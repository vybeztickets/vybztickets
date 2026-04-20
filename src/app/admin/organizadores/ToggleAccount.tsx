"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToggleAccount({ userId, role }: { userId: string; role: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const suspended = role === "suspended";
  const pendingActivation = role === "pending_activation";

  async function toggle(activate?: boolean) {
    setLoading(true);
    await fetch("/api/admin/users/toggle", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, suspend: !suspended && !activate, activate }),
    });
    setLoading(false);
    router.refresh();
  }

  if (pendingActivation) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full animate-pulse"
          style={{ background: "rgba(180,83,9,0.12)", color: "#b45309" }}>
          Solicitud pendiente
        </span>
        <button
          onClick={() => toggle(true)}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
          style={{ background: "rgba(0,140,0,0.1)", color: "#166534" }}
        >
          {loading ? "…" : "✓ Activar"}
        </button>
        <button
          onClick={() => toggle(false)}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
          style={{ background: "rgba(200,0,0,0.08)", color: "#991b1b" }}
        >
          {loading ? "…" : "Rechazar"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => toggle()}
      disabled={loading}
      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
      style={suspended
        ? { background: "rgba(0,140,0,0.1)", color: "#166534" }
        : { background: "rgba(200,0,0,0.08)", color: "#991b1b" }
      }
    >
      {loading ? "…" : suspended ? "Activar" : "Suspender"}
    </button>
  );
}
