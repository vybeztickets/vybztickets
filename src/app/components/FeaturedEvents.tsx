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
    tagGradient: "linear-gradient(135deg,#7c3aed,#ec4899)",
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
    tagGradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
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
    tagGradient: "linear-gradient(135deg,#10b981,#3b82f6)",
  },
  {
    id: 13,
    title: "Coldplay — Music of the Spheres",
    category: "Rock / Pop",
    date: "SEP 2025",
    venue: "Estadio Nacional, San José",
    price: "₡150,000",
    image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&q=80",
    tag: "NUEVO",
    tagGradient: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
  },
];

export default function FeaturedEvents() {
  return (
    <section className="py-20" style={{ background: "linear-gradient(to bottom, #080808, #0c0c0c, #080808)" }}>
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/25 text-[11px] tracking-[0.25em] uppercase font-medium mb-2">
              Los más esperados
            </p>
            <h2 className="font-[family-name:var(--font-bebas)] text-5xl md:text-[64px] text-white tracking-wide leading-none">
              Featured Events
            </h2>
          </div>
          <Link
            href="/eventos"
            className="hidden md:flex items-center gap-2 text-white/30 hover:text-white text-sm transition-colors group"
          >
            Ver todos
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
        </div>
      </div>

      <div className="h-scroll overflow-x-auto pb-4">
        <div className="flex gap-4 px-6 max-w-7xl mx-auto" style={{ width: "max-content" }}>
          {FEATURED.map((event) => (
            <Link
              key={event.id}
              href={`/eventos/${event.id}`}
              className="gradient-border group block flex-shrink-0 w-[340px] md:w-[420px] overflow-hidden hover:scale-[1.02] transition-all duration-300"
            >
              {/* 16:9 */}
              <div className="relative w-full aspect-video overflow-hidden bg-[#111]">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                  sizes="420px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/20 to-transparent" />

                {/* Tag */}
                <span
                  className="absolute top-3 right-3 text-[9px] font-bold tracking-[0.18em] uppercase px-2.5 py-1.5 text-white"
                  style={{ background: event.tagGradient, borderRadius: "2px" }}
                >
                  {event.tag}
                </span>

                {/* Category bottom-left */}
                <span className="absolute bottom-3 left-4 text-[10px] text-white/30 tracking-[0.12em] uppercase">
                  {event.category}
                </span>
              </div>

              <div className="p-5">
                <p className="text-white/25 text-[10px] tracking-[0.18em] uppercase font-medium mb-1.5">
                  {event.date}
                </p>
                <h3 className="text-white font-semibold text-lg leading-snug mb-1 group-hover:text-white/90">
                  {event.title}
                </h3>
                <p className="text-white/25 text-xs mb-4 truncate">{event.venue}</p>
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Desde {event.price}</span>
                  <span
                    className="text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all"
                    style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                  >
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
