import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: count } = await (admin as any).from("inventory_counts").select("*").eq("id", id).eq("organizer_id", user.id).single();
  if (!count) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: countItems } = await (admin as any)
    .from("inventory_count_items")
    .select("*, inventory_items(name, unit, category)")
    .eq("count_id", id)
    .order("inventory_items(category)").order("inventory_items(name)");

  return NextResponse.json({ count, items: countItems ?? [] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const { data: count } = await (admin as any).from("inventory_counts").select("id, organizer_id, status").eq("id", id).eq("organizer_id", user.id).single();
  if (!count) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.item_updates && Array.isArray(body.item_updates)) {
    for (const upd of body.item_updates as { count_item_id: string; actual_qty: number }[]) {
      await (admin as any).from("inventory_count_items").update({ actual_qty: upd.actual_qty }).eq("id", upd.count_item_id).eq("count_id", id);
    }
  }

  if (body.status === "completed") {
    const { data: countItems } = await (admin as any).from("inventory_count_items").select("*").eq("count_id", id);
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
    }
    await (admin as any).from("inventory_counts").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
  }

  return NextResponse.json({ success: true });
}
