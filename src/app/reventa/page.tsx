import { createClient } from "@/lib/supabase/server";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Reventa — Vybz Tickets" };

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CR", {
    weekday: "short", day: "numeric", month: "short",
  });
}
function formatPrice(n: number) { return "₡" + n.toLocaleString("es-CR"); }

type EventWithListings = {
  id: string;
  name: string;
  date: string;
  venue: string;
  city: string;
  image_url: string | null;
  category: string;
  listingCount: number;
  minPrice: number;
};

export default async function ReventaPage() {
  const supabase = await createClient();

  // Get active resale listings joined to their tickets and events
  const { data: listings } = await supabase
    .from("resale_listings")
    .select(`
      id, resale_price,
      tickets (
        event_id,
        events ( id, name, date, venue, city, image_url, category, status )
      )
    `)
    .eq("status", "active");

  // Group by event
  const eventMap = new Map<string, EventWithListings>();
  for (const l of listings ?? []) {
    const ticket = l.tickets as Record<string, unknown> | null;
    const event = ticket?.events as Record<string, unknown> | null;
    if (!event || event.status !== "published") continue;
    const eid = event.id as string;
    if (!eventMap.has(eid)) {
      eventMap.set(eid, {
        id: eid,
        name: event.name as string,
        date: event.date as string,
        venue: event.venue as string,
        city: event.city as string,
        image_url: event.image_url as string | null,
        category: event.category as string,
        listingCount: 0,
        minPrice: Infinity,
      });
    }
    const entry = eventMap.get(eid)!;
    entry.listingCount++;
    if (l.resale_price < entry.minPrice) entry.minPrice = l.resale_price;
  }

  const events = Array.from(eventMap.values()).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="page-light min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase text-black/40"
            style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            ✦ REVENTA SEGURA · C2C
          </div>
          <h1
            className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-[0.92] tracking-wide mb-5"
            style={{ fontSize: "clamp(52px,8vw,96px)" }}
          >
            Compra y vende<br />
            <span style={{ color: "rgba(0,0,0,0.18)" }}>con escrow.</span>
          </h1>
          <p className="text-[#0a0a0a]/45 text-base leading-relaxed mb-8 max-w-md mx-auto">
            Entradas de segunda mano verificadas. El dinero queda en custodia hasta que ambas partes confirman.
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap mb-10">
            {["🔒 Escrow protegido", "✓ Entradas verificadas", "↩ Reembolso garantizado"].map((t) => (
              <span key={t} className="text-[#0a0a0a]/45 text-xs font-medium">{t}</span>
            ))}
          </div>
          <Link
            href="/auth/login?redirectTo=/revendedor/nueva-venta"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
          >
            Vender mis entradas
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 10L10 2M10 2H4M10 2V8" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Escrow steps */}
      <section className="py-16 px-6" style={{ background: "#f7f7f7" }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[9px] font-bold tracking-[0.22em] uppercase text-black/30 mb-10">Cómo funciona el escrow</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { n: "1", title: "Publicas tu entrada", desc: "Sube tu ticket y fija el precio." },
              { n: "2", title: "Comprador paga", desc: "El dinero queda retenido en escrow." },
              { n: "3", title: "QR transferido", desc: "La entrada pasa al comprador al instante." },
              { n: "4", title: "Cobras tu dinero", desc: "El pago se libera una vez confirmado." },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold text-white" style={{ background: "#0a0a0a" }}>
                  {s.n}
                </div>
                <h3 className="text-[#0a0a0a] font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-[#0a0a0a]/40 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listings */}
      <main className="flex-1 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-2">
                ✦ {events.length > 0 ? `${events.length} evento${events.length !== 1 ? "s" : ""} con entradas` : "DISPONIBLE"}
              </p>
              <h2
                className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide"
                style={{ fontSize: "clamp(32px,4vw,52px)" }}
              >
                Entradas en reventa
              </h2>
            </div>
            <Link
              href="/auth/login?redirectTo=/revendedor/nueva-venta"
              className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors text-[#0a0a0a]/60 hover:text-[#0a0a0a]"
              style={{ border: "1px solid rgba(0,0,0,0.15)" }}
            >
              + Vender entrada
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-32">
              <p
                className="text-[#0a0a0a]/15 font-[family-name:var(--font-bebas)] tracking-wide mb-3"
                style={{ fontSize: "clamp(32px,4vw,48px)" }}
              >
                Sin entradas en reventa
              </p>
              <p className="text-[#0a0a0a]/25 text-sm mb-6">
                Sé el primero en publicar una entrada de segunda mano.
              </p>
              <Link
                href="/auth/login?redirectTo=/revendedor/nueva-venta"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
              >
                Vender ahora
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((event) => (
                <Link key={event.id} href={`/reventa/${event.id}`} className="card-light group overflow-hidden block">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden rounded-t-[15px]">
                    {event.image_url ? (
                      <Image src={event.image_url} alt={event.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full" style={{ background: "linear-gradient(135deg,rgba(0,0,0,0.06),rgba(0,0,0,0.03))" }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase" style={{ background: "rgba(0,0,0,0.85)", color: "#fff" }}>
                      REVENTA
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", color: "#0a0a0a" }}>
                      {event.category}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-[#0a0a0a] font-semibold text-base leading-tight mb-1 line-clamp-1 group-hover:text-[#0a0a0a]/60 transition-colors">
                      {event.name}
                    </h3>
                    <p className="text-[#0a0a0a]/30 text-xs mb-1">{formatDate(event.date)}</p>
                    <p className="text-[#0a0a0a]/30 text-xs mb-4">{event.venue}, {event.city}</p>

                    <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      <div>
                        <p className="text-[#0a0a0a]/25 text-[9px] uppercase tracking-wider">Desde</p>
                        <p className="text-[#0a0a0a] font-bold text-base">{formatPrice(event.minPrice)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#0a0a0a]/25 text-[9px] uppercase tracking-wider">Disponibles</p>
                        <p className="text-[#0a0a0a] font-semibold text-sm">{event.listingCount}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Sell CTA */}
      <section className="py-20 px-6" style={{ background: "#f7f7f7" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-tight tracking-wide mb-4"
            style={{ fontSize: "clamp(36px,4vw,56px)" }}
          >
            ¿Tienes entradas que no vas a usar?
          </h2>
          <p className="text-[#0a0a0a]/40 text-sm mb-8 max-w-sm mx-auto">
            Véndelas de forma segura. El comprador paga al instante y tú recibes tu dinero una vez confirmada la transferencia.
          </p>
          <Link
            href="/auth/login?redirectTo=/revendedor/nueva-venta"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
          >
            Empezar a vender
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 10L10 2M10 2H4M10 2V8" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer variant="reventa" />
    </div>
  );
}
