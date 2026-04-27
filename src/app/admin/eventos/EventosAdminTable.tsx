"use client";

import { useState } from "react";
import Link from "next/link";

type EventRow = {
  id: string;
  name: string;
  date: string;
  status: string;
  category: string | null;
  city: string | null;
  orgName: string | null;
  orgEmail: string | null;
  sold: number;
  revenue: number;
  vybzFee: number;
  isUpcoming: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  published: "Activo", draft: "Borrador", cancelled: "Cancelado", ended: "Finalizado",
};
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  published: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
  draft: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
  cancelled: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
  ended: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
};

const STATUSES = ["Todos", "published", "draft", "ended", "cancelled"];

function fmt(n: number) { return "₡" + n.toLocaleString("es-CR"); }
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventosAdminTable({ events, stats }: {
  events: EventRow[];
  stats: { active: number; finalized: number; totalRevenue: number; totalTickets: number; vybzFee: number };
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Todos");

  const filtered = events.filter(e => {
    const matchQ = !q || [e.name, e.city, e.orgName, e.orgEmail, e.category].some(v => v?.toLowerCase().includes(q.toLowerCase()));
    const matchStatus = status === "Todos" || e.status === status;
    return matchQ && matchStatus;
  });

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Activos", value: stats.active.toString(), color: "#166534", bg: "rgba(0,140,0,0.07)", border: "rgba(0,140,0,0.15)" },
          { label: "Finalizados", value: stats.finalized.toString(), color: "rgba(0,0,0,0.45)", bg: "#fff", border: "rgba(0,0,0,0.07)" },
          { label: "Revenue total", value: fmt(stats.totalRevenue), color: "#0a0a0a", bg: "#fff", border: "rgba(0,0,0,0.07)", sub: `${stats.totalTickets} tickets` },
          { label: "Ingresos Vybz", value: fmt(stats.vybzFee), color: "#047857", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>{s.label}</p>
            <p className="font-[family-name:var(--font-bebas)] text-2xl leading-none" style={{ color: s.color }}>{s.value}</p>
            {"sub" in s && s.sub && <p className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.3)" }}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar evento, ciudad, organizador…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#0a0a0a" }}
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#0a0a0a" }}>
          {STATUSES.map(s => <option key={s} value={s}>{s === "Todos" ? "Todos los estados" : STATUS_LABEL[s] ?? s}</option>)}
        </select>
      </div>

      <p className="text-[#0a0a0a]/30 text-xs mb-3">{filtered.length} de {events.length} eventos</p>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Evento", "Organizador", "Fecha", "Estado", "Tickets", "Revenue", "Vybz fee", ""].map(h => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-[#0a0a0a]/25">Sin resultados</td></tr>
            ) : filtered.map(e => {
              const sc = STATUS_COLORS[e.status] ?? STATUS_COLORS.draft;
              return (
                <tr key={e.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {e.isUpcoming && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
                      <div>
                        <p className="text-[#0a0a0a] text-sm font-medium">{e.name}</p>
                        <p className="text-[#0a0a0a]/35 text-xs">{e.city}{e.category ? ` · ${e.category}` : ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] text-xs">{e.orgName ?? "Sin nombre"}</p>
                    <p className="text-[#0a0a0a]/35 text-[10px]">{e.orgEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-[#0a0a0a]/50 text-xs whitespace-nowrap">{fmtDate(e.date)}</td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={sc}>
                      {STATUS_LABEL[e.status] ?? e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm">{e.sold}</td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm font-semibold">{fmt(e.revenue)}</td>
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#047857" }}>{fmt(e.vybzFee)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/eventos/${e.id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">Ver →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
