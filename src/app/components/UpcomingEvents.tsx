import Image from "next/image";
import Link from "next/link";

const EVENTS = [
  {
    id: 1,
    title: "Ultra Music Festival CR",
    category: "Electronic",
    date: "SAT 15 MAR",
    venue: "Parque La Sabana, San José",
    price: "₡45,000",
    image: "https://images.unsplash.com/photo-1540039723070-438d9dfdeab2?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(139,92,246,0.2)",
    pillColor: "#a78bfa",
  },
  {
    id: 2,
    title: "Jazz & Chill Rooftop",
    category: "Jazz",
    date: "SAT 5 ABR",
    venue: "Escazú, San José",
    price: "₡25,000",
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(251,191,36,0.15)",
    pillColor: "#fbbf24",
  },
  {
    id: 3,
    title: "Reggaeton Night Liberia",
    category: "Reggaeton",
    date: "SAT 12 ABR",
    venue: "Guanacaste",
    price: "₡30,000",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(52,211,153,0.15)",
    pillColor: "#34d399",
  },
  {
    id: 4,
    title: "Rock en el Parque",
    category: "Rock",
    date: "SUN 20 ABR",
    venue: "Parque Central, Heredia",
    price: "₡20,000",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(248,113,113,0.15)",
    pillColor: "#f87171",
  },
  {
    id: 5,
    title: "Salsa Tropical",
    category: "Salsa",
    date: "SAT 3 MAY",
    venue: "Centro Cultural, Cartago",
    price: "₡15,000",
    image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(244,114,182,0.15)",
    pillColor: "#f472b6",
  },
  {
    id: 6,
    title: "Festival de Verano",
    category: "Pop",
    date: "SAT 10 MAY",
    venue: "Playa Flamingo, Guanacaste",
    price: "₡35,000",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
    pillBg: "rgba(96,165,250,0.15)",
    pillColor: "#60a5fa",
  },
];

export default function UpcomingEvents() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-white/25 text-[11px] tracking-[0.25em] uppercase font-medium mb-2">
            No te lo pierdas
          </p>
          <h2 className="font-[family-name:var(--font-bebas)] text-5xl md:text-[64px] text-white tracking-wide leading-none">
            Upcoming Events
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EVENTS.map((event) => (
          <Link
            key={event.id}
            href={`/eventos/${event.id}`}
            className="gradient-border group block overflow-hidden hover:scale-[1.02] transition-all duration-300"
            style={{ borderRadius: "2px" }}
          >
            {/* Image 4:3 */}
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#111]">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-80" />

              {/* Category pill */}
              <span
                className="pill absolute top-3 left-3"
                style={{ background: event.pillBg, color: event.pillColor, backdropFilter: "blur(8px)", border: `1px solid ${event.pillColor}33` }}
              >
                {event.category}
              </span>
            </div>

            {/* Content */}
            <div className="p-5 bg-transparent">
              <p className="text-white/25 text-[10px] tracking-[0.18em] uppercase font-medium mb-1.5">
                {event.date}
              </p>
              <h3 className="text-white font-semibold text-[15px] leading-snug mb-1 group-hover:text-white/90 transition-colors">
                {event.title}
              </h3>
              <p className="text-white/25 text-xs mb-5 truncate">{event.venue}</p>
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm">Desde {event.price}</span>
                <span
                  className="text-[11px] font-medium px-3 py-1 rounded-full border transition-all"
                  style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                >
                  Comprar
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex justify-center md:hidden">
        <Link
          href="/eventos"
          className="text-white/40 hover:text-white text-sm border border-white/10 px-6 py-3 rounded-full hover:border-white/20 transition-all"
        >
          Ver todos los eventos →
        </Link>
      </div>
    </section>
  );
}
