import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();

  const { data: row } = await (admin as any).from("scanner_access").select("organizer_id").eq("id", id).single();
  if (!row || row.organizer_id !== user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await (admin as any).from("scanner_access").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
