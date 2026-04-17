import Image from "next/image";
import Link from "next/link";

const RESALE = [
  {
    id: 20,
    title: "Taylor Swift — The Eras Tour",
    venue: "Estadio Nacional · San José",
    date: "OCT 2025",
    qty: 2,
    originalPrice: "₡80,000",
    resalePrice: "₡145,000",
    pct: "+81%",
    image: "https://images.unsplash.com/photo-1540039723070-438d9dfdeab2?auto=format&fit=crop&w=800&q=80",
    section: "Campo A",
  },
  {
    id: 21,
    title: "Bad Bunny — Un Verano Sin Ti",
    venue: "Estadio Morera Soto · Alajuela",
    date: "NOV 2025",
    qty: 1,
    originalPrice: "₡65,000",
    resalePrice: "₡95,000",
    pct: "+46%",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
    section: "Platea Norte",
  },
  {
    id: 22,
    title: "Guns N' Roses Live",
    venue: "Parque La Sabana · San José",
    date: "DIC 2025",
    qty: 4,
    originalPrice: "₡55,000",
    resalePrice: "₡78,000",
    pct: "+42%",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80",
    section: "General",
  },
];

const STEPS = [
  { n: "01", title: "Comprador paga", desc: "El pago queda retenido en custodia. El vendedor no recibe nada aún." },
  { n: "02", title: "Tickets verificados", desc: "Confirmamos autenticidad antes de liberar las entradas al comprador." },
  { n: "03", title: "Fondos liberados", desc: "Cuando confirmas recepción, el vendedor recibe su pago al instante." },
];

export default function ResaleSection() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-white/20 text-[10px] tracking-[0.28em] uppercase font-semibold mb-2">
            Marketplace P2P seguro
          </p>
          <h2 className="font-[family-name:var(--font-bebas)] leading-none tracking-wide text-white"
            style={{ fontSize: "clamp(42px, 5.5vw, 72px)" }}>
            Tickets for Resale
          </h2>
        </div>
        <Link href="/reventa"
          className="hidden md:inline-flex items-center gap-2 text-white/30 hover:text-white text-sm transition-colors group shrink-0">
          Ver mercado completo
          <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        {RESALE.map((t) => (
          <Link key={t.id} href={`/reventa/${t.id}`}
            className="card group block rounded-xl overflow-hidden">
            {/* Image */}
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              <Image src={t.image} alt={t.title} fill
                className="object-cover opacity-55 transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/30 to-transparent" />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="text-[8px] font-bold tracking-[0.18em] uppercase px-2.5 py-1.5 rounded-full text-white"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
                  RESALE
                </span>
                <span className="text-[8px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1.5 rounded-full text-white/40"
                  style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  🔒 ESCROW
                </span>
              </div>

              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                <span className="text-white/30 text-[10px] tracking-wide">
                  {t.section} · {t.qty} {t.qty === 1 ? "entrada" : "entradas"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded text-emerald-400"
                  style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  {t.pct}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-5">
              <p className="text-white/20 text-[10px] tracking-[0.15em] uppercase mb-1.5">{t.date}</p>
              <h3 className="text-white font-semibold text-[15px] leading-snug mb-1">{t.title}</h3>
              <p className="text-white/20 text-xs mb-4 truncate">{t.venue}</p>
              <div className="flex items-center justify-between pt-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-baseline gap-2">
                  <span className="text-white/25 text-xs line-through">{t.originalPrice}</span>
                  <span className="text-white font-bold">{t.resalePrice}</span>
                </div>
                <span className="btn-secondary text-[11px] px-3 py-1.5 rounded-full">
                  Comprar
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Escrow CTA */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(219,39,119,0.06))", border: "1px solid rgba(124,58,237,0.2)" }}>

        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.2), transparent 70%)", filter: "blur(40px)" }} />

        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full mb-4"
                style={{ background: "rgba(124,58,237,0.18)", border: "1px solid rgba(167,139,250,0.3)", color: "#c084fc" }}>
                🔒 ESCROW PROTECTED
              </span>
              <h3 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl text-white tracking-wide leading-none mb-2">
                Compra y vende
                <br />
                <span className="gradient-text">sin riesgos</span>
              </h3>
              <p className="text-white/30 text-sm max-w-md leading-relaxed">
                El dinero queda en custodia hasta que ambas partes confirman. Sin fraudes, sin sorpresas.
              </p>
            </div>
            <Link href="/reventa"
              className="btn-primary shrink-0 text-sm px-7 py-3.5 rounded-full inline-block text-center">
              Vender mis entradas
            </Link>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex gap-5 pt-8 md:pr-8"
                style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none", paddingLeft: i > 0 ? "2rem" : "0" }}>
                <span className="font-[family-name:var(--font-bebas)] text-5xl leading-none gradient-text-subtle shrink-0 opacity-60">
                  {s.n}
                </span>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">{s.title}</p>
                  <p className="text-white/25 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
