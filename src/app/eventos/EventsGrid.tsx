"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type TicketType = { id: string; price: number; total_available: number; sold_count: number; is_active: boolean };
type Event = {
  id: string; name: string; description: string | null; date: string; time: string;
  venue: string; city: string; country: string; category: string;
  image_url: string | null; status: string; ticket_types: TicketType[];
};

const CATEGORIES = ["Todos", "Festival", "Música", "Tecnología", "Entretenimiento", "Gastronomía", "Deportes"];

function getMinPrice(tt: TicketType[]) {
  const active = tt.filter((t) => t.is_active);
  return active.length ? Math.min(...active.map((t) => t.price)) : null;
}
function getAvailability(tt: TicketType[]) {
  return tt.reduce((s, t) => s + t.total_available - t.sold_count, 0);
}
function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return {
    day: date.toLocaleDateString("es-CR", { day: "2-digit" }),
    month: date.toLocaleDateString("es-CR", { month: "short" }).toUpperCase(),
    weekday: date.toLocaleDateString("es-CR", { weekday: "short" }).toUpperCase(),
  };
}
function formatPrice(n: number) { return "₡" + n.toLocaleString("es-CR"); }

export default function EventsGrid({ events }: { events: Event[] }) {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = events.filter((e) => {
    const matchCat = activeCategory === "Todos" || e.category === activeCategory;
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Search + filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0a0a0a]/25" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar evento, ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-[#0a0a0a] placeholder-[#0a0a0a]/25 focus:outline-none"
            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={
                activeCategory === cat
                  ? { background: "#0a0a0a", color: "#fff" }
                  : { background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.45)", border: "1px solid rgba(0,0,0,0.08)" }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[#0a0a0a]/30 text-xs mb-6">
        {filtered.length} evento{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-24 text-[#0a0a0a]/20">
          <p className="text-2xl mb-2">Sin resultados</p>
          <p className="text-sm">Intenta con otra categoría o búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((event) => {
            const { day, month, weekday } = formatDate(event.date);
            const minPrice = getMinPrice(event.ticket_types);
            const available = getAvailability(event.ticket_types);
            const soldOut = available <= 0;

            return (
              <Link key={event.id} href={`/eventos/${event.id}`} className="card-light group block overflow-hidden">
                {/* Image */}
                <div className="relative h-52 overflow-hidden rounded-t-[15px]">
                  {event.image_url ? (
                    <Image
                      src={event.image_url}
                      alt={event.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full" style={{ background: "linear-gradient(135deg,rgba(0,0,0,0.06),rgba(0,0,0,0.03))" }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

                  {/* Date badge */}
                  <div
                    className="absolute top-3 left-3 text-center px-2.5 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}
                  >
                    <p className="text-[#0a0a0a]/40 text-[8px] font-bold tracking-widest">{weekday}</p>
                    <p className="text-[#0a0a0a] font-[family-name:var(--font-bebas)] text-2xl leading-none">{day}</p>
                    <p className="text-[#0a0a0a]/50 text-[8px] font-bold tracking-widest">{month}</p>
                  </div>

                  {/* Category badge */}
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                    style={{ background: "rgba(255,255,255,0.9)", color: "#0a0a0a", backdropFilter: "blur(8px)" }}
                  >
                    {event.category}
                  </div>

                  {soldOut && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(4px)" }}>
                      <span className="text-[#0a0a0a] font-bold tracking-widest text-sm uppercase">Agotado</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-[#0a0a0a] font-semibold text-base leading-tight mb-2 line-clamp-2 group-hover:text-[#0a0a0a]/60 transition-colors">
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[#0a0a0a]/30 text-xs mb-4">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {event.venue}, {event.city}
                  </div>

                  <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <div>
                      {minPrice !== null ? (
                        <>
                          <p className="text-[#0a0a0a]/25 text-[9px] uppercase tracking-wider">Desde</p>
                          <p className="text-[#0a0a0a] font-bold text-base">{formatPrice(minPrice)}</p>
                        </>
                      ) : (
                        <p className="text-[#0a0a0a]/30 text-sm">Sin tickets</p>
                      )}
                    </div>
                    {!soldOut && (
                      <div className="px-4 py-2 rounded-full text-xs font-semibold bg-[#0a0a0a] text-white hover:bg-[#333] transition-colors">
                        Ver tickets
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
