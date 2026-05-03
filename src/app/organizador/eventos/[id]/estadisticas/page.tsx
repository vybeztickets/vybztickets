import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import EventStatsCharts from "./EventStatsCharts";
import CopyUrl from "./CopyUrl";

function formatPrice(n: number) { return "₡" + n.toLocaleString("en-US"); }

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
    .select("id, name")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();
  if (!event) notFound();

  const [ticketsRes, viewsRes] = await Promise.all([
    admin.from("tickets").select("purchase_price, status, promo_code, created_at").eq("event_id", id),
    (admin as any).from("event_views").select("created_at, referrer").eq("event_id", id),
  ]);

  const allTickets = ticketsRes.data ?? [];
  const allViews = viewsRes.data ?? [];

  const activeTickets = allTickets.filter((t: any) => t.status === "active" || t.status === "used");
  const totalRevenue = activeTickets.reduce((s: number, t: any) => s + t.purchase_price, 0);
  const totalSold = activeTickets.length;
  const guestlists = activeTickets.filter((t: any) => t.purchase_price === 0).length;
  const attendees = allTickets.filter((t: any) => t.status === "used").length;
  const totalViews = allViews.length;

  // Daily data last 28 days
  const since28 = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
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

  // Top ambassadors
  const { data: promoLinks } = await admin
    .from("promo_links")
    .select("promoter_name, code, tickets_sold")
    .eq("event_id", id)
    .order("tickets_sold", { ascending: false })
    .limit(3);

  const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://vybztickets.com"}/eventos/${id}`;

  const stats = [
    { label: "Total revenue", value: formatPrice(totalRevenue) },
    { label: "Tickets sold", value: totalSold },
    { label: "Guestlists", value: guestlists },
    { label: "Attendees", value: attendees },
    { label: "Page visits", value: totalViews.toLocaleString("en-US") },
  ];

  return (
    <div className="p-8 max-w-5xl">
      {/* Stats row */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[#0a0a0a]/35 text-xs uppercase tracking-wider mb-2">{s.label}</p>
            <p className="text-[#0a0a0a] font-bold text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mb-8">
        <EventStatsCharts data={chartData} />
      </div>

      {/* Bottom row */}
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

        {/* Top ambassadors */}
        {(promoLinks ?? []).length > 0 ? (
          <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <h3 className="text-[#0a0a0a] font-semibold text-sm mb-4">Top ambassadors</h3>
            <div className="flex flex-col gap-3">
              {(promoLinks ?? []).map((p, i) => (
                <div key={p.code} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-[#0a0a0a]"
                    style={{ background: i === 0 ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "rgba(0,0,0,0.07)" }}>
                    {(p.promoter_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0a0a0a] text-xs font-medium truncate">{p.promoter_name ?? p.code}</p>
                    <p className="text-[#0a0a0a]/30 text-[10px]">Code: {p.code}</p>
                  </div>
                  <span className="text-purple-400 text-xs font-semibold shrink-0">{p.tickets_sold} tickets</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <h3 className="text-[#0a0a0a] font-semibold text-sm mb-4">Event URL</h3>
            <CopyUrl url={eventUrl} />
          </div>
        )}
      </div>

      {/* Event URL always shown at bottom */}
      {(promoLinks ?? []).length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
          <h3 className="text-[#0a0a0a] font-semibold text-sm mb-4">Event URL</h3>
          <CopyUrl url={eventUrl} />
        </div>
      )}
    </div>
  );
}
