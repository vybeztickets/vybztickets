import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("resale_listings")
    .select(`
      id, resale_price, original_price, status, escrow_status, created_at,
      tickets (
        id,
        events ( id, name, date, venue, city )
      )
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.ticket_id || !body?.resale_price) {
    return NextResponse.json({ error: "ticket_id y resale_price son requeridos" }, { status: 400 });
  }

  const resalePrice = Number(body.resale_price);
  if (!Number.isFinite(resalePrice) || resalePrice <= 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  // Verify the ticket belongs to this user and is active
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id, purchase_price, status, attendee_id")
    .eq("id", body.ticket_id)
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
  }

  if (ticket.attendee_id !== user.id) {
    return NextResponse.json({ error: "No tenés permiso sobre esta entrada" }, { status: 403 });
  }

  if (ticket.status !== "active") {
    return NextResponse.json({ error: "La entrada no está disponible para reventa" }, { status: 400 });
  }

  // Check not already listed
  const { data: existing } = await supabase
    .from("resale_listings")
    .select("id")
    .eq("ticket_id", body.ticket_id)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Esta entrada ya está publicada en reventa" }, { status: 409 });
  }

  const { data: listing, error: insertError } = await supabase
    .from("resale_listings")
    .insert({
      ticket_id: body.ticket_id,
      seller_id: user.id,
      original_price: ticket.purchase_price,
      resale_price: resalePrice,
      status: "active",
      escrow_status: "pending",
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json(listing, { status: 201 });
}
