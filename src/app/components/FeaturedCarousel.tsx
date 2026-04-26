"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

type TicketType = { id: string; price: number; is_active: boolean; total_available: number; sold_count: number };
type Event = {
  id: string; name: string; date: string; time: string;
  venue: string; city: string; image_url: string | null; category: string;
  ticket_types: TicketType[];
};

function getMinPrice(tt: TicketType[]) {
  const active = tt.filter((t) => t.is_active);
  return active.length ? Math.min(...active.map((t) => t.price)) : null;
}

function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return {
    day: date.toLocaleDateString("es-CR", { day: "2-digit" }),
    month: date.toLocaleDateString("es-CR", { month: "short" }).toUpperCase(),
    weekday: date.toLocaleDateString("es-CR", { weekday: "long" }),
  };
}

export default function FeaturedCarousel({ events }: { events: Event[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % events.length), [events.length]);
  const prev = () => setCurrent((c) => (c - 1 + events.length) % events.length);

  useEffect(() => {
    if (events.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [events.length, next]);

  if (events.length === 0) return null;

  const event = events[current];
  const { day, month, weekday } = formatDate(event.date);
  const minPrice = getMinPrice(event.ticket_types);

  return (
    <section style={{ background: "#0a0a0a" }} className="relative overflow-hidden">
      {/* Background image blur */}
      {event.image_url && (
        <div className="absolute inset-0 opacity-15">
          <Image src={event.image_url} alt="" fill className="object-cover" style={{ filter: "blur(40px)" }} />
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-10 md:gap-16">
        {/* Left — text */}
        <div className="flex-1 order-2 md:order-1">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/50">Destacado</span>
          </div>

          <h2 className="font-[family-name:var(--font-bebas)] text-white leading-none tracking-wide mb-4"
            style={{ fontSize: "clamp(40px,6vw,72px)" }}>
            {event.name}
          </h2>

          <div className="flex flex-wrap gap-4 mb-8 text-white/40 text-sm">
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {weekday} {day} {month} · {event.time?.slice(0, 5)}
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {event.venue}, {event.city}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href={`/eventos/${event.id}`}
              className="px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[#0a0a0a] hover:bg-white/90 transition-colors">
              Ver entradas
              {minPrice !== null && (
                <span className="ml-2 opacity-50 text-xs">desde ₡{minPrice.toLocaleString("es-CR")}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Right — poster */}
        <div className="order-1 md:order-2 shrink-0 relative">
          <div className="relative w-64 h-80 md:w-72 md:h-96 rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {event.image_url ? (
              <Image src={event.image_url} alt={event.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: "rgba(255,255,255,0.05)" }} />
            )}
            {/* Date badge */}
            <div className="absolute top-4 right-4 text-center px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(10,10,10,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-white/40 text-[8px] font-bold tracking-widest">{month}</p>
              <p className="text-white font-[family-name:var(--font-bebas)] text-3xl leading-none">{day}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      {events.length > 1 && (
        <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-4">
          <button onClick={prev}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            {events.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className="transition-all rounded-full"
                style={{
                  width: i === current ? "20px" : "6px",
                  height: "6px",
                  background: i === current ? "#fff" : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
          <button onClick={next}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
