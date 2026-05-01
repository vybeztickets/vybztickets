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
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 text-sm font-medium"
      style={{ background: "#dc2626", color: "#fff" }}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-black shrink-0" style={{ background: "rgba(255,255,255,0.25)" }}>!</span>
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
