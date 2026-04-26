import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin.from("events").select("id, name, status").eq("id", id).eq("organizer_id", user.id).single();
  if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();

  // Whitelist updatable fields
  const allowed = [
    "name", "description", "date", "time", "end_time", "venue", "city", "country",
    "category", "status", "image_url", "instagram_url", "facebook_pixel",
    "google_analytics", "google_tag_manager", "banner_url",
    "location_lat", "location_lng", "location_secret",
    "pre_purchase_message", "post_purchase_message", "terms_conditions", "collect_id",
    "ticket_border_color", "ticket_text_color", "ticket_bg_color", "ticket_accent_color",
    "venue_map_url", "has_tables", "is_visible", "sales_end_date",
  ];
  const updates: EventUpdate = {};
  for (const key of allowed) {
    if (key in body) (updates as Record<string, unknown>)[key] = body[key];
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update(updates)
    .eq("id", id)
    .eq("organizer_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();

  // Verify ownership
  const { data: event } = await admin
    .from("events")
    .select("id, organizer_id")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();
  if (!event) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Cascade delete: validations → resale_listings → tickets → ticket_types → event
  await admin.from("ticket_validations").delete().eq("event_id", id);
  const { data: tickets } = await admin.from("tickets").select("id").eq("event_id", id);
  if (tickets && tickets.length > 0) {
    const ticketIds = tickets.map((t) => t.id);
    await admin.from("resale_listings").delete().in("ticket_id", ticketIds);
    await admin.from("tickets").delete().eq("event_id", id);
  }
  await admin.from("ticket_types").delete().eq("event_id", id);
  const { error } = await admin.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
