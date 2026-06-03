import { NextResponse } from "next/server";
import { getTeamMemberFromRequest } from "@/lib/team-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const member = await getTeamMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: items } = await (admin as any)
    .from("inventory_items")
    .select("id, name, category, unit, current_stock, par_level, cost_per_unit")
    .eq("organizer_id", member.organizer_id)
    .eq("is_active", true)
    .order("category").order("name");

  return NextResponse.json({ items: items ?? [], role: member.role });
}

export async function POST(request: Request) {
  const member = await getTeamMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  const admin = createAdminClient();

  if (action === "empty_bottle") {
    const { item_id, quantity } = body;
    if (!item_id || !quantity) return NextResponse.json({ error: "item_id and quantity required" }, { status: 400 });

    const { data: item } = await (admin as any).from("inventory_items").select("id, current_stock").eq("id", item_id).eq("organizer_id", member.organizer_id).single();
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const newStock = Math.max(0, Number(item.current_stock) - Number(quantity));
    await (admin as any).from("inventory_items").update({ current_stock: newStock }).eq("id", item_id);
    await (admin as any).from("inventory_movements").insert({
      organizer_id: member.organizer_id,
      item_id,
      type: "empty_bottle",
      quantity_change: -Number(quantity),
      notes: `Marked empty by ${member.name ?? member.email}`,
      team_member_id: member.id,
    });
    return NextResponse.json({ success: true, new_stock: newStock });
  }

  if (action === "start_count") {
    const { data: items } = await (admin as any)
      .from("inventory_items")
      .select("id, current_stock")
      .eq("organizer_id", member.organizer_id)
      .eq("is_active", true);

    const { data: count, error } = await (admin as any)
      .from("inventory_counts")
      .insert({ organizer_id: member.organizer_id, counted_by_team_member: member.id })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const countItems = (items ?? []).map((item: { id: string; current_stock: number }) => ({
      count_id: count.id, item_id: item.id, expected_qty: item.current_stock, actual_qty: null,
    }));
    if (countItems.length > 0) await (admin as any).from("inventory_count_items").insert(countItems);
    return NextResponse.json({ count_id: count.id }, { status: 201 });
  }

  if (action === "submit_count") {
    const { count_id, updates } = body;
    if (!count_id || !Array.isArray(updates)) return NextResponse.json({ error: "count_id and updates required" }, { status: 400 });

    const { data: count } = await (admin as any).from("inventory_counts").select("organizer_id").eq("id", count_id).single();
    if (!count || count.organizer_id !== member.organizer_id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    for (const upd of updates as { count_item_id: string; actual_qty: number }[]) {
      await (admin as any).from("inventory_count_items").update({ actual_qty: upd.actual_qty }).eq("id", upd.count_item_id).eq("count_id", count_id);
    }

    const { data: countItems } = await (admin as any).from("inventory_count_items").select("*").eq("count_id", count_id);
    for (const ci of countItems ?? []) {
      if (ci.actual_qty === null) continue;
      const variance = Number(ci.actual_qty) - Number(ci.expected_qty);
      await (admin as any).from("inventory_items").update({ current_stock: ci.actual_qty }).eq("id", ci.item_id);
      if (variance !== 0) {
        await (admin as any).from("inventory_movements").insert({
          organizer_id: member.organizer_id, item_id: ci.item_id, type: "count",
          quantity_change: variance, notes: `Physical count by ${member.name ?? member.email}`,
          team_member_id: member.id,
        });
      }
    }
    await (admin as any).from("inventory_counts").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", count_id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
