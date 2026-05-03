import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sendTicketEmail } from "@/lib/send-ticket-email";
import { isValidEmail, isValidUUID, isPositiveInt, isNonEmptyString } from "@/lib/validate";

export async function POST(request: Request) {
  const body = await request.json();
  const { eventId, ticketTypeId, quantity, buyerEmail, buyerName, buyerPhone, buyerNotes, paxCount, promoCode, discountPercent, marketingOptIn, perTicketData } = body;

  if (!isValidUUID(eventId) || !isValidUUID(ticketTypeId)) {
    return NextResponse.json({ error: "Invalid event or ticket type" }, { status: 400 });
  }
  if (!isValidEmail(buyerEmail)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (!isNonEmptyString(buyerName)) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!isPositiveInt(quantity, 10)) {
    return NextResponse.json({ error: "Quantity must be between 1 and 10" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify ticket type + event in one go
  const [{ data: ticketType, error: ttError }, eventRes] = await Promise.all([
    supabase.from("ticket_types").select("*").eq("id", ticketTypeId).eq("event_id", eventId).eq("is_active", true).single(),
    (supabase as any).from("events").select("id, name, date, time, venue, city, currency, post_purchase_message, terms_conditions").eq("id", eventId).single(),
  ]);
  const event = eventRes.data as {
    id: string; name: string; date: string; time: string | null; venue: string; city: string;
    currency: string | null; post_purchase_message: string | null; terms_conditions: string | null;
  } | null;

  if (ttError || !ticketType) return NextResponse.json({ error: "Tipo de ticket no encontrado" }, { status: 404 });

  const available = ticketType.total_available - ticketType.sold_count;
  if (available < quantity) return NextResponse.json({ error: `Solo quedan ${available} tickets disponibles` }, { status: 409 });

  // Validate promo code
  if (promoCode) {
    const { data: promo } = await supabase.from("promo_links").select("id").eq("code", String(promoCode).toUpperCase().trim()).eq("event_id", eventId).maybeSingle();
    if (!promo) return NextResponse.json({ error: "Código de descuento no válido para este evento" }, { status: 400 });
  }

  // Create tickets
  const finalPrice = discountPercent > 0 ? Math.round(ticketType.price * (1 - discountPercent / 100)) : ticketType.price;
  const ticketsToInsert = Array.from({ length: quantity }, (_, i) => {
    const pt = Array.isArray(perTicketData) && perTicketData[i];
    return {
      ticket_type_id: ticketTypeId,
      event_id: eventId,
      buyer_email: pt ? pt.email : buyerEmail,
      buyer_name: pt ? (pt.name || null) : (buyerName ?? null),
      buyer_phone: buyerPhone ?? null,
      buyer_notes: buyerNotes ?? null,
      pax_count: paxCount ?? quantity,
      promo_code: promoCode ?? null,
      marketing_opt_in: marketingOptIn ?? false,
      purchase_price: finalPrice,
      status: "active" as const,
      qr_code: randomUUID(),
    };
  });

  const { data: tickets, error: insertError } = await supabase.from("tickets").insert(ticketsToInsert).select("id, qr_code, buyer_email, buyer_name");

  if (insertError) {
    console.error("Insert error:", insertError);
    return NextResponse.json({ error: "Error al crear los tickets" }, { status: 500 });
  }

  // Increment sold_count
  await supabase.from("ticket_types").update({ sold_count: ticketType.sold_count + quantity }).eq("id", ticketTypeId);

  // Send ticket emails — grouped by buyer_email, awaited so Vercel doesn't kill the function
  if (tickets && event) {
    const grouped = new Map<string, typeof tickets>();
    for (const t of tickets) {
      const em = t.buyer_email as string;
      if (!grouped.has(em)) grouped.set(em, []);
      grouped.get(em)!.push(t);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vybztickets.vercel.app";

    const formattedDate = new Date((event.date as string) + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

    const emailResults = await Promise.allSettled(
      Array.from(grouped.entries()).map(([email, group]) =>
        sendTicketEmail({
          to: email,
          buyerName: (group[0].buyer_name as string | null),
          eventName: event.name as string,
          eventDate: formattedDate,
          eventTime: (event.time as string | null),
          eventVenue: event.venue as string,
          eventCity: event.city as string,
          ticketTypeName: ticketType.name as string,
          ticketPrice: finalPrice,
          currency: (event.currency as string) ?? "CRC",
          qrCodes: group.map(t => t.qr_code as string),
          ticketIds: group.map(t => t.id as string),
          postPurchaseMessage: (event as any).post_purchase_message ?? null,
          termsConditions: (event as any).terms_conditions ?? null,
          siteUrl,
        })
      )
    );

    const emailErrors = emailResults
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map(r => r.reason?.message ?? String(r.reason));

    if (emailErrors.length > 0) {
      console.error("Email send errors:", emailErrors);
    }
  }

  return NextResponse.json({
    success: true,
    ticketIds: tickets?.map((t) => t.id) ?? [],
    qrCodes: tickets?.map((t) => t.qr_code) ?? [],
  });
}
