import { createClient } from "@/lib/supabase/server";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(n: number) {
  return "₡" + n.toLocaleString("es-CR");
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
  });
}

export default async function ReventaEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  // Fetch the event
  const { data: event } = await supabase
    .from("events")
    .select("id, name, date, time, venue, city, image_url, category, status")
    .eq("id", eventId)
    .eq("status", "published")
    .single();

  if (!event) notFound();

  // Fetch active resale listings for this event
  const { data: listings } = await supabase
    .from("resale_listings")
    .select(`
      id, resale_price, original_price, created_at,
      tickets (
        id, event_id
      )
    `)
    .eq("status", "active")
    .order("resale_price", { ascending: true });

  // Filter by event_id (join doesn't support .eq on nested easily)
  const eventListings = (listings ?? []).filter((l) => {
    const ticket = l.tickets as Record<string, unknown> | null;
    return ticket?.event_id === eventId;
  });

  return (
    <div className="page-light min-h-screen flex flex-col">
      <Navbar />

      {/* Event hero */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Image */}
            <div
              className="relative w-full md:w-64 h-48 md:h-48 rounded-2xl overflow-hidden shrink-0"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              {event.image_url ? (
                <Image src={event.image_url} alt={event.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: "linear-gradient(135deg,rgba(0,0,0,0.06),rgba(0,0,0,0.03))" }} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase"
                  style={{ background: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.5)" }}
                >
                  {event.category}
                </span>
                <span
                  className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase"
                  style={{ background: "rgba(0,0,0,0.85)", color: "#fff" }}
                >
                  REVENTA
                </span>
              </div>
              <h1
                className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-tight tracking-wide mb-2"
                style={{ fontSize: "clamp(28px,4vw,52px)" }}
              >
                {event.name}
              </h1>
              <p className="text-[#0a0a0a]/40 text-sm mb-1">{formatDate(event.date)}</p>
              <p className="text-[#0a0a0a]/40 text-sm">{event.venue}, {event.city}</p>

              {eventListings.length > 0 && (
                <div className="flex items-center gap-6 mt-5">
                  <div>
                    <p className="text-[#0a0a0a]/25 text-[9px] uppercase tracking-wider">Desde</p>
                    <p className="text-[#0a0a0a] font-bold text-xl">{formatPrice(eventListings[0].resale_price)}</p>
                  </div>
                  <div>
                    <p className="text-[#0a0a0a]/25 text-[9px] uppercase tracking-wider">Disponibles</p>
                    <p className="text-[#0a0a0a] font-bold text-xl">{eventListings.length}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <main className="flex-1 px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <h2
              className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide"
              style={{ fontSize: "clamp(20px,2.5vw,32px)" }}
            >
              Entradas disponibles
            </h2>
            <Link
              href="/auth/login?redirectTo=/revendedor/nueva-venta"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-colors text-[#0a0a0a]/50 hover:text-[#0a0a0a]"
              style={{ border: "1px solid rgba(0,0,0,0.12)" }}
            >
              + Vender mi entrada
            </Link>
          </div>

          {eventListings.length === 0 ? (
            <div
              className="rounded-2xl p-16 text-center"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
            >
              <p className="text-[#0a0a0a]/30 text-sm mb-4">
                No hay entradas disponibles en este momento.
              </p>
              <Link
                href="/auth/login?redirectTo=/revendedor/nueva-venta"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
              >
                Vender una entrada
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {eventListings.map((l, i) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-5 rounded-2xl"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.06)", color: i === 0 ? "#fff" : "rgba(0,0,0,0.4)" }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-[#0a0a0a] font-semibold text-sm">{formatPrice(l.resale_price)}</p>
                      <p className="text-[#0a0a0a]/30 text-xs">
                        Original: {formatPrice(l.original_price)} · Publicada {formatDateShort(l.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      <span className="text-[#0a0a0a]/35 text-xs">Escrow</span>
                    </div>
                    <Link
                      href={`/auth/login?redirectTo=/reventa/${eventId}/comprar/${l.id}`}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
                    >
                      Comprar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trust note */}
          <div className="mt-8 flex flex-wrap items-center gap-5 justify-center">
            {["🔒 Pago protegido por escrow", "✓ QR verificado antes de liberar fondos", "↩ Reembolso si el evento se cancela"].map((t) => (
              <span key={t} className="text-[#0a0a0a]/35 text-xs">{t}</span>
            ))}
          </div>
        </div>
      </main>

      <Footer variant="reventa" />
    </div>
  );
}
