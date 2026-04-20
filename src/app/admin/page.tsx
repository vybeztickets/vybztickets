import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";

function fmt(n: number) { return "₡" + n.toLocaleString("es-CR"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CR", { day: "numeric", month: "short" });
}

export default async function AdminOverview() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { count: totalUsers },
    { count: totalEvents },
    { count: totalTickets },
    { count: pendingKyc },
    { count: activeListings },
    { count: pendingActivation },
    { data: revenueData },
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("events").select("id", { count: "exact", head: true }),
    db.from("tickets").select("id", { count: "exact", head: true }),
    db.from("kyc_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("resale_listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "pending_activation"),
    db.from("tickets").select("purchase_price").neq("status", "refunded"),
  ]);

  const totalRevenue = (revenueData ?? []).reduce((s, t) => s + (t.purchase_price ?? 0), 0);

  const { data: recentEvents } = await db
    .from("events")
    .select("id, name, date, status, organizer_id")
    .order("created_at", { ascending: false })
    .limit(6);

  const recentEventOrgIds = [...new Set((recentEvents ?? []).map((e) => e.organizer_id).filter(Boolean))];
  const { data: recentEventOrgs } = recentEventOrgIds.length > 0
    ? await db.from("profiles").select("id, full_name, email").in("id", recentEventOrgIds)
    : { data: [] };
  const recentOrgMap = new Map((recentEventOrgs ?? []).map((p) => [p.id, p]));

  const { data: recentUsers } = await db
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const hasAlerts = (pendingKyc ?? 0) > 0 || (pendingActivation ?? 0) > 0;

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-black/25 mb-2">Admin Console · VYBZ</p>
            <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(32px,4vw,52px)" }}>
              Overview
            </h1>
          </div>
          <p className="text-[#0a0a0a]/30 text-xs pb-1">
            {new Date().toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Alerts row */}
      {hasAlerts && (
        <div className="flex gap-3 mb-8">
          {(pendingActivation ?? 0) > 0 && (
            <Link href="/admin/organizadores"
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl flex-1 group transition-all hover:opacity-90"
              style={{ background: "#b45309" }}>
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{pendingActivation} solicitud{(pendingActivation ?? 0) > 1 ? "es" : ""} de activación</p>
                <p className="text-white/60 text-xs">Organizadores esperando aprobación → Revisar</p>
              </div>
            </Link>
          )}
          {(pendingKyc ?? 0) > 0 && (
            <Link href="/admin/c2c/kyc"
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl flex-1 group transition-all hover:opacity-90"
              style={{ background: "#0a0a0a" }}>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{pendingKyc} verificación{(pendingKyc ?? 0) > 1 ? "es" : ""} KYC pendiente{(pendingKyc ?? 0) > 1 ? "s" : ""}</p>
                <p className="text-white/40 text-xs">Identidades C2C por revisar → Revisar</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Volumen total", value: fmt(totalRevenue), sub: "en ventas B2B", href: "/admin/finanzas", accent: true },
          { label: "Tickets vendidos", value: (totalTickets ?? 0).toLocaleString(), sub: "entradas emitidas", href: "/admin/eventos" },
          { label: "Eventos activos", value: (totalEvents ?? 0).toLocaleString(), sub: "en plataforma", href: "/admin/eventos" },
          { label: "Usuarios registrados", value: (totalUsers ?? 0).toLocaleString(), sub: "cuentas totales", href: "/admin/usuarios" },
          { label: "Listings C2C", value: (activeListings ?? 0).toLocaleString(), sub: "activos en reventa", href: "/admin/c2c/listings" },
          { label: "KYC pendientes", value: (pendingKyc ?? 0).toLocaleString(), sub: "por verificar", href: "/admin/c2c/kyc" },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md group"
            style={{
              background: s.accent ? "#0a0a0a" : "#fff",
              border: s.accent ? "none" : "1px solid rgba(0,0,0,0.07)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.accent ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)" }}>
                {s.label}
              </p>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="opacity-0 group-hover:opacity-40 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform"
                style={{ color: s.accent ? "#fff" : "#0a0a0a" }}>
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
            <p className="font-[family-name:var(--font-bebas)] leading-none tracking-wide mb-1"
              style={{ fontSize: "clamp(28px,3vw,38px)", color: s.accent ? "#ffffff" : "#0a0a0a" }}>
              {s.value}
            </p>
            <p className="text-[11px]" style={{ color: s.accent ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
              {s.sub}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent events */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[#0a0a0a] font-semibold text-sm">Eventos recientes</p>
            <Link href="/admin/eventos" className="text-[#0a0a0a]/35 hover:text-[#0a0a0a] text-xs transition-colors font-medium">
              Ver todos →
            </Link>
          </div>
          <div>
            {(recentEvents ?? []).map((e) => {
              const org = recentOrgMap.get(e.organizer_id) ?? null;
              return (
                <Link
                  key={e.id}
                  href={`/admin/eventos/${e.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-black/[0.015] transition-colors"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0a0a0a] text-sm font-medium truncate">{e.name}</p>
                    <p className="text-[#0a0a0a]/35 text-xs mt-0.5">{org?.full_name ?? org?.email ?? "—"} · {fmtDate(e.date)}</p>
                  </div>
                  <span
                    className="ml-3 shrink-0 text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                    style={{
                      background: e.status === "published" ? "rgba(0,140,0,0.1)" : "rgba(0,0,0,0.06)",
                      color: e.status === "published" ? "#166534" : "rgba(0,0,0,0.4)",
                    }}
                  >
                    {e.status}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent users */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[#0a0a0a] font-semibold text-sm">Usuarios recientes</p>
            <Link href="/admin/usuarios" className="text-[#0a0a0a]/35 hover:text-[#0a0a0a] text-xs transition-colors font-medium">
              Ver todos →
            </Link>
          </div>
          <div>
            {(recentUsers ?? []).map((u) => {
              const roleColors: Record<string, { bg: string; color: string }> = {
                admin: { bg: "#0a0a0a", color: "#fff" },
                organizer: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
                reseller: { bg: "rgba(0,80,200,0.1)", color: "#1e40af" },
                pending_activation: { bg: "rgba(180,83,9,0.12)", color: "#b45309" },
                suspended: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
              };
              const rc = roleColors[u.role] ?? { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" };
              return (
                <Link
                  key={u.id}
                  href={`/admin/usuarios/${u.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-black/[0.015] transition-colors"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-black/[0.07] flex items-center justify-center text-[10px] font-bold text-[#0a0a0a]/50 shrink-0">
                      {(u.full_name ?? u.email ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#0a0a0a] text-sm font-medium truncate">{u.full_name ?? "Sin nombre"}</p>
                      <p className="text-[#0a0a0a]/35 text-xs truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className="ml-3 shrink-0 text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={rc}>
                    {u.role === "pending_activation" ? "Pendiente" : u.role}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
