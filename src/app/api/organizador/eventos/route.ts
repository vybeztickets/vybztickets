import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, description, date, time, venue, city, category, image_url, sales_end_date, ticketTypes } = body;

  if (!name || !date || !time || !venue || !city || !category) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  if (!ticketTypes?.length) {
    return NextResponse.json({ error: "Debes agregar al menos un tipo de ticket" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: event, error: eventError } = await admin
    .from("events")
    .insert({
      organizer_id: user.id,
      name,
      description: description || null,
      date,
      time,
      venue,
      city,
      country: "Costa Rica",
      category,
      image_url: image_url || null,
      sales_end_date: sales_end_date || null,
      status: "published",
    })
    .select("id")
    .single();

  if (eventError || !event) {
    console.error("Event insert error:", eventError);
    return NextResponse.json({ error: "Error al crear el evento" }, { status: 500 });
  }

  const { error: ttError } = await admin
    .from("ticket_types")
    .insert(
      ticketTypes.map((t: { name: string; description: string | null; price: number; total_available: number }) => ({
        event_id: event.id,
        name: t.name,
        description: t.description,
        price: t.price,
        total_available: t.total_available,
        sold_count: 0,
        is_active: true,
      }))
    );

  if (ttError) {
    console.error("Ticket types insert error:", ttError);
    return NextResponse.json({ error: "Error al crear los tipos de ticket" }, { status: 500 });
  }

  return NextResponse.json({ success: true, eventId: event.id });
}
