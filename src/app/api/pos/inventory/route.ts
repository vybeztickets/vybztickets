import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function validatePosSession(code: string, eventId: string) {
  const admin = createAdminClient();
  const { data: session } = await (admin as any)
    .from("scan_sessions")
    .select("event_id, expires_at, is_active")
    .eq("code", code.toUpperCase())
    .eq("type", "pos")
    .eq("is_active", true)
    .single();

  if (!session || session.event_id !== eventId) return null;
  if (session.expires_at && new Date(session.expires_at) < new Date()) return null;

  const { data: event } = await (admin as any).from("events").select("organizer_id").eq("id", eventId).single();
  return event?.organizer_id ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") ?? "";
  const eventId = searchParams.get("eventId") ?? "";

  const organizerId = await validatePosSession(code, eventId);
  if (!organizerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const admin = createAdminClient();
  const { data: items } = await (admin as any)
    .from("inventory_items")
    .select("id, name, category, unit, current_stock, par_level")
    .eq("organizer_id", organizerId)
    .eq("is_active", true)
    .in("category", ["spirits", "wine", "other"])
    .order("name");

  return NextResponse.json({ items: items ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { code, eventId, item_id, quantity } = body;

  if (!code || !eventId || !item_id || !quantity) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const organizerId = await validatePosSession(code, eventId);
  if (!organizerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const admin = createAdminClient();
  const { data: item } = await (admin as any).from("inventory_items").select("id, current_stock").eq("id", item_id).eq("organizer_id", organizerId).single();
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const newStock = Math.max(0, Number(item.current_stock) - Number(quantity));
  await (admin as any).from("inventory_items").update({ current_stock: newStock }).eq("id", item_id);
  await (admin as any).from("inventory_movements").insert({
    organizer_id: organizerId,
    item_id,
    type: "empty_bottle",
    quantity_change: -Number(quantity),
    notes: `Marked empty via POS`,
  });

  const { checkAndNotifyLowStock } = await import("@/lib/inventory-alerts");
  checkAndNotifyLowStock(organizerId, [item_id]).catch(() => {});

  return NextResponse.json({ success: true, new_stock: newStock });
}
