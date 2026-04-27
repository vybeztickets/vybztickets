"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/organizador"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f7f7f7" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <a
            href="/"
            className="font-[family-name:var(--font-bebas)] text-5xl tracking-widest text-[#0a0a0a] hover:opacity-50 transition-opacity inline-block"
          >
            VYBZ
          </a>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(0,0,0,0.05)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#0a0a0a] mb-2">Contraseña actualizada</h2>
              <p className="text-sm text-[#0a0a0a]/40">Redirigiendo…</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-[#0a0a0a] mb-2">Nueva contraseña</h2>
              <p className="text-sm text-[#0a0a0a]/40 mb-6">
                Elegí una contraseña segura de al menos 6 caracteres.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none transition-colors"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.1)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0a0a0a")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
                />
                <input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none transition-colors"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.1)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0a0a0a")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
                />

                {error && <p className="text-red-500 text-xs px-1">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold mt-1 transition-colors disabled:opacity-40"
                  style={{ background: "#0a0a0a", color: "#fff" }}
                >
                  {loading ? "Guardando…" : "Actualizar contraseña"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
