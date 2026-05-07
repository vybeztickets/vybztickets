import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { code, eventId, items, total, paymentMethod } = body;

  if (!code || !eventId || !items || !paymentMethod)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: "Order must have items" }, { status: 400 });

  const admin = createAdminClient();

  const { data: session } = await (admin as any)
    .from("scan_sessions")
    .select("id, type, event_id, expires_at, is_active")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (!session || session.type !== "pos" || session.event_id !== eventId)
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  if (session.expires_at && new Date(session.expires_at) < new Date())
    return NextResponse.json({ error: "Code expired" }, { status: 401 });

  const { data: event } = await (admin as any).from("events").select("organizer_id, currency").eq("id", eventId).single();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data: order, error } = await (admin as any)
    .from("pos_orders")
    .insert({
      session_code: code.toUpperCase(),
      event_id: eventId,
      organizer_id: event.organizer_id,
      items,
      total,
      currency: (event as any).currency ?? "USD",
      payment_method: paymentMethod,
      status: "paid",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order }, { status: 201 });
}
