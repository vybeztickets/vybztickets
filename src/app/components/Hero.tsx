export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden dot-grid">
      {/* Blobs */}
      <div className="absolute inset-0 z-0">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="absolute inset-0 bg-[#080808]/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto w-full pt-24 pb-20">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] backdrop-blur-sm px-4 py-2 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-pink-400" style={{ animation: "glow-pulse 2s ease-in-out infinite" }} />
          <span className="text-[11px] text-white/50 tracking-[0.2em] uppercase font-medium">
            Costa Rica &amp; Latinoamérica
          </span>
        </div>

        {/* Heading */}
        <h1
          className="font-[family-name:var(--font-bebas)] leading-[0.92] text-white mb-6 tracking-wide"
          style={{ fontSize: "clamp(60px, 11vw, 130px)" }}
        >
          YOUR NEXT
          <br />
          <span className="gradient-text">EVENT</span>
          <br />
          STARTS HERE
        </h1>

        <p className="text-white/40 text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed font-[family-name:var(--font-space-grotesk)]">
          La plataforma premium de tickets en Costa Rica. Compra, vende y descubre los mejores eventos.
        </p>

        {/* Search */}
        <div className="max-w-xl mx-auto flex shadow-2xl mb-8">
          <input
            type="text"
            placeholder="Busca eventos, artistas, venues..."
            className="flex-1 bg-white/[0.04] border border-white/10 border-r-0 text-white placeholder-white/20 px-5 py-3.5 text-sm focus:outline-none focus:border-white/20 transition-colors backdrop-blur-sm font-[family-name:var(--font-space-grotesk)]"
          />
          <button className="btn-glow px-7 py-3.5 text-sm shrink-0">
            Buscar
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-2">
          {["Electronic", "Rock", "Reggaeton", "Jazz", "Salsa", "Pop"].map((tag) => (
            <button
              key={tag}
              className="text-[11px] text-white/30 border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 rounded-full hover:border-white/20 hover:text-white/60 cursor-pointer transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080808] to-transparent z-10 pointer-events-none" />
    </section>
  );
}
