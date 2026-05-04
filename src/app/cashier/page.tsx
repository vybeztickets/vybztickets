"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function CashierEntryPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("vybz_cashier_session");
    if (stored) {
      try {
        const s = JSON.parse(stored);
        if (s.eventId && s.code) { router.replace("/cashier/app"); return; }
      } catch {}
      localStorage.removeItem("vybz_cashier_session");
    }
    inputRef.current?.focus();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) { setError("Code must be 6 characters"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, type: "cashier" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Invalid code"); setLoading(false); return; }
      if (data.type !== "cashier") { setError("This code is not for Front Desk access"); setLoading(false); return; }
      localStorage.setItem("vybz_cashier_session", JSON.stringify(data));
      router.push("/cashier/app");
    } catch {
      setError("Connection error. Try again.");
      setLoading(false);
    }
  }

  function handleInput(val: string) {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(clean);
    setError(null);
  }

  const display = code.length > 3 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#0a0a0a" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <p className="font-[family-name:var(--font-bebas)] text-white tracking-widest" style={{ fontSize: 40 }}>VYBZ</p>
          <p className="text-white/30 text-sm mt-1">Front Desk access</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Enter your access code</p>
            <input
              ref={inputRef}
              type="text"
              value={display}
              onChange={e => handleInput(e.target.value)}
              placeholder="XXX-XXX"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full text-center text-white placeholder-white/15 font-[family-name:var(--font-bebas)] rounded-2xl focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: error ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                fontSize: 32,
                padding: "20px 16px",
                letterSpacing: "0.4em",
              }}
            />
            {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-4 rounded-2xl text-sm font-semibold text-[#0a0a0a] transition-all disabled:opacity-30"
            style={{ background: code.length === 6 ? "#fff" : "rgba(255,255,255,0.3)" }}
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        </form>
        <p className="text-white/15 text-xs text-center mt-8">Code provided by the event organizer</p>
      </div>
    </div>
  );
}
