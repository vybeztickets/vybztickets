"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";

const CATEGORIES = ["Todo", "Electronic", "Rock", "Reggaeton", "Jazz", "Salsa", "Pop", "Teatro", "Deportes"];

const EVENTS = [
  {
    id: 1,
    title: "Ultra Music Festival CR",
    category: "Electronic",
    day: "15",
    month: "MAR",
    dow: "SAT",
    venue: "Parque La Sabana",
    city: "San José",
    price: "₡45,000",
    going: 1240,
    image: "https://images.unsplash.com/photo-1540039723070-438d9dfdeab2?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "Jazz & Chill Rooftop",
    category: "Jazz",
    day: "5",
    month: "ABR",
    dow: "SAT",
    venue: "Rooftop 503",
    city: "Escazú",
    price: "₡25,000",
    going: 318,
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "Reggaeton Night Liberia",
    category: "Reggaeton",
    day: "12",
    month: "ABR",
    dow: "SAT",
    venue: "Arena Guanacaste",
    city: "Liberia",
    price: "₡30,000",
    going: 876,
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    title: "Rock en el Parque",
    category: "Rock",
    day: "20",
    month: "ABR",
    dow: "SUN",
    venue: "Parque Central",
    city: "Heredia",
    price: "₡20,000",
    going: 543,
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    title: "Salsa Tropical",
    category: "Salsa",
    day: "3",
    month: "MAY",
    dow: "SAT",
    venue: "Centro Cultural",
    city: "Cartago",
    price: "₡15,000",
    going: 209,
    image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    title: "Festival de Verano",
    category: "Pop",
    day: "10",
    month: "MAY",
    dow: "SAT",
    venue: "Playa Flamingo",
    city: "Guanacaste",
    price: "₡35,000",
    going: 1980,
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
  },
];

export default function UpcomingEvents() {
  const [active, setActive] = useState("Todo");
  const filtered = active === "Todo" ? EVENTS : EVENTS.filter((e) => e.category === active);

  return (
    <section className="py-24 px-6" style={{ background: "#ffffff" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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

        {/* Category tabs */}
        <div className="overflow-x-auto mb-8 -mx-1 px-1">
          <div className="flex gap-2 w-max">
            {CATEGORIES.map((cat) => (
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

        {/* Events grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((event, i) => (
            <Reveal key={event.id} delay={i * 80}>
              <Link href={`/eventos/${event.id}`} className="card-light group block overflow-hidden">
                {/* Image */}
                <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-[15px]">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                  {/* Date block */}
                  <div
                    className="absolute top-3 right-3 flex flex-col items-center text-center px-2.5 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)" }}
                  >
                    <span className="text-[#0a0a0a]/40 text-[8px] font-bold tracking-[0.15em] uppercase leading-none mb-0.5">{event.month}</span>
                    <span className="text-[#0a0a0a] font-[family-name:var(--font-bebas)] text-2xl leading-none">{event.day}</span>
                    <span className="text-[#0a0a0a]/30 text-[8px] font-medium tracking-wide uppercase">{event.dow}</span>
                  </div>

                  {/* Category pill */}
                  <div
                    className="absolute top-3 left-3 text-[9px] font-bold tracking-[0.12em] uppercase px-2.5 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)", color: "#0a0a0a" }}
                  >
                    {event.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-[#0a0a0a] font-semibold text-[15px] leading-snug mb-1.5 group-hover:text-[#0a0a0a]/70 transition-colors">
                    {event.title}
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
                      <p className="text-[#0a0a0a]/25 text-[9px] uppercase tracking-[0.12em] mb-0.5">Desde</p>
                      <p className="text-[#0a0a0a] font-bold text-base">{event.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {[0, 1, 2].map((j) => (
                          <div
                            key={j}
                            className="w-5 h-5 rounded-full border-2 border-white"
                            style={{ background: ["#0a0a0a", "#555", "#999"][j] }}
                          />
                        ))}
                      </div>
                      <span className="text-[#0a0a0a]/25 text-[10px]">+{event.going.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
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
