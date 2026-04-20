import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId requerido" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("promo_links")
    .select("*, ticket_types(id, name, price)")
    .eq("event_id", eventId)
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { eventId, code, promoter_name, discount_percent, ticket_type_id, max_uses } = body;
  if (!eventId || !code) return NextResponse.json({ error: "eventId y código son requeridos" }, { status: 400 });

  const admin = createAdminClient();

  // Verify ownership
  const { data: event } = await admin.from("events").select("id").eq("id", eventId).eq("organizer_id", user.id).single();
  if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

  // Check code uniqueness per event
  const { data: existing } = await admin.from("promo_links").select("id").eq("event_id", eventId).eq("code", code).maybeSingle();
  if (existing) return NextResponse.json({ error: "Ya existe un código con ese nombre para este evento" }, { status: 409 });

  const discountNum = Number(discount_percent) || 0;
  const { data: created, error } = await admin
    .from("promo_links")
    .insert({
      event_id: eventId,
      organizer_id: user.id,
      code: code.trim().toUpperCase(),
      promoter_name: promoter_name || null,
      discount_percent: discountNum,
      ticket_type_id: ticket_type_id || null,
      max_uses: max_uses ? Number(max_uses) : null,
      is_active: true,
      times_used: 0,
      is_guestlist: discountNum === 100,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(created, { status: 201 });
}
