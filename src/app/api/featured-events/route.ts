import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: featured, error } = await (admin as any)
    .from("featured_events")
    .select("event_id")
    .eq("status", "active")
    .lte("start_date", today)
    .gte("end_date", today);

  if (error || !featured || featured.length === 0) {
    return NextResponse.json([]);
  }

  const eventIds = featured.map((f: { event_id: string }) => f.event_id);

  const { data: activeOrgs } = await (admin as any)
    .from("profiles")
    .select("id")
    .in("role", ["organizer", "admin"]);

  const activeOrgIds = new Set((activeOrgs ?? []).map((p: { id: string }) => p.id));

  const { data: events } = await admin
    .from("events")
    .select("id, name, date, time, venue, city, image_url, category, organizer_id, ticket_types(id, price, is_active, total_available, sold_count)")
    .in("id", eventIds)
    .eq("status", "published")
    .order("date", { ascending: true });

  const activeEvents = (events ?? []).filter((e: any) => activeOrgIds.has(e.organizer_id));

  return NextResponse.json(activeEvents);
}
