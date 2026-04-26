import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members" as never)
    .select("id, member_email, role, created_at")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { email, role } = await request.json();
  if (!email || !role) return NextResponse.json({ error: "Email y rol requeridos" }, { status: 400 });
  if (email === user.email) return NextResponse.json({ error: "No puedes agregarte a ti mismo" }, { status: 400 });

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("team_members")
    .insert({ organizer_id: user.id, member_email: email.toLowerCase().trim(), role })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Este miembro ya existe en el equipo" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, role } = await request.json();
  if (!id || !role) return NextResponse.json({ error: "ID y rol requeridos" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_members" as never)
    .update({ role } as never)
    .eq("id", id)
    .eq("organizer_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_members" as never)
    .delete()
    .eq("id", id)
    .eq("organizer_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
