import { createAdminClient } from "@/lib/supabase/admin";
import FeaturedCarousel from "./FeaturedCarousel";

export default async function FeaturedEvents() {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: featured } = await (admin as any)
    .from("featured_events")
    .select("event_id, banner_url, banner_status")
    .eq("status", "active")
    .lte("start_date", today)
    .gte("end_date", today)
    .not("banner_url", "is", null)
    .eq("banner_status", "approved");

  if (!featured || featured.length === 0) return null;

  const bannerMap: Record<string, string> = {};
  for (const f of featured as { event_id: string; banner_url: string }[]) {
    bannerMap[f.event_id] = f.banner_url;
  }

  const eventIds = Object.keys(bannerMap);

  const { data: activeOrgs } = await (admin as any)
    .from("profiles")
    .select("id")
    .in("role", ["organizer", "admin"]);

  const activeOrgIds = new Set((activeOrgs ?? []).map((p: { id: string }) => p.id));

  const { data: events } = await admin
    .from("events")
    .select("id, name, organizer_id")
    .in("id", eventIds)
    .eq("status", "published");

  if (!events || events.length === 0) return null;

  const slides = (events as { id: string; name: string; organizer_id: string }[])
    .filter(e => bannerMap[e.id] && activeOrgIds.has(e.organizer_id))
    .map(e => ({ eventId: e.id, eventName: e.name, bannerUrl: bannerMap[e.id] }));

  if (slides.length === 0) return null;

  return <FeaturedCarousel slides={slides} />;
}
