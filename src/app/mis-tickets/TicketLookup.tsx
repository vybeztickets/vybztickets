"use client";

export default function TicketLookup() {
  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(124,58,237,0.15)" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>
      <h2 className="text-white font-semibold text-lg mb-3">Revisa tu correo</h2>
      <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
        Tu entrada con código QR fue enviada al email que ingresaste al momento de comprar.
      </p>
      <p className="text-white/25 text-xs mt-4">
        ¿No la encuentras? Búscala en tu carpeta de spam o{" "}
        <a href="/eventos" className="text-purple-400/70 hover:text-purple-400 transition-colors">
          ve al evento para reenviarla
        </a>.
      </p>
    </div>
  );
}
