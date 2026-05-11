import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { checkRateLimit, getIP, rateLimitedResponse } from "@/lib/ratelimit";
import { isValidUUID } from "@/lib/validate";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

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
  const ip = getIP(request);
  if (!checkRateLimit("table-sale", ip, 30, 60_000)) return rateLimitedResponse();

  const body = await request.json();
  const { eventId, code, tableTypeId, paxCount, paymentMethod, totalPrice } = body;

  if (!isValidUUID(eventId) || !isValidUUID(tableTypeId) || typeof code !== "string") {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400, headers: SECURITY_HEADERS });
  }
  if (!["cash", "card"].includes(paymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400, headers: SECURITY_HEADERS });
  }
  const pax = Number(paxCount);
  if (!Number.isInteger(pax) || pax < 1 || pax > 200) {
    return NextResponse.json({ error: "Invalid pax count" }, { status: 400, headers: SECURITY_HEADERS });
  }
  const price = Number(totalPrice);
  if (isNaN(price) || price < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400, headers: SECURITY_HEADERS });
  }

  const admin = createAdminClient();
  if (!await verifyCode(admin, code, eventId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
  }

  const { data: created, error } = await (admin as any)
    .from("tickets")
    .insert([{
      event_id: eventId,
      ticket_type_id: tableTypeId,
      qr_code: crypto.randomUUID(),
      status: "active",
      buyer_name: "Door entry",
      buyer_email: `door-table-${Date.now()}@frontdesk.local`,
      buyer_phone: null,
      purchase_price: price,
      pax_count: pax,
      buyer_notes: `table_door_entry:${paymentMethod}`,
    }])
    .select("id, qr_code")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: SECURITY_HEADERS });

  const { data: tt } = await admin.from("ticket_types").select("sold_count").eq("id", tableTypeId).single();
  await admin.from("ticket_types").update({ sold_count: ((tt?.sold_count ?? 0) + 1) } as never).eq("id", tableTypeId);

  return NextResponse.json({ ticket: created }, { status: 201, headers: SECURITY_HEADERS });
}
