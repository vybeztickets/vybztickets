import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsedDays = parseInt(searchParams.get("days") ?? "30");
  const days = Math.min(Number.isNaN(parsedDays) ? 30 : parsedDays, 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();

  const { data: items } = await (admin as any)
    .from("inventory_items")
    .select("id, name, category, unit, current_stock, cost_per_unit")
    .eq("organizer_id", user.id)
    .eq("is_active", true);

  const { data: movements } = await (admin as any)
    .from("inventory_movements")
    .select("item_id, quantity_change, created_at")
    .eq("organizer_id", user.id)
    .gte("created_at", since);

  // Inventory value
  let inventoryValue = 0;
  for (const item of items ?? []) {
    if (item.cost_per_unit) inventoryValue += Number(item.current_stock) * Number(item.cost_per_unit);
  }

  // Per-item in/out
  const flowByItem: Record<string, { totalIn: number; totalOut: number }> = {};
  let totalIn = 0;
  let totalOut = 0;

  for (const m of movements ?? []) {
    const qty = Number(m.quantity_change);
    if (!flowByItem[m.item_id]) flowByItem[m.item_id] = { totalIn: 0, totalOut: 0 };
    if (qty > 0) { flowByItem[m.item_id].totalIn += qty; totalIn += qty; }
    else { flowByItem[m.item_id].totalOut += Math.abs(qty); totalOut += Math.abs(qty); }
  }

  const itemFlow = (items ?? [])
    .filter((i: any) => flowByItem[i.id])
    .map((i: any) => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      category: i.category,
      totalIn: flowByItem[i.id]?.totalIn ?? 0,
      totalOut: flowByItem[i.id]?.totalOut ?? 0,
      netChange: (flowByItem[i.id]?.totalIn ?? 0) - (flowByItem[i.id]?.totalOut ?? 0),
    }))
    .sort((a: any, b: any) => (b.totalIn + b.totalOut) - (a.totalIn + a.totalOut));

  return NextResponse.json({ days, inventoryValue, totalIn, totalOut, itemFlow });
}
