"use client";

import { useState } from "react";

const FILTERS = ["Todos", "Borradores", "Enviados", "En cola"];

const MOCK_CAMPAIGNS = [
  { id: 1, subject: "¡Últimas entradas disponibles!", preview: "No te quedes sin tu ticket para el evento más esperado...", status: "sent", sentAt: "2026-04-10 09:30", target: "Todos", recipients: 1240 },
  { id: 2, subject: "Early Bird - Precio especial por 48h", preview: "Aprovecha el precio especial antes de que termine...", status: "sent", sentAt: "2026-04-05 14:00", target: "1-Evento", recipients: 890 },
  { id: 3, subject: "Recordatorio: El evento es mañana", preview: "Recuerda traer tu QR impreso o en tu teléfono...", status: "queued", sentAt: "2026-04-18 10:00", target: "1-Evento", recipients: 450 },
  { id: 4, subject: "Nueva promo - 20% descuento", preview: "Solo por hoy, obtén un 20% de descuento en...", status: "draft", sentAt: null, target: "-", recipients: 0 },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  sent: { label: "Enviado", color: "#10b981" },
  draft: { label: "Borrador", color: "#f59e0b" },
  queued: { label: "En cola", color: "#6366f1" },
};

const DELETED_KEY = "mkt_deleted_ids";

function getDeleted(): number[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) ?? "[]"); } catch { return []; }
}

export default function MarketingClient() {
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<number[]>([]);
  const [campaigns, setCampaigns] = useState(() =>
    MOCK_CAMPAIGNS.filter((c) => !getDeleted().includes(c.id))
  );

  function toggleSelect(id: number) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  const filtered = campaigns.filter((c) => {
    if (filter === "Todos") return true;
    if (filter === "Borradores") return c.status === "draft";
    if (filter === "Enviados") return c.status === "sent";
    if (filter === "En cola") return c.status === "queued";
    return true;
  });

  function toggleAll() {
    const visibleIds = filtered.map((c) => c.id);
    const allOn = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
    setSelected(allOn ? [] : visibleIds);
  }

  function deleteSelected() {
    const toDelete = selected;
    setCampaigns((c) => c.filter((x) => !toDelete.includes(x.id)));
    setSelected([]);
    const existing = getDeleted();
    localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set([...existing, ...toDelete])]));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Marketing</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "#0a0a0a", color: "#fff" }}
        >
          + Mensaje
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        {["Correos", "Estadísticas"].map((t) => (
          <button
            key={t}
            className="px-4 py-3 text-sm font-medium transition-colors"
            style={t === "Correos" ? { color: "#0a0a0a", borderBottom: "2px solid #0a0a0a" } : { color: "rgba(0,0,0,0.3)" }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters + delete */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 text-xs font-medium transition-colors"
              style={{
                background: filter === f ? "#0a0a0a" : "transparent",
                color: filter === f ? "#fff" : "rgba(0,0,0,0.35)",
                borderRight: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {selected.length > 0 && (
          <button
            onClick={deleteSelected}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
            style={{ border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
            Eliminar ({selected.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <div
          className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
          style={{
            gridTemplateColumns: "32px 1fr 180px 140px 120px 40px",
            background: "rgba(0,0,0,0.03)",
            color: "rgba(0,0,0,0.3)",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
          }}
        >
          <input
            type="checkbox"
            className="accent-black"
            checked={filtered.length > 0 && filtered.every((c) => selected.includes(c.id))}
            onChange={toggleAll}
          />
          <div>Mensaje</div><div>Estado</div><div>Enviar a</div><div>Destinatarios</div><div />
        </div>

        {filtered.map((c, i) => {
          const s = STATUS_MAP[c.status];
          return (
            <div
              key={c.id}
              className="grid items-center px-5 py-4 hover:bg-white/[0.02] transition-colors"
              style={{
                gridTemplateColumns: "32px 1fr 180px 140px 120px 40px",
                borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
              }}
            >
              <input
                type="checkbox"
                className="accent-black"
                checked={selected.includes(c.id)}
                onChange={() => toggleSelect(c.id)}
              />
              <div>
                <p className="text-[#0a0a0a] text-sm font-medium">{c.subject}</p>
                <p className="text-[#0a0a0a]/30 text-xs truncate max-w-xs">{c.preview}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-[#0a0a0a]/60 text-xs">{c.sentAt ?? "—"}</span>
                </div>
              </div>
              <div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)" }}
                >
                  {c.target}
                </span>
              </div>
              <div className="text-[#0a0a0a] text-sm">{c.recipients.toLocaleString()}</div>
              <button className="text-[#0a0a0a]/20 hover:text-[#0a0a0a]/50 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[#0a0a0a]/15 text-xs mt-6 text-center">
        Las campañas de email requieren integración con servicio de correo (próximamente)
      </p>
    </div>
  );
}
