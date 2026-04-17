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
    n: "01",
    title: "Comprador paga",
    desc: "El pago queda retenido en custodia segura. El vendedor no recibe nada aún.",
  },
  {
    n: "02",
    title: "Transferencia verificada",
    desc: "Verificamos la autenticidad de los tickets antes de liberarlos al comprador.",
  },
  {
    n: "03",
    title: "Fondos liberados",
    desc: "Solo cuando confirmas la recepción, el vendedor recibe su dinero.",
  },
];

export default function ResaleSection() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-white/25 text-[11px] tracking-[0.25em] uppercase font-medium mb-2">
            Marketplace seguro
          </p>
          <h2 className="font-[family-name:var(--font-bebas)] text-5xl md:text-[64px] text-white tracking-wide leading-none">
            Tickets for Resale
          </h2>
        </div>
        <Link
          href="/reventa"
          className="hidden md:flex items-center gap-2 text-white/30 hover:text-white text-sm transition-colors group"
        >
          Ver todo
          <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
        </Link>
      </div>

      {/* Resale cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
        {RESALE_TICKETS.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/reventa/${ticket.id}`}
            className="gradient-border group block overflow-hidden hover:scale-[1.02] transition-all duration-300"
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#111]">
              <Image
                src={ticket.image}
                alt={ticket.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent" />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span
                  className="text-[8px] font-bold tracking-[0.2em] uppercase px-2.5 py-1.5 text-white"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}
                >
                  RESALE
                </span>
                <span
                  className="text-[8px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1.5"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  🔒 ESCROW
                </span>
              </div>

              <div className="absolute bottom-3 left-4 text-[10px] text-white/30 tracking-wide">
                {ticket.section} · {ticket.qty} {ticket.qty === 1 ? "entrada" : "entradas"}
              </div>
            </div>

            <div className="p-5">
              <p className="text-white/25 text-[10px] tracking-[0.18em] uppercase font-medium mb-1.5">
                {ticket.date}
              </p>
              <h3 className="text-white font-semibold text-[15px] leading-snug mb-1">{ticket.title}</h3>
              <p className="text-white/25 text-xs mb-4 truncate">{ticket.venue}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-white/25 text-xs line-through">{ticket.originalPrice}</span>
                  <span className="text-white font-semibold">{ticket.resalePrice}</span>
                </div>
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

      {/* Escrow block */}
      <div
        className="relative overflow-hidden p-8 md:p-10"
        style={{
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Glow bg accent */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)" }}
        />

        <div className="relative flex flex-col md:flex-row md:items-center gap-6 mb-8">
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase mb-3"
              style={{
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "#a78bfa",
              }}
            >
              🔒 ESCROW PROTECTED
            </div>
            <h3 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl text-white tracking-wide">
              Compra y vende sin riesgos
            </h3>
            <p className="text-white/30 text-sm mt-2 max-w-md leading-relaxed">
              Nuestro sistema escrow protege tanto al comprador como al vendedor. El dinero solo se libera cuando ambas partes confirman la transacción.
            </p>
          </div>
          <Link
            href="/reventa"
            className="btn-glow shrink-0 text-sm px-6 py-3 text-white inline-block text-center"
          >
            Vender mis entradas
          </Link>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {ESCROW_STEPS.map((s) => (
            <div key={s.n} className="flex gap-4">
              <span className="font-[family-name:var(--font-bebas)] text-5xl leading-none shrink-0 gradient-text">
                {s.n}
              </span>
              <div>
                <p className="text-white font-semibold text-sm mb-1">{s.title}</p>
                <p className="text-white/30 text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
