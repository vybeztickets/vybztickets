import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");
  if (!eventId) return NextResponse.json({ error: "event_id requerido" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();

  // Verify organizer owns event
  const { data: event } = await admin.from("events").select("organizer_id").eq("id", eventId).single();
  if (!event || event.organizer_id !== user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data } = await (admin as any).from("scanner_access").select("*").eq("event_id", eventId).order("created_at", { ascending: false });

  return NextResponse.json({ staff: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { event_id, email } = body;
  if (!event_id || !email) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();

  const { data: event } = await admin.from("events").select("organizer_id").eq("id", event_id).single();
  if (!event || event.organizer_id !== user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data, error } = await (admin as any).from("scanner_access").insert({
    event_id,
    organizer_id: user.id,
    email: email.toLowerCase().trim(),
  }).select().single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Este email ya tiene acceso" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ staff: data });
}
