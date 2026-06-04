import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, role } = body;

  const admin = createAdminClient();
  const { data: member } = await (admin as any)
    .from("team_members")
    .select("id")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, string> = {};
  if (status && ["active", "suspended"].includes(status)) updates.status = status;
  if (role && ["bar_manager", "inventory_staff", "procurement"].includes(role)) updates.role = role;

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await (admin as any).from("team_members").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: member } = await (admin as any)
    .from("team_members")
    .select("id")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await (admin as any).from("team_sessions").delete().eq("team_member_id", id);
  const { error } = await (admin as any).from("team_members").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
