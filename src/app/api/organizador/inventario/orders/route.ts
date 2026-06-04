import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { checkRateLimit, getIP, rateLimitedResponse } from "@/lib/ratelimit";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: orders } = await (admin as any)
    .from("inventory_purchase_orders")
    .select("*")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  if (!orders?.length) return NextResponse.json({ orders: [] });

  // Fetch suppliers separately (no inline joins)
  const supplierIds = [...new Set((orders as { supplier_id: string | null }[]).filter(o => o.supplier_id).map(o => o.supplier_id as string))];
  const supplierMap: Record<string, { name: string }> = {};
  if (supplierIds.length > 0) {
    const { data: suppliers } = await (admin as any)
      .from("inventory_suppliers")
      .select("id, name")
      .in("id", supplierIds);
    for (const s of (suppliers ?? []) as { id: string; name: string }[]) {
      supplierMap[s.id] = { name: s.name };
    }
  }

  const enriched = (orders as any[]).map((o: any) => ({
    ...o,
    inventory_suppliers: o.supplier_id ? (supplierMap[o.supplier_id] ?? null) : null,
  }));

  return NextResponse.json({ orders: enriched });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("inv-order-create", getIP(request), 20, 60_000))
    return rateLimitedResponse();

  const body = await request.json();
  const { supplier_id, items, notes } = body;
  if (!items || !Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "Items are required" }, { status: 400 });

  const total_cost = items.reduce((sum: number, i: { qty: number; unit_cost: number }) => sum + (i.qty * (i.unit_cost ?? 0)), 0);
  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("inventory_purchase_orders")
    .insert({ organizer_id: user.id, supplier_id: supplier_id || null, items, total_cost, notes: notes || null, status: "draft" })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data }, { status: 201 });
}
