import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: session } = await (admin as any)
    .from("scan_sessions")
    .select("id, event_id, type, label, expires_at, is_active")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Código inválido o expirado" }, { status: 404 });
  }

  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    await (admin as any).from("scan_sessions").update({ is_active: false }).eq("id", session.id);
    return NextResponse.json({ error: "Código expirado" }, { status: 410 });
  }

  const { data: event } = await admin
    .from("events")
    .select("id, name, date, time, venue, city")
    .eq("id", session.event_id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    eventId: event.id,
    eventName: event.name,
    eventDate: event.date,
    eventTime: event.time,
    venue: event.venue,
    city: event.city,
    type: session.type,
    label: session.label,
    code: code.toUpperCase().trim(),
  });
}
