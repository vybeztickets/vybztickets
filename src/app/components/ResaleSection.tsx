import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";

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
    <section className="py-24 px-6" style={{ background: "#ffffff" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Reveal className="flex items-end justify-between mb-10">
          <div>
            <div
              className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40">✦ MARKETPLACE P2P</span>
            </div>
            <h2
              className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide"
              style={{ fontSize: "clamp(40px, 5vw, 64px)" }}
            >
              Tickets for Resale
            </h2>
          </div>
          <Link
            href="/reventa"
            className="hidden md:inline-flex items-center gap-2 text-[#0a0a0a]/35 hover:text-[#0a0a0a] text-sm font-medium transition-colors group shrink-0"
          >
            Ver mercado completo
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
        </Reveal>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {RESALE.map((t, i) => (
            <Reveal key={t.id} delay={i * 100}>
              <Link href={`/reventa/${t.id}`} className="card-light group block overflow-hidden">
                <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-[15px]">
                  <Image
                    src={t.image}
                    alt={t.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span
                      className="text-[8px] font-bold tracking-[0.18em] uppercase px-2.5 py-1.5 rounded-full"
                      style={{ background: "#0a0a0a", color: "#fff" }}
                    >
                      RESALE
                    </span>
                    <span
                      className="text-[8px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.88)", color: "#0a0a0a" }}
                    >
                      🔒 ESCROW
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                    <span className="text-white/60 text-[10px] tracking-wide">
                      {t.section} · {t.qty} {t.qty === 1 ? "entrada" : "entradas"}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,0.9)", color: "#059669" }}
                    >
                      {t.pct}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-[#0a0a0a]/30 text-[10px] tracking-[0.15em] uppercase mb-1.5">{t.date}</p>
                  <h3 className="text-[#0a0a0a] font-semibold text-[15px] leading-snug mb-1">{t.title}</h3>
                  <p className="text-[#0a0a0a]/25 text-xs mb-4 truncate">{t.venue}</p>
                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-[#0a0a0a]/25 text-xs line-through">{t.originalPrice}</span>
                      <span className="text-[#0a0a0a] font-bold">{t.resalePrice}</span>
                    </div>
                    <span
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-full text-[#0a0a0a] transition-colors hover:bg-[#0a0a0a] hover:text-white"
                      style={{ border: "1.5px solid rgba(0,0,0,0.12)" }}
                    >
                      Comprar
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* Escrow CTA */}
        <Reveal>
          <div
            className="rounded-2xl overflow-hidden p-8 md:p-12"
            style={{ background: "#0a0a0a" }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
              <div>
                <span
                  className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full mb-4"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}
                >
                  🔒 ESCROW PROTECTED
                </span>
                <h3 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl text-white tracking-wide leading-none mb-2">
                  Compra y vende
                  <br />
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>sin riesgos</span>
                </h3>
                <p className="text-white/30 text-sm max-w-md leading-relaxed">
                  El dinero queda en custodia hasta que ambas partes confirman. Sin fraudes, sin sorpresas.
                </p>
              </div>
              <Link
                href="/reventa"
                className="shrink-0 text-sm font-semibold px-7 py-3.5 rounded-full inline-block text-center bg-white text-[#0a0a0a] hover:bg-white/90 transition-colors"
              >
                Vender mis entradas →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              {STEPS.map((s, i) => (
                <div
                  key={s.n}
                  className="flex gap-5 pt-8 md:pr-8"
                  style={{
                    borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                    paddingLeft: i > 0 ? "2rem" : "0",
                  }}
                >
                  <span className="font-[family-name:var(--font-bebas)] text-5xl leading-none text-white/15 shrink-0">
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
        </Reveal>
      </div>
    </section>
  );
}
