import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardCharts from "./DashboardCharts";
import { formatPrice } from "@/lib/currency";

function heroFmt(n: number, currency: string): string {
  if (currency === "USD") return "$" + Math.round(n).toLocaleString("en-US");
  return formatPrice(n, currency);
}

export const metadata = { title: "Dashboard — Vybz Tickets" };

export default async function OrganizerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador");

  const admin = createAdminClient();

  const [profileRes, eventsRes] = await Promise.all([
    admin.from("profiles").select("currency").eq("id", user.id).single(),
    admin.from("events")
      .select(`*, ticket_types(id, price, total_available, sold_count, is_active)`)
      .eq("organizer_id", user.id)
      .order("date", { ascending: true }),
  ]);

  const profileCurrency: string = (profileRes.data as any)?.currency ?? "CRC";

  const eventsData = ((eventsRes.data ?? []) as unknown as {
    id: string; date: string; status: string; name: string; currency?: string;
    ticket_types: { id: string; price: number; total_available: number; sold_count: number; is_active: boolean }[];
  }[]);

  const now = new Date();
  const upcoming = eventsData.filter((e) => new Date(e.date) >= now && e.status === "published");
  const totalSold = eventsData.reduce((s, e) => s + e.ticket_types.reduce((a, t) => a + t.sold_count, 0), 0);

  // Revenue by currency — never mix CRC and USD
  const revenueByCurrency: Record<string, number> = {};
  for (const e of eventsData) {
    const cur = e.currency ?? profileCurrency;
    const rev = e.ticket_types.reduce((a, t) => a + t.sold_count * t.price, 0);
    revenueByCurrency[cur] = (revenueByCurrency[cur] ?? 0) + rev;
  }
  const currencies = Object.keys(revenueByCurrency);
  const ticketRevenue = revenueByCurrency[profileCurrency] ?? 0;
  const hasMixedCurrencies = currencies.length > 1;

  const allEventIds = eventsData.map((e) => e.id);

  const [viewsRes, checkedInRes] = await Promise.all([
    (admin as any)
      .from("event_views")
      .select("id", { count: "exact", head: true })
      .in("event_id", allEventIds.length > 0 ? allEventIds : ["none"]),
    admin
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .in("event_id", allEventIds.length > 0 ? allEventIds : ["none"])
      .eq("status", "used"),
  ]);

  const totalViews = viewsRes.count ?? 0;
  const totalCheckedIn = checkedInRes.count ?? 0;

  // POS data — graceful if table not yet created
  const posDailyMap: Record<string, number> = {};
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    posDailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  let barRevenue = 0;
  const posProductMap: Record<string, { name: string; units: number; revenue: number }> = {};

  try {
    const since28d = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
    const { data: posOrders } = await (admin as any)
      .from("pos_orders")
      .select("total, created_at, items")
      .eq("organizer_id", user.id)
      .gte("created_at", since28d);
    for (const o of (posOrders ?? []) as { total: number; created_at: string; items: { name: string; quantity: number; subtotal: number }[] }[]) {
      const key = o.created_at.slice(0, 10);
      if (key in posDailyMap) posDailyMap[key] += o.total ?? 0;
      barRevenue += o.total ?? 0;
      for (const item of (o.items ?? [])) {
        if (!posProductMap[item.name]) posProductMap[item.name] = { name: item.name, units: 0, revenue: 0 };
        posProductMap[item.name].units += item.quantity;
        posProductMap[item.name].revenue += item.subtotal;
      }
    }
  } catch {
    // pos_orders table not yet created
  }

  const posChartData = Object.entries(posDailyMap).map(([date, barRevenue]) => ({ date, barRevenue }));
  const topProducts = Object.values(posProductMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Gross Revenue = tickets + bar (primary currency only)
  const grossRevenue = ticketRevenue + barRevenue;

  // 28-day ticket chart data
  const { data: recentTickets } = await admin
    .from("tickets")
    .select("purchase_price, created_at, event_id")
    .in("event_id", allEventIds.length > 0 ? allEventIds : ["none"])
    .eq("status", "active")
    .gte("created_at", new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString());

  const dailyData: Record<string, { date: string; revenue: number; tickets: number }> = {};
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyData[key] = { date: key, revenue: 0, tickets: 0 };
  }
  const primaryEventIds = new Set(eventsData.filter((e) => (e.currency ?? profileCurrency) === profileCurrency).map((e) => e.id));
  (recentTickets ?? []).forEach((t) => {
    const key = t.created_at.slice(0, 10);
    if (dailyData[key] && primaryEventIds.has(t.event_id)) {
      dailyData[key].revenue += t.purchase_price;
      dailyData[key].tickets += 1;
    }
  });
  const chartData = Object.values(dailyData);

  // Top buyers
  const { data: allTickets } = await admin
    .from("tickets")
    .select("buyer_email, buyer_name, purchase_price, event_id")
    .in("event_id", allEventIds.length > 0 ? allEventIds : ["none"])
    .in("status", ["active", "used"]);

  const customerMap: Record<string, { email: string; name: string | null; spent: number; tickets: number }> = {};
  (allTickets ?? []).forEach((t) => {
    if (!primaryEventIds.has(t.event_id)) return;
    if (!customerMap[t.buyer_email]) customerMap[t.buyer_email] = { email: t.buyer_email, name: t.buyer_name, spent: 0, tickets: 0 };
    customerMap[t.buyer_email].spent += t.purchase_price;
    customerMap[t.buyer_email].tickets += 1;
  });
  const bestCustomers = Object.values(customerMap).sort((a, b) => b.spent - a.spent).slice(0, 5);

  const avgPerTicket = totalSold > 0 ? Math.round(ticketRevenue / totalSold) : 0;
  const avgPerPerson = totalCheckedIn > 0 ? Math.round(grossRevenue / totalCheckedIn) : 0;

  const miniStats = [
    { label: "Tickets sold", value: totalSold },
    { label: "Upcoming", value: upcoming.length },
    { label: "Avg. ticket", value: heroFmt(avgPerTicket, profileCurrency) },
    { label: "Avg/person", value: avgPerPerson > 0 ? heroFmt(avgPerPerson, profileCurrency) : "—" },
    { label: "Visits", value: totalViews.toLocaleString("en-US") },
  ];

  return (
    <div className="px-10 py-8 max-w-6xl mx-auto">

      {/* ── Hero: Gross Revenue ── */}
      <div className="flex items-center gap-0 mb-10 pb-8" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex-1 min-w-0 pr-8" style={{ borderRight: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-[0.2em] mb-3">Gross Revenue</p>
          <p className="font-[family-name:var(--font-bebas)] text-[72px] text-[#0a0a0a] leading-none mb-1">
            {heroFmt(grossRevenue, profileCurrency)}
          </p>
          {/* Breakdown subline */}
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[#0a0a0a]/35 text-xs">
              Tickets: <span className="font-semibold">{heroFmt(ticketRevenue, profileCurrency)}</span>
            </span>
            <span className="text-[#0a0a0a]/15">·</span>
            <span className="text-[#0a0a0a]/35 text-xs">
              Bar: <span className="font-semibold">{heroFmt(barRevenue, profileCurrency)}</span>
            </span>
          </div>
          {hasMixedCurrencies && (
            <p className="text-[#0a0a0a]/20 text-xs mb-1">
              {profileCurrency} only ·{" "}
              {currencies.filter((c) => c !== profileCurrency).map((c) =>
                `${formatPrice(revenueByCurrency[c], c)} in ${c}`
              ).join(", ")} not included
            </p>
          )}
          <p className="text-[#0a0a0a]/20 text-xs">All events · all time</p>
        </div>

        <div className="flex items-center shrink-0">
          {miniStats.map((s) => (
            <div key={s.label} className="px-6" style={{ borderLeft: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider mb-2 whitespace-nowrap">{s.label}</p>
              <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a] leading-none">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts ── */}
      <DashboardCharts chartData={chartData} currency={profileCurrency} posChartData={posChartData} />

      {/* ── Bottom grid ── */}
      {(bestCustomers.length > 0 || eventsData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top buyers */}
          {bestCustomers.length > 0 && (
            <div className="rounded-2xl p-6" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
              <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider mb-5">Top buyers</p>
              <div className="flex flex-col gap-4">
                {bestCustomers.map((c, i) => (
                  <div key={c.email} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.06)", color: i === 0 ? "#fff" : "#0a0a0a" }}>
                      {(c.name ?? c.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#0a0a0a] text-xs font-semibold truncate">{c.name ?? c.email}</p>
                      <p className="text-[#0a0a0a]/30 text-[10px]">{c.tickets} ticket{c.tickets !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-[#0a0a0a] text-sm font-bold shrink-0">
                      {formatPrice(c.spent, profileCurrency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Occupancy */}
          <div className="rounded-2xl p-6" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
            <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider mb-5">Occupancy per event</p>
            <div className="flex flex-col gap-5">
              {eventsData.slice(0, 5).map((e) => {
                const sold = e.ticket_types.reduce((s, t) => s + t.sold_count, 0);
                const total = e.ticket_types.reduce((s, t) => s + t.total_available, 0);
                const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
                return (
                  <div key={e.id}>
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/organizador/eventos/${e.id}`}
                        className="text-[#0a0a0a] text-xs font-semibold truncate flex-1 hover:opacity-60 transition-opacity">
                        {e.name}
                      </Link>
                      <span className="text-[#0a0a0a]/30 text-[10px] ml-3 shrink-0">{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#0a0a0a" }} />
                    </div>
                  </div>
                );
              })}
              {eventsData.length === 0 && (
                <p className="text-[#0a0a0a]/20 text-sm text-center py-4">No events yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Top bar products (last 28 days) ── */}
      {topProducts.length > 0 && (
        <div className="rounded-2xl p-6 mb-6" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider">Top bar products · last 28 days</p>
            <Link href="/organizador/pos/ventas" className="text-[10px] text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 uppercase tracking-wider transition-colors">
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-0" style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, overflow: "hidden" }}>
            {topProducts.map((p, i) => {
              const pct = barRevenue > 0 ? (p.revenue / barRevenue) * 100 : 0;
              return (
                <div
                  key={p.name}
                  className="flex items-center gap-4 px-4 py-3"
                  style={{ borderBottom: i < topProducts.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.07)", color: i === 0 ? "#fff" : "rgba(0,0,0,0.4)" }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0a0a0a] text-sm font-medium truncate">{p.name}</p>
                    <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)", maxWidth: 200 }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#0a0a0a" }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#0a0a0a] text-sm font-bold">{formatPrice(p.revenue, profileCurrency)}</p>
                    <p className="text-[#0a0a0a]/25 text-[10px]">{p.units} units · {pct.toFixed(0)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {eventsData.length === 0 && (
        <div className="text-center py-24">
          <p className="font-[family-name:var(--font-bebas)] text-5xl text-[#0a0a0a]/10 mb-4">NO EVENTS</p>
          <Link href="/organizador/eventos/nuevo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors">
            + Create your first event
          </Link>
        </div>
      )}
    </div>
  );
}
