import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";

const FEATURED = [
  {
    id: 10,
    title: "Tomorrowland Costa Rica",
    subtitle: "El festival de música electrónica más grande del mundo llega a Costa Rica por primera vez.",
    category: "Electronic",
    date: "28 JUN 2025",
    venue: "Estadio Nacional · San José",
    price: "₡120,000",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=85",
    tag: "SOLD OUT SOON",
    big: true,
  },
  {
    id: 11,
    title: "Pitbull — Vibras Tour",
    category: "Reggaeton",
    date: "18 JUL 2025",
    venue: "Estadio Morera Soto · Alajuela",
    price: "₡85,000",
    image: "https://images.unsplash.com/photo-1501281668745-b851a45f6af5?auto=format&fit=crop&w=800&q=80",
    tag: "DESTACADO",
    big: false,
  },
  {
    id: 12,
    title: "Festival Int'l de Jazz",
    category: "Jazz",
    date: "8 AGO 2025",
    venue: "Teatro Nacional · San José",
    price: "₡60,000",
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=800&q=80",
    tag: "EARLY BIRD",
    big: false,
  },
  {
    id: 13,
    title: "Coldplay — Music of the Spheres",
    category: "Rock",
    date: "5 SEP 2025",
    venue: "Estadio Nacional · San José",
    price: "₡150,000",
    image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=800&q=80",
    tag: "NUEVO",
    big: false,
  },
];

const big = FEATURED.find((e) => e.big)!;
const small = FEATURED.filter((e) => !e.big);

export default function FeaturedEvents() {
  return (
    <section className="py-24 px-6" style={{ background: "#f7f7f7" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Reveal className="flex items-end justify-between mb-10">
          <div>
            <div
              className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40">✦ DESTACADOS</span>
            </div>
            <h2
              className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide"
              style={{ fontSize: "clamp(40px, 5vw, 64px)" }}
            >
              Featured Events
            </h2>
          </div>
          <Link
            href="/eventos"
            className="hidden md:inline-flex items-center gap-2 text-[#0a0a0a]/35 hover:text-[#0a0a0a] text-sm font-medium transition-colors group shrink-0"
          >
            Ver todos
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
        </Reveal>

        {/* Editorial layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Big card */}
          <Reveal direction="left" className="lg:col-span-3">
            <Link
              href={`/eventos/${big.id}`}
              className="card-light group block overflow-hidden relative"
              style={{ minHeight: "480px", display: "flex", flexDirection: "column" }}
            >
              <div className="relative flex-1 overflow-hidden" style={{ minHeight: 480 }}>
                <Image
                  src={big.image}
                  alt={big.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Tag */}
                <div className="absolute top-5 left-5">
                  <span
                    className="text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
                  >
                    {big.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <p className="text-white/50 text-[11px] tracking-[0.15em] uppercase font-medium mb-2">{big.date}</p>
                  <h3 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl text-white tracking-wide leading-none mb-2">
                    {big.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-5 max-w-sm">{big.subtitle}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-[9px] uppercase tracking-[0.12em] mb-0.5">Desde</p>
                      <p className="text-white font-bold text-xl">{big.price}</p>
                    </div>
                    <div
                      className="text-white/70 text-xs px-4 py-2 rounded-full"
                      style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                      {big.venue}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Small cards */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {small.map((event, i) => (
              <Reveal key={event.id} direction="right" delay={i * 120}>
                <Link
                  href={`/eventos/${event.id}`}
                  className="card-light group flex overflow-hidden flex-1"
                  style={{ minHeight: "144px" }}
                >
                  <div className="relative w-28 shrink-0 overflow-hidden rounded-l-[15px]">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="112px"
                    />
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(0,0,0,0.06)", color: "#0a0a0a" }}
                        >
                          {event.tag}
                        </span>
                        <span className="text-[#0a0a0a]/25 text-[9px] uppercase tracking-wide">{event.category}</span>
                      </div>
                      <h4 className="text-[#0a0a0a] font-semibold text-sm leading-snug group-hover:text-[#0a0a0a]/70 transition-colors">
                        {event.title}
                      </h4>
                      <p className="text-[#0a0a0a]/30 text-[11px] mt-0.5 truncate">{event.venue}</p>
                    </div>
                    <div
                      className="flex items-center justify-between pt-3"
                      style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
                    >
                      <span className="text-[#0a0a0a] font-bold text-sm">{event.price}</span>
                      <span className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wide">{event.date}</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
