"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const CATEGORIES = ["Todo", "Electronic", "Rock", "Reggaeton", "Jazz", "Salsa", "Pop", "Teatro", "Deportes"];

const EVENTS = [
  {
    id: 1,
    title: "Ultra Music Festival CR",
    category: "Electronic",
    date: "SAT",
    day: "15",
    month: "MAR",
    venue: "Parque La Sabana",
    city: "San José",
    price: "₡45,000",
    going: 1240,
    image: "https://images.unsplash.com/photo-1540039723070-438d9dfdeab2?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(139,92,246,0.18)",
    pillColor: "#a78bfa",
    pillBorder: "rgba(139,92,246,0.35)",
  },
  {
    id: 2,
    title: "Jazz & Chill Rooftop",
    category: "Jazz",
    date: "SAT",
    day: "5",
    month: "ABR",
    venue: "Rooftop 503",
    city: "Escazú",
    price: "₡25,000",
    going: 318,
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(251,191,36,0.12)",
    pillColor: "#fbbf24",
    pillBorder: "rgba(251,191,36,0.3)",
  },
  {
    id: 3,
    title: "Reggaeton Night Liberia",
    category: "Reggaeton",
    date: "SAT",
    day: "12",
    month: "ABR",
    venue: "Arena Guanacaste",
    city: "Liberia",
    price: "₡30,000",
    going: 876,
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(52,211,153,0.12)",
    pillColor: "#34d399",
    pillBorder: "rgba(52,211,153,0.3)",
  },
  {
    id: 4,
    title: "Rock en el Parque",
    category: "Rock",
    date: "SUN",
    day: "20",
    month: "ABR",
    venue: "Parque Central",
    city: "Heredia",
    price: "₡20,000",
    going: 543,
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(248,113,113,0.12)",
    pillColor: "#f87171",
    pillBorder: "rgba(248,113,113,0.3)",
  },
  {
    id: 5,
    title: "Salsa Tropical",
    category: "Salsa",
    date: "SAT",
    day: "3",
    month: "MAY",
    venue: "Centro Cultural",
    city: "Cartago",
    price: "₡15,000",
    going: 209,
    image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(244,114,182,0.12)",
    pillColor: "#f472b6",
    pillBorder: "rgba(244,114,182,0.3)",
  },
  {
    id: 6,
    title: "Festival de Verano",
    category: "Pop",
    date: "SAT",
    day: "10",
    month: "MAY",
    venue: "Playa Flamingo",
    city: "Guanacaste",
    price: "₡35,000",
    going: 1980,
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(96,165,250,0.12)",
    pillColor: "#60a5fa",
    pillBorder: "rgba(96,165,250,0.3)",
  },
];

export default function UpcomingEvents() {
  const [active, setActive] = useState("Todo");

  const filtered = active === "Todo"
    ? EVENTS
    : EVENTS.filter((e) => e.category === active);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-white/20 text-[10px] tracking-[0.28em] uppercase font-semibold mb-2">
            No te lo pierdas
          </p>
          <h2 className="font-[family-name:var(--font-bebas)] leading-none tracking-wide text-white"
            style={{ fontSize: "clamp(42px, 5.5vw, 72px)" }}>
            Upcoming Events
          </h2>
        </div>
        <Link href="/eventos"
          className="hidden md:inline-flex items-center gap-2 text-white/30 hover:text-white text-sm transition-colors group shrink-0">
          Ver todos los eventos
          <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
        </Link>
      </div>

      {/* Category tabs */}
      <div className="h-scroll overflow-x-auto mb-8 -mx-1 px-1">
        <div className="flex gap-2 w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className="shrink-0 text-[11px] font-semibold tracking-[0.1em] uppercase px-4 py-2 rounded-full transition-all duration-200"
              style={
                active === cat
                  ? { background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "#fff" }
                  : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((event) => (
          <Link key={event.id} href={`/eventos/${event.id}`}
            className="card group block overflow-hidden rounded-xl">
            {/* Image */}
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/20 to-transparent opacity-90" />

              {/* Category pill */}
              <span className="category-pill absolute top-3 left-3 text-white"
                style={{ background: event.pillBg, color: event.pillColor, border: `1px solid ${event.pillBorder}`, backdropFilter: "blur(8px)" }}>
                {event.category}
              </span>

              {/* Date block — top right */}
              <div className="absolute top-3 right-3 flex flex-col items-center text-center px-2.5 py-2 rounded-lg"
                style={{ background: "rgba(7,7,7,0.75)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-white/40 text-[8px] font-bold tracking-[0.15em] uppercase leading-none mb-0.5">{event.month}</span>
                <span className="text-white font-[family-name:var(--font-bebas)] text-2xl leading-none">{event.day}</span>
                <span className="text-white/30 text-[8px] font-medium tracking-wide uppercase">{event.date}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-white font-semibold text-[15px] leading-snug mb-1.5 group-hover:text-white/85 transition-colors">
                {event.title}
              </h3>
              <div className="flex items-center gap-1.5 mb-4">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0 opacity-25">
                  <path d="M5.5 0.5C3.567 0.5 2 2.067 2 4c0 2.5 3.5 6.5 3.5 6.5S9 6.5 9 4c0-1.933-1.567-3.5-3.5-3.5Z" stroke="white" strokeWidth="1.2"/>
                </svg>
                <span className="text-white/25 text-xs truncate">{event.venue}, {event.city}</span>
              </div>

              <div className="flex items-center justify-between pt-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <p className="text-white/25 text-[9px] uppercase tracking-[0.12em] mb-0.5">Desde</p>
                  <p className="text-white font-bold text-base">{event.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-5 h-5 rounded-full border border-[#070707] bg-gradient-to-br"
                        style={{ background: ["#7c3aed","#db2777","#0891b2"][i], borderWidth: "1.5px" }} />
                    ))}
                  </div>
                  <span className="text-white/25 text-[10px]">+{event.going.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link href="/eventos"
          className="btn-secondary text-sm px-8 py-3 rounded-full inline-block">
          Ver todos los eventos
        </Link>
      </div>
    </section>
  );
}
