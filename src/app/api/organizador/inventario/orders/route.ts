import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await (admin as any)
    .from("inventory_purchase_orders")
    .select("*, inventory_suppliers(name)")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ orders: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
