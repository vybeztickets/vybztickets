import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type MonthData = {
  month: string;
  label: string;
  beginning_inventory: number;
  purchases: number;
  ending_inventory: number;
  sales: number;
  pour_cost_pct: number | null;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Build last 6 months list (YYYY-MM), most recent first
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  // Fetch all snapshots for this organizer
  const { data: snapshots } = await (admin as any)
    .from("inventory_monthly_snapshots")
    .select("month, inventory_value")
    .eq("organizer_id", user.id);

  const snapshotMap: Record<string, number> = {};
  for (const s of (snapshots ?? []) as { month: string; inventory_value: number }[]) {
    snapshotMap[s.month] = Number(s.inventory_value);
  }

  // Fetch inventory items with cost for current value (used as current month's ending)
  const { data: items } = await (admin as any)
    .from("inventory_items")
    .select("id, current_stock, cost_per_unit")
    .eq("organizer_id", user.id)
    .eq("is_active", true);

  const currentInventoryValue = ((items ?? []) as { current_stock: number; cost_per_unit: number | null }[]).reduce(
    (sum, i) => sum + Number(i.current_stock) * Number(i.cost_per_unit ?? 0),
    0
  );

  const currentMonth = months[0];

  // Fetch all movements grouped by month (purchase type = positive, cost bearing)
  // We need movements from the last 7 months to cover the full range
  const earliest = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
  const { data: movements } = await (admin as any)
    .from("inventory_movements")
    .select("item_id, type, quantity_change, created_at")
    .eq("organizer_id", user.id)
    .gte("created_at", earliest);

  // Build item cost map
  const costMap: Record<string, number> = {};
  for (const i of (items ?? []) as { id: string; cost_per_unit: number | null }[]) {
    costMap[i.id] = Number(i.cost_per_unit ?? 0);
  }

  // Aggregate purchases per month
  const purchasesByMonth: Record<string, number> = {};
  for (const m of (movements ?? []) as { item_id: string; type: string; quantity_change: number; created_at: string }[]) {
    if (m.type !== "purchase" || Number(m.quantity_change) <= 0) continue;
    const d = new Date(m.created_at);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!purchasesByMonth[mKey]) purchasesByMonth[mKey] = 0;
    purchasesByMonth[mKey] += Number(m.quantity_change) * (costMap[m.item_id] ?? 0);
  }

  // Fetch POS sales per month — try pos_orders table
  const { data: posOrders } = await (admin as any)
    .from("pos_orders")
    .select("total, created_at")
    .eq("organizer_id", user.id)
    .gte("created_at", earliest)
    .eq("status", "completed");

  const salesByMonth: Record<string, number> = {};
  for (const o of (posOrders ?? []) as { total: number; created_at: string }[]) {
    const d = new Date(o.created_at);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!salesByMonth[mKey]) salesByMonth[mKey] = 0;
    salesByMonth[mKey] += Number(o.total ?? 0);
  }

  const MONTH_LABELS: Record<string, string> = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
  };

  const result: MonthData[] = months.map((month, idx) => {
    const [yr, mo] = month.split("-");
    const label = `${MONTH_LABELS[mo]} ${yr}`;

    // Ending = snapshot for this month if exists, else current value if current month
    const ending = snapshotMap[month] ?? (idx === 0 ? currentInventoryValue : 0);

    // Beginning = ending of previous month (which is months[idx+1])
    const prevMonth = months[idx + 1];
    const beginning = prevMonth !== undefined
      ? (snapshotMap[prevMonth] ?? 0)
      : 0;

    const purchases = purchasesByMonth[month] ?? 0;
    const sales = salesByMonth[month] ?? 0;

    // Pour cost = (Beginning + Purchases - Ending) / Sales * 100
    const cogs = beginning + purchases - ending;
    const pour_cost_pct = sales > 0 ? (cogs / sales) * 100 : null;

    return { month, label, beginning_inventory: beginning, purchases, ending_inventory: ending, sales, pour_cost_pct };
  });

  return NextResponse.json({ months: result });
}
