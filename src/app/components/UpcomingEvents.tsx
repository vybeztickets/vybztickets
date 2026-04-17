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
    color: "#7c3aed",
  },
  {
    id: 2,
    title: "Jazz & Chill Rooftop",
    category: "Jazz",
    date: "SAT 5 ABR",
    venue: "Escazú, San José",
    price: "₡25,000",
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=800&q=80",
    color: "#d97706",
  },
  {
    id: 3,
    title: "Reggaeton Night Liberia",
    category: "Reggaeton",
    date: "SAT 12 ABR",
    venue: "Centro Comercial Liberia, Guanacaste",
    price: "₡30,000",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
    color: "#059669",
  },
  {
    id: 4,
    title: "Rock en el Parque",
    category: "Rock",
    date: "SUN 20 ABR",
    venue: "Parque Central, Heredia",
    price: "₡20,000",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80",
    color: "#dc2626",
  },
  {
    id: 5,
    title: "Salsa Tropical",
    category: "Salsa",
    date: "SAT 3 MAY",
    venue: "Centro Cultural, Cartago",
    price: "₡15,000",
    image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=800&q=80",
    color: "#db2777",
  },
  {
    id: 6,
    title: "Festival de Verano",
    category: "Pop",
    date: "SAT 10 MAY",
    venue: "Playa Flamingo, Guanacaste",
    price: "₡35,000",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
    color: "#2563eb",
  },
];

export default function UpcomingEvents() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[#666] text-xs tracking-[0.25em] uppercase font-medium mb-2">
            No te lo pierdas
          </p>
          <h2 className="font-[family-name:var(--font-bebas)] text-5xl md:text-6xl text-white tracking-wide">
            Upcoming Events
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {EVENTS.map((event) => (
          <Link
            key={event.id}
            href={`/eventos/${event.id}`}
            className="group bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:scale-[1.02] transition-all duration-300 cursor-pointer block"
          >
            {/* Image 4:3 */}
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#111]">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {/* Category badge */}
              <span
                className="absolute top-3 left-3 text-[10px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1"
                style={{ background: event.color, color: "#fff" }}
              >
                {event.category}
              </span>
            </div>

            {/* Card content */}
            <div className="p-5">
              <p className="text-[#666] text-[11px] tracking-[0.15em] uppercase font-medium mb-1.5">
                {event.date}
              </p>
              <h3 className="text-white font-semibold text-base leading-snug mb-1 group-hover:text-white/90">
                {event.title}
              </h3>
              <p className="text-[#555] text-xs mb-4 truncate">{event.venue}</p>
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm">
                  Desde {event.price}
                </span>
                <span className="text-[#888] text-xs border border-[#2a2a2a] px-3 py-1 group-hover:border-[#3a3a3a] transition-colors">
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
          className="text-[#888] hover:text-white text-sm border border-[#2a2a2a] px-6 py-3 hover:border-[#3a3a3a] transition-all"
        >
          Ver todos los eventos →
        </Link>
      </div>
    </section>
  );
}
