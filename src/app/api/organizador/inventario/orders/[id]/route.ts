import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type OrderLine = { item_id: string; qty: number; unit_cost?: number; received_qty?: number; line_notes?: string };

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { data: order } = await (admin as any)
    .from("inventory_purchase_orders")
    .select("*")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch supplier separately (no inline joins)
  let inventory_suppliers = null;
  if (order.supplier_id) {
    const { data: supplier } = await (admin as any)
      .from("inventory_suppliers")
      .select("id, name, contact_name, email, phone")
      .eq("id", order.supplier_id)
      .single();
    inventory_suppliers = supplier ?? null;
  }

  return NextResponse.json({ order: { ...order, inventory_suppliers } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const { data: order } = await (admin as any)
    .from("inventory_purchase_orders")
    .select("id, status, items")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Mark as sent ──────────────────────────────────────────────────────────
  if (body.status === "sent" && order.status === "draft") {
    await (admin as any).from("inventory_purchase_orders")
      .update({ status: "sent" })
      .eq("id", id);

  // ── Cancel ────────────────────────────────────────────────────────────────
  } else if (body.status === "cancelled") {
    await (admin as any).from("inventory_purchase_orders")
      .update({ status: "cancelled" })
      .eq("id", id);

  // ── Confirm receipt (with per-line received quantities) ───────────────────
  } else if (body.status === "received" && order.status !== "received") {
    const lines: OrderLine[] = body.items ?? order.items;

    for (const line of lines) {
      const qtyReceived = line.received_qty ?? line.qty;
      if (qtyReceived <= 0) continue;

      const { data: inv } = await (admin as any)
        .from("inventory_items")
        .select("current_stock")
        .eq("id", line.item_id)
        .single();
      if (!inv) continue;

      const newStock = Number(inv.current_stock) + Number(qtyReceived);
      await (admin as any).from("inventory_items").update({ current_stock: newStock }).eq("id", line.item_id);
      await (admin as any).from("inventory_movements").insert({
        organizer_id: user.id,
        item_id: line.item_id,
        type: "purchase",
        quantity_change: Number(qtyReceived),
        unit_cost: line.unit_cost || null,
        notes: `PO received${line.received_qty != null && line.received_qty !== line.qty ? ` (ordered ${line.qty}, received ${qtyReceived})` : ""}: ${id.slice(0, 8)}`,
        created_by: user.id,
      });
    }

    await (admin as any).from("inventory_purchase_orders").update({
      status: "received",
      received_at: new Date().toISOString(),
      items: lines,
    }).eq("id", id);

  // ── Edit draft (items, notes, supplier) ───────────────────────────────────
  } else if (order.status === "draft") {
    const updates: Record<string, unknown> = {};
    if (body.items) {
      updates.items = body.items;
      updates.total_cost = (body.items as OrderLine[]).reduce((s, l) => s + (l.qty * (l.unit_cost ?? 0)), 0);
    }
    if ("notes" in body) updates.notes = body.notes;
    if ("supplier_id" in body) updates.supplier_id = body.supplier_id;
    if (Object.keys(updates).length > 0) {
      await (admin as any).from("inventory_purchase_orders").update(updates).eq("id", id);
    }
  }

  return NextResponse.json({ success: true });
}
