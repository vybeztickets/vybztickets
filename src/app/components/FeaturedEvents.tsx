import Image from "next/image";
import Link from "next/link";

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
    tagColor: "#c084fc",
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
    tagColor: "#fb923c",
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
    tagColor: "#34d399",
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
    tagColor: "#60a5fa",
    big: false,
  },
];

const big = FEATURED.find((e) => e.big)!;
const small = FEATURED.filter((e) => !e.big);

export default function FeaturedEvents() {
  return (
    <section className="py-24" style={{ background: "linear-gradient(180deg,#070707 0%,#0c0a14 50%,#070707 100%)" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-white/20 text-[10px] tracking-[0.28em] uppercase font-semibold mb-2">
              Los más esperados
            </p>
            <h2 className="font-[family-name:var(--font-bebas)] leading-none tracking-wide text-white"
              style={{ fontSize: "clamp(42px, 5.5vw, 72px)" }}>
              Featured Events
            </h2>
          </div>
          <Link href="/eventos"
            className="hidden md:inline-flex items-center gap-2 text-white/30 hover:text-white text-sm transition-colors group shrink-0">
            Ver todos
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
        </div>

        {/* Editorial layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Big hero card — col-span-3 */}
          <Link href={`/eventos/${big.id}`}
            className="lg:col-span-3 card group block rounded-2xl overflow-hidden relative"
            style={{ minHeight: "480px" }}>
            <Image src={big.image} alt={big.title} fill
              className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 60vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/50 to-transparent" />

            {/* Tag */}
            <div className="absolute top-5 left-5 flex items-center gap-2">
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full text-white"
                style={{ background: `${big.tagColor}28`, border: `1px solid ${big.tagColor}60`, color: big.tagColor }}>
                {big.tag}
              </span>
              <span className="text-[9px] font-semibold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full text-white/40"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {big.category}
              </span>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-7">
              <p className="text-white/35 text-[11px] tracking-[0.15em] uppercase font-medium mb-2">{big.date}</p>
              <h3 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl text-white tracking-wide leading-none mb-2">
                {big.title}
              </h3>
              {big.subtitle && (
                <p className="text-white/40 text-sm leading-relaxed mb-5 max-w-sm">{big.subtitle}</p>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/25 text-[9px] uppercase tracking-[0.12em] mb-0.5">Desde</p>
                  <p className="text-white font-bold text-xl">{big.price}</p>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: "999px" }}>
                  <span>{big.venue}</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Small cards — col-span-2 */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {small.map((event) => (
              <Link key={event.id} href={`/eventos/${event.id}`}
                className="card group flex gap-0 rounded-xl overflow-hidden flex-1"
                style={{ minHeight: "144px" }}>
                {/* Image */}
                <div className="relative w-32 shrink-0 overflow-hidden">
                  <Image src={event.image} alt={event.title} fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="128px" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[rgba(12,10,20,0.5)]" />
                </div>
                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold tracking-[0.15em] uppercase"
                        style={{ color: event.tagColor }}>
                        {event.tag}
                      </span>
                      <span className="text-white/20 text-[9px] uppercase tracking-wide">{event.category}</span>
                    </div>
                    <h4 className="text-white font-semibold text-sm leading-snug group-hover:text-white/80 transition-colors">
                      {event.title}
                    </h4>
                    <p className="text-white/25 text-[11px] mt-1 truncate">{event.venue}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-white font-bold text-sm">{event.price}</span>
                    <span className="text-white/25 text-[10px] uppercase tracking-wide">{event.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
