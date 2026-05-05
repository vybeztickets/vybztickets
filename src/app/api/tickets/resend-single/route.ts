// Run in Supabase SQL editor before deploying:
// ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resent_at timestamptz;

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTicketEmail } from "@/lib/send-ticket-email";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/validate";
import { checkRateLimit, getIP, rateLimitedResponse } from "@/lib/ratelimit";

export async function POST(request: Request) {
  // 5 resends per IP per 10 minutes
  if (!checkRateLimit("resend", getIP(request), 5, 10 * 60_000)) {
    return rateLimitedResponse();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticketId } = await request.json();
  if (!isValidUUID(ticketId)) return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });

  const admin = createAdminClient();

  const { data: ticket } = await (admin as any)
    .from("tickets")
    .select("id, qr_code, buyer_name, buyer_email, purchase_price, status, resent_at, ticket_type_id, event_id")
    .eq("id", ticketId)
    .maybeSingle();

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  // Ownership check
  const { data: profile } = await (admin as any)
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();
  const userEmail = (profile?.email ?? user.email ?? "").toLowerCase();
  if (ticket.buyer_email.toLowerCase() !== userEmail) {
    return NextResponse.json({ error: "Not your ticket" }, { status: 403 });
  }

  if (ticket.status !== "active") {
    return NextResponse.json({ error: "Ticket is not active" }, { status: 400 });
  }

  if (ticket.resent_at) {
    return NextResponse.json({ error: "already_resent" }, { status: 400 });
  }

  const { data: event } = await (admin as any)
    .from("events")
    .select("name, date, time, venue, city, country, currency, post_purchase_message, terms_conditions")
    .eq("id", ticket.event_id)
    .single();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data: ticketType } = await (admin as any)
    .from("ticket_types")
    .select("name")
    .eq("id", ticket.ticket_type_id)
    .single();

  const d = new Date(event.date + "T00:00:00");
  const formattedDate = d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vybztickets.vercel.app";

  await sendTicketEmail({
    to: ticket.buyer_email,
    buyerName: ticket.buyer_name ?? null,
    eventName: event.name,
    eventDate: formattedDate,
    eventTime: event.time ?? null,
    eventVenue: event.venue,
    eventCity: event.city,
    ticketTypeName: ticketType?.name ?? "Ticket",
    ticketPrice: ticket.purchase_price ?? 0,
    currency: event.currency ?? "CRC",
    qrCodes: [ticket.qr_code],
    ticketIds: [ticket.id],
    postPurchaseMessage: event.post_purchase_message ?? null,
    termsConditions: event.terms_conditions ?? null,
    siteUrl,
  });

  await (admin as any)
    .from("tickets")
    .update({ resent_at: new Date().toISOString() })
    .eq("id", ticketId);

  return NextResponse.json({ success: true });
}
