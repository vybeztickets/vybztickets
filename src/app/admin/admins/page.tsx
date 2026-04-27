"use client";

import { useEffect, useState, useRef } from "react";

type Admin = { id: string; full_name: string | null; email: string | null; created_at: string };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/admins")
      .then(r => r.json())
      .then(d => { setAdmins(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    setError(null);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setAdmins(prev => [...prev, data]);
      setEmail("");
      inputRef.current?.focus();
    }
    setAdding(false);
  }

  async function removeAdmin(id: string) {
    setRemoving(id);
    const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setAdmins(prev => prev.filter(a => a.id !== id));
    }
    setRemoving(null);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0a0a0a] mb-1">Administradores</h1>
        <p className="text-[#0a0a0a]/40 text-sm">Gestioná quién tiene acceso al panel de administración.</p>
      </div>

      {/* Add admin */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#f9f9f9" }}>
          <p className="text-sm font-semibold text-[#0a0a0a]">Agregar administrador</p>
          <p className="text-xs text-[#0a0a0a]/40 mt-0.5">La cuenta debe estar registrada previamente en Vybz.</p>
        </div>
        <div className="p-5">
          <form onSubmit={addAdmin} className="flex gap-2">
            <input
              ref={inputRef}
              type="email"
              placeholder="email@ejemplo.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "#0a0a0a" }}
            />
            <button
              type="submit"
              disabled={adding || !email.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
              style={{ background: "#0a0a0a" }}
            >
              {adding ? "..." : "Promover"}
            </button>
          </form>
          {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
        </div>
      </div>

      {/* Admin list */}
      {loading ? (
        <div className="py-16 text-center text-[#0a0a0a]/20 text-sm">Cargando…</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#f9f9f9" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a]/30">{admins.length} admin{admins.length !== 1 ? "s" : ""}</p>
          </div>
          {admins.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[#0a0a0a]/25 text-center">Sin administradores</p>
          ) : (
            admins.map((a, i) => (
              <div
                key={a.id}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: i < admins.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: "rgba(0,0,0,0.06)", color: "#0a0a0a" }}>
                    {(a.full_name ?? a.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0a0a0a]">{a.full_name ?? "—"}</p>
                    <p className="text-xs text-[#0a0a0a]/40">{a.email} · desde {fmtDate(a.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeAdmin(a.id)}
                  disabled={removing === a.id}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
                  style={{ background: "rgba(239,68,68,0.07)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  {removing === a.id ? "..." : "Quitar"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <p className="text-xs text-[#0a0a0a]/25 mt-4">
        Al quitar un admin, su cuenta vuelve al rol de organizador.
      </p>
    </div>
  );
}
