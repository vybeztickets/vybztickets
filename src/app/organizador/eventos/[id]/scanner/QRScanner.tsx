"use client";

import { useState, useRef } from "react";

type ValidationResult = {
  status: "valid" | "already_used" | "invalid";
  message: string;
  ticket?: {
    buyerName: string | null;
    buyerEmail: string;
    ticketType: string;
  };
};

export default function QRScanner({ eventId }: { eventId: string }) {
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function validate(qrCode: string) {
    if (!qrCode.trim()) return;
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/tickets/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCode: qrCode.trim(), eventId }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
    setManualCode("");
    inputRef.current?.focus();
  }

  function handleManual(e: React.FormEvent) {
    e.preventDefault();
    validate(manualCode);
  }

  const colors = {
    valid: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#10b981" },
    already_used: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#f59e0b" },
    invalid: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#ef4444" },
  };

  const icons = {
    valid: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    already_used: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    invalid: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Manual input — also works with a USB QR scanner (acts as keyboard) */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <p className="text-[#0a0a0a]/50 text-sm mb-4">
          Pega o escribe el código QR del ticket, o conecta un lector USB de QR:
        </p>
        <form onSubmit={handleManual} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Código QR del ticket..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            autoFocus
            className="flex-1 px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none font-mono"
            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
          />
          <button
            type="submit"
            disabled={loading || !manualCode.trim()}
            className="px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "#fff" }}
          >
            {loading ? "..." : "Validar"}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div
          className="rounded-2xl p-6 text-center transition-all"
          style={{
            background: colors[result.status].bg,
            border: `1px solid ${colors[result.status].border}`,
          }}
        >
          <div className="flex justify-center mb-3">{icons[result.status]}</div>
          <p className="font-bold text-lg mb-1" style={{ color: colors[result.status].text }}>
            {result.message}
          </p>
          {result.ticket && (
            <div className="mt-3 text-sm text-[#0a0a0a]/50 space-y-1">
              <p>{result.ticket.ticketType}</p>
              {result.ticket.buyerName && <p>{result.ticket.buyerName}</p>}
              <p className="text-[#0a0a0a]/30 text-xs">{result.ticket.buyerEmail}</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div
        className="rounded-2xl p-5 text-xs text-[#0a0a0a]/25 space-y-2"
        style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}
      >
        <p>• El campo está siempre activo — conecta un lector USB y escanea directamente.</p>
        <p>• Tickets válidos se marcan como "usado" automáticamente.</p>
        <p>• Tickets ya usados o de otro evento serán rechazados.</p>
      </div>
    </div>
  );
}
