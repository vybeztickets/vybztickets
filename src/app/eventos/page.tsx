import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import EventsGrid from "./EventsGrid";
import FeaturedEvents from "@/app/components/FeaturedEvents";
import MeshBackground from "@/app/components/MeshBackground";

export const metadata = { title: "Events — Vybz Tickets" };

const getPublishedEvents = unstable_cache(
  async () => {
    const admin = createAdminClient();

    const { data: activeOrgs } = await (admin as any)
      .from("profiles")
      .select("id")
      .in("role", ["organizer", "admin"]);

    const activeOrgIds = (activeOrgs ?? []).map((p: { id: string }) => p.id);

    const { data: events } = await admin
      .from("events")
      .select(`*, ticket_types (id, price, total_available, sold_count, is_active)`)
      .eq("status", "published")
      .in("organizer_id", activeOrgIds.length ? activeOrgIds : ["none"])
      .order("date", { ascending: true });

    return events ?? [];
  },
  ["published-events"],
  { revalidate: 30 }
);

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; filter?: string }>;
}) {
  const [{ category, filter }, events] = await Promise.all([
    searchParams,
    getPublishedEvents(),
  ]);

  return (
    <div className="min-h-screen flex flex-col" style={{ color: "#0a0a0a" }}>
      <MeshBackground />
      <Navbar />
      <div style={{ paddingTop: "64px" }}>
        <FeaturedEvents />
      </div>
      <main className="flex-1 pt-14 pb-20">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h1
            className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide"
            style={{ fontSize: "clamp(48px,7vw,88px)" }}
          >
            Upcoming Events
          </h1>
        </div>
        <EventsGrid key={filter ?? "all"} events={events} initialCategory={category} initialFilter={filter} />
      </main>
      <Footer />
    </div>
  );
}
