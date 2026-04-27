import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as any)?.role !== "admin") return null;
  return { user, admin };
}

export async function GET() {
  const supabase = await createClient();
  const ctx = await requireAdmin(supabase);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data, error } = await ctx.admin
    .from("profiles")
    .select("id, full_name, email, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const ctx = await requireAdmin(supabase);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  const { data: target, error: findErr } = await ctx.admin
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!target) return NextResponse.json({ error: "No existe ninguna cuenta con ese email" }, { status: 404 });
  if (target.role === "admin") return NextResponse.json({ error: "Esta cuenta ya es admin" }, { status: 409 });

  const { error: updateErr } = await ctx.admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", target.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ id: target.id, full_name: target.full_name, email: target.email, created_at: new Date().toISOString() });
}
