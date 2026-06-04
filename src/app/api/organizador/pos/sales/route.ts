import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const ML_PER_OZ = 29.5735;

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
    id: string; total: number; items: { product_id?: string; name: string; qty?: number; quantity?: number; price?: number; subtotal: number }[];
    payment_method: string; created_at: string; event_id: string;
  }[];

  const totalRevenue = allOrders.reduce((s, o) => s + (o.total ?? 0), 0);

  // ── Product breakdown ──────────────────────────────────────────────────
  const productMap: Record<string, { name: string; units: number; revenue: number; productId?: string }> = {};
  for (const order of allOrders) {
    for (const item of (order.items ?? [])) {
      const qty = item.qty ?? item.quantity ?? 1;
      const key = item.product_id ?? item.name;
      if (!productMap[key]) productMap[key] = { name: item.name, units: 0, revenue: 0, productId: item.product_id };
      productMap[key].units += qty;
      productMap[key].revenue += item.subtotal ?? 0;
    }
  }
  const productBreakdown = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

  // ── Top by qty ────────────────────────────────────────────────────────
  const topByQty = Object.values(productMap)
    .map(p => ({ name: p.name, qty: p.units, revenue: p.revenue }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // ── Top by margin (requires recipe costs) ────────────────────────────
  const { data: posProducts } = await (admin as any)
    .from("pos_products")
    .select("id, name, price, ingredients, product_category")
    .eq("organizer_id", user.id);

  const posProductList = (posProducts ?? []) as {
    id: string; name: string; price: number;
    ingredients: { item_id: string; qty: number; unit: string }[] | null;
    product_category: string | null;
  }[];

  // Collect all inventory item ids referenced in recipes
  const inventoryItemIds = new Set<string>();
  for (const p of posProductList) {
    for (const ing of (p.ingredients ?? [])) {
      if (ing.item_id) inventoryItemIds.add(ing.item_id);
    }
  }

  let inventoryItemMap: Record<string, { cost_per_unit: number; unit_size_ml: number | null; unit: string }> = {};
  if (inventoryItemIds.size > 0) {
    const { data: invItems } = await (admin as any)
      .from("inventory_items")
      .select("id, cost_per_unit, unit_size_ml, unit")
      .in("id", [...inventoryItemIds]);
    for (const inv of (invItems ?? []) as { id: string; cost_per_unit: number; unit_size_ml: number | null; unit: string }[]) {
      inventoryItemMap[inv.id] = { cost_per_unit: inv.cost_per_unit ?? 0, unit_size_ml: inv.unit_size_ml ?? null, unit: inv.unit };
    }
  }

  // Build a product name→recipe cost map
  function calcIngredientCost(
    ingredients: { item_id: string; qty: number; unit: string }[] | null
  ): number | null {
    if (!ingredients || ingredients.length === 0) return null;
    let total = 0;
    let hasData = false;
    for (const ing of ingredients) {
      const inv = inventoryItemMap[ing.item_id];
      if (!inv) continue;
      hasData = true;
      const costPerUnit = inv.cost_per_unit;
      let costForIng = 0;
      if (ing.unit === "oz" || ing.unit === "ml" || ing.unit === "dash" || ing.unit === "splash") {
        // Convert everything to oz
        let qtyOz = ing.qty;
        if (ing.unit === "ml") qtyOz = ing.qty / ML_PER_OZ;
        else if (ing.unit === "dash") qtyOz = ing.qty * 0.03125; // ~1/32 oz
        else if (ing.unit === "splash") qtyOz = ing.qty * 0.125; // ~1/8 oz

        // cost_per_oz = cost_per_unit / (unit_size_ml / ML_PER_OZ)
        if (inv.unit_size_ml && inv.unit_size_ml > 0) {
          const bottleSizeOz = inv.unit_size_ml / ML_PER_OZ;
          const costPerOz = costPerUnit / bottleSizeOz;
          costForIng = qtyOz * costPerOz;
        } else {
          // fallback: treat cost_per_unit as cost per oz
          costForIng = qtyOz * costPerUnit;
        }
      } else {
        // "each" — cost per unit directly
        costForIng = ing.qty * costPerUnit;
      }
      total += costForIng;
    }
    return hasData ? total : null;
  }

  // Build map: product name → cost per sale
  const productCostMap: Record<string, number | null> = {};
  for (const p of posProductList) {
    productCostMap[p.name] = calcIngredientCost(p.ingredients ?? null);
  }

  const topByMargin = Object.values(productMap)
    .map(p => {
      const costPerUnit = productCostMap[p.name] ?? null;
      if (costPerUnit === null) {
        return { name: p.name, qty: p.units, revenue: p.revenue, cost: null, profit: null, marginPct: null };
      }
      const totalCost = costPerUnit * p.units;
      const profit = p.revenue - totalCost;
      const marginPct = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
      return { name: p.name, qty: p.units, revenue: p.revenue, cost: totalCost, profit, marginPct };
    })
    .sort((a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity))
    .slice(0, 10);

  // ── Daily chart ───────────────────────────────────────────────────────
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

  // ── Avg ticket per person ─────────────────────────────────────────────
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
    topByQty,
    topByMargin,
  });
}
