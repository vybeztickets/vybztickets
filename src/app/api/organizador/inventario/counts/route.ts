import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await (admin as any)
    .from("inventory_counts")
    .select("*")
    .eq("organizer_id", user.id)
    .order("started_at", { ascending: false })
    .limit(20);
  return NextResponse.json({ counts: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  const { data: items } = await (admin as any)
    .from("inventory_items")
    .select("id, name, unit, current_stock, par_level, category")
    .eq("organizer_id", user.id)
    .eq("is_active", true)
    .order("category").order("name");

  const { data: count, error } = await (admin as any)
    .from("inventory_counts")
    .insert({ organizer_id: user.id, notes: body.notes || null, counted_by_owner: user.id })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const countItems = (items ?? []).map((item: { id: string; current_stock: number }) => ({
    count_id: count.id,
    item_id: item.id,
    expected_qty: item.current_stock,
    actual_qty: null,
  }));

  if (countItems.length > 0) {
    await (admin as any).from("inventory_count_items").insert(countItems);
  }

  return NextResponse.json({ count, itemCount: countItems.length }, { status: 201 });
}
