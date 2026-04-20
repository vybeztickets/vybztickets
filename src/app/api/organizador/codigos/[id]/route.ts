import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

type PromoLinkUpdate = Database["public"]["Tables"]["promo_links"]["Update"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  const { data: existing } = await admin.from("promo_links").select("organizer_id").eq("id", id).single();
  if (!existing || existing.organizer_id !== user.id) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const allowed = ["promoter_name", "discount_percent", "ticket_type_id", "is_active", "max_uses", "is_guestlist"];
  const updates: PromoLinkUpdate = {};
  for (const key of allowed) {
    if (key in body) (updates as Record<string, unknown>)[key] = body[key];
  }
  if ("discount_percent" in updates) {
    updates.is_guestlist = Number(updates.discount_percent) === 100;
  }

  const { error } = await admin.from("promo_links").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing } = await admin.from("promo_links").select("organizer_id").eq("id", id).single();
  if (!existing || existing.organizer_id !== user.id) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { error } = await admin.from("promo_links").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
