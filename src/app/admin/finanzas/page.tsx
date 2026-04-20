import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";
import ReporteButton from "./ReporteButton";

const PLATFORM_FEE_B2B = 0.05;
const PLATFORM_FEE_C2C = 0.03;

function fmt(n: number) { return "₡" + n.toLocaleString("es-CR"); }

type OrgRow = {
  organizer_id: string;
  revenue: number;
  tickets: number;
  eventCount: number;
  name: string;
  email: string;
};

function buildMonthSeries(items: { created_at: string }[], nMonths = 6) {
  const now = new Date();
  const result: { label: string; key: string; count: number }[] = [];
  for (let i = nMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-CR", { month: "short" });
    result.push({ key, label, count: 0 });
  }
  for (const item of items) {
    const d = new Date(item.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const slot = result.find(r => r.key === key);
    if (slot) slot.count++;
  }
  return result;
}

export default async function AdminFinanzasPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: tickets },
    { data: events },
    { data: profiles },
    { data: c2cListings },
  ] = await Promise.all([
    db.from("tickets").select("id, purchase_price, status, created_at, event_id"),
    db.from("events").select("id, name, organizer_id, created_at"),
    db.from("profiles").select("id, full_name, email, created_at"),
    db.from("resale_listings").select("asking_price, status, created_at"),
  ]);

  const eventMap = new Map((events ?? []).map((e) => [e.id, e]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const orgStats = new Map<string, OrgRow>();
  const eventSet = new Set<string>();

  for (const t of tickets ?? []) {
    if (t.status === "refunded") continue;
    const ev = eventMap.get(t.event_id);
    if (!ev) continue;
    const oid = ev.organizer_id;
    const prof = profileMap.get(oid);
    const s = orgStats.get(oid) ?? {
      organizer_id: oid,
      revenue: 0,
      tickets: 0,
      eventCount: 0,
      name: prof?.full_name ?? "Sin nombre",
      email: prof?.email ?? "",
    };
    s.revenue += t.purchase_price ?? 0;
    s.tickets++;
    if (!eventSet.has(t.event_id)) { s.eventCount++; eventSet.add(t.event_id); }
    orgStats.set(oid, s);
  }

  const sortedOrgs = Array.from(orgStats.values()).sort((a, b) => b.revenue - a.revenue);

  const totalB2B = sortedOrgs.reduce((s, o) => s + o.revenue, 0);
  const totalRefunded = (tickets ?? []).filter((t) => t.status === "refunded").reduce((s, t) => s + (t.purchase_price ?? 0), 0);
  const totalC2C = (c2cListings ?? []).filter((l) => l.status === "sold").reduce((s, l) => s + (l.asking_price ?? 0), 0);
  const estimatedFee = Math.round(totalB2B * PLATFORM_FEE_B2B) + Math.round(totalC2C * PLATFORM_FEE_C2C);

  // Monthly revenue (last 6 months)
  type MonthData = { label: string; revenue: number };
  const monthMap = new Map<string, MonthData>();
  for (const t of tickets ?? []) {
    if (t.status === "refunded") continue;
    const d = new Date(t.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-CR", { month: "short" });
    const m = monthMap.get(key) ?? { label, revenue: 0 };
    m.revenue += t.purchase_price ?? 0;
    monthMap.set(key, m);
  }
  // Last 6 months including months with 0 revenue
  const now = new Date();
  const months: MonthData[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-CR", { month: "short" });
    months.push(monthMap.get(key) ?? { label, revenue: 0 });
  }

  const maxMonthRevenue = Math.max(...months.map((m) => m.revenue), 1);

  // Growth series
  const userSeries = buildMonthSeries(profiles ?? []);
  const eventSeries = buildMonthSeries(events ?? []);
  const maxUsers = Math.max(...userSeries.map(s => s.count), 1);
  const maxEvents = Math.max(...eventSeries.map(s => s.count), 1);

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ Finanzas</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
            Dashboard Financiero
          </h1>
          <p className="text-[#0a0a0a]/35 text-sm mt-1">
            Fee estimado Stripe: {(PLATFORM_FEE_B2B * 100).toFixed(0)}% B2B · {(PLATFORM_FEE_C2C * 100).toFixed(0)}% C2C
            <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ background: "rgba(245,158,11,0.12)", color: "#b45309" }}>
              Stripe pendiente
            </span>
          </p>
        </div>
        <ReporteButton />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Revenue B2B total", value: fmt(totalB2B), sub: "ventas brutas", accent: true },
          { label: "Fee estimado total", value: fmt(estimatedFee), sub: `B2B ${(PLATFORM_FEE_B2B*100).toFixed(0)}% + C2C ${(PLATFORM_FEE_C2C*100).toFixed(0)}%` },
          { label: "Volumen C2C", value: fmt(totalC2C), sub: "ventas de reventa" },
          { label: "Reembolsos totales", value: fmt(totalRefunded), sub: "capital devuelto" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: s.accent ? "#0a0a0a" : "#fff", border: s.accent ? "none" : "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: s.accent ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>{s.label}</p>
            <p className="font-[family-name:var(--font-bebas)] text-2xl leading-none mb-1" style={{ color: s.accent ? "#fff" : "#0a0a0a" }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: s.accent ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5 mb-8">

        {/* Revenue B2B chart */}
        <div className="col-span-1 rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm mb-5">Revenue B2B mensual</p>
          <div className="flex items-end gap-2 h-28">
            {months.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[8px] font-semibold text-[#0a0a0a]/35 text-center leading-tight">{m.revenue > 0 ? fmt(m.revenue).replace("₡","") : ""}</p>
                <div
                  className="w-full rounded-t-md"
                  style={{
                    background: "#0a0a0a",
                    height: `${Math.max(3, (m.revenue / maxMonthRevenue) * 80)}px`,
                    opacity: m.revenue > 0 ? 0.85 : 0.08,
                  }}
                />
                <p className="text-[9px] text-[#0a0a0a]/35 capitalize">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* User growth chart */}
        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm mb-5">Nuevos usuarios / mes</p>
          <div className="flex items-end gap-2 h-28">
            {userSeries.map((s) => (
              <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[8px] font-semibold text-[#0a0a0a]/35">{s.count > 0 ? s.count : ""}</p>
                <div
                  className="w-full rounded-t-md"
                  style={{
                    background: "#10b981",
                    height: `${Math.max(3, (s.count / maxUsers) * 80)}px`,
                    opacity: s.count > 0 ? 0.8 : 0.1,
                  }}
                />
                <p className="text-[9px] text-[#0a0a0a]/35 capitalize">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Events created chart */}
        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm mb-5">Eventos creados / mes</p>
          <div className="flex items-end gap-2 h-28">
            {eventSeries.map((s) => (
              <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[8px] font-semibold text-[#0a0a0a]/35">{s.count > 0 ? s.count : ""}</p>
                <div
                  className="w-full rounded-t-md"
                  style={{
                    background: "#6366f1",
                    height: `${Math.max(3, (s.count / maxEvents) * 80)}px`,
                    opacity: s.count > 0 ? 0.8 : 0.1,
                  }}
                />
                <p className="text-[9px] text-[#0a0a0a]/35 capitalize">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-organizer breakdown */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm">Revenue por organizador</p>
          <p className="text-[#0a0a0a]/35 text-xs">{sortedOrgs.length} organizadores</p>
        </div>
        {sortedOrgs.length === 0 ? (
          <p className="text-[#0a0a0a]/25 text-sm p-8 text-center">Sin datos</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Organizador", "Eventos", "Tickets", "Revenue", "Fee est.", "% total", ""].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedOrgs.map((o) => (
                <tr key={o.organizer_id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] font-medium text-sm">{o.name}</p>
                    <p className="text-[#0a0a0a]/35 text-xs">{o.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]">{o.eventCount}</td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]">{o.tickets}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#0a0a0a]">{fmt(o.revenue)}</td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]/60">{fmt(Math.round(o.revenue * PLATFORM_FEE_B2B))}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ background: "#0a0a0a", width: `${totalB2B > 0 ? (o.revenue / totalB2B) * 100 : 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#0a0a0a]/50 w-8 text-right">
                        {totalB2B > 0 ? Math.round((o.revenue / totalB2B) * 100) : 0}%
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/organizadores/${o.organizer_id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">Ver →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
