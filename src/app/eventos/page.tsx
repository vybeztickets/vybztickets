import { createClient } from "@/lib/supabase/server";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import EventsGrid from "./EventsGrid";
import FeaturedEvents from "@/app/components/FeaturedEvents";

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
    <div className="page-light min-h-screen flex flex-col">
      <Navbar />
      <div>
        <FeaturedEvents />
      </div>
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40">✦ TODOS LOS EVENTOS</span>
          </div>
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
