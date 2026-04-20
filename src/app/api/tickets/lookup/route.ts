import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(`
      id,
      qr_code,
      status,
      purchase_price,
      created_at,
      buyer_name,
      ticket_types (name),
      events (name, date, time, venue, city)
    `)
    .eq("buyer_email", email)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Lookup error:", error);
    return NextResponse.json({ error: "Error al buscar tickets" }, { status: 500 });
  }

  return NextResponse.json({ tickets: tickets ?? [] });
}
