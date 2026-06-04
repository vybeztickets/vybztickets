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

export async function GET(request: Request) {
  const ip = getIP(request);
  if (!checkRateLimit("frontdesk-tables", ip, 60, 60_000)) return rateLimitedResponse();

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const code = searchParams.get("code");

  if (!isValidUUID(eventId) || typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Missing or invalid params" }, { status: 400, headers: SECURITY_HEADERS });
  }

  const admin = createAdminClient();
  if (!await verifyCode(admin, code, eventId!)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
  }

  const [{ data: event }, { data: zones }, { data: tables }] = await Promise.all([
    (admin as any).from("events").select("venue_map_url, name, currency").eq("id", eventId).single(),
    (admin as any).from("table_zones").select("id, name, color, sort_order").eq("event_id", eventId).order("sort_order", { ascending: true }),
    (admin as any).from("ticket_types").select("id, name, price, capacity, zone_id, zone_color, table_color, table_border_color, table_text_color, map_table_size, map_position_x, map_position_y, price_per_extra_person, max_extra_people, is_active, sold_count, total_available").eq("event_id", eventId).eq("category", "table").order("name", { ascending: true }),
  ]);

  const tableIds = (tables ?? []).map((t: { id: string }) => t.id);
  const { data: tickets } = tableIds.length > 0
    ? await (admin as any).from("tickets").select("id, ticket_type_id, buyer_name, buyer_email, buyer_phone, buyer_notes, pax_count, status, purchase_price, created_at, qr_code").eq("event_id", eventId).in("ticket_type_id", tableIds).neq("status", "cancelled")
    : { data: [] };

  return NextResponse.json({
    venueMapUrl: event?.venue_map_url ?? null,
    eventName: event?.name ?? "",
    currency: event?.currency ?? "USD",
    zones: zones ?? [],
    tables: tables ?? [],
    tickets: tickets ?? [],
  }, { headers: SECURITY_HEADERS });
}
