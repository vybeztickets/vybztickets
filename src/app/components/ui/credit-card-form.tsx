"use client";

import { useState } from "react";

type Props = {
  holderName?: string;
  amount?: string;
  eventName?: string;
};

function CardFront({ name, amount, eventName, flipped }: { name: string; amount: string; eventName: string; flipped: boolean }) {
  return (
    <div
      className="absolute inset-0 rounded-2xl p-6 flex flex-col justify-between"
      style={{
        backfaceVisibility: "hidden",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        opacity: flipped ? 0 : 1,
        transition: "opacity 0.15s ease",
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold mb-1">Vybz Tickets</p>
          <p className="text-white/50 text-[10px] truncate max-w-[160px]">{eventName || "Evento"}</p>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
          </svg>
        </div>
      </div>

      {/* Chip + amount */}
      <div className="flex items-end justify-between">
        <div>
          <div className="w-10 h-8 rounded-md mb-4" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="grid grid-cols-2 gap-0.5 p-1 h-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-sm" style={{ background: "rgba(255,255,255,0.15)" }} />
              ))}
            </div>
          </div>
          <p className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5">Titular</p>
          <p className="text-white font-semibold text-sm tracking-wider">{name || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5">Total</p>
          <p className="font-[family-name:var(--font-bebas)] text-white text-2xl leading-none tracking-wide">{amount}</p>
        </div>
      </div>
    </div>
  );
}

function CardBack({ flipped }: { flipped: boolean }) {
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden"
      style={{
        backfaceVisibility: "hidden",
        background: "linear-gradient(135deg, #111827 0%, #0a0a0a 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        opacity: flipped ? 1 : 0,
        transition: "opacity 0.15s ease 0.15s",
      }}
    >
      <div className="h-12 mt-6" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="px-6 mt-5">
        <div className="h-8 rounded-md flex items-center justify-end px-3" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="flex gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.25)" }} />
            ))}
          </div>
        </div>
        <p className="text-white/20 text-[9px] text-center mt-4">Procesado de forma segura</p>
      </div>
    </div>
  );
}

export function PaymentCardVisual({ holderName = "", amount = "", eventName = "" }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative w-full cursor-pointer select-none"
      style={{ height: 180, perspective: "1000px" }}
      onClick={() => setFlipped((f) => !f)}
      title="Haz click para ver el reverso"
    >
      <div
        className="absolute inset-0 transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <CardFront name={holderName} amount={amount} eventName={eventName} flipped={false} />
        <div className="absolute inset-0" style={{ transform: "rotateY(180deg)" }}>
          <CardBack flipped={false} />
        </div>
      </div>
    </div>
  );
}
