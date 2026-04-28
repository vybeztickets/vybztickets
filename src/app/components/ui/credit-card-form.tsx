"use client";

import { useState } from "react";

type Props = {
  holderName?: string;
  eventName?: string;
};

function Chip() {
  return (
    <div
      className="w-10 h-7 rounded-md overflow-hidden"
      style={{ background: "linear-gradient(135deg, #d4a94a 0%, #f5d78e 40%, #b8860b 100%)", border: "1px solid rgba(255,255,255,0.2)" }}
    >
      <svg width="100%" height="100%" viewBox="0 0 40 28">
        <line x1="0" y1="9" x2="40" y2="9" stroke="rgba(0,0,0,0.25)" strokeWidth="1"/>
        <line x1="0" y1="19" x2="40" y2="19" stroke="rgba(0,0,0,0.25)" strokeWidth="1"/>
        <line x1="13" y1="0" x2="13" y2="28" stroke="rgba(0,0,0,0.25)" strokeWidth="1"/>
        <line x1="27" y1="0" x2="27" y2="28" stroke="rgba(0,0,0,0.25)" strokeWidth="1"/>
        <rect x="13" y="9" width="14" height="10" rx="1" fill="rgba(0,0,0,0.15)"/>
      </svg>
    </div>
  );
}

function CardFront({ name }: { name: string }) {
  return (
    <div
      className="absolute inset-0 rounded-2xl p-5 flex flex-col"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 55%, #16213e 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Top: issuer + network */}
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-[9px] uppercase tracking-[0.25em] font-bold">Vybz Tickets</p>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
        </svg>
      </div>

      {/* Chip */}
      <div className="mt-5">
        <Chip />
      </div>

      {/* Card number dots */}
      <div className="flex items-center gap-3 mt-4">
        {[0, 1, 2].map((g) => (
          <div key={g} className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.3)" }} />
            ))}
          </div>
        ))}
        <p className="text-white/35 text-[11px] font-mono tracking-widest">****</p>
      </div>

      {/* Name at bottom */}
      <div className="mt-auto">
        <p className="text-white/25 text-[8px] uppercase tracking-widest mb-0.5">Titular</p>
        <p className="text-white text-[12px] font-medium tracking-wider uppercase min-h-[18px]">
          {name || <span className="text-white/20">— — — —</span>}
        </p>
      </div>
    </div>
  );
}

function CardBack() {
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        background: "linear-gradient(135deg, #111827 0%, #0a0a0a 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="w-full h-10 mt-7" style={{ background: "rgba(0,0,0,0.6)" }} />
      <div className="mx-5 mt-4">
        <div className="flex items-center rounded" style={{ background: "rgba(255,255,255,0.08)", height: 32 }}>
          <div className="flex-1 h-full rounded-l" style={{
            background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 6px, rgba(255,255,255,0.08) 6px, rgba(255,255,255,0.08) 12px)",
          }} />
          <div className="px-3 shrink-0">
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />
              ))}
            </div>
          </div>
        </div>
        <p className="text-white/15 text-[8px] text-center mt-3 tracking-wide">Procesado de forma segura · ONVO Pay</p>
      </div>
    </div>
  );
}

export function PaymentCardVisual({ holderName = "", eventName: _eventName = "" }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="mx-auto" style={{ maxWidth: 360 }}>
      <div
        className="relative w-full cursor-pointer select-none"
        style={{ aspectRatio: "85.6 / 53.98", perspective: "1000px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <CardFront name={holderName} />
          <CardBack />
        </div>
      </div>
    </div>
  );
}
