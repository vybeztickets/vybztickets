import { createClient as createAdmin } from "@supabase/supabase-js";
import AutoPrint from "./AutoPrint";
import ReportActions from "./ReportActions";

const PLATFORM_FEE_B2B = 0.15;   // 15% service fee, always paid by buyer
const PLATFORM_FEE_C2C = 0;      // C2C fee model TBD

function fmt(n: number) { return "₡" + n.toLocaleString("en-US"); }

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

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

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

  const printDate = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

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
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(0,0,0,0.3)", marginBottom: 4 }}>VYBZ TICKETS · FINANCIAL REPORT</p>
            <h1 style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", letterSpacing: -0.5, margin: 0 }}>
              {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", margin: 0 }}>Generated on {printDate}</p>
            <p style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", margin: "2px 0 0" }}>Internal use · Confidential</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="kpi-grid">
          <div className="kpi accent">
            <div className="kpi-label">Gross B2B Revenue</div>
            <div className="kpi-value">{fmt(grossB2B)}</div>
            <div className="kpi-sub">
              {growthB2B !== null ? <span className={growthB2B >= 0 ? "growth-pos" : "growth-neg"} style={{ color: growthB2B >= 0 ? "#6ee7b7" : "#fca5a5" }}>{pct(growthB2B)} vs prior month</span> : "First month of data"}
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Vybz B2B Revenue</div>
            <div className="kpi-value">{fmt(feeB2B)}</div>
            <div className="kpi-sub">Service fee {(PLATFORM_FEE_B2B * 100).toFixed(0)}% · paid by buyer (ONVO Pay)</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Total Estimated Revenue</div>
            <div className="kpi-value">{fmt(totalEstimatedRevenue)}</div>
            <div className="kpi-sub">B2B {fmt(feeB2B)} + C2C {fmt(feeC2C)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Tickets Sold</div>
            <div className="kpi-value">{soldTickets.length}</div>
            <div className="kpi-sub">{refundedTickets.length} refunded · net {fmt(netB2B)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">New Accounts</div>
            <div className="kpi-value">{usersCount}</div>
            <div className="kpi-sub">{usersGrowth !== null ? `${pct(usersGrowth)} vs prior month` : "First month"}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Events Created</div>
            <div className="kpi-value">{eventsCount}</div>
            <div className="kpi-sub">{publishedEvents} published · {eventsGrowth !== null ? `${pct(eventsGrowth)} vs prior month` : "—"}</div>
          </div>
        </div>

        {/* B2B Section */}
        <div className="section">
          <div className="section-title">B2B Sales</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Gross revenue (tickets sold)</td><td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(grossB2B)}</td></tr>
              <tr><td>Refunds issued ({refundedTickets.length})</td><td style={{ textAlign: "right", color: "#dc2626" }}>−{fmt(refundedAmt)}</td></tr>
              <tr style={{ background: "rgba(0,0,0,0.02)" }}><td style={{ fontWeight: 700 }}>Net B2B revenue</td><td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(netB2B)}</td></tr>
              <tr><td>Platform fee ({(PLATFORM_FEE_B2B * 100).toFixed(0)}%) *</td><td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(feeB2B)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* C2C Section */}
        <div className="section">
          <div className="section-title">C2C Resale</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>C2C volume sold</td><td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(grossC2C)}</td></tr>
              <tr><td>New listings created</td><td style={{ textAlign: "right" }}>{newListings}</td></tr>
              <tr><td>C2C fee ({(PLATFORM_FEE_C2C * 100).toFixed(0)}%) *</td><td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(feeC2C)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Top Organizers */}
        {orgRevSorted.length > 0 && (
          <div className="section">
            <div className="section-title">Top Organizers of the Month</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Organizer</th>
                  <th style={{ textAlign: "right" }}>Revenue</th>
                  <th style={{ textAlign: "right" }}>Estimated fee</th>
                  <th style={{ textAlign: "right" }}>% of total</th>
                </tr>
              </thead>
              <tbody>
                {orgRevSorted.map(([oid, rev], i) => {
                  const p = orgProfMap.get(oid);
                  return (
                    <tr key={oid}>
                      <td style={{ color: "rgba(0,0,0,0.3)", fontWeight: 700 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p?.full_name ?? "No name"}</div>
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
            <div className="section-title">New users ({usersCount})</div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registration date</th>
                </tr>
              </thead>
              <tbody>
                {(newUsers ?? []).slice(0, 20).map(u => (
                  <tr key={u.id}>
                    <td>{u.full_name ?? "—"}</td>
                    <td style={{ color: "rgba(0,0,0,0.5)" }}>{u.email}</td>
                    <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                    <td style={{ color: "rgba(0,0,0,0.4)" }}>{new Date(u.created_at).toLocaleDateString("en-US")}</td>
                  </tr>
                ))}
                {usersCount > 20 && <tr><td colSpan={4} style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}>... and {usersCount - 20} more</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        <div className="stripe-note">
          * B2B service fee: {(PLATFORM_FEE_B2B * 100).toFixed(0)}% on the base ticket price, always paid by the buyer via ONVO Pay. C2C fee model under review — not included in this report. CAPEX and operating costs not included.
        </div>

        <ReportActions />
      </div>
    </>
  );
}
