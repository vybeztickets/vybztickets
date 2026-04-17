import Image from "next/image";
import Link from "next/link";

const FEATURED = [
  {
    id: 10,
    title: "Tomorrowland Costa Rica",
    category: "Electronic",
    date: "JUN 2025",
    venue: "Estadio Nacional, San José",
    price: "₡120,000",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80",
    tag: "SOLD OUT SOON",
  },
  {
    id: 11,
    title: "Pitbull — Vibras Tour CR",
    category: "Pop / Reggaeton",
    date: "JUL 2025",
    venue: "Estadio Nacional, Alajuela",
    price: "₡85,000",
    image: "https://images.unsplash.com/photo-1501281668745-b851a45f6af5?auto=format&fit=crop&w=1200&q=80",
    tag: "DESTACADO",
  },
  {
    id: 12,
    title: "Festival Internacional de Jazz",
    category: "Jazz",
    date: "AGO 2025",
    venue: "Teatro Nacional, San José",
    price: "₡60,000",
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=1200&q=80",
    tag: "EARLY BIRD",
  },
  {
    id: 13,
    title: "Coldplay — Music of the Spheres",
    category: "Rock",
    date: "SEP 2025",
    venue: "Estadio Nacional, San José",
    price: "₡150,000",
    image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&q=80",
    tag: "NUEVO",
  },
];

export default function FeaturedEvents() {
  return (
    <section className="py-20 bg-[#0d0d0d]">
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[#666] text-xs tracking-[0.25em] uppercase font-medium mb-2">
              Los más esperados
            </p>
            <h2 className="font-[family-name:var(--font-bebas)] text-5xl md:text-6xl text-white tracking-wide">
              Featured Events
            </h2>
          </div>
          <Link
            href="/eventos"
            className="hidden md:flex items-center gap-2 text-[#888] hover:text-white text-sm transition-colors group"
          >
            Ver todos
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div className="horizontal-scroll overflow-x-auto pb-4">
        <div className="flex gap-5 px-6 max-w-7xl mx-auto" style={{ width: "max-content" }}>
          {FEATURED.map((event) => (
            <Link
              key={event.id}
              href={`/eventos/${event.id}`}
              className="group relative flex-shrink-0 w-[340px] md:w-[420px] bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:scale-[1.02] transition-all duration-300 block"
            >
              {/* 16:9 image */}
              <div className="relative w-full aspect-video overflow-hidden bg-[#111]">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="420px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent" />
                {/* Tag */}
                <span className="absolute top-3 right-3 text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 bg-white text-[#0a0a0a]">
                  {event.tag}
                </span>
                {/* Category bottom-left */}
                <span className="absolute bottom-3 left-4 text-[10px] text-[#888] tracking-[0.15em] uppercase">
                  {event.category}
                </span>
              </div>

              <div className="p-5">
                <p className="text-[#666] text-[11px] tracking-[0.15em] uppercase font-medium mb-1.5">
                  {event.date}
                </p>
                <h3 className="text-white font-semibold text-lg leading-snug mb-1">
                  {event.title}
                </h3>
                <p className="text-[#555] text-xs mb-4 truncate">{event.venue}</p>
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Desde {event.price}</span>
                  <span className="text-[#888] text-xs border border-[#2a2a2a] px-3 py-1.5 group-hover:border-[#3a3a3a] transition-colors">
                    Ver entradas
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
