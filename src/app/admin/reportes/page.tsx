import { createClient as createAdmin } from "@supabase/supabase-js";
import AutoPrint from "./AutoPrint";
import ReportActions from "./ReportActions";

const PLATFORM_FEE_B2B = 0.05;   // 5% — update when Stripe connected
const PLATFORM_FEE_C2C = 0.03;   // 3% on resale

function fmt(n: number) { return "₡" + n.toLocaleString("es-CR"); }

export default async function ReportePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = parseInt(sp.year ?? String(now.getFullYear()));
  const month = parseInt(sp.month ?? String(now.getMonth() + 1));

  const monthStart = new Date(year, month - 1, 1).toISOString();
  const monthEnd = new Date(year, month, 0, 23, 59, 59).toISOString();
  const prevMonthStart = new Date(year, month - 2, 1).toISOString();
  const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59).toISOString();

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("es-CR", { month: "long", year: "numeric" });

  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: ticketsMonth },
    { data: ticketsPrev },
    { data: newUsers },
    { data: prevUsers },
    { data: eventsMonth },
    { data: prevEvents },
    { data: c2cSoldMonth },
    { data: c2cListingsMonth },
  ] = await Promise.all([
    db.from("tickets").select("id, purchase_price, status, event_id").gte("created_at", monthStart).lte("created_at", monthEnd),
    db.from("tickets").select("purchase_price, status").gte("created_at", prevMonthStart).lte("created_at", prevMonthEnd),
    db.from("profiles").select("id, full_name, email, role, created_at").gte("created_at", monthStart).lte("created_at", monthEnd),
    db.from("profiles").select("id").gte("created_at", prevMonthStart).lte("created_at", prevMonthEnd),
    db.from("events").select("id, name, status, organizer_id").gte("created_at", monthStart).lte("created_at", monthEnd),
    db.from("events").select("id").gte("created_at", prevMonthStart).lte("created_at", prevMonthEnd),
    db.from("resale_listings").select("asking_price").eq("status", "sold").gte("updated_at", monthStart).lte("updated_at", monthEnd),
    db.from("resale_listings").select("id, status, asking_price").gte("created_at", monthStart).lte("created_at", monthEnd),
  ]);

  const soldTickets = (ticketsMonth ?? []).filter(t => t.status !== "refunded");
  const refundedTickets = (ticketsMonth ?? []).filter(t => t.status === "refunded");
  const grossB2B = soldTickets.reduce((s, t) => s + (t.purchase_price ?? 0), 0);
  const refundedAmt = refundedTickets.reduce((s, t) => s + (t.purchase_price ?? 0), 0);
  const netB2B = grossB2B - refundedAmt;
  const feeB2B = Math.round(netB2B * PLATFORM_FEE_B2B);

  const prevGrossB2B = (ticketsPrev ?? []).filter(t => t.status !== "refunded").reduce((s, t) => s + (t.purchase_price ?? 0), 0);
  const growthB2B = prevGrossB2B > 0 ? ((grossB2B - prevGrossB2B) / prevGrossB2B) * 100 : null;

  const grossC2C = (c2cSoldMonth ?? []).reduce((s, l) => s + (l.asking_price ?? 0), 0);
  const feeC2C = Math.round(grossC2C * PLATFORM_FEE_C2C);
  const newListings = (c2cListingsMonth ?? []).length;

  const totalEstimatedRevenue = feeB2B + feeC2C;

  const usersCount = (newUsers ?? []).length;
  const prevUsersCount = (prevUsers ?? []).length;
  const usersGrowth = prevUsersCount > 0 ? ((usersCount - prevUsersCount) / prevUsersCount) * 100 : null;

  const eventsCount = (eventsMonth ?? []).length;
  const publishedEvents = (eventsMonth ?? []).filter(e => e.status === "published").length;
  const prevEventsCount = (prevEvents ?? []).length;
  const eventsGrowth = prevEventsCount > 0 ? ((eventsCount - prevEventsCount) / prevEventsCount) * 100 : null;

  // Top organizers this month
  const orgIds = [...new Set((ticketsMonth ?? []).map(t => t.event_id).filter(Boolean))];
  const { data: eventsAll } = orgIds.length > 0
    ? await db.from("events").select("id, organizer_id").in("id", orgIds)
    : { data: [] };
  const eventOrgMap = new Map((eventsAll ?? []).map(e => [e.id, e.organizer_id]));
  const orgRevMap = new Map<string, number>();
  for (const t of soldTickets) {
    const oid = eventOrgMap.get(t.event_id);
    if (!oid) continue;
    orgRevMap.set(oid, (orgRevMap.get(oid) ?? 0) + (t.purchase_price ?? 0));
  }
  const orgRevSorted = Array.from(orgRevMap.entries()).sort(([,a],[,b]) => b - a).slice(0, 5);
  const orgProfileIds = orgRevSorted.map(([id]) => id);
  const { data: orgProfiles } = orgProfileIds.length > 0
    ? await db.from("profiles").select("id, full_name, email").in("id", orgProfileIds)
    : { data: [] };
  const orgProfMap = new Map((orgProfiles ?? []).map(p => [p.id, p]));

  function pct(val: number | null) {
    if (val === null) return "—";
    const sign = val >= 0 ? "+" : "";
    return `${sign}${val.toFixed(1)}%`;
  }

  const printDate = new Date().toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <AutoPrint />
      <div className="report-wrapper" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", background: "#fff", color: "#0a0a0a", minHeight: "100vh" }}>
        <style>{`
          @media print {
            @page { margin: 16mm; size: A4; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
          }
          .report-wrapper { max-width: 860px; margin: 0 auto; padding: 40px 32px; }
          .section { margin-bottom: 32px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.07); font-size: 12px; }
          th { font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.1em; color: rgba(0,0,0,0.35); background: rgba(0,0,0,0.02); }
          .kpi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 28px; }
          .kpi { border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; padding: 14px 16px; }
          .kpi-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(0,0,0,0.35); margin-bottom: 4px; }
          .kpi-value { font-size: 22px; font-weight: 800; line-height: 1; }
          .kpi-sub { font-size: 10px; color: rgba(0,0,0,0.35); margin-top: 3px; }
          .kpi.accent { background: #0a0a0a; border-color: #0a0a0a; }
          .kpi.accent .kpi-label, .kpi.accent .kpi-value, .kpi.accent .kpi-sub { color: #fff; }
          .kpi.accent .kpi-label { color: rgba(255,255,255,0.4); }
          .kpi.accent .kpi-sub { color: rgba(255,255,255,0.35); }
          .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(0,0,0,0.3); margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(0,0,0,0.08); }
          .growth-pos { color: #16a34a; font-weight: 700; }
          .growth-neg { color: #dc2626; font-weight: 700; }
          .stripe-note { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 8px; padding: 10px 14px; font-size: 11px; color: #92400e; margin-top: 12px; }
        `}</style>

        {/* Header */}
        <div className="section" style={{ borderBottom: "2px solid #0a0a0a", paddingBottom: 20, marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(0,0,0,0.3)", marginBottom: 4 }}>VYBZ TICKETS · REPORTE FINANCIERO</p>
            <h1 style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", letterSpacing: -0.5, margin: 0 }}>
              {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", margin: 0 }}>Generado el {printDate}</p>
            <p style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", margin: "2px 0 0" }}>Uso interno · Confidencial</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="kpi-grid">
          <div className="kpi accent">
            <div className="kpi-label">Revenue Bruto B2B</div>
            <div className="kpi-value">{fmt(grossB2B)}</div>
            <div className="kpi-sub">
              {growthB2B !== null ? <span className={growthB2B >= 0 ? "growth-pos" : "growth-neg"} style={{ color: growthB2B >= 0 ? "#6ee7b7" : "#fca5a5" }}>{pct(growthB2B)} vs mes anterior</span> : "Primer mes de datos"}
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Fee Estimado B2B</div>
            <div className="kpi-value">{fmt(feeB2B)}</div>
            <div className="kpi-sub">{(PLATFORM_FEE_B2B * 100).toFixed(0)}% sobre ventas netas · pendiente Stripe</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Ingreso Estimado Total</div>
            <div className="kpi-value">{fmt(totalEstimatedRevenue)}</div>
            <div className="kpi-sub">B2B {fmt(feeB2B)} + C2C {fmt(feeC2C)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Tickets Vendidos</div>
            <div className="kpi-value">{soldTickets.length}</div>
            <div className="kpi-sub">{refundedTickets.length} reembolsados · neto {fmt(netB2B)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Nuevas Cuentas</div>
            <div className="kpi-value">{usersCount}</div>
            <div className="kpi-sub">{usersGrowth !== null ? `${pct(usersGrowth)} vs mes anterior` : "Primer mes"}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Eventos Creados</div>
            <div className="kpi-value">{eventsCount}</div>
            <div className="kpi-sub">{publishedEvents} publicados · {eventsGrowth !== null ? `${pct(eventsGrowth)} vs mes anterior` : "—"}</div>
          </div>
        </div>

        {/* B2B Section */}
        <div className="section">
          <div className="section-title">Ventas B2B</div>
          <table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th style={{ textAlign: "right" }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Revenue bruto (tickets vendidos)</td><td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(grossB2B)}</td></tr>
              <tr><td>Reembolsos emitidos ({refundedTickets.length})</td><td style={{ textAlign: "right", color: "#dc2626" }}>−{fmt(refundedAmt)}</td></tr>
              <tr style={{ background: "rgba(0,0,0,0.02)" }}><td style={{ fontWeight: 700 }}>Revenue neto B2B</td><td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(netB2B)}</td></tr>
              <tr><td>Comisión de plataforma ({(PLATFORM_FEE_B2B * 100).toFixed(0)}%) *</td><td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(feeB2B)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* C2C Section */}
        <div className="section">
          <div className="section-title">Reventa C2C</div>
          <table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th style={{ textAlign: "right" }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Volumen C2C vendido</td><td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(grossC2C)}</td></tr>
              <tr><td>Nuevos listings creados</td><td style={{ textAlign: "right" }}>{newListings}</td></tr>
              <tr><td>Comisión C2C ({(PLATFORM_FEE_C2C * 100).toFixed(0)}%) *</td><td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(feeC2C)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Top Organizers */}
        {orgRevSorted.length > 0 && (
          <div className="section">
            <div className="section-title">Top Organizadores del Mes</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Organizador</th>
                  <th style={{ textAlign: "right" }}>Revenue</th>
                  <th style={{ textAlign: "right" }}>Fee Estimado</th>
                  <th style={{ textAlign: "right" }}>% del Total</th>
                </tr>
              </thead>
              <tbody>
                {orgRevSorted.map(([oid, rev], i) => {
                  const p = orgProfMap.get(oid);
                  return (
                    <tr key={oid}>
                      <td style={{ color: "rgba(0,0,0,0.3)", fontWeight: 700 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p?.full_name ?? "Sin nombre"}</div>
                        <div style={{ fontSize: 10, color: "rgba(0,0,0,0.35)" }}>{p?.email}</div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(rev)}</td>
                      <td style={{ textAlign: "right" }}>{fmt(Math.round(rev * PLATFORM_FEE_B2B))}</td>
                      <td style={{ textAlign: "right" }}>{grossB2B > 0 ? ((rev / grossB2B) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* New Users */}
        {(newUsers ?? []).length > 0 && (
          <div className="section">
            <div className="section-title">Nuevos usuarios ({usersCount})</div>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Fecha registro</th>
                </tr>
              </thead>
              <tbody>
                {(newUsers ?? []).slice(0, 20).map(u => (
                  <tr key={u.id}>
                    <td>{u.full_name ?? "—"}</td>
                    <td style={{ color: "rgba(0,0,0,0.5)" }}>{u.email}</td>
                    <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                    <td style={{ color: "rgba(0,0,0,0.4)" }}>{new Date(u.created_at).toLocaleDateString("es-CR")}</td>
                  </tr>
                ))}
                {usersCount > 20 && <tr><td colSpan={4} style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}>... y {usersCount - 20} más</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        <div className="stripe-note">
          * Las comisiones son estimadas al {(PLATFORM_FEE_B2B * 100).toFixed(0)}% (B2B) y {(PLATFORM_FEE_C2C * 100).toFixed(0)}% (C2C). Los datos reales de ingresos estarán disponibles cuando se conecte Stripe. CAPEX y costos operativos no incluidos en este reporte.
        </div>

        <ReportActions />
      </div>
    </>
  );
}
