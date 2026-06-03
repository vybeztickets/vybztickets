import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();
  const { data: s } = await (admin as any).from("inventory_suppliers").select("id").eq("id", id).eq("organizer_id", user.id).single();
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ["name", "contact_name", "phone", "email", "notes"];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) { if (k in body) updates[k] = body[k]; }
  await (admin as any).from("inventory_suppliers").update(updates).eq("id", id);
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { data: s } = await (admin as any).from("inventory_suppliers").select("id").eq("id", id).eq("organizer_id", user.id).single();
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await (admin as any).from("inventory_suppliers").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
