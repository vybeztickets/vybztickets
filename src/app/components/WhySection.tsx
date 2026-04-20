import Reveal from "./Reveal";

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    label: "SEGURIDAD",
    title: "Escrow Protegido",
    desc: "Tu dinero queda en custodia hasta que ambas partes confirman la transacción. Sin fraudes, sin sorpresas.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    label: "VELOCIDAD",
    title: "QR al Instante",
    desc: "Compra y recibe tu entrada digital en segundos. Directo a tu correo, lista para escanear en la puerta.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 2.1l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 21.9l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    label: "RETAIL",
    title: "Reventa Segura",
    desc: "Compra y vende entradas de segunda mano con la protección del sistema de escrow más confiable de Costa Rica.",
  },
];

export default function WhySection() {
  return (
    <section className="py-24 px-6" style={{ background: "#f7f7f7" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Reveal className="flex flex-col items-center text-center mb-14">
          <div
            className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40">✦ BENEFICIOS</span>
          </div>
          <h2
            className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-tight tracking-wide mb-3"
            style={{ fontSize: "clamp(40px, 5vw, 64px)" }}
          >
            Por qué elegir Vybz
          </h2>
          <p className="text-[#0a0a0a]/40 text-sm max-w-md leading-relaxed">
            La experiencia de compra de entradas más moderna y segura de Centroamérica.
          </p>
        </Reveal>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120} direction="up">
              <div className="card-light p-8 flex flex-col h-full">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-[#0a0a0a]"
                  style={{ background: "#0a0a0a0d" }}
                >
                  {f.icon}
                </div>
                {/* Label */}
                <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#0a0a0a]/30 mb-2">{f.label}</p>
                {/* Title */}
                <h3 className="text-[#0a0a0a] text-[18px] font-semibold leading-snug mb-3">{f.title}</h3>
                {/* Desc */}
                <p className="text-[#0a0a0a]/45 text-sm leading-relaxed flex-1">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Stat bar */}
        <Reveal delay={400} className="mt-10">
          <div
            className="rounded-2xl p-6 flex flex-wrap items-center justify-around gap-6"
            style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {[
              { n: "100%", label: "Pagos verificados" },
              { n: "QR", label: "Entrada digital" },
              { n: "B2B", label: "Para organizadores" },
              { n: "24/7", label: "Soporte disponible" },
            ].map(({ n, label }) => (
              <div key={label} className="text-center">
                <p className="font-[family-name:var(--font-bebas)] text-[32px] tracking-wide leading-none text-white">{n}</p>
                <p className="text-white/30 text-[10px] uppercase tracking-[0.15em] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
