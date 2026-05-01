"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChooseRolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const then = searchParams.get("then") ?? "/";

  const [loading, setLoading] = useState(true);
  const [roleChoice, setRoleChoice] = useState<"attendee" | "organizer">("attendee");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const pending = localStorage.getItem("vybz_pending_role");
      if (pending) {
        localStorage.removeItem("vybz_pending_role");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await fetch("/api/auth/set-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, role: pending }),
          });
        }
        router.replace(then);
        return;
      }
      setLoading(false);
    }
    init();
  }, [router, then]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const role = roleChoice === "organizer" ? "pending_activation" : "user";
      await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role }),
      });
    }
    router.replace(then);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fafafa" }}>
        <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#fafafa" }}>
      <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-[#0a0a0a] mb-1">
          ¿Qué tipo de cuenta?
        </h1>
        <p className="text-sm text-[#0a0a0a]/40 mb-8">Elige cómo vas a usar Vybz.</p>

        <div className="flex rounded-xl overflow-hidden mb-6" style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}>
          {([
            { value: "attendee", label: "Attendee", sub: "Compra entradas" },
            { value: "organizer", label: "Organizador", sub: "Vende entradas" },
          ] as const).map(({ value, label, sub }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRoleChoice(value)}
              className="flex-1 py-4 px-4 text-left transition-all"
              style={{
                background: roleChoice === value ? "#0a0a0a" : "rgba(0,0,0,0.02)",
                borderRight: value === "attendee" ? "1px solid rgba(0,0,0,0.1)" : undefined,
              }}
            >
              <p className="text-sm font-semibold" style={{ color: roleChoice === value ? "#fff" : "#0a0a0a" }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: roleChoice === value ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)" }}>{sub}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
          style={{ background: "#0a0a0a", color: "#fff" }}
        >
          {saving ? "Guardando…" : "Continuar"}
        </button>
      </div>
    </div>
  );
}
