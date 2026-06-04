"use client";

import { useState } from "react";
import Link from "next/link";

type Listing = {
  id: string;
  seller_id: string;
  status: string;
  asking_price: number | null;
  created_at: string;
  eventName: string | null;
  eventDate: string | null;
  sellerName: string | null;
  sellerEmail: string | null;
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
  sold: { bg: "rgba(0,80,200,0.1)", color: "#1e40af" },
  cancelled: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
  expired: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
};

const STATUSES = ["All", "active", "sold", "cancelled", "expired"];

function fmt(n: number) { return "₡" + n.toLocaleString("en-US"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function ListingsTable({ listings, stats }: {
  listings: Listing[];
  stats: { active: number; sold: number; totalVolume: number };
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  const filtered = listings.filter(l => {
    const matchQ = !q || [l.eventName, l.sellerName, l.sellerEmail].some(v => v?.toLowerCase().includes(q.toLowerCase()));
    const matchStatus = status === "All" || l.status === status;
    return matchQ && matchStatus;
  });

  return (
    <>
      <p className="text-[#0a0a0a]/35 text-sm mb-5">{stats.active} active · {stats.sold} sold · {fmt(stats.totalVolume)} in volume</p>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search event or seller…"
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
      </div>

      <p className="text-[#0a0a0a]/30 text-xs mb-3">{filtered.length} of {listings.length} listings</p>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Event", "Seller", "Price", "Status", "Date", ""].map(h => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#0a0a0a]/25">No results</td></tr>
            ) : filtered.map(l => {
              const sc = STATUS_COLORS[l.status] ?? STATUS_COLORS.expired;
              return (
                <tr key={l.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] text-sm font-medium">{l.eventName ?? "—"}</p>
                    <p className="text-[#0a0a0a]/35 text-xs">{l.eventDate ? fmtDate(l.eventDate) : ""}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] text-xs">{l.sellerName ?? "No name"}</p>
                    <p className="text-[#0a0a0a]/35 text-[10px]">{l.sellerEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#0a0a0a]">{fmt(l.asking_price ?? 0)}</td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={sc}>{l.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#0a0a0a]/50">{fmtDate(l.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/usuarios/${l.seller_id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">View seller →</Link>
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
