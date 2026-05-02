import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";

const SERVICE_FEE = 0.15;

function fmt(n: number) { return "$" + n.toLocaleString("en-US"); }
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminOverview() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: totalAttendees },
    { count: totalTicketCount },
    { count: pendingActivation },
    { data: revenueData },
    { data: activeEvents },
    { data: finalizedEvents },
    { data: recentUsers },
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
    db.from("tickets").select("id", { count: "exact", head: true }).neq("status", "refunded"),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "pending_activation"),
    db.from("tickets").select("purchase_price, status").neq("status", "refunded"),
    db.from("events").select("id, name, date, status, organizer_id, city")
      .eq("status", "published")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(6),
    db.from("events").select("id, name, date, status, organizer_id, city")
      .or(`status.eq.ended,and(status.eq.published,date.lt.${today})`)
      .order("date", { ascending: false })
      .limit(6),
    db.from("profiles").select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalB2BRevenue = (revenueData ?? []).reduce((s, t) => s + (t.purchase_price ?? 0), 0);
  const totalB2BFee = Math.round(totalB2BRevenue * SERVICE_FEE);

  const allEventOrgIds = [
    ...(activeEvents ?? []).map(e => e.organizer_id),
    ...(finalizedEvents ?? []).map(e => e.organizer_id),
  ].filter(Boolean);
  const uniqueOrgIds = [...new Set(allEventOrgIds)];
  const { data: orgProfiles } = uniqueOrgIds.length > 0
    ? await db.from("profiles").select("id, full_name, email").in("id", uniqueOrgIds)
    : { data: [] };
  const orgMap = new Map((orgProfiles ?? []).map(p => [p.id, p]));

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    organizer: "Organizer",
    pending_activation: "Pending",
    suspended: "Suspended",
    user: "Attendee",
  };
  const roleColors: Record<string, { bg: string; color: string }> = {
    admin: { bg: "#0a0a0a", color: "#fff" },
    organizer: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
    pending_activation: { bg: "rgba(180,83,9,0.12)", color: "#b45309" },
    suspended: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
    user: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
  };

  return (
    <div className="p-8 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-black/25 mb-1">Admin Console · VYBZ</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(32px,4vw,52px)" }}>
            Overview
          </h1>
        </div>
        <p className="text-[#0a0a0a]/30 text-xs pb-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Activation alert */}
      {(pendingActivation ?? 0) > 0 && (
        <div className="mb-8">
          <Link href="/admin/organizadores"
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl hover:opacity-90 transition-opacity"
            style={{ background: "#b45309" }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{pendingActivation} activation request{(pendingActivation ?? 0) > 1 ? "s" : ""}</p>
              <p className="text-white/60 text-xs">Organizers waiting for approval → Review</p>
            </div>
          </Link>
        </div>
      )}

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Link href="/admin/finanzas"
          className="rounded-2xl p-5 hover:opacity-90 transition-opacity"
          style={{ background: "#0a0a0a" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-white/35">B2B Volume</p>
          <p className="font-[family-name:var(--font-bebas)] text-2xl leading-none mb-1 text-white">{fmt(totalB2BRevenue)}</p>
          <p className="text-[10px] text-white/25">{(totalTicketCount ?? 0).toLocaleString()} tickets sold</p>
        </Link>
        <Link href="/admin/finanzas"
          className="rounded-2xl p-5 hover:opacity-90 transition-opacity"
          style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#047857" }}>Vybz Revenue B2B</p>
          <p className="font-[family-name:var(--font-bebas)] text-2xl leading-none mb-1" style={{ color: "#065f46" }}>{fmt(totalB2BFee)}</p>
          <p className="text-[10px]" style={{ color: "rgba(4,120,87,0.55)" }}>service fee 15%</p>
        </Link>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: "Attendees", value: (totalAttendees ?? 0).toLocaleString(), href: "/admin/usuarios", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg> },
          { label: "Active Events", value: (activeEvents ?? []).length.toLocaleString(), href: "/admin/eventos", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
        ].map((s) => (
          <Link key={s.label} href={s.href}
            className="rounded-2xl p-4 flex items-center gap-3 hover:bg-black/[0.02] transition-colors"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)" }}>
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] text-[#0a0a0a]/35 uppercase tracking-wider font-bold">{s.label}</p>
              <p className="font-semibold text-[#0a0a0a] text-lg leading-tight">{s.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Events panels */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[#0a0a0a] font-semibold text-sm">Active Events</p>
            </div>
            <Link href="/admin/eventos" className="text-[#0a0a0a]/35 hover:text-[#0a0a0a] text-xs transition-colors font-medium">View all →</Link>
          </div>
          {(activeEvents ?? []).length === 0 ? (
            <p className="text-[#0a0a0a]/25 text-sm p-8 text-center">No active events</p>
          ) : (
            <div>
              {(activeEvents ?? []).map((e) => {
                const org = orgMap.get(e.organizer_id);
                return (
                  <Link key={e.id} href={`/admin/eventos/${e.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-black/[0.015] transition-colors"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#0a0a0a] text-sm font-medium truncate">{e.name}</p>
                      <p className="text-[#0a0a0a]/35 text-xs mt-0.5">{org?.full_name ?? "—"} · {fmtDate(e.date)}</p>
                    </div>
                    <span className="ml-3 shrink-0 text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                      style={{ background: "rgba(0,140,0,0.1)", color: "#166534" }}>
                      Active
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "rgba(0,0,0,0.2)" }} />
              <p className="text-[#0a0a0a] font-semibold text-sm">Ended Events</p>
            </div>
            <Link href="/admin/eventos" className="text-[#0a0a0a]/35 hover:text-[#0a0a0a] text-xs transition-colors font-medium">View all →</Link>
          </div>
          {(finalizedEvents ?? []).length === 0 ? (
            <p className="text-[#0a0a0a]/25 text-sm p-8 text-center">No ended events</p>
          ) : (
            <div>
              {(finalizedEvents ?? []).map((e) => {
                const org = orgMap.get(e.organizer_id);
                return (
                  <Link key={e.id} href={`/admin/eventos/${e.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-black/[0.015] transition-colors"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#0a0a0a] text-sm font-medium truncate">{e.name}</p>
                      <p className="text-[#0a0a0a]/35 text-xs mt-0.5">{org?.full_name ?? "—"} · {fmtDate(e.date)}</p>
                    </div>
                    <span className="ml-3 shrink-0 text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                      style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" }}>
                      Ended
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent users + Quick access */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[#0a0a0a] font-semibold text-sm">Recent Users</p>
            <Link href="/admin/usuarios" className="text-[#0a0a0a]/35 hover:text-[#0a0a0a] text-xs transition-colors font-medium">View all →</Link>
          </div>
          <div>
            {(recentUsers ?? []).map((u) => {
              const rc = roleColors[u.role] ?? { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" };
              return (
                <Link key={u.id} href={`/admin/usuarios/${u.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-black/[0.015] transition-colors"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-black/[0.06] flex items-center justify-center text-[10px] font-bold text-[#0a0a0a]/40 shrink-0">
                      {(u.full_name ?? u.email ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#0a0a0a] text-sm font-medium truncate">{u.full_name ?? "No name"}</p>
                      <p className="text-[#0a0a0a]/35 text-xs truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className="ml-3 shrink-0 text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={rc}>
                    {roleLabels[u.role] ?? u.role}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick access */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0a0a0a]/30 px-1">Quick Access</p>
          {[
            { label: "Finances B2B", sub: "Revenue and fees", href: "/admin/finanzas", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>, color: "#10b981" },
            { label: "Organizers", sub: "Manage accounts", href: "/admin/organizadores", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, color: "#6366f1", badge: pendingActivation ?? 0 },
            { label: "PDF Report", sub: "Download monthly report", href: "/admin/finanzas", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, color: "#0a0a0a" },
          ].map((item) => (
            <Link key={item.href + item.label} href={item.href}
              className="flex items-center gap-3 p-4 rounded-2xl hover:opacity-90 transition-opacity"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${item.color}15`, color: item.color }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0a0a0a] text-sm font-semibold">{item.label}</p>
                <p className="text-[#0a0a0a]/35 text-xs">{item.sub}</p>
              </div>
              {(item.badge ?? 0) > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center shrink-0">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
