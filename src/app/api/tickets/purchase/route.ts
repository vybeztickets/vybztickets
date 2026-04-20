import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const body = await request.json();
  const { eventId, ticketTypeId, quantity, buyerEmail, buyerName, buyerPhone, buyerNotes, paxCount, promoCode, discountPercent, marketingOptIn, perTicketData } = body;

  if (!eventId || !ticketTypeId || !quantity || !buyerEmail) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  if (quantity < 1 || quantity > 10) {
    return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify ticket type exists and has availability
  const { data: ticketType, error: ttError } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("id", ticketTypeId)
    .eq("event_id", eventId)
    .eq("is_active", true)
    .single();

  if (ttError || !ticketType) {
    return NextResponse.json({ error: "Tipo de ticket no encontrado" }, { status: 404 });
  }

  const available = ticketType.total_available - ticketType.sold_count;
  if (available < quantity) {
    return NextResponse.json({ error: `Solo quedan ${available} tickets disponibles` }, { status: 409 });
  }

  // Validate promo code belongs to this event (not another event)
  if (promoCode) {
    const { data: promo } = await supabase
      .from("promo_links")
      .select("id")
      .eq("code", String(promoCode).toUpperCase().trim())
      .eq("event_id", eventId)
      .maybeSingle();
    if (!promo) {
      return NextResponse.json({ error: "Código de descuento no válido para este evento" }, { status: 400 });
    }
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

  const { data: tickets, error: insertError } = await supabase
    .from("tickets")
    .insert(ticketsToInsert)
    .select("id, qr_code");

  if (insertError) {
    console.error("Insert error:", insertError);
    return NextResponse.json({ error: "Error al crear los tickets" }, { status: 500 });
  }

  // Increment sold_count
  const { error: updateError } = await supabase
    .from("ticket_types")
    .update({ sold_count: ticketType.sold_count + quantity })
    .eq("id", ticketTypeId);

  if (updateError) {
    console.error("Update sold_count error:", updateError);
  }

  return NextResponse.json({
    success: true,
    ticketIds: tickets?.map((t) => t.id) ?? [],
    qrCodes: tickets?.map((t) => t.qr_code) ?? [],
  });
}
