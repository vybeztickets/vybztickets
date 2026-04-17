export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 z-0">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="absolute inset-0 bg-[#0a0a0a]/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto w-full">
        <p className="text-[#666] text-xs tracking-[0.3em] uppercase font-medium mb-6">
          Costa Rica &amp; Latinoamérica
        </p>
        <h1
          className="font-[family-name:var(--font-bebas)] leading-none text-white mb-6 tracking-wide"
          style={{ fontSize: "clamp(56px, 10vw, 120px)" }}
        >
          YOUR NEXT EVENT
          <br />
          <span className="text-transparent bg-clip-text"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>
            STARTS HERE
          </span>
        </h1>
        <p className="text-[#888] text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed">
          Costa Rica's premier ticket platform — buy, sell, and discover events across Latin America.
        </p>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto flex shadow-2xl">
          <input
            type="text"
            placeholder="Busca eventos, artistas, venues..."
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] border-r-0 text-white placeholder-[#444] px-6 py-4 text-sm focus:outline-none focus:border-[#3a3a3a] transition-colors font-[family-name:var(--font-space-grotesk)]"
          />
          <button className="bg-white text-[#0a0a0a] font-semibold px-8 py-4 text-sm hover:bg-white/90 transition-colors whitespace-nowrap shrink-0">
            Buscar
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {["Electronic", "Rock", "Reggaeton", "Jazz", "Salsa", "Pop"].map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-[#555] border border-[#2a2a2a] px-3 py-1 hover:border-[#444] hover:text-[#888] cursor-pointer transition-all"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-30">
        <span className="text-[10px] tracking-[0.2em] uppercase text-white">Scroll</span>
        <div className="w-px h-8 bg-white/40" />
      </div>
    </section>
  );
}
