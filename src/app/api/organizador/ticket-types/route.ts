import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { eventId, name, price, total_available, description, category, capacity,
    zone_name, zone_color, zone_id, is_hidden, min_per_order, max_per_order,
    sales_start_date, sales_end_date, entry_deadline,
    price_per_extra_person, max_extra_people, includes,
    deposit_enabled, deposit_percent, min_hours_before_event,
    deposit_refund_percent, deposit_warning_text,
    table_color, table_border_color, table_text_color, map_table_size } = body;

  if (!eventId || !name || price == null) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify event belongs to user
  const { data: event } = await admin.from("events").select("id").eq("id", eventId).eq("organizer_id", user.id).single();
  if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

  const { data, error } = await (admin as any).from("ticket_types").insert({
    event_id: eventId,
    name,
    price: Number(price),
    total_available: total_available != null ? Number(total_available) : 999999,
    description: description ?? null,
    category: category ?? "general",
    capacity: capacity ?? null,
    zone_name: zone_name ?? null,
    zone_color: zone_color ?? null,
    zone_id: zone_id ?? null,
    is_hidden: is_hidden ?? false,
    min_per_order: min_per_order ?? 1,
    max_per_order: max_per_order ?? null,
    sales_start_date: sales_start_date ?? null,
    sales_end_date: sales_end_date ?? null,
    entry_deadline: entry_deadline ?? null,
    price_per_extra_person: price_per_extra_person ?? 0,
    max_extra_people: max_extra_people ?? 0,
    includes: includes ?? null,
    deposit_enabled: deposit_enabled ?? false,
    deposit_percent: deposit_percent ?? 0,
    min_hours_before_event: min_hours_before_event ?? 24,
    deposit_refund_percent: deposit_refund_percent ?? 0,
    deposit_warning_text: deposit_warning_text ?? null,
    table_color: table_color ?? null,
    table_border_color: table_border_color ?? null,
    table_text_color: table_text_color ?? null,
    map_table_size: map_table_size ?? "medium",
    sold_count: 0,
    is_active: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, ticketType: data });
}
