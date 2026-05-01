import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";
import ReporteButton from "./ReporteButton";

const SERVICE_FEE = 0.15;

function fmt(n: number) { return "$" + n.toLocaleString("en-US"); }

type OrgRow = {
  organizer_id: string;
  revenue: number;
  vybzFee: number;
  tickets: number;
  eventCount: number;
  name: string;
  email: string;
};

type EventRow = {
  event_id: string;
  event_name: string;
  organizer_name: string;
  organizer_id: string;
  tickets: number;
  revenue: number;
  vybzFee: number;
};

export default async function AdminFinanzasPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: tickets },
    { data: events },
    { data: profiles },
  ] = await Promise.all([
    db.from("tickets").select("id, purchase_price, status, created_at, event_id"),
    db.from("events").select("id, name, organizer_id, created_at"),
    db.from("profiles").select("id, full_name, email, created_at"),
  ]);

  const eventMap = new Map((events ?? []).map((e) => [e.id, e]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const orgStats = new Map<string, OrgRow>();
  const eventStats = new Map<string, EventRow>();
  const countedEventPerOrg = new Map<string, Set<string>>();

  for (const t of tickets ?? []) {
    if (t.status === "refunded") continue;
    const ev = eventMap.get(t.event_id);
    if (!ev) continue;
    const oid = ev.organizer_id;
    const prof = profileMap.get(oid);
    const price = t.purchase_price ?? 0;
    const fee = Math.round(price * SERVICE_FEE);

    const s = orgStats.get(oid) ?? {
      organizer_id: oid, revenue: 0, vybzFee: 0, tickets: 0, eventCount: 0,
      name: prof?.full_name ?? "Sin nombre", email: prof?.email ?? "",
    };
    s.revenue += price; s.vybzFee += fee; s.tickets++;
    const counted = countedEventPerOrg.get(oid) ?? new Set<string>();
    if (!counted.has(t.event_id)) { s.eventCount++; counted.add(t.event_id); }
    countedEventPerOrg.set(oid, counted);
    orgStats.set(oid, s);

    const es = eventStats.get(t.event_id) ?? {
      event_id: t.event_id, event_name: ev.name,
      organizer_name: prof?.full_name ?? "Sin nombre", organizer_id: oid,
      tickets: 0, revenue: 0, vybzFee: 0,
    };
    es.tickets++; es.revenue += price; es.vybzFee += fee;
    eventStats.set(t.event_id, es);
  }

  const sortedOrgs = Array.from(orgStats.values()).sort((a, b) => b.revenue - a.revenue);
  const sortedEvents = Array.from(eventStats.values()).sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = sortedOrgs.reduce((s, o) => s + o.revenue, 0);
  const totalVybzFee = sortedOrgs.reduce((s, o) => s + o.vybzFee, 0);
  const totalRefunded = (tickets ?? []).filter(t => t.status === "refunded").reduce((s, t) => s + (t.purchase_price ?? 0), 0);

  // Monthly chart
  type MonthData = { label: string; revenue: number; fee: number };
  const monthMap = new Map<string, MonthData>();
  for (const t of tickets ?? []) {
    if (t.status === "refunded") continue;
    const d = new Date(t.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-CR", { month: "short" });
    const m = monthMap.get(key) ?? { label, revenue: 0, fee: 0 };
    const price = t.purchase_price ?? 0;
    m.revenue += price; m.fee += Math.round(price * SERVICE_FEE);
    monthMap.set(key, m);
  }
  const now = new Date();
  const months: MonthData[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-CR", { month: "short" });
    months.push(monthMap.get(key) ?? { label, revenue: 0, fee: 0 });
  }
  const maxMonth = Math.max(...months.map(m => m.revenue), 1);

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ B2B · Organizadores</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
            Finanzas B2B
          </h1>
          <p className="text-[#0a0a0a]/35 text-sm mt-1">Service fee {(SERVICE_FEE * 100).toFixed(0)}% · pagado por el comprador · ONVO Pay</p>
        </div>
        <ReporteButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-5" style={{ background: "#0a0a0a" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-white/35">Volumen total B2B</p>
          <p className="font-[family-name:var(--font-bebas)] text-3xl leading-none mb-1 text-white">{fmt(totalRevenue)}</p>
          <p className="text-[10px] text-white/25">{sortedOrgs.reduce((s, o) => s + o.tickets, 0)} tickets vendidos</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#047857" }}>Ingresos Vybz (15%)</p>
          <p className="font-[family-name:var(--font-bebas)] text-3xl leading-none mb-1" style={{ color: "#065f46" }}>{fmt(totalVybzFee)}</p>
          <p className="text-[10px]" style={{ color: "rgba(4,120,87,0.6)" }}>service fee acumulado</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-[#0a0a0a]/35">Reembolsos</p>
          <p className="font-[family-name:var(--font-bebas)] text-3xl leading-none mb-1 text-[#0a0a0a]">{fmt(totalRefunded)}</p>
          <p className="text-[10px] text-[#0a0a0a]/30">capital devuelto</p>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-[#0a0a0a] font-semibold text-sm mb-1">Revenue mensual</p>
        <p className="text-[#0a0a0a]/35 text-xs mb-5">
          <span className="inline-block w-2 h-2 rounded-sm mr-1 align-middle" style={{ background: "#0a0a0a", opacity: 0.85 }} />neto organizador
          <span className="inline-block w-2 h-2 rounded-sm mx-1 ml-3 align-middle" style={{ background: "#10b981", opacity: 0.8 }} />Vybz fee
        </p>
        <div className="flex items-end gap-3 h-32">
          {months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              {m.revenue > 0 && <p className="text-[8px] font-semibold text-[#0a0a0a]/35 text-center">{fmt(m.revenue)}</p>}
              <div className="w-full flex flex-col">
                <div className="w-full rounded-t-md" style={{ background: "#10b981", height: `${Math.max(2, (m.fee / maxMonth) * 90)}px`, opacity: m.fee > 0 ? 0.8 : 0.08 }} />
                <div className="w-full" style={{ background: "#0a0a0a", height: `${Math.max(2, ((m.revenue - m.fee) / maxMonth) * 90)}px`, opacity: m.revenue > 0 ? 0.85 : 0.08 }} />
              </div>
              <p className="text-[9px] text-[#0a0a0a]/35 capitalize">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-event breakdown */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm">Ingresos por evento</p>
          <p className="text-[#0a0a0a]/35 text-xs">{sortedEvents.length} eventos con ventas</p>
        </div>
        {sortedEvents.length === 0 ? (
          <p className="text-[#0a0a0a]/25 text-sm p-8 text-center">Sin datos</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Evento", "Organizador", "Tickets", "Volumen base", "Vybz (15%)", "Neto organizador", ""].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((e) => (
                <tr key={e.event_id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4"><p className="text-[#0a0a0a] font-medium text-sm">{e.event_name}</p></td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]/60">{e.organizer_name}</td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]">{e.tickets}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#0a0a0a]">{fmt(e.revenue)}</td>
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#047857" }}>{fmt(e.vybzFee)}</td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]/60">{fmt(e.revenue - e.vybzFee)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/eventos/${e.event_id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">Ver →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.02)" }}>
                <td className="px-6 py-3 text-xs font-bold text-[#0a0a0a]/50 uppercase tracking-wider" colSpan={3}>Total</td>
                <td className="px-6 py-3 text-sm font-bold text-[#0a0a0a]">{fmt(totalRevenue)}</td>
                <td className="px-6 py-3 text-sm font-bold" style={{ color: "#047857" }}>{fmt(totalVybzFee)}</td>
                <td className="px-6 py-3 text-sm font-bold text-[#0a0a0a]/60">{fmt(totalRevenue - totalVybzFee)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Per-organizer breakdown */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm">Ingresos por organizador</p>
          <p className="text-[#0a0a0a]/35 text-xs">{sortedOrgs.length} organizadores</p>
        </div>
        {sortedOrgs.length === 0 ? (
          <p className="text-[#0a0a0a]/25 text-sm p-8 text-center">Sin datos</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Organizador", "Eventos", "Tickets", "Volumen base", "Vybz (15%)", "Neto org.", "% del total", ""].map((h) => (
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
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#047857" }}>{fmt(o.vybzFee)}</td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]/60">{fmt(o.revenue - o.vybzFee)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-full rounded-full" style={{ background: "#0a0a0a", width: `${totalRevenue > 0 ? (o.revenue / totalRevenue) * 100 : 0}%` }} />
                      </div>
                      <p className="text-xs text-[#0a0a0a]/50 w-8 text-right">
                        {totalRevenue > 0 ? Math.round((o.revenue / totalRevenue) * 100) : 0}%
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/organizadores/${o.organizer_id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">Ver →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.02)" }}>
                <td className="px-6 py-3 text-xs font-bold text-[#0a0a0a]/50 uppercase tracking-wider" colSpan={3}>Total</td>
                <td className="px-6 py-3 text-sm font-bold text-[#0a0a0a]">{fmt(totalRevenue)}</td>
                <td className="px-6 py-3 text-sm font-bold" style={{ color: "#047857" }}>{fmt(totalVybzFee)}</td>
                <td className="px-6 py-3 text-sm font-bold text-[#0a0a0a]/60">{fmt(totalRevenue - totalVybzFee)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
