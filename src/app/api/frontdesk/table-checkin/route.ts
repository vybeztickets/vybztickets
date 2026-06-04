import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { checkRateLimit, getIP, rateLimitedResponse } from "@/lib/ratelimit";
import { isValidUUID } from "@/lib/validate";

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

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export async function POST(request: Request) {
  const ip = getIP(request);
  if (!checkRateLimit("table-checkin", ip, 60, 60_000)) return rateLimitedResponse();

  const body = await request.json();
  const { eventId, code, ticketId, paxArrived } = body;

  if (!isValidUUID(eventId) || !isValidUUID(ticketId) || typeof code !== "string") {
    return NextResponse.json({ error: "Missing or invalid params" }, { status: 400, headers: SECURITY_HEADERS });
  }

  const admin = createAdminClient();
  if (!await verifyCode(admin, code, eventId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
  }

  const { data: ticket } = await admin
    .from("tickets")
    .select("pax_count, buyer_notes, status")
    .eq("id", ticketId)
    .eq("event_id", eventId)
    .single();

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404, headers: SECURITY_HEADERS });

  const totalPax = (ticket as any).pax_count ?? 1;
  const arrived = typeof paxArrived === "number" && paxArrived > 0 ? paxArrived : null;
  const isPartial = arrived !== null && arrived < totalPax;

  let newNotes: string = (ticket as any).buyer_notes ?? "";
  if (arrived !== null) {
    newNotes = newNotes.match(/arrived:\d+/)
      ? newNotes.replace(/arrived:\d+/, `arrived:${arrived}`)
      : newNotes ? `${newNotes} | arrived:${arrived}` : `arrived:${arrived}`;
  }

  const newStatus = isPartial ? (ticket as any).status : "used";

  const { error } = await admin
    .from("tickets")
    .update({ status: newStatus, buyer_notes: newNotes } as never)
    .eq("id", ticketId)
    .eq("event_id", eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: SECURITY_HEADERS });
  return NextResponse.json({ ok: true, status: newStatus, arrived }, { headers: SECURITY_HEADERS });
}
