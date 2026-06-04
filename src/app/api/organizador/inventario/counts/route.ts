import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { checkRateLimit, getIP, rateLimitedResponse } from "@/lib/ratelimit";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: counts } = await (admin as any)
    .from("inventory_counts")
    .select("*")
    .eq("organizer_id", user.id)
    .order("started_at", { ascending: false })
    .limit(20);

  if (!counts?.length) return NextResponse.json({ counts: [] });

  const countIds = counts.map((c: { id: string }) => c.id);
  const { data: countItems } = await (admin as any)
    .from("inventory_count_items")
    .select("count_id, expected_qty, actual_qty")
    .in("count_id", countIds);

  const varianceMap: Record<string, { total: number; withVariance: number; netVariance: number }> = {};
  for (const item of (countItems ?? [])) {
    if (!varianceMap[item.count_id]) varianceMap[item.count_id] = { total: 0, withVariance: 0, netVariance: 0 };
    const v = varianceMap[item.count_id];
    v.total++;
    if (item.actual_qty != null && item.actual_qty !== item.expected_qty) {
      v.withVariance++;
      v.netVariance += (item.actual_qty - item.expected_qty);
    }
  }

  const countsWithVariance = counts.map((c: { id: string }) => ({ ...c, variance_summary: varianceMap[c.id] ?? null }));
  return NextResponse.json({ counts: countsWithVariance });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("inv-count-create", getIP(request), 10, 60_000))
    return rateLimitedResponse();

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
