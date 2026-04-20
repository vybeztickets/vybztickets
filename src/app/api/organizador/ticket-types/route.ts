import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { eventId, name, price, total_available, description, category, capacity,
    zone_name, zone_color, is_hidden, min_per_order, max_per_order,
    sales_start_date, sales_end_date, entry_deadline } = body;

  if (!eventId || !name || price == null) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify event belongs to user
  const { data: event } = await admin.from("events").select("id").eq("id", eventId).eq("organizer_id", user.id).single();
  if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

  const { data, error } = await admin.from("ticket_types").insert({
    event_id: eventId,
    name,
    price: Number(price),
    total_available: total_available != null ? Number(total_available) : 999999,
    description: description ?? null,
    category: category ?? "general",
    capacity: capacity ?? null,
    zone_name: zone_name ?? null,
    zone_color: zone_color ?? null,
    is_hidden: is_hidden ?? false,
    min_per_order: min_per_order ?? 1,
    max_per_order: max_per_order ?? null,
    sales_start_date: sales_start_date ?? null,
    sales_end_date: sales_end_date ?? null,
    entry_deadline: entry_deadline ?? null,
    sold_count: 0,
    is_active: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, ticketType: data });
}
