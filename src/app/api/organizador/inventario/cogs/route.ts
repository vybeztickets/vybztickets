import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "30"), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();

  // All active items for inventory value
  const { data: items } = await (admin as any)
    .from("inventory_items")
    .select("id, name, category, current_stock, cost_per_unit")
    .eq("organizer_id", user.id)
    .eq("is_active", true);

  // Movements that consumed stock
  const { data: movements } = await (admin as any)
    .from("inventory_movements")
    .select("item_id, type, quantity_change, unit_cost, created_at")
    .eq("organizer_id", user.id)
    .in("type", ["sale", "empty_bottle", "waste"])
    .lt("quantity_change", 0)
    .gte("created_at", since);

  const itemMap = Object.fromEntries((items ?? []).map((i: any) => [i.id, i]));

  // Inventory value = current stock × cost per unit
  let inventoryValue = 0;
  const valueByCategory: Record<string, number> = {};
  for (const item of items ?? []) {
    if (!item.cost_per_unit) continue;
    const val = Number(item.current_stock) * Number(item.cost_per_unit);
    inventoryValue += val;
    valueByCategory[item.category] = (valueByCategory[item.category] ?? 0) + val;
  }

  // COGS = consumed qty × cost per unit (from movement or item default)
  let cogs = 0;
  const cogsByCategory: Record<string, number> = {};
  const cogsByItem: Record<string, { name: string; category: string; qty: number; cost: number }> = {};

  for (const m of movements ?? []) {
    const item = itemMap[m.item_id];
    const costPerUnit = m.unit_cost ?? item?.cost_per_unit ?? 0;
    if (!costPerUnit) continue;
    const consumed = Math.abs(Number(m.quantity_change));
    const cost = consumed * Number(costPerUnit);
    const category = item?.category ?? "other";
    cogs += cost;
    cogsByCategory[category] = (cogsByCategory[category] ?? 0) + cost;
    if (!cogsByItem[m.item_id]) {
      cogsByItem[m.item_id] = { name: item?.name ?? m.item_id, category, qty: 0, cost: 0 };
    }
    cogsByItem[m.item_id].qty += consumed;
    cogsByItem[m.item_id].cost += cost;
  }

  // Bar revenue in same period for pour cost %
  const { data: posOrders } = await (admin as any)
    .from("pos_orders")
    .select("total")
    .eq("organizer_id", user.id)
    .gte("created_at", since);

  const barRevenue = (posOrders ?? []).reduce((s: number, o: any) => s + Number(o.total), 0);
  const pourCostPct = barRevenue > 0 ? (cogs / barRevenue) * 100 : null;

  const topConsumed = Object.values(cogsByItem)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  return NextResponse.json({
    days,
    inventoryValue,
    valueByCategory,
    cogs,
    cogsByCategory,
    topConsumed,
    barRevenue,
    pourCostPct,
  });
}
