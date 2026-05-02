import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import EventStatsCharts from "./EventStatsCharts";
import CopyUrl from "./CopyUrl";

function formatPrice(n: number) { return "₡" + n.toLocaleString("en-US"); }

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

  const { data: tickets } = await admin
    .from("tickets")
    .select("purchase_price, status, promo_code, created_at, buyer_name, buyer_email")
    .eq("event_id", id);

  const allTickets = tickets ?? [];
  const activeTickets = allTickets.filter((t) => t.status === "active" || t.status === "used");
  const totalRevenue = activeTickets.reduce((s, t) => s + t.purchase_price, 0);
  const totalSold = activeTickets.length;
  const courtesies = activeTickets.filter((t) => t.purchase_price === 0).length;
  const attendees = allTickets.filter((t) => t.status === "used").length;

  // Daily chart data (last 28 days)
  const dailyData: Record<string, { date: string; revenue: number; tickets: number }> = {};
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyData[key] = { date: key, revenue: 0, tickets: 0 };
  }
  activeTickets.forEach((t) => {
    const key = t.created_at.slice(0, 10);
    if (dailyData[key]) {
      dailyData[key].revenue += t.purchase_price;
      dailyData[key].tickets += 1;
    }
  });
  const chartData = Object.values(dailyData);

  // Top embajadores from promo_links
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
    { label: "Complimentary", value: courtesies },
    { label: "Attendees", value: attendees },
  ];

  return (
    <div className="p-8 max-w-5xl">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
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

      {/* Bottom row: embajadores + event URL */}
      <div className="grid grid-cols-2 gap-6">
        {(promoLinks ?? []).length > 0 && (
          <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <h3 className="text-[#0a0a0a] font-semibold text-sm mb-4">Top ambassadors</h3>
            <div className="flex flex-col gap-3">
              {(promoLinks ?? []).map((p, i) => (
                <div key={p.code} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-[#0a0a0a]"
                    style={{ background: i === 0 ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "rgba(0,0,0,0.07)" }}
                  >
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
        )}

        <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
          <h3 className="text-[#0a0a0a] font-semibold text-sm mb-4">Event URL</h3>
          <CopyUrl url={eventUrl} />
        </div>
      </div>
    </div>
  );
}
