import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("pos_products")
    .select("*")
    .eq("organizer_id", user.id)
    .order("category")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    name,
    price,
    category = "other",
    currency = "USD",
    subcategory = null,
    has_mixer = false,
    mixers = [],
    chief_product_id = null,
    product_type = null,
    product_category = null,
    ingredients = [],
    inventory_item_id = null,
    inventory_qty_per_sale = null,
  } = body;

  if (!name || typeof name !== "string" || !name.trim())
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (typeof price !== "number" || price < 0)
    return NextResponse.json({ error: "Valid price required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("pos_products")
    .insert({
      organizer_id: user.id,
      name: name.trim(),
      price,
      category,
      currency,
      subcategory,
      has_mixer,
      mixers,
      is_active: true,
      chief_product_id,
      product_type,
      product_category,
      ingredients,
      inventory_item_id,
      inventory_qty_per_sale,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data }, { status: 201 });
}
