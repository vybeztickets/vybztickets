import Image from "next/image";

const HERO_CARDS = [
  {
    title: "Tomorrowland CR",
    date: "JUN 28",
    price: "₡120,000",
    cat: "Electronic",
    img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80",
    rotate: "3deg",
    top: "0px",
    right: "0px",
    zIndex: 1,
  },
  {
    title: "Jazz & Chill Rooftop",
    date: "ABR 5",
    price: "₡25,000",
    cat: "Jazz",
    img: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=600&q=80",
    rotate: "-2.5deg",
    top: "80px",
    right: "160px",
    zIndex: 2,
  },
  {
    title: "Ultra Music Festival",
    date: "MAR 15",
    price: "₡45,000",
    cat: "Electronic",
    img: "https://images.unsplash.com/photo-1540039723070-438d9dfdeab2?auto=format&fit=crop&w=600&q=80",
    rotate: "1.5deg",
    top: "160px",
    right: "80px",
    zIndex: 3,
  },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden dot-grid flex items-center">
      {/* Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="absolute inset-0 bg-[#070707]/50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── Left column ── */}
          <div>
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2.5 mb-7 px-4 py-2 rounded-full"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400"
                style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-violet-300/80">
                Costa Rica · Latinoamérica
              </span>
            </div>

            {/* Main heading */}
            <h1 className="font-[family-name:var(--font-bebas)] leading-[0.9] tracking-wide mb-6"
              style={{ fontSize: "clamp(68px, 8.5vw, 116px)" }}>
              <span className="text-white block">YOUR</span>
              <span className="gradient-text block">NEXT EVENT</span>
              <span className="text-white block">STARTS HERE</span>
            </h1>

            <p className="text-white/40 text-base leading-relaxed mb-8 max-w-md">
              La plataforma premium de tickets en Costa Rica. Compra, vende y descubre los mejores eventos — con pagos seguros vía escrow.
            </p>

            {/* Search */}
            <div className="flex mb-8 max-w-lg"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center gap-3 flex-1 px-4">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0 opacity-30">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="white" strokeWidth="1.5"/>
                  <path d="M11 11L14 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="Busca eventos, artistas, venues..."
                  className="bg-transparent text-white placeholder-white/25 text-sm py-3.5 w-full focus:outline-none"
                />
              </div>
              <button className="btn-primary px-6 py-3.5 text-sm shrink-0">
                Buscar
              </button>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-6">
              {[
                { n: "2,400+", label: "eventos" },
                { n: "50K+",  label: "fans" },
                { n: "340+",  label: "venues" },
              ].map(({ n, label }, i) => (
                <div key={label} className="flex items-center gap-6">
                  {i > 0 && <div className="w-px h-7 bg-white/10" />}
                  <div>
                    <p className="font-[family-name:var(--font-bebas)] text-[22px] tracking-wide gradient-text-subtle leading-none">{n}</p>
                    <p className="text-white/25 text-[10px] uppercase tracking-[0.15em] mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column — floating cards ── */}
          <div className="hidden lg:block relative h-[520px]">
            {HERO_CARDS.map((card) => (
              <div
                key={card.title}
                className="hero-card w-64 rounded-xl"
                style={{
                  top: card.top,
                  right: card.right,
                  zIndex: card.zIndex,
                  transform: `rotate(${card.rotate})`,
                  animation: `float-card ${5 + card.zIndex}s ease-in-out infinite`,
                  "--r": card.rotate,
                } as React.CSSProperties}
              >
                <div className="relative h-40 overflow-hidden rounded-t-xl">
                  <Image src={card.img} alt={card.title} fill className="object-cover" sizes="256px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070707]/80 to-transparent" />
                  <span className="category-pill absolute top-2.5 left-2.5 text-white"
                    style={{ background: "rgba(124,58,237,0.5)", border: "1px solid rgba(167,139,250,0.3)" }}>
                    {card.cat}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-white/30 text-[10px] tracking-[0.15em] uppercase mb-1">{card.date}</p>
                  <p className="text-white font-semibold text-[13px] leading-snug mb-2">{card.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">{card.price}</span>
                    <span className="text-[10px] text-white/30 border border-white/10 px-2.5 py-1 rounded-full">
                      Ver →
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Glow under cards */}
            <div className="absolute bottom-10 right-20 w-80 h-40 pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.2), transparent 70%)", filter: "blur(30px)" }} />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#070707] to-transparent pointer-events-none z-10" />
    </section>
  );
}
