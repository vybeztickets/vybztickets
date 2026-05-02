"use client";

import { useState } from "react";
import Link from "next/link";
import ToggleAccount from "./ToggleAccount";

type Org = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  country: string | null;
  events: number;
  revenue: number;
};

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  organizer:          { bg: "rgba(0,140,0,0.1)",    color: "#166534", label: "Active" },
  suspended:          { bg: "rgba(200,0,0,0.08)",   color: "#991b1b", label: "Suspended" },
  pending_activation: { bg: "rgba(180,83,9,0.12)",  color: "#b45309", label: "Pending" },
};

const STATUSES = ["All", "organizer", "pending_activation", "suspended"];

function fmt(n: number) { return "$" + n.toLocaleString("en-US"); }

export default function OrganizadoresTable({ orgs, total, pendingCount }: { orgs: Org[]; total: number; pendingCount: number }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [country, setCountry] = useState("All");

  const countries = ["All", ...Array.from(new Set(orgs.map(o => o.country).filter(Boolean) as string[])).sort()];

  const filtered = orgs.filter(o => {
    const matchQ = !q || [o.full_name, o.email].some(v => v?.toLowerCase().includes(q.toLowerCase()));
    const matchStatus = status === "All" || o.role === status;
    const matchCountry = country === "All" || o.country === country;
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
          {STATUSES.map(s => <option key={s} value={s}>
            {s === "All" ? "All statuses" : s === "pending_activation" ? "Pending" : s === "organizer" ? "Active" : s === "suspended" ? "Suspended" : s}
          </option>)}
        </select>
        {countries.length > 1 && (
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#0a0a0a" }}>
            {countries.map(c => <option key={c} value={c}>{c === "All" ? "All countries" : c}</option>)}
          </select>
        )}
      </div>

      <p className="text-[#0a0a0a]/30 text-xs mb-3">
        {filtered.length} of {total} organizers
        {pendingCount > 0 && (
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(180,83,9,0.12)", color: "#b45309" }}>
            {pendingCount} pending
          </span>
        )}
      </p>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Organizer", "Country", "Events", "Revenue", "Status", "Account", "Alerts", ""].map(h => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-[#0a0a0a]/25">No results</td></tr>
            ) : filtered.map(o => {
              const rs = ROLE_STYLE[o.role] ?? ROLE_STYLE.organizer;
              const isPending = o.role === "pending_activation";
              return (
                <tr key={o.id}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: isPending ? "rgba(180,83,9,0.03)" : undefined }}
                  className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] font-medium text-sm">{o.full_name ?? "No name"}</p>
                    <p className="text-[#0a0a0a]/35 text-xs">{o.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#0a0a0a]/50">{o.country ?? "—"}</td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm">{o.events}</td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm font-semibold">{fmt(o.revenue)}</td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: rs.bg, color: rs.color }}>
                      {rs.label ?? o.role}
                    </span>
                  </td>
                  <td className="px-6 py-4"><ToggleAccount userId={o.id} role={o.role} /></td>
                  <td className="px-6 py-4">
                    {isPending && (
                      <Link href={`/admin/organizadores/${o.id}`} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#b45309" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Ver más
                      </Link>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/organizadores/${o.id}`} className="text-xs font-semibold text-[#0a0a0a]/40 hover:text-[#0a0a0a] transition-colors">Ver →</Link>
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
