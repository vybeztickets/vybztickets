import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from("events").select("id").eq("id", eventId).eq("organizer_id", user.id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: zones } = await (admin as any)
    .from("table_zones")
    .select("id, sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  let counter = 1;
  const updates: ReturnType<typeof admin.from>[] = [];
  for (const zone of zones ?? []) {
    const { data: tables } = await (admin as any)
      .from("ticket_types")
      .select("id")
      .eq("event_id", eventId)
      .eq("zone_id", zone.id)
      .eq("category", "table")
      .order("created_at", { ascending: true });
    for (const table of tables ?? []) {
      updates.push(
        (admin as any).from("ticket_types").update({ name: String(counter) }).eq("id", table.id)
      );
      counter++;
    }
  }
  await Promise.all(updates);
  return NextResponse.json({ ok: true, renumbered: counter - 1 });
}
