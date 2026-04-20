"use client";

import { useState } from "react";

export default function SuspendedBanner({ isPending }: { isPending: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">(isPending ? "done" : "idle");

  async function requestActivation() {
    setStatus("loading");
    await fetch("/api/organizador/activation-request", { method: "POST" });
    setStatus("done");
  }

  return (
    <div
      className="flex items-center justify-between px-6 py-3 text-sm font-medium"
      style={{ background: "#b45309", color: "#fff" }}
    >
      <div className="flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Cuenta inactiva — no puedes crear eventos ni enviar comunicaciones hasta que el equipo active tu cuenta.</span>
      </div>
      {status === "done" ? (
        <span className="text-xs opacity-75 shrink-0 ml-4">Solicitud enviada · en revisión</span>
      ) : (
        <button
          onClick={requestActivation}
          disabled={status === "loading"}
          className="ml-4 shrink-0 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
        >
          {status === "loading" ? "Enviando…" : "Activar cuenta →"}
        </button>
      )}
    </div>
  );
}
