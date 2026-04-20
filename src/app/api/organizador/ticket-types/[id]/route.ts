import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

type TicketTypeUpdate = Database["public"]["Tables"]["ticket_types"]["Update"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const allowed = ["name", "price", "total_available", "description", "is_active", "is_hidden",
    "category", "capacity", "zone_name", "zone_color", "min_per_order", "max_per_order",
    "sales_start_date", "sales_end_date", "entry_deadline", "map_position_x", "map_position_y"];
  const updates: TicketTypeUpdate = {};
  for (const key of allowed) {
    if (key in body) (updates as Record<string, unknown>)[key] = body[key];
  }

  const admin = createAdminClient();

  // Verify ownership via event
  const { data: tt } = await admin.from("ticket_types").select("event_id").eq("id", id).single();
  if (!tt) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const { data: event } = await admin.from("events").select("id").eq("id", (tt as { event_id: string }).event_id).eq("organizer_id", user.id).single();
  if (!event) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { error } = await admin.from("ticket_types").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();
  const { data: tt } = await admin.from("ticket_types").select("event_id, sold_count").eq("id", id).single();
  if (!tt) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const ttTyped = tt as { event_id: string; sold_count: number };
  if (ttTyped.sold_count > 0) return NextResponse.json({ error: "No puedes eliminar una entrada con ventas" }, { status: 409 });
  const { data: event } = await admin.from("events").select("id").eq("id", ttTyped.event_id).eq("organizer_id", user.id).single();
  if (!event) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { error } = await admin.from("ticket_types").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
