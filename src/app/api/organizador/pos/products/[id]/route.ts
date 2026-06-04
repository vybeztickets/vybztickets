import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/validate";
import { checkRateLimit, getIP, rateLimitedResponse } from "@/lib/ratelimit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("pos_products")
    .select("*")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("pos-product-patch", getIP(request), 60, 60_000))
    return rateLimitedResponse();

  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  const allowed = [
    "name", "price", "category", "currency", "is_active", "subcategory",
    "has_mixer", "mixers", "is_pinned",
    "chief_product_id", "product_type", "product_category", "ingredients",
    "inventory_item_id", "inventory_qty_per_sale",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const admin = createAdminClient();
  const { data: existing } = await (admin as any)
    .from("pos_products").select("organizer_id").eq("id", id).eq("organizer_id", user.id).single();
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await (admin as any)
    .from("pos_products").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("pos-product-delete", getIP(request), 30, 60_000))
    return rateLimitedResponse();

  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const admin = createAdminClient();
  const { data: existing } = await (admin as any)
    .from("pos_products").select("organizer_id").eq("id", id).eq("organizer_id", user.id).single();
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await (admin as any).from("pos_products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
