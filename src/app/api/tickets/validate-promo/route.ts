import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code, eventId } = await request.json();
  if (!code || !eventId) return NextResponse.json({ valid: false, error: "Faltan parámetros" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("promo_links")
    .select("id, discount_percent, is_active, max_uses, times_used, ticket_type_id, is_guestlist")
    .eq("code", String(code).toUpperCase().trim())
    .eq("event_id", eventId)
    .maybeSingle();

  if (!data) return NextResponse.json({ valid: false, error: "Código no válido" });
  if (data.is_active === false) return NextResponse.json({ valid: false, error: "Código inactivo" });
  if (data.max_uses !== null && data.times_used >= data.max_uses) {
    return NextResponse.json({ valid: false, error: "Código agotado" });
  }

  return NextResponse.json({
    valid: true,
    discount_percent: data.discount_percent,
    ticket_type_id: data.ticket_type_id,
    is_guestlist: data.is_guestlist ?? false,
  });
}
