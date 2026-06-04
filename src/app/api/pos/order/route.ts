import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const OZ_ML = 29.5735;
const DASH_ML = 0.625;
const SPLASH_ML = 5;

function ingredientToBottles(qty: number, unit: string, unitSizeMl: number | null): number {
  if (!unitSizeMl || unitSizeMl <= 0) return 0;
  let ml = 0;
  if (unit === "oz") ml = qty * OZ_ML;
  else if (unit === "ml") ml = qty;
  else if (unit === "dash") ml = qty * DASH_ML;
  else if (unit === "splash") ml = qty * SPLASH_ML;
  else return 0; // "each" handled separately
  return ml / unitSizeMl;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { code, eventId, items, total, paymentMethod } = body;

  if (!code || !eventId || !items || !paymentMethod)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: "Order must have items" }, { status: 400 });

  const admin = createAdminClient();

  const { data: session } = await (admin as any)
    .from("scan_sessions")
    .select("id, type, event_id, expires_at, is_active")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (!session || session.type !== "pos" || session.event_id !== eventId)
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  if (session.expires_at && new Date(session.expires_at) < new Date())
    return NextResponse.json({ error: "Code expired" }, { status: 401 });

  const { data: event } = await (admin as any).from("events").select("organizer_id, currency").eq("id", eventId).single();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data: order, error } = await (admin as any)
    .from("pos_orders")
    .insert({
      session_code: code.toUpperCase(),
      event_id: eventId,
      organizer_id: event.organizer_id,
      items,
      total,
      currency: (event as any).currency ?? "USD",
      payment_method: paymentMethod,
      status: "paid",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Auto-deduct inventory ─────────────────────────────────────────────────
  try {
    const soldItems = items as { id: string; quantity: number }[];
    const productIds = soldItems.map(i => i.id);

    // Fetch pos_products with ingredients + simple link
    const { data: posProducts } = await (admin as any)
      .from("pos_products")
      .select("id, inventory_item_id, inventory_qty_per_sale, ingredients")
      .in("id", productIds);

    if (!posProducts?.length) {
      return NextResponse.json({ order }, { status: 201 });
    }

    // Collect all inventory item ids we need
    const allInventoryItemIds = new Set<string>();
    for (const pp of posProducts) {
      if (pp.inventory_item_id) allInventoryItemIds.add(pp.inventory_item_id);
      for (const ing of (pp.ingredients ?? [])) {
        if (ing.item_id) allInventoryItemIds.add(ing.item_id);
      }
    }

    if (allInventoryItemIds.size === 0) {
      return NextResponse.json({ order }, { status: 201 });
    }

    // Fetch inventory items for unit_size_ml and current_stock
    const { data: invItems } = await (admin as any)
      .from("inventory_items")
      .select("id, current_stock, unit_size_ml, unit")
      .in("id", Array.from(allInventoryItemIds));

    const invMap = new Map<string, { id: string; current_stock: number; unit_size_ml: number | null; unit: string }>(
      (invItems ?? []).map((i: any) => [i.id, i])
    );

    // Build deduction map: item_id → total bottles to deduct
    const deductions = new Map<string, number>();

    for (const pp of posProducts) {
      const soldQty = soldItems.find(i => i.id === pp.id)?.quantity ?? 1;

      // Simple item link
      if (pp.inventory_item_id && Number(pp.inventory_qty_per_sale) > 0) {
        const current = deductions.get(pp.inventory_item_id) ?? 0;
        deductions.set(pp.inventory_item_id, current + Number(pp.inventory_qty_per_sale) * soldQty);
      }

      // Recipe ingredients
      for (const ing of (pp.ingredients ?? [])) {
        if (!ing.item_id) continue;
        const invItem = invMap.get(ing.item_id);
        let deductQty = 0;

        if (ing.unit === "each") {
          deductQty = ing.qty * soldQty;
        } else {
          deductQty = ingredientToBottles(ing.qty * soldQty, ing.unit, invItem?.unit_size_ml ?? null);
        }

        if (deductQty > 0) {
          const current = deductions.get(ing.item_id) ?? 0;
          deductions.set(ing.item_id, current + deductQty);
        }
      }
    }

    // Apply deductions + create movements
    const affectedIds: string[] = [];
    const movementInserts: any[] = [];

    for (const [itemId, deductQty] of deductions.entries()) {
      const invItem = invMap.get(itemId);
      if (!invItem) continue;
      const newStock = Math.max(0, Number(invItem.current_stock) - deductQty);
      await (admin as any).from("inventory_items").update({ current_stock: newStock }).eq("id", itemId);
      movementInserts.push({
        organizer_id: event.organizer_id,
        item_id: itemId,
        type: "sale",
        quantity_change: -deductQty,
        notes: `POS sale — order ${order.id}`,
        pos_order_id: order.id,
      });
      affectedIds.push(itemId);
    }

    if (movementInserts.length > 0) {
      await (admin as any).from("inventory_movements").insert(movementInserts);
    }

    if (affectedIds.length > 0) {
      const { checkAndNotifyLowStock } = await import("@/lib/inventory-alerts");
      checkAndNotifyLowStock(event.organizer_id, affectedIds).catch(() => {});
    }
  } catch {}

  return NextResponse.json({ order }, { status: 201 });
}
