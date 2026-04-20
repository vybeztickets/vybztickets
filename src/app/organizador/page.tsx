import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardCharts from "./DashboardCharts";

export const metadata = { title: "Dashboard — Vybz Tickets" };

function formatPrice(n: number) {
  return "₡" + n.toLocaleString("es-CR");
}

export default async function OrganizerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador");

  const admin = createAdminClient();

  const { data: events } = await admin
    .from("events")
    .select(`*, ticket_types(id, price, total_available, sold_count, is_active)`)
    .eq("organizer_id", user.id)
    .order("date", { ascending: true });

  const eventsData = events ?? [];

  const now = new Date();
  const upcoming = eventsData.filter((e) => new Date(e.date) >= now && e.status === "published");
  const totalSold = eventsData.reduce((s, e) => s + e.ticket_types.reduce((a: number, t: {sold_count:number}) => a + t.sold_count, 0), 0);
  const totalRevenue = eventsData.reduce((s, e) => s + e.ticket_types.reduce((a: number, t: {sold_count:number;price:number}) => a + t.sold_count * t.price, 0), 0);
  const avgRevenuePerSale = totalSold > 0 ? Math.round(totalRevenue / totalSold) : 0;

  const stats = [
    { label: "Próximos", value: upcoming.length, sub: upcoming.length > 0 ? "Ver eventos" : "—", href: "/organizador/eventos" },
    { label: "Ventas totales", value: formatPrice(totalRevenue), sub: "Acumulado" },
    { label: "Entradas vendidas", value: totalSold, sub: "Tickets" },
    { label: "Ticket promedio", value: formatPrice(avgRevenuePerSale), sub: "Por venta" },
  ];

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

  const customerMap: Record<string, { email: string; name: string | null; spent: number; events: number }> = {};
  (allTickets ?? []).forEach((t) => {
    if (!customerMap[t.buyer_email]) {
      customerMap[t.buyer_email] = { email: t.buyer_email, name: t.buyer_name, spent: 0, events: 0 };
    }
    customerMap[t.buyer_email].spent += t.purchase_price;
    customerMap[t.buyer_email].events += 1;
  });
  const bestCustomers = Object.values(customerMap).sort((a, b) => b.spent - a.spent).slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[#0a0a0a]/35 text-xs uppercase tracking-[0.2em] font-semibold mb-1">Panel de control</p>
          <h1 className="text-2xl font-bold text-[#0a0a0a]">Dashboard</h1>
        </div>
        <Link
          href="/organizador/eventos/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
        >
          <span>+</span> Nuevo evento
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="card-light rounded-2xl p-5"
          >
            <p className="text-[#0a0a0a]/35 text-[10px] uppercase tracking-wider mb-3">{s.label}</p>
            <p className="text-[#0a0a0a] font-bold text-2xl mb-1">{s.value}</p>
            {s.href ? (
              <Link href={s.href} className="text-[#0a0a0a]/50 text-xs hover:text-[#0a0a0a] transition-colors underline underline-offset-2">{s.sub}</Link>
            ) : (
              <p className="text-[#0a0a0a]/25 text-xs">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts chartData={chartData} />

      {/* Best customers + Attendance */}
      {bestCustomers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <div className="card-light rounded-2xl p-6">
            <h3 className="text-[#0a0a0a] font-semibold text-base mb-5">Mejores compradores</h3>
            <div className="flex flex-col gap-3">
              {bestCustomers.map((c, i) => (
                <div key={c.email} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                    style={{ background: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.12)", color: i === 0 ? "#fff" : "#0a0a0a" }}
                  >
                    {c.name?.charAt(0).toUpperCase() ?? c.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0a0a0a] text-xs font-medium truncate">{c.name ?? c.email}</p>
                    <p className="text-[#0a0a0a]/30 text-[10px] truncate">{c.events} ticket{c.events !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-[#0a0a0a] text-xs font-semibold shrink-0">{formatPrice(c.spent)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-light rounded-2xl p-6">
            <h3 className="text-[#0a0a0a] font-semibold text-base mb-5">Asistencia por evento</h3>
            <div className="flex flex-col gap-4">
              {eventsData.slice(0, 5).map((e) => {
                const sold = e.ticket_types.reduce((s: number, t: {sold_count:number}) => s + t.sold_count, 0);
                const total = e.ticket_types.reduce((s: number, t: {total_available:number}) => s + t.total_available, 0);
                const pct = total > 0 ? Math.min(100, Math.round(sold / total * 100)) : 0;
                return (
                  <div key={e.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[#0a0a0a] text-xs font-medium truncate flex-1">{e.name}</p>
                      <span className="text-[#0a0a0a]/40 text-[10px] ml-3 shrink-0">{sold} vendidos</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "#0a0a0a" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
