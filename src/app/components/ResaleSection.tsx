import Image from "next/image";
import Link from "next/link";

const RESALE_TICKETS = [
  {
    id: 20,
    title: "Taylor Swift — The Eras Tour",
    venue: "Estadio Nacional, San José",
    date: "OCT 2025",
    qty: 2,
    originalPrice: "₡80,000",
    resalePrice: "₡145,000",
    image: "https://images.unsplash.com/photo-1540039723070-438d9dfdeab2?auto=format&fit=crop&w=800&q=80",
    section: "Campo A",
  },
  {
    id: 21,
    title: "Bad Bunny — Un Verano Sin Ti",
    venue: "Estadio Morera Soto, Alajuela",
    date: "NOV 2025",
    qty: 1,
    originalPrice: "₡65,000",
    resalePrice: "₡95,000",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
    section: "Platea Norte",
  },
  {
    id: 22,
    title: "Guns N' Roses Live",
    venue: "Parque La Sabana, San José",
    date: "DIC 2025",
    qty: 4,
    originalPrice: "₡55,000",
    resalePrice: "₡78,000",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80",
    section: "General",
  },
];

const ESCROW_STEPS = [
  {
    step: "01",
    title: "Comprador paga",
    desc: "El pago queda retenido en custodia segura. El vendedor no recibe nada aún.",
  },
  {
    step: "02",
    title: "Transferencia verificada",
    desc: "Verificamos la autenticidad de los tickets antes de liberarlos al comprador.",
  },
  {
    step: "03",
    title: "Fondos liberados",
    desc: "Solo cuando confirmas la recepción, el vendedor recibe su dinero.",
  },
];

export default function ResaleSection() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[#666] text-xs tracking-[0.25em] uppercase font-medium mb-2">
            Marketplace seguro
          </p>
          <h2 className="font-[family-name:var(--font-bebas)] text-5xl md:text-6xl text-white tracking-wide">
            Tickets for Resale
          </h2>
        </div>
        <Link
          href="/reventa"
          className="hidden md:flex items-center gap-2 text-[#888] hover:text-white text-sm transition-colors group"
        >
          Ver todo
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Resale cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
        {RESALE_TICKETS.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/reventa/${ticket.id}`}
            className="group bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:scale-[1.02] transition-all duration-300 block"
          >
            {/* Image */}
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#111]">
              <Image
                src={ticket.image}
                alt={ticket.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
              {/* RESALE badge */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 bg-[#f59e0b] text-[#0a0a0a]">
                  RESALE
                </span>
                <span className="text-[9px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888]">
                  🔒 ESCROW
                </span>
              </div>
              <div className="absolute bottom-3 left-4 text-[10px] text-[#666] tracking-wide">
                {ticket.section} · {ticket.qty} {ticket.qty === 1 ? "entrada" : "entradas"}
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-[#666] text-[11px] tracking-[0.15em] uppercase font-medium mb-1.5">
                {ticket.date}
              </p>
              <h3 className="text-white font-semibold text-base leading-snug mb-1">
                {ticket.title}
              </h3>
              <p className="text-[#555] text-xs mb-4 truncate">{ticket.venue}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#555] text-xs line-through mr-2">
                    {ticket.originalPrice}
                  </span>
                  <span className="text-white font-semibold">{ticket.resalePrice}</span>
                </div>
                <span className="text-[#888] text-xs border border-[#2a2a2a] px-3 py-1 group-hover:border-[#3a3a3a] transition-colors">
                  Comprar
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Escrow explanation */}
      <div className="border border-[#2a2a2a] bg-[#111] p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
          <div className="flex-1">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] inline-block mb-3">
              🔒 ESCROW PROTECTED
            </span>
            <h3 className="font-[family-name:var(--font-bebas)] text-3xl md:text-4xl text-white tracking-wide">
              Compra y vende sin riesgos
            </h3>
            <p className="text-[#555] text-sm mt-2 max-w-md leading-relaxed">
              Nuestro sistema escrow protege tanto al comprador como al vendedor. El dinero solo se libera cuando ambas partes confirman la transacción.
            </p>
          </div>
          <Link
            href="/reventa"
            className="shrink-0 bg-white text-[#0a0a0a] font-semibold text-sm px-6 py-3 hover:bg-white/90 transition-colors"
          >
            Vender mis entradas
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[#2a2a2a] pt-8">
          {ESCROW_STEPS.map((s) => (
            <div key={s.step} className="flex gap-4">
              <span className="font-[family-name:var(--font-bebas)] text-4xl text-[#2a2a2a] leading-none shrink-0">
                {s.step}
              </span>
              <div>
                <p className="text-white font-semibold text-sm mb-1">{s.title}</p>
                <p className="text-[#555] text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
