import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/validate";
import { checkRateLimit, getIP, rateLimitedResponse } from "@/lib/ratelimit";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const admin = createAdminClient();

  const { data: count } = await (admin as any).from("inventory_counts").select("*").eq("id", id).eq("organizer_id", user.id).single();
  if (!count) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch count items separately (no inline joins as per project convention)
  const { data: countItems } = await (admin as any)
    .from("inventory_count_items")
    .select("*")
    .eq("count_id", id);

  if (!countItems?.length) return NextResponse.json({ count, items: [] });

  // Fetch inventory items for these count items to get names, units, categories, and bottle weights
  const itemIds = [...new Set((countItems as { item_id: string }[]).map(ci => ci.item_id))];
  const { data: inventoryItems } = await (admin as any)
    .from("inventory_items")
    .select("id, name, unit, category, full_bottle_weight_g, empty_bottle_weight_g")
    .in("id", itemIds);

  const itemMap = Object.fromEntries(((inventoryItems ?? []) as any[]).map((i: any) => [i.id, i]));

  // Sort by category then name
  const categoryOrder = ["botellas", "cervezas", "vino", "seltzers", "sin_alcohol", "shots", "food", "other"];
  const enriched = ((countItems ?? []) as any[]).map((ci: any) => {
    const inv = itemMap[ci.item_id];
    return {
      ...ci,
      inventory_items: inv
        ? { name: inv.name, unit: inv.unit, category: inv.category, full_bottle_weight_g: inv.full_bottle_weight_g ?? null, empty_bottle_weight_g: inv.empty_bottle_weight_g ?? null }
        : null,
    };
  }).sort((a: any, b: any) => {
    const catA = categoryOrder.indexOf(a.inventory_items?.category ?? "other");
    const catB = categoryOrder.indexOf(b.inventory_items?.category ?? "other");
    if (catA !== catB) return catA - catB;
    return (a.inventory_items?.name ?? "").localeCompare(b.inventory_items?.name ?? "");
  });

  return NextResponse.json({ count, items: enriched });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("inv-count-patch", getIP(request), 120, 60_000))
    return rateLimitedResponse();

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const body = await request.json();
  const admin = createAdminClient();

  const { data: count } = await (admin as any).from("inventory_counts").select("id, organizer_id, status").eq("id", id).eq("organizer_id", user.id).single();
  if (!count) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.item_updates && Array.isArray(body.item_updates)) {
    for (const upd of body.item_updates as { count_item_id: string; actual_qty: number; partial_weight_g?: number | null }[]) {
      // Validate count_item_id and actual_qty before touching the DB
      if (!isValidUUID(upd.count_item_id)) continue;
      const actualQty = Number(upd.actual_qty);
      if (!Number.isFinite(actualQty) || actualQty < 0) continue;
      const updatePayload: Record<string, unknown> = { actual_qty: actualQty };
      if (upd.partial_weight_g !== undefined) {
        const pw = upd.partial_weight_g === null ? null : Number(upd.partial_weight_g);
        updatePayload.partial_weight_g = (pw === null || Number.isFinite(pw)) ? pw : null;
      }
      await (admin as any).from("inventory_count_items").update(updatePayload).eq("id", upd.count_item_id).eq("count_id", id);
    }
  }

  if (body.status === "completed") {
    const { data: countItems } = await (admin as any).from("inventory_count_items").select("*").eq("count_id", id);
    let inventoryValue = 0;

    // Fetch all item costs for snapshot
    const itemIds = [...new Set(((countItems ?? []) as any[]).map((ci: any) => ci.item_id))];
    const { data: invItems } = await (admin as any)
      .from("inventory_items")
      .select("id, cost_per_unit")
      .in("id", itemIds);
    const costMap = Object.fromEntries(((invItems ?? []) as any[]).map((i: any) => [i.id, Number(i.cost_per_unit ?? 0)]));

    for (const ci of countItems ?? []) {
      if (ci.actual_qty === null || ci.actual_qty === undefined) continue;
      const variance = Number(ci.actual_qty) - Number(ci.expected_qty);
      await (admin as any).from("inventory_items").update({ current_stock: ci.actual_qty }).eq("id", ci.item_id);
      if (variance !== 0) {
        await (admin as any).from("inventory_movements").insert({
          organizer_id: user.id,
          item_id: ci.item_id,
          type: "count",
          quantity_change: variance,
          notes: `Physical count #${id.slice(0, 8)}`,
          created_by: user.id,
        });
      }
      inventoryValue += Number(ci.actual_qty) * (costMap[ci.item_id] ?? 0);
    }

    await (admin as any).from("inventory_counts").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);

    // Upsert monthly snapshot
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    await (admin as any).from("inventory_monthly_snapshots").upsert(
      { organizer_id: user.id, month, inventory_value: inventoryValue },
      { onConflict: "organizer_id,month" }
    );
  }

  return NextResponse.json({ success: true });
}
