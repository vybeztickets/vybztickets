import { createAdminClient } from "@/lib/supabase/admin";
import UpcomingEventsClient from "./UpcomingEventsClient";

export default async function UpcomingEvents() {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: activeOrgs } = await (admin as any)
    .from("profiles")
    .select("id")
    .in("role", ["organizer", "admin"]);

  const activeOrgIds = (activeOrgs ?? []).map((p: { id: string }) => p.id);

  const { data: events } = await admin
    .from("events")
    .select(`id, name, category, date, venue, city, image_url, currency, ticket_types (id, price, total_available, sold_count, is_active)`)
    .eq("status", "published")
    .gte("date", today)
    .in("organizer_id", activeOrgIds.length ? activeOrgIds : ["none"])
    .order("date", { ascending: true })
    .limit(6);

  return <UpcomingEventsClient events={(events ?? []) as any} />;
}
