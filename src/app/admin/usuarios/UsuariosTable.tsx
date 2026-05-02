"use client";

import { useState } from "react";
import Link from "next/link";

type User = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  country: string | null;
  created_at: string;
  ticketCount: number;
};

const ROLE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  admin:              { bg: "#0a0a0a",                  color: "#fff",               label: "Admin" },
  organizer:          { bg: "rgba(0,140,0,0.1)",        color: "#166534",            label: "Organizer" },
  pending_activation: { bg: "rgba(180,83,9,0.12)",      color: "#b45309",            label: "Pending" },
  suspended:          { bg: "rgba(200,0,0,0.08)",       color: "#991b1b",            label: "Suspended" },
  user:               { bg: "rgba(0,0,0,0.06)",         color: "rgba(0,0,0,0.4)",    label: "Attendee" },
};

const ROLES = ["All", "user", "organizer", "pending_activation", "admin", "suspended"];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function UsuariosTable({ users, total }: { users: User[]; total: number }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");
  const [country, setCountry] = useState("All");

  const countries = ["All", ...Array.from(new Set(users.map(u => u.country).filter(Boolean) as string[])).sort()];

  const filtered = users.filter(u => {
    const matchQ = !q || [u.full_name, u.email].some(v => v?.toLowerCase().includes(q.toLowerCase()));
    const matchRole = role === "All" || u.role === role;
    const matchCountry = country === "All" || u.country === country;
    return matchQ && matchRole && matchCountry;
  });

  return (
    <>
      {/* Search + filters */}
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
        <select value={role} onChange={e => setRole(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#0a0a0a" }}>
          {ROLES.map(r => <option key={r} value={r}>{r === "All" ? "All roles" : (ROLE_COLORS[r]?.label ?? r)}</option>)}
        </select>
        {countries.length > 1 && (
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#0a0a0a" }}>
            {countries.map(c => <option key={c} value={c}>{c === "All" ? "All countries" : c}</option>)}
          </select>
        )}
      </div>

      <p className="text-[#0a0a0a]/30 text-xs mb-3">{filtered.length} of {total} users</p>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["User", "Role", "Country", "Tickets", "Registered", ""].map(h => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#0a0a0a]/25">No results</td></tr>
            ) : filtered.map(u => {
              const rc = ROLE_COLORS[u.role] ?? ROLE_COLORS.user;
              return (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] font-medium text-sm">{u.full_name ?? "No name"}</p>
                    <p className="text-[#0a0a0a]/35 text-xs">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: rc.bg, color: rc.color }}>{rc.label}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#0a0a0a]/50">{u.country ?? "—"}</td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm">{u.ticketCount}</td>
                  <td className="px-6 py-4 text-[#0a0a0a]/50 text-xs">{fmtDate(u.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/usuarios/${u.id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">Ver →</Link>
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
