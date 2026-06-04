"use client";

import { useState } from "react";
import Link from "next/link";

type Revendedor = {
  id: string;
  user_id: string;
  status: string;
  full_name_on_id: string | null;
  cedula_number: string | null;
  payment_method: string | null;
  sinpe_phone: string | null;
  bank_name: string | null;
  submitted_at: string;
  email: string | null;
  country: string | null;
  active: number;
  sold: number;
  revenue: number;
};

const KYC_COLORS: Record<string, { bg: string; color: string }> = {
  approved: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
  pending: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
  rejected: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
  suspended: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
};

const STATUSES = ["All", "approved", "pending", "rejected", "suspended"];

function fmt(n: number) { return "₡" + n.toLocaleString("en-US"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function RevendedoresTable({ rows, total }: { rows: Revendedor[]; total: number }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [country, setCountry] = useState("All");

  const countries = ["All", ...Array.from(new Set(rows.map(r => r.country).filter(Boolean) as string[])).sort()];

  const filtered = rows.filter(r => {
    const matchQ = !q || [r.full_name_on_id, r.email].some(v => v?.toLowerCase().includes(q.toLowerCase()));
    const matchStatus = status === "All" || r.status === status;
    const matchCountry = country === "All" || r.country === country;
    return matchQ && matchStatus && matchCountry;
  });

  return (
    <>
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#0a0a0a" }}
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#0a0a0a" }}>
          {STATUSES.map(s => <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>)}
        </select>
        {countries.length > 1 && (
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#0a0a0a" }}>
            {countries.map(c => <option key={c} value={c}>{c === "All" ? "All countries" : c}</option>)}
          </select>
        )}
      </div>

      <p className="text-[#0a0a0a]/30 text-xs mb-3">{filtered.length} of {total} resellers</p>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Reseller", "Country", "KYC", "Payment method", "Active", "Sold", "Revenue", "Since", ""].map(h => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-[#0a0a0a]/25">No results</td></tr>
            ) : filtered.map(r => {
              const kc = KYC_COLORS[r.status] ?? KYC_COLORS.pending;
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] text-sm font-medium">{r.full_name_on_id}</p>
                    <p className="text-[#0a0a0a]/35 text-xs">{r.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#0a0a0a]/50">{r.country ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={kc}>{r.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#0a0a0a]/60">
                    {r.payment_method === "sinpe_movil" ? `SINPE ${r.sinpe_phone ?? ""}` : r.bank_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]">{r.active}</td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]">{r.sold}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#0a0a0a]">{fmt(r.revenue)}</td>
                  <td className="px-6 py-4 text-xs text-[#0a0a0a]/50">{fmtDate(r.submitted_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/usuarios/${r.user_id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">Ver →</Link>
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
