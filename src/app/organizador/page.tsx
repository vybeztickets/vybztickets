import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardCharts from "./DashboardCharts";

export const metadata = { title: "Dashboard — Vybz Tickets" };

function formatPrice(n: number) {
  if (n >= 1000000) return "₡" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "₡" + (n / 1000).toFixed(0) + "K";
  return "₡" + n.toLocaleString("es-CR");
}

export default async function OrganizerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador");

  const admin = createAdminClient();

  const { data: rawEvents } = await admin
    .from("events")
    .select(`*, ticket_types(id, price, total_available, sold_count, is_active)`)
    .eq("organizer_id", user.id)
    .order("date", { ascending: true });

  const eventsData = (rawEvents ?? []) as unknown as {
    id: string; date: string; status: string; name: string;
    ticket_types: { id: string; price: number; total_available: number; sold_count: number; is_active: boolean }[];
  }[];

  const now = new Date();
  const upcoming = eventsData.filter((e) => new Date(e.date) >= now && e.status === "published");
  const totalSold = eventsData.reduce((s, e) => s + e.ticket_types.reduce((a, t) => a + t.sold_count, 0), 0);
  const totalRevenue = eventsData.reduce((s, e) => s + e.ticket_types.reduce((a, t) => a + t.sold_count * t.price, 0), 0);
  const avgRevenuePerSale = totalSold > 0 ? Math.round(totalRevenue / totalSold) : 0;

  const { data: recentTickets } = await admin
    .from("tickets")
    .select("purchase_price, created_at, event_id")
    .in("event_id", eventsData.map((e) => e.id))
    .eq("status", "active")
    .gte("created_at", new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString());

  const dailyData: Record<string, { date: string; revenue: number; tickets: number }> = {};
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyData[key] = { date: key, revenue: 0, tickets: 0 };
  }
  (recentTickets ?? []).forEach((t) => {
    const key = t.created_at.slice(0, 10);
    if (dailyData[key]) {
      dailyData[key].revenue += t.purchase_price;
      dailyData[key].tickets += 1;
    }
  });
  const chartData = Object.values(dailyData);

  const { data: allTickets } = await admin
    .from("tickets")
    .select("buyer_email, buyer_name, purchase_price")
    .in("event_id", eventsData.map((e) => e.id))
    .in("status", ["active", "used"]);

  const customerMap: Record<string, { email: string; name: string | null; spent: number; tickets: number }> = {};
  (allTickets ?? []).forEach((t) => {
    if (!customerMap[t.buyer_email]) {
      customerMap[t.buyer_email] = { email: t.buyer_email, name: t.buyer_name, spent: 0, tickets: 0 };
    }
    customerMap[t.buyer_email].spent += t.purchase_price;
    customerMap[t.buyer_email].tickets += 1;
  });
  const bestCustomers = Object.values(customerMap).sort((a, b) => b.spent - a.spent).slice(0, 5);

  const miniStats = [
    { label: "Entradas vendidas", value: totalSold },
    { label: "Próximos eventos", value: upcoming.length },
    { label: "Ticket promedio", value: formatPrice(avgRevenuePerSale) },
  ];

  return (
    <div className="px-10 py-8 max-w-6xl mx-auto">

      {/* ── Hero KPI row ── */}
      <div
        className="flex items-center gap-0 mb-10 pb-8"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      >
        {/* Main revenue */}
        <div className="flex-1 min-w-0 pr-10" style={{ borderRight: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-[0.2em] mb-3">
            Ingresos acumulados
          </p>
          <p
            className="font-[family-name:var(--font-bebas)] text-[72px] text-[#0a0a0a] leading-none mb-2"
          >
            {totalRevenue === 0 ? "₡0" : formatPrice(totalRevenue)}
          </p>
          <p className="text-[#0a0a0a]/25 text-xs">Todos los eventos · acumulado</p>
        </div>

        {/* Mini stats */}
        <div className="flex items-center shrink-0">
          {miniStats.map((s, i) => (
            <div
              key={s.label}
              className="px-10"
              style={{ borderLeft: "1px solid rgba(0,0,0,0.07)" }}
            >
              <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider mb-2">{s.label}</p>
              <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a] leading-none">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Full-width chart ── */}
      <DashboardCharts chartData={chartData} />

      {/* ── Bottom: buyers + events performance ── */}
      {bestCustomers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best buyers */}
          <div
            className="rounded-2xl p-6"
            style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}
          >
            <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider mb-5">Mejores compradores</p>
            <div className="flex flex-col gap-4">
              {bestCustomers.map((c, i) => (
                <div key={c.email} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.06)",
                      color: i === 0 ? "#fff" : "#0a0a0a",
                    }}
                  >
                    {(c.name ?? c.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0a0a0a] text-xs font-semibold truncate">{c.name ?? c.email}</p>
                    <p className="text-[#0a0a0a]/30 text-[10px]">{c.tickets} ticket{c.tickets !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-[#0a0a0a] text-sm font-bold shrink-0">
                    {formatPrice(c.spent)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Events performance */}
          <div
            className="rounded-2xl p-6"
            style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}
          >
            <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider mb-5">Ocupación por evento</p>
            <div className="flex flex-col gap-5">
              {eventsData.slice(0, 5).map((e) => {
                const sold = e.ticket_types.reduce((s, t) => s + t.sold_count, 0);
                const total = e.ticket_types.reduce((s, t) => s + t.total_available, 0);
                const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
                return (
                  <div key={e.id}>
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        href={`/organizador/eventos/${e.id}`}
                        className="text-[#0a0a0a] text-xs font-semibold truncate flex-1 hover:opacity-60 transition-opacity"
                      >
                        {e.name}
                      </Link>
                      <span className="text-[#0a0a0a]/30 text-[10px] ml-3 shrink-0">
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: "rgba(0,0,0,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: "#0a0a0a" }}
                      />
                    </div>
                  </div>
                );
              })}
              {eventsData.length === 0 && (
                <p className="text-[#0a0a0a]/20 text-sm text-center py-4">Sin eventos aún</p>
              )}
            </div>
          </div>
        </div>
      )}

      {eventsData.length === 0 && (
        <div className="text-center py-24">
          <p className="font-[family-name:var(--font-bebas)] text-5xl text-[#0a0a0a]/10 mb-4">SIN EVENTOS</p>
          <Link
            href="/organizador/eventos/nuevo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
          >
            + Crear tu primer evento
          </Link>
        </div>
      )}
    </div>
  );
}
