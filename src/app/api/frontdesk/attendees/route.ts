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
  const search = searchParams.get("search")?.toLowerCase().trim() ?? "";

  if (!eventId || !code) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const admin = createAdminClient();
  if (!await verifyCode(admin, code, eventId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rawTickets } = await admin
    .from("tickets")
    .select("id, status, buyer_name, buyer_email, purchase_price, promo_code, created_at, ticket_types(name)")
    .eq("event_id", eventId)
    .in("status", ["active", "used", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(500);

  type Ticket = {
    id: string; status: string; buyer_name: string | null; buyer_email: string;
    purchase_price: number; promo_code: string | null; created_at: string;
    ticket_types: { name: string } | null;
  };

  const tickets = (rawTickets ?? []) as Ticket[];

  const filtered = search
    ? tickets.filter(t =>
        t.buyer_name?.toLowerCase().includes(search) ||
        t.buyer_email?.toLowerCase().includes(search) ||
        t.id.toLowerCase().includes(search) ||
        t.promo_code?.toLowerCase().includes(search)
      )
    : tickets;

  return NextResponse.json({
    attendees: filtered.map(t => ({
      id: t.id,
      name: t.buyer_name,
      email: t.buyer_email,
      ticketType: (t.ticket_types as { name: string } | null)?.name ?? "—",
      status: t.status,
      promoCode: t.promo_code,
      price: t.purchase_price,
      createdAt: t.created_at,
    })),
    total: filtered.length,
  });
}
