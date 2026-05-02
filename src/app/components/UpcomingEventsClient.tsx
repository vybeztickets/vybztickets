"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";

type TicketType = { price: number; is_active: boolean; total_available: number; sold_count: number };

export type UpcomingEvent = {
  id: string;
  name: string;
  category: string | null;
  date: string;
  venue: string;
  city: string;
  image_url: string | null;
  currency: string | null;
  ticket_types: TicketType[];
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  const days = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
  return {
    day: String(d.getDate()),
    month: months[d.getMonth()],
    dow: days[d.getDay()],
  };
}

function minPrice(ticket_types: TicketType[], currency: string | null) {
  const active = ticket_types.filter(t => t.is_active && t.total_available > t.sold_count);
  if (!active.length) return null;
  const min = Math.min(...active.map(t => t.price));
  const symbol = currency === "USD" ? "$" : "₡";
  return currency === "USD"
    ? `${symbol}${min.toFixed(2)}`
    : `${symbol}${min.toLocaleString("es-CR")}`;
}

export default function UpcomingEventsClient({ events }: { events: UpcomingEvent[] }) {
  const categories = ["Todo", ...Array.from(new Set(events.map(e => e.category).filter(Boolean) as string[]))];
  const [active, setActive] = useState("Todo");
  const filtered = active === "Todo" ? events : events.filter(e => e.category === active);

  if (events.length === 0) return null;

  return (
    <section className="py-24 px-6" style={{ background: "#ffffff" }}>
      <div className="max-w-7xl mx-auto">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div
              className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40">✦ PRÓXIMOS EVENTOS</span>
            </div>
            <h2
              className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide"
              style={{ fontSize: "clamp(40px, 5vw, 64px)" }}
            >
              Upcoming Events
            </h2>
          </div>
          <Link
            href="/eventos"
            className="hidden md:inline-flex items-center gap-2 text-[#0a0a0a]/40 hover:text-[#0a0a0a] text-sm font-medium transition-colors group shrink-0"
          >
            Ver todos
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
        </Reveal>

        {categories.length > 1 && (
          <div className="overflow-x-auto mb-8 -mx-1 px-1">
            <div className="flex gap-2 w-max">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className="shrink-0 text-[11px] font-semibold tracking-[0.08em] uppercase px-4 py-2 rounded-full transition-all duration-200"
                  style={
                    active === cat
                      ? { background: "#0a0a0a", color: "#fff" }
                      : { background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,0,0,0.07)" }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((event, i) => {
            const { day, month, dow } = formatDate(event.date);
            const price = minPrice(event.ticket_types, event.currency);
            const sold = event.ticket_types.reduce((acc, t) => acc + (t.sold_count ?? 0), 0);
            return (
              <Reveal key={event.id} delay={i * 80}>
                <Link href={`/eventos/${event.id}`} className="card-light group block overflow-hidden">
                  <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-[15px]">
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full" style={{ background: "rgba(0,0,0,0.06)" }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div
                      className="absolute top-3 right-3 flex flex-col items-center text-center px-2.5 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)" }}
                    >
                      <span className="text-[#0a0a0a]/40 text-[8px] font-bold tracking-[0.15em] uppercase leading-none mb-0.5">{month}</span>
                      <span className="text-[#0a0a0a] font-[family-name:var(--font-bebas)] text-2xl leading-none">{day}</span>
                      <span className="text-[#0a0a0a]/30 text-[8px] font-medium tracking-wide uppercase">{dow}</span>
                    </div>
                    {event.category && (
                      <div
                        className="absolute top-3 left-3 text-[9px] font-bold tracking-[0.12em] uppercase px-2.5 py-1.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)", color: "#0a0a0a" }}
                      >
                        {event.category}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-[#0a0a0a] font-semibold text-[15px] leading-snug mb-1.5 group-hover:text-[#0a0a0a]/70 transition-colors">
                      {event.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mb-4">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 opacity-25">
                        <path d="M5 .5C3.07.5 1.5 2.07 1.5 4c0 2.5 3.5 5.5 3.5 5.5S8.5 6.5 8.5 4C8.5 2.07 6.93.5 5 .5Z" stroke="#0a0a0a" strokeWidth="1.2" />
                      </svg>
                      <span className="text-[#0a0a0a]/30 text-xs truncate">{event.venue}, {event.city}</span>
                    </div>

                    <div
                      className="flex items-center justify-between pt-4"
                      style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
                    >
                      <div>
                        {price ? (
                          <>
                            <p className="text-[#0a0a0a]/25 text-[9px] uppercase tracking-[0.12em] mb-0.5">Desde</p>
                            <p className="text-[#0a0a0a] font-bold text-base">{price}</p>
                          </>
                        ) : (
                          <p className="text-[#0a0a0a]/40 text-sm font-medium">Agotado</p>
                        )}
                      </div>
                      {sold > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                            {[0, 1, 2].map((j) => (
                              <div key={j} className="w-5 h-5 rounded-full border-2 border-white" style={{ background: ["#0a0a0a", "#555", "#999"][j] }} />
                            ))}
                          </div>
                          <span className="text-[#0a0a0a]/25 text-[10px]">+{sold.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={200} className="mt-10 flex justify-center">
          <Link
            href="/eventos"
            className="inline-flex items-center gap-2 text-[#0a0a0a]/60 hover:text-[#0a0a0a] text-sm font-semibold px-8 py-3 rounded-full transition-all"
            style={{ border: "1.5px solid rgba(0,0,0,0.12)" }}
          >
            Ver todos los eventos
            <span>→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
