import { createClient } from "@/lib/supabase/server";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import EventsGrid from "./EventsGrid";
import FeaturedEvents from "@/app/components/FeaturedEvents";
import MeshBackground from "@/app/components/MeshBackground";

export const metadata = { title: "Eventos — Vybz Tickets" };

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const supabase = await createClient();
  const { category } = await searchParams;

  const { data: events } = await supabase
    .from("events")
    .select(`*, ticket_types (id, price, total_available, sold_count, is_active)`)
    .eq("status", "published")
    .order("date", { ascending: true });

  return (
    <div className="min-h-screen flex flex-col" style={{ color: "#0a0a0a" }}>
      <MeshBackground />
      <Navbar />
      <div style={{ paddingTop: "64px" }}>
        <FeaturedEvents />
      </div>
      <main className="flex-1 pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(48px,7vw,88px)" }}>
            Próximos Eventos
          </h1>
        </div>
        <EventsGrid events={events ?? []} initialCategory={category} />
      </main>
      <Footer />
    </div>
  );
}
