import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

async function verifyCode(admin: ReturnType<typeof createAdminClient>, code: string, eventId: string) {
  const { data } = await (admin as any)
    .from("scan_sessions")
    .select("id, event_id, expires_at, is_active")
    .eq("code", code.toUpperCase().trim())
    .eq("type", "cashier")
    .eq("is_active", true)
    .single();
  if (!data || data.event_id !== eventId) return false;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
  return true;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { eventId, code, name, email, ticketTypeId, paymentMethod, quantity = 1, price } = body;

  if (!eventId || !code || !ticketTypeId || !paymentMethod) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!await verifyCode(admin, code, eventId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = [];
  for (let i = 0; i < Math.min(quantity, 20); i++) {
    tickets.push({
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      qr_code: uuidv4(),
      status: "active",
      buyer_name: name || "Door entry",
      buyer_email: email || `door-${Date.now()}-${i}@frontdesk.local`,
      buyer_phone: null,
      purchase_price: price ?? 0,
      promo_code: null,
      buyer_notes: "door_entry",
    });
  }

  const { data: created, error } = await (admin as any)
    .from("tickets")
    .insert(tickets)
    .select("id, buyer_name, buyer_email, status");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update sold_count on ticket_type
  const { data: tt } = await admin.from("ticket_types").select("sold_count").eq("id", ticketTypeId).single();
  await admin.from("ticket_types")
    .update({ sold_count: ((tt?.sold_count ?? 0) + quantity) } as any)
    .eq("id", ticketTypeId);

  return NextResponse.json({ tickets: created }, { status: 201 });
}
