"use client";

import { useState } from "react";

export default function ResendTicket({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "used" | "notfound">("idle");

  async function handleResend() {
    if (typeof window !== "undefined" && localStorage.getItem(`resent_${eventId}`)) {
      setStatus("used"); return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/tickets/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, email }),
      });
      const data = await res.json();
      if (!data.found) { setStatus("notfound"); return; }
      localStorage.setItem(`resent_${eventId}`, "1");
      setStatus("sent");
    } catch {
      setStatus("notfound");
    }
  }

  if (!open) {
    return (
      <div className="mt-14 text-center">
        <button onClick={() => setOpen(true)} className="text-white/20 text-xs hover:text-white/35 transition-colors underline underline-offset-2">
          ¿Ya compraste una entrada? Reenviar mi entrada
        </button>
      </div>
    );
  }

  return (
    <div className="mt-14 text-center">
      <p className="text-white/25 text-xs mb-3">Ingresa el email con el que compraste tu entrada</p>
      {status === "sent" ? (
        <p className="text-green-400/80 text-sm">¡Listo! Tu entrada fue reenviada a <span className="font-medium">{email}</span></p>
      ) : status === "used" ? (
        <p className="text-yellow-400/60 text-xs">Ya usaste tu reenvío para este evento. Contacta al organizador si necesitas ayuda.</p>
      ) : status === "notfound" ? (
        <p className="text-red-400/60 text-xs">No encontramos una entrada activa con ese email para este evento.</p>
      ) : (
        <div className="flex gap-2 max-w-sm mx-auto">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleResend()}
            className="flex-1 px-3 py-2 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          />
          <button
            onClick={handleResend}
            disabled={!email || status === "sending"}
            className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors"
            style={{ background: "rgba(124,58,237,0.25)", color: "#c084fc", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            {status === "sending" ? "..." : "Reenviar"}
          </button>
        </div>
      )}
    </div>
  );
}
