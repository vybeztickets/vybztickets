import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Image from "next/image";
import CheckoutPanel from "./CheckoutPanel";
import ResendTicket from "./ResendTicket";
import Countdown from "./Countdown";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawEvent } = await supabase
    .from("events")
    .select(`*, ticket_types (*)`)
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!rawEvent) notFound();

  const event = rawEvent as unknown as {
    id: string; name: string; date: string; time: string | null; end_time: string | null; till_late: boolean | null; currency: string | null;
    description: string | null; image_url: string | null; venue: string; city: string;
    country: string; category: string | null; venue_map_url: string | null;
    location_lat: number | null; location_lng: number | null;
    ticket_types: { id: string; name: string; description: string | null; price: number; total_available: number; sold_count: number; is_active: boolean; is_hidden?: boolean | null; category?: string; capacity?: number | null; zone_name?: string | null; zone_color?: string | null }[];
  };

  const d = new Date(event.date + "T00:00:00");
  const formattedDate = d.toLocaleDateString("es-CR", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const mapsUrl = event.location_lat && event.location_lng
    ? `https://www.google.com/maps?q=${event.location_lat},${event.location_lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.city}, ${event.country}`)}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#ffffff" }}>
      <Navbar />
      <main className="flex-1 pt-16 pb-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: flyer + info + location ── */}
            <div className="lg:w-[300px] shrink-0">
              <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}>
                {event.image_url ? (
                  <Image src={event.image_url} alt={event.name} width={600} height={800} className="w-full h-auto" style={{ display: "block" }} />
                ) : (
                  <div className="w-full flex items-center justify-center" style={{ aspectRatio: "3/4" }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="mb-6">
                  <p className="text-[#0a0a0a]/30 text-[10px] font-bold uppercase tracking-wider mb-2">Info</p>
                  <p className="text-[#0a0a0a]/55 text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
                </div>
              )}

              <div>
                <p className="text-[#0a0a0a]/30 text-[10px] font-bold uppercase tracking-wider mb-2">Ubicación</p>
                <p className="text-[#0a0a0a]/60 text-sm leading-relaxed">
                  {event.venue}<br />
                  {event.city}, {event.country}
                </p>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#0a0a0a]/35 text-xs mt-2 hover:text-[#0a0a0a] transition-colors">
                  Ver en Google Maps
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* ── RIGHT: date, name, tickets ── */}
            <div className="flex-1 min-w-0">
              <p className="text-[#0a0a0a]/40 text-sm mb-3 capitalize">
                {formattedDate}
                {event.time && <span> · {event.time}{event.till_late ? " – Till late" :event.end_time ? ` – ${event.end_time}` : ""}</span>}
              </p>

              <Countdown date={event.date} time={event.time} />

              <h1 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl tracking-wide text-[#0a0a0a] mb-3 leading-none">
                {event.name}
              </h1>

              {event.category && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
                  style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)" }}>
                  {event.category}
                </span>
              )}

              <CheckoutPanel
                ticketTypes={event.ticket_types}
                eventId={event.id}
                eventName={event.name}
                venueMapUrl={(event as any).venue_map_url ?? null}
                platformFeePercent={(event as any).platform_fee_percent ?? 15}
                currency={event.currency ?? "CRC"}
              />

              <ResendTicket eventId={event.id} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
