import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function verifyCode(admin: ReturnType<typeof createAdminClient>, code: string, eventId: string) {
  const { data } = await (admin as any)
    .from("scan_sessions")
    .select("id, event_id, expires_at, is_active")
    .eq("code", code.toUpperCase().trim())
    .eq("type", "cashier")
    .eq("is_active", true)
    .single();
  if (!data || data.event_id !== eventId) return false;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const code = searchParams.get("code");

  if (!eventId || !code) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const admin = createAdminClient();
  if (!await verifyCode(admin, code, eventId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tickets } = await admin
    .from("tickets")
    .select("id, status, promo_code, purchase_price, buyer_notes")
    .eq("event_id", eventId)
    .in("status", ["active", "used"]);

  const all = tickets ?? [];
  const doorTickets = all.filter(t => (t as any).buyer_notes === "door_entry");
  const onlineTickets = all.filter(t => (t as any).buyer_notes !== "door_entry");

  const onlineCount = onlineTickets.length;
  const doorCount = doorTickets.length;
  const scanned = all.filter(t => t.status === "used").length;
  const remaining = all.filter(t => t.status === "active").length;

  const promoCodes = [...new Set(onlineTickets.map(t => t.promo_code).filter(Boolean))];
  let guestlistCount = 0;
  if (promoCodes.length > 0) {
    const { data: promos } = await (admin as any)
      .from("promo_links")
      .select("code, is_guestlist")
      .eq("event_id", eventId)
      .in("code", promoCodes);
    const guestlistCodes = new Set((promos ?? []).filter((p: any) => p.is_guestlist).map((p: any) => p.code));
    guestlistCount = onlineTickets.filter(t => t.promo_code && guestlistCodes.has(t.promo_code)).length;
  }

  const onlineRevenue = onlineTickets.reduce((sum, t) => sum + (t.purchase_price ?? 0), 0);
  const doorRevenue = doorTickets.reduce((sum, t) => sum + (t.purchase_price ?? 0), 0);

  return NextResponse.json({
    onlineCount,
    doorCount,
    scanned,
    remaining,
    guestlistCount,
    onlineRevenue,
    doorRevenue,
  });
}
