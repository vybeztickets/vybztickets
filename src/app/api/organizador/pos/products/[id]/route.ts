import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = ["name", "price", "category", "currency", "is_active", "subcategory", "has_mixer", "mixers"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const admin = createAdminClient();
  const { data: existing } = await (admin as any)
    .from("pos_products").select("organizer_id").eq("id", id).single();
  if (!existing || existing.organizer_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await (admin as any)
    .from("pos_products").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing } = await (admin as any)
    .from("pos_products").select("organizer_id").eq("id", id).single();
  if (!existing || existing.organizer_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await (admin as any).from("pos_products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
