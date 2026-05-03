/*
 * SQL to run in Supabase before using this route:
 *
 * ALTER TABLE tickets
 *   ADD COLUMN IF NOT EXISTS transferred_to uuid REFERENCES tickets(id),
 *   ADD COLUMN IF NOT EXISTS transferred_from uuid REFERENCES tickets(id),
 *   ADD COLUMN IF NOT EXISTS transferred_at timestamptz;
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTicketEmail } from "@/lib/send-ticket-email";
import { isValidEmail, isValidUUID, isNonEmptyString } from "@/lib/validate";

export async function POST(req: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let body: {
    ticketId?: string;
    recipientName?: string;
    recipientEmail?: string;
    recipientPhone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { ticketId, recipientName, recipientEmail, recipientPhone } = body;

  if (!isValidUUID(ticketId)) {
    return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
  }
  if (!isNonEmptyString(recipientName)) {
    return NextResponse.json({ error: "Recipient name is required" }, { status: 400 });
  }
  if (!isValidEmail(recipientEmail)) {
    return NextResponse.json({ error: "Invalid recipient email address" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 3. Get logged-in user email from profiles
  const { data: profile } = await (admin as any)
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  const userEmail: string = (
    profile?.email ?? user.email ?? ""
  ).toLowerCase();

  if (!userEmail) {
    return NextResponse.json({ error: "Could not determine user email" }, { status: 500 });
  }

  // 4. Fetch ticket
  const { data: ticket, error: ticketError } = await (admin as any)
    .from("tickets")
    .select(
      "id, ticket_type_id, event_id, buyer_email, buyer_name, buyer_phone, purchase_price, status, qr_code, pax_count, transferred_from, transferred_to"
    )
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError || !ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // 5. Ownership check
  if ((ticket.buyer_email ?? "").toLowerCase() !== userEmail) {
    return NextResponse.json({ error: "You do not own this ticket" }, { status: 403 });
  }

  // 6. Status checks
  if (ticket.status !== "active") {
    return NextResponse.json(
      { error: "Only active tickets can be transferred" },
      { status: 400 }
    );
  }
  if (ticket.transferred_from !== null) {
    return NextResponse.json(
      { error: "Tickets received via transfer cannot be transferred again" },
      { status: 400 }
    );
  }
  if (ticket.transferred_to !== null) {
    return NextResponse.json(
      { error: "This ticket has already been transferred" },
      { status: 400 }
    );
  }

  // 7. Generate new QR code
  const newQrCode = randomUUID();

  // 8. Insert new ticket for recipient
  const { data: newTicket, error: insertError } = await (admin as any)
    .from("tickets")
    .insert({
      ticket_type_id: ticket.ticket_type_id,
      event_id: ticket.event_id,
      buyer_email: recipientEmail.toLowerCase().trim(),
      buyer_name: recipientName,
      buyer_phone: recipientPhone || null,
      purchase_price: ticket.purchase_price,
      status: "active",
      qr_code: newQrCode,
      transferred_from: ticket.id,
      pax_count: ticket.pax_count,
    })
    .select("id")
    .single();

  if (insertError || !newTicket) {
    console.error("Transfer insert error:", insertError);
    return NextResponse.json({ error: "Failed to create new ticket" }, { status: 500 });
  }

  // 9. Update original ticket to "transferred"
  const { error: updateError } = await (admin as any)
    .from("tickets")
    .update({
      status: "transferred",
      transferred_to: newTicket.id,
      transferred_at: new Date().toISOString(),
    })
    .eq("id", ticket.id);

  if (updateError) {
    console.error("Transfer update error:", updateError);
    return NextResponse.json({ error: "Failed to update original ticket" }, { status: 500 });
  }

  // 10. Send email to recipient (non-blocking)
  try {
    const { data: event } = await (admin as any)
      .from("events")
      .select("id, name, date, time, venue, city, currency, post_purchase_message, terms_conditions")
      .eq("id", ticket.event_id)
      .maybeSingle();

    const { data: ticketType } = await (admin as any)
      .from("ticket_types")
      .select("id, name, price")
      .eq("id", ticket.ticket_type_id)
      .maybeSingle();

    if (event && ticketType) {
      const d = new Date(event.date + "T00:00:00");
      const formattedDate = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://vybztickets.com";

      await sendTicketEmail({
        to: recipientEmail.toLowerCase().trim(),
        buyerName: recipientName,
        eventName: event.name,
        eventDate: formattedDate,
        eventTime: event.time ?? null,
        eventVenue: event.venue,
        eventCity: event.city,
        ticketTypeName: ticketType.name,
        ticketPrice: ticket.purchase_price,
        currency: event.currency ?? "CRC",
        qrCodes: [newQrCode],
        postPurchaseMessage: event.post_purchase_message ?? null,
        termsConditions: event.terms_conditions ?? null,
        ticketIds: [newTicket.id],
        siteUrl,
      });
    }
  } catch (emailErr) {
    // Email failure does not block the transfer
    console.error("Transfer email error:", emailErr);
  }

  return NextResponse.json({ success: true });
}
