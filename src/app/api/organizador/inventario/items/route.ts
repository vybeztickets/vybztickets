import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: items, error } = await (admin as any)
    .from("inventory_items")
    .select("*")
    .eq("organizer_id", user.id)
    .eq("is_active", true)
    .order("category")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!items?.length) return NextResponse.json({ items: [] });

  // Fetch suppliers separately (no inline joins)
  const supplierIds = [...new Set((items as { supplier_id: string | null }[]).filter(i => i.supplier_id).map(i => i.supplier_id as string))];
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

  const enriched = (items as any[]).map((item: any) => ({
    ...item,
    inventory_suppliers: item.supplier_id ? (supplierMap[item.supplier_id] ?? null) : null,
  }));

  return NextResponse.json({ items: enriched });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, category, unit, unit_size_ml, par_level, cost_per_unit, supplier_id, barcode, full_bottle_weight_g, empty_bottle_weight_g } = body;
  if (!name || !category || !unit) return NextResponse.json({ error: "Name, category, and unit are required" }, { status: 400 });

  const admin = createAdminClient();
  const { max_stock } = body;
  const { data, error } = await (admin as any)
    .from("inventory_items")
    .insert({ organizer_id: user.id, name, category, unit, unit_size_ml: unit_size_ml || null, par_level: par_level ?? 0, max_stock: max_stock || null, cost_per_unit: cost_per_unit || null, supplier_id: supplier_id || null, barcode: barcode || null, full_bottle_weight_g: full_bottle_weight_g || null, empty_bottle_weight_g: empty_bottle_weight_g || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
