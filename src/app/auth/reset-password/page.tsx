"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?redirectTo=/auth/update-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(0,0,0,0.05)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#0a0a0a] mb-2">Revisá tu correo</h2>
              <p className="text-sm text-[#0a0a0a]/50 mb-6 leading-relaxed">
                Si ese email está registrado, vas a recibir un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <a
                href="/auth/login"
                className="text-sm font-semibold text-[#0a0a0a]/40 hover:text-[#0a0a0a] transition-colors"
              >
                Volver al inicio de sesión
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-[#0a0a0a] mb-2">Restablecer contraseña</h2>
              <p className="text-sm text-[#0a0a0a]/40 mb-6">
                Ingresá tu email y te enviamos un enlace para crear una nueva contraseña.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                  {loading ? "Enviando…" : "Enviar enlace"}
                </button>
              </form>

              <div className="text-center mt-5">
                <a
                  href="/auth/login"
                  className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors"
                >
                  Volver al inicio de sesión
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
