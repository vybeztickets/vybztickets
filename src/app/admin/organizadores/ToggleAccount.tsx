"use client";

import { useState } from "react";

export default function ToggleAccount({ userId, role }: { userId: string; role: string }) {
  const [currentRole, setCurrentRole] = useState(role);
  const [loading, setLoading] = useState(false);

  const isActive = currentRole === "organizer" || currentRole === "admin";
  const isPending = currentRole === "pending_activation";
  const isAdmin = currentRole === "admin";

  async function setRole(activate: boolean) {
    const newRole = activate ? "organizer" : "suspended";
    setCurrentRole(newRole);
    setLoading(true);
    const res = await fetch("/api/admin/users/toggle", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, suspend: !activate, activate }),
    });
    if (!res.ok) setCurrentRole(role);
    setLoading(false);
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setRole(true)}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
          style={{ background: "rgba(0,140,0,0.1)", color: "#166534" }}
        >
          {loading ? "…" : "Activar"}
        </button>
        <button
          onClick={() => setRole(false)}
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
      type="button"
      onClick={() => setRole(!isActive)}
      disabled={loading || isAdmin}
      className="relative w-11 h-6 rounded-full transition-colors disabled:opacity-40"
      style={{ background: isActive ? "#0a0a0a" : "rgba(0,0,0,0.12)" }}
      title={isAdmin ? "Cuenta admin" : isActive ? "Suspender cuenta" : "Activar cuenta"}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: isActive ? "24px" : "4px" }}
      />
    </button>
  );
}
