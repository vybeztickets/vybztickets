import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const PRICE_PER_DAY = 1.0;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = req.nextUrl.searchParams.get("event_id");
  if (!eventId) return NextResponse.json({ error: "event_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await (admin as any)
    .from("featured_events")
    .select("*")
    .eq("event_id", eventId)
    .eq("organizer_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json(data ?? null);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { event_id, start_date, end_date, banner_url } = body;

  if (!event_id || !start_date || !end_date) {
    return NextResponse.json({ error: "Campos requeridos: event_id, start_date, end_date" }, { status: 400 });
  }

  const start = new Date(start_date);
  const end = new Date(end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    return NextResponse.json({ error: "La fecha de inicio no puede ser en el pasado" }, { status: 400 });
  }
  if (end < start) {
    return NextResponse.json({ error: "La fecha de fin debe ser posterior a la de inicio" }, { status: 400 });
  }

  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const total_cost = days * PRICE_PER_DAY;

  const admin = createAdminClient();

  // Verify organizer owns this event
  const { data: event } = await admin
    .from("events")
    .select("id, organizer_id")
    .eq("id", event_id)
    .eq("organizer_id", user.id)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Evento no encontrado o no autorizado" }, { status: 403 });
  }

  // Cancel any existing active featuring for this event
  await (admin as any)
    .from("featured_events")
    .update({ status: "cancelled" })
    .eq("event_id", event_id)
    .eq("organizer_id", user.id)
    .eq("status", "active");

  const { data: created, error } = await (admin as any)
    .from("featured_events")
    .insert({
      event_id,
      organizer_id: user.id,
      start_date,
      end_date,
      days,
      price_per_day: PRICE_PER_DAY,
      total_cost,
      currency: "USD",
      status: "active",
      banner_url: banner_url || null,
      banner_status: banner_url ? "pending_review" : "none",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(created, { status: 201 });
}
