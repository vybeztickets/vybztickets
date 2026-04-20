import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { eventId, email } = await request.json();
  if (!eventId || !email) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("tickets")
    .select("id, qr_code")
    .eq("event_id", eventId)
    .eq("buyer_email", email.toLowerCase().trim())
    .eq("status", "active")
    .limit(5);

  if (!data || data.length === 0) return NextResponse.json({ found: false });

  // TODO: trigger email delivery with QR codes
  return NextResponse.json({ found: true, count: data.length });
}
