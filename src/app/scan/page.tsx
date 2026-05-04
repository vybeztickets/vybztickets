"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ScanEntryPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("vybz_scan_session");
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.eventId && session.code) {
          router.replace("/scan/scanner");
          return;
        }
      } catch {}
      localStorage.removeItem("vybz_scan_session");
    }
    inputRef.current?.focus();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError("El código debe tener 6 caracteres");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Código inválido");
        setLoading(false);
        return;
      }

      localStorage.setItem("vybz_scan_session", JSON.stringify(data));
      router.push("/scan/scanner");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  function handleInput(val: string) {
    // Strip dashes so user can type with or without them
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(clean);
    setError(null);
  }

  const displayCode = code.length > 3 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#0a0a0a" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <p
            className="font-[family-name:var(--font-bebas)] text-white tracking-widest"
            style={{ fontSize: 40 }}
          >
            VYBZ
          </p>
          <p className="text-white/30 text-sm mt-1">Scanner access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code input */}
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
              Enter your access code
            </p>
            <input
              ref={inputRef}
              type="text"
              value={displayCode}
              onChange={e => handleInput(e.target.value)}
              placeholder="XXX-XXX"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full text-center tracking-[0.5em] text-white placeholder-white/15 font-[family-name:var(--font-bebas)] rounded-2xl focus:outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: error ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                fontSize: 32,
                padding: "20px 16px",
                letterSpacing: "0.4em",
              }}
            />
            {error && (
              <p className="text-red-400 text-xs text-center mt-2">{error}</p>
            )}
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

        <p className="text-white/15 text-xs text-center mt-8">
          Code provided by the event organizer
        </p>
      </div>
    </div>
  );
}
