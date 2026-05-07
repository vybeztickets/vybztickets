import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") ?? "20")));

  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let query = (admin as any)
    .from("pos_orders")
    .select("id, total, items, payment_method, created_at, event_id")
    .eq("organizer_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (eventId) query = query.eq("event_id", eventId);

  const { data: orders, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allOrders = (orders ?? []) as {
    id: string; total: number; items: { name: string; quantity: number; subtotal: number }[];
    payment_method: string; created_at: string; event_id: string;
  }[];

  const totalRevenue = allOrders.reduce((s, o) => s + (o.total ?? 0), 0);

  // Product breakdown
  const productMap: Record<string, { name: string; units: number; revenue: number }> = {};
  for (const order of allOrders) {
    for (const item of (order.items ?? [])) {
      if (!productMap[item.name]) productMap[item.name] = { name: item.name, units: 0, revenue: 0 };
      productMap[item.name].units += item.quantity;
      productMap[item.name].revenue += item.subtotal;
    }
  }
  const productBreakdown = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

  // Daily chart
  const dailyData: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dailyData[d.toISOString().slice(0, 10)] = 0;
  }
  for (const order of allOrders) {
    const key = order.created_at.slice(0, 10);
    if (key in dailyData) dailyData[key] += order.total ?? 0;
  }
  const chart = Object.entries(dailyData).map(([date, revenue]) => ({ date, revenue }));

  // Avg ticket per person: total bar revenue / checked-in attendees
  const eventIds = [...new Set(allOrders.map(o => o.event_id).filter(Boolean))];
  let checkedIn = 0;
  if (eventIds.length > 0) {
    const { count } = await admin.from("tickets")
      .select("id", { count: "exact", head: true })
      .in("event_id", eventIds)
      .eq("status", "used");
    checkedIn = count ?? 0;
  }

  const { data: events } = await admin.from("events")
    .select("id, name, date")
    .eq("organizer_id", user.id)
    .order("date", { ascending: false });

  return NextResponse.json({
    totalRevenue,
    totalOrders: allOrders.length,
    avgOrderValue: allOrders.length > 0 ? Math.round((totalRevenue / allOrders.length) * 100) / 100 : 0,
    avgTicketPerPerson: checkedIn > 0 ? Math.round((totalRevenue / checkedIn) * 100) / 100 : 0,
    checkedIn,
    productBreakdown,
    chart,
    events: events ?? [],
  });
}
