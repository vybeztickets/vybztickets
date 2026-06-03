import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

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

  // Auto-deduct inventory for items linked with qty_per_sale > 0
  try {
    const itemIds = (items as { id: string; quantity: number }[]).map(i => i.id);
    if (itemIds.length > 0) {
      const { data: posProducts } = await (admin as any)
        .from("pos_products")
        .select("id, inventory_item_id, inventory_qty_per_sale")
        .in("id", itemIds)
        .not("inventory_item_id", "is", null)
        .gt("inventory_qty_per_sale", 0);

      const affectedItemIds: string[] = [];
      for (const pp of posProducts ?? []) {
        const soldQty = (items as { id: string; quantity: number }[]).find(i => i.id === pp.id)?.quantity ?? 1;
        const deduct = Number(pp.inventory_qty_per_sale) * soldQty;
        const { data: invItem } = await (admin as any).from("inventory_items").select("current_stock").eq("id", pp.inventory_item_id).single();
        if (!invItem) continue;
        const newStock = Math.max(0, Number(invItem.current_stock) - deduct);
        await (admin as any).from("inventory_items").update({ current_stock: newStock }).eq("id", pp.inventory_item_id);
        await (admin as any).from("inventory_movements").insert({
          organizer_id: event.organizer_id,
          item_id: pp.inventory_item_id,
          type: "sale",
          quantity_change: -deduct,
          notes: `POS sale — order ${order.id}`,
          pos_order_id: order.id,
        });
        affectedItemIds.push(pp.inventory_item_id);
      }
      if (affectedItemIds.length > 0) {
        const { checkAndNotifyLowStock } = await import("@/lib/inventory-alerts");
        checkAndNotifyLowStock(event.organizer_id, affectedItemIds).catch(() => {});
      }
    }
  } catch {}

  return NextResponse.json({ order }, { status: 201 });
}
