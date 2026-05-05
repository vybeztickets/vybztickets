import { createAdminClient } from "@/lib/supabase/admin";
import { sendTicketEmail } from "@/lib/send-ticket-email";
import { NextResponse } from "next/server";
import { isValidEmail, isValidUUID } from "@/lib/validate";
import { checkRateLimit, getIP, rateLimitedResponse } from "@/lib/ratelimit";

export async function POST(request: Request) {
  // 3 resend requests per IP per 5 minutes
  if (!checkRateLimit("resend-public", getIP(request), 3, 5 * 60_000)) {
    return rateLimitedResponse();
  }

  const { eventId, email } = await request.json();
  if (!isValidUUID(eventId) || !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const admin = createAdminClient();

  const { data: tickets } = await admin
    .from("tickets")
    .select("id, qr_code, buyer_name, purchase_price, ticket_type_id")
    .eq("event_id", eventId)
    .eq("buyer_email", normalizedEmail)
    .eq("status", "active")
    .limit(10);

  if (!tickets || tickets.length === 0) return NextResponse.json({ found: false });

  const { data: event } = await admin
    .from("events")
    .select("name, date, time, venue, city, country, currency, post_purchase_message, terms_conditions")
    .eq("id", eventId)
    .single();

  if (!event) return NextResponse.json({ found: false });

  const ticketTypeId = (tickets[0] as any).ticket_type_id;
  const { data: ticketType } = await admin
    .from("ticket_types")
    .select("name")
    .eq("id", ticketTypeId)
    .single();

  const d = new Date((event as any).date + "T00:00:00");
  const formattedDate = d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vybztickets.vercel.app";

  await sendTicketEmail({
    to: normalizedEmail,
    buyerName: (tickets[0] as any).buyer_name ?? null,
    eventName: (event as any).name,
    eventDate: formattedDate,
    eventTime: (event as any).time ?? null,
    eventVenue: (event as any).venue,
    eventCity: (event as any).city,
    ticketTypeName: (ticketType as any)?.name ?? "Entrada",
    ticketPrice: (tickets[0] as any).purchase_price ?? 0,
    currency: (event as any).currency ?? "CRC",
    qrCodes: tickets.map((t: any) => t.qr_code),
    ticketIds: tickets.map((t: any) => t.id),
    postPurchaseMessage: (event as any).post_purchase_message ?? null,
    termsConditions: (event as any).terms_conditions ?? null,
    siteUrl,
  });

  return NextResponse.json({ found: true, count: tickets.length });
}
