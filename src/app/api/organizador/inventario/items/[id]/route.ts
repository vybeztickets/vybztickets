import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/validate";
import { checkRateLimit, getIP, rateLimitedResponse } from "@/lib/ratelimit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("inv-item-patch", getIP(request), 60, 60_000))
    return rateLimitedResponse();

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const body = await request.json();
  const admin = createAdminClient();

  const { data: item } = await (admin as any).from("inventory_items").select("id").eq("id", id).eq("organizer_id", user.id).single();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ["name", "category", "unit", "unit_size_ml", "par_level", "max_stock", "cost_per_unit", "supplier_id", "barcode", "current_stock", "full_bottle_weight_g", "empty_bottle_weight_g"];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) { if (k in body) updates[k] = body[k]; }

  const { error } = await (admin as any).from("inventory_items").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("inv-item-delete", getIP(request), 30, 60_000))
    return rateLimitedResponse();

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const admin = createAdminClient();
  const { data: item } = await (admin as any).from("inventory_items").select("id").eq("id", id).eq("organizer_id", user.id).single();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await (admin as any).from("inventory_items").update({ is_active: false }).eq("id", id);
  return NextResponse.json({ success: true });
}
