import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { qrCode, eventId } = body;

  if (!qrCode || !eventId) {
    return NextResponse.json({ status: "invalid", message: "Datos incompletos" }, { status: 400 });
  }

  // Must be authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ status: "invalid", message: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find ticket by qr_code
  const { data: rawTicket } = await admin
    .from("tickets")
    .select(`id, status, event_id, buyer_email, buyer_name, ticket_types (name)`)
    .eq("qr_code", qrCode)
    .single();
  const ticket = rawTicket as {
    id: string; status: string; event_id: string;
    buyer_email: string; buyer_name: string | null;
    ticket_types: { name: string } | null;
  } | null;

  if (!ticket) {
    return NextResponse.json({ status: "invalid", message: "Ticket no encontrado" });
  }

  if (ticket.event_id !== eventId) {
    return NextResponse.json({ status: "invalid", message: "Ticket no pertenece a este evento" });
  }

  if (ticket.status === "used") {
    return NextResponse.json({
      status: "already_used",
      message: "Ticket ya fue usado",
      ticket: {
        buyerName: ticket.buyer_name,
        buyerEmail: ticket.buyer_email,
        ticketType: (ticket.ticket_types as { name: string } | null)?.name ?? "",
      },
    });
  }

  if (ticket.status !== "active") {
    return NextResponse.json({ status: "invalid", message: `Ticket ${ticket.status}` });
  }

  // Mark as used
  await admin
    .from("tickets")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: "used" } as any)
    .eq("id", ticket.id);

  // Log validation
  await admin
    .from("ticket_validations")
    .insert({
      ticket_id: ticket.id,
      event_id: eventId,
      validated_by: user.id,
      validation_method: "manual",
      status: "valid",
    });

  return NextResponse.json({
    status: "valid",
    message: "¡Entrada válida!",
    ticket: {
      buyerName: ticket.buyer_name,
      buyerEmail: ticket.buyer_email,
      ticketType: (ticket.ticket_types as { name: string } | null)?.name ?? "",
    },
  });
}
