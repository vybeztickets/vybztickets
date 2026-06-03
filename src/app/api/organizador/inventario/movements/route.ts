import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const item_id = searchParams.get("item_id");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

  const admin = createAdminClient();
  let query = (admin as any)
    .from("inventory_movements")
    .select("*, inventory_items(name, unit)")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (item_id) query = query.eq("item_id", item_id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ movements: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { item_id, type, quantity_change, notes, unit_cost } = body;
  if (!item_id || !type || quantity_change === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const VALID_TYPES = ["purchase", "waste", "adjustment", "empty_bottle"];
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const admin = createAdminClient();
  const { data: item } = await (admin as any).from("inventory_items").select("id, current_stock").eq("id", item_id).eq("organizer_id", user.id).single();
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const newStock = Number(item.current_stock) + Number(quantity_change);
  await (admin as any).from("inventory_items").update({ current_stock: newStock }).eq("id", item_id);
  const { data: movement, error } = await (admin as any)
    .from("inventory_movements")
    .insert({ organizer_id: user.id, item_id, type, quantity_change: Number(quantity_change), notes: notes || null, unit_cost: unit_cost || null, created_by: user.id })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { checkAndNotifyLowStock } = await import("@/lib/inventory-alerts");
  checkAndNotifyLowStock(user.id, [item_id]).catch(() => {});

  return NextResponse.json({ movement }, { status: 201 });
}
