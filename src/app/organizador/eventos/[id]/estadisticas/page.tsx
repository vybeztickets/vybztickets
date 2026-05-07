import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import EventStatsCharts from "./EventStatsCharts";
import CopyUrl from "./CopyUrl";
import { formatPrice } from "@/lib/currency";

function heroFmt(n: number, currency: string): string {
  if (currency === "USD") return "$" + Math.round(n).toLocaleString("en-US");
  return formatPrice(n, currency);
}

function normalizeReferrer(ref: string | null): string {
  if (!ref) return "Direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
    if (host.includes("google")) return "Google";
    if (host.includes("whatsapp")) return "WhatsApp";
    if (host.includes("twitter") || host.includes("t.co") || host.includes("x.com")) return "Twitter / X";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("youtube")) return "YouTube";
    return host;
  } catch {
    return "Direct";
  }
}

export default async function EventEstadisticas({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, name, currency")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();
  if (!event) notFound();

  const currency: string = (event as any).currency ?? "CRC";

  const [ticketsRes, viewsRes] = await Promise.all([
    admin.from("tickets").select("purchase_price, status, promo_code, created_at").eq("event_id", id),
    (admin as any).from("event_views").select("created_at, referrer").eq("event_id", id),
  ]);

  const allTickets = ticketsRes.data ?? [];
  const allViews = viewsRes.data ?? [];

  const activeTickets = allTickets.filter((t: any) => t.status === "active" || t.status === "used");
  const ticketRevenue = activeTickets.reduce((s: number, t: any) => s + t.purchase_price, 0);
  const totalSold = activeTickets.length;
  const guestlists = activeTickets.filter((t: any) => t.purchase_price === 0).length;
  const attendees = allTickets.filter((t: any) => t.status === "used").length;
  const totalViews = allViews.length;

  // POS bar revenue for this event — graceful if table doesn't exist
  let barRevenue = 0;
  const posProductMap: Record<string, { name: string; units: number; revenue: number }> = {};
  const barDailyMap: Record<string, number> = {};
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    barDailyMap[d.toISOString().slice(0, 10)] = 0;
  }

  try {
    const { data: posOrders } = await (admin as any)
      .from("pos_orders")
      .select("total, created_at, items")
      .eq("event_id", id);
    for (const o of (posOrders ?? []) as { total: number; created_at: string; items: { name: string; quantity: number; subtotal: number }[] }[]) {
      barRevenue += o.total ?? 0;
      const key = o.created_at.slice(0, 10);
      if (key in barDailyMap) barDailyMap[key] += o.total ?? 0;
      for (const item of (o.items ?? [])) {
        if (!posProductMap[item.name]) posProductMap[item.name] = { name: item.name, units: 0, revenue: 0 };
        posProductMap[item.name].units += item.quantity;
        posProductMap[item.name].revenue += item.subtotal;
      }
    }
  } catch {
    // pos_orders table not yet created
  }

  const barChartData = Object.entries(barDailyMap).map(([date, barRevenue]) => ({ date, barRevenue }));
  const topProducts = Object.values(posProductMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const grossRevenue = ticketRevenue + barRevenue;
  const avgPerPerson = attendees > 0 ? Math.round(grossRevenue / attendees) : 0;

  // Daily chart data (28 days)
  const dailyData: Record<string, { date: string; revenue: number; tickets: number; views: number }> = {};
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyData[key] = { date: key, revenue: 0, tickets: 0, views: 0 };
  }
  activeTickets.forEach((t: any) => {
    const key = t.created_at.slice(0, 10);
    if (dailyData[key]) { dailyData[key].revenue += t.purchase_price; dailyData[key].tickets += 1; }
  });
  allViews.forEach((v: any) => {
    const key = v.created_at.slice(0, 10);
    if (dailyData[key]) dailyData[key].views += 1;
  });
  const chartData = Object.values(dailyData);

  // Top 3 traffic sources (last 28 days)
  const since28 = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const recentViews = allViews.filter((v: any) => new Date(v.created_at) >= since28);
  const referrerMap: Record<string, number> = {};
  recentViews.forEach((v: any) => {
    const label = normalizeReferrer(v.referrer);
    referrerMap[label] = (referrerMap[label] ?? 0) + 1;
  });
  const topSources = Object.entries(referrerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, visits]) => ({ name, visits }));

  const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://vybztickets.com"}/eventos/${id}`;

  // 6 KPI cards
  const stats = [
    { label: "Gross Revenue", value: heroFmt(grossRevenue, currency), sub: "Tickets + Bar" },
    { label: "Ticket Revenue", value: heroFmt(ticketRevenue, currency), sub: `${totalSold} sold · ${guestlists} free` },
    { label: "Bar Revenue", value: heroFmt(barRevenue, currency), sub: barRevenue > 0 ? `${Object.keys(posProductMap).length} products` : "No POS data" },
    { label: "Avg / Person", value: avgPerPerson > 0 ? heroFmt(avgPerPerson, currency) : "—", sub: `${attendees} attendees` },
    { label: "Tickets Sold", value: totalSold, sub: `${guestlists} guestlist` },
    { label: "Page Visits", value: totalViews.toLocaleString("en-US"), sub: "All time" },
  ];

  return (
    <div className="p-8 max-w-5xl">

      {/* ── 6 KPI cards ── */}
      <div className="grid grid-cols-6 gap-3 mb-8">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{
              background: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.07)",
            }}
          >
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: i === 0 ? "rgba(255,255,255,0.4)" : "rgba(10,10,10,0.35)" }}>
              {s.label}
            </p>
            <p className="font-[family-name:var(--font-bebas)] text-2xl leading-none mb-1" style={{ color: i === 0 ? "#fff" : "#0a0a0a" }}>
              {s.value}
            </p>
            <p className="text-[9px] leading-tight" style={{ color: i === 0 ? "rgba(255,255,255,0.3)" : "rgba(10,10,10,0.25)" }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="mb-8">
        <EventStatsCharts data={chartData} currency={currency} barData={barChartData} />
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Traffic sources */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
          <h3 className="text-[#0a0a0a] font-semibold text-sm mb-1">Top traffic sources</h3>
          <p className="text-[#0a0a0a]/30 text-xs mb-4">Where visitors come from · last 28 days</p>
          {topSources.length === 0 ? (
            <p className="text-[#0a0a0a]/20 text-xs py-4 text-center">No visits tracked yet</p>
          ) : (
            <div className="flex flex-col gap-4">
              {topSources.map((s, i) => {
                const maxVisits = topSources[0].visits;
                const pct = Math.round((s.visits / maxVisits) * 100);
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                          style={{ background: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.08)", color: i === 0 ? "#fff" : "#0a0a0a" }}>
                          {i + 1}
                        </div>
                        <span className="text-[#0a0a0a] text-xs font-medium">{s.name}</span>
                      </div>
                      <span className="text-[#0a0a0a]/50 text-xs font-semibold">{s.visits.toLocaleString("en-US")} visits</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.25)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bar product breakdown OR Event URL */}
        {topProducts.length > 0 ? (
          <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <h3 className="text-[#0a0a0a] font-semibold text-sm mb-1">Top bar products</h3>
            <p className="text-[#0a0a0a]/30 text-xs mb-4">POS sales for this event · all time</p>
            <div className="flex flex-col gap-3">
              {topProducts.map((p, i) => {
                const pct = barRevenue > 0 ? (p.revenue / barRevenue) * 100 : 0;
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ background: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.08)", color: i === 0 ? "#fff" : "#0a0a0a" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[#0a0a0a] text-xs font-medium truncate">{p.name}</p>
                        <p className="text-[#0a0a0a] text-xs font-bold ml-2 shrink-0">{formatPrice(p.revenue, currency)}</p>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#0a0a0a" }} />
                      </div>
                      <p className="text-[#0a0a0a]/25 text-[9px] mt-0.5">{p.units} units</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <h3 className="text-[#0a0a0a] font-semibold text-sm mb-4">Event URL</h3>
            <CopyUrl url={eventUrl} />
          </div>
        )}
      </div>

      {/* Event URL shown below if bar products displaced it */}
      {topProducts.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
          <h3 className="text-[#0a0a0a] font-semibold text-sm mb-4">Event URL</h3>
          <CopyUrl url={eventUrl} />
        </div>
      )}
    </div>
  );
}
