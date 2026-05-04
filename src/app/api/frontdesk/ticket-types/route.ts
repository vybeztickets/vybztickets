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

  const { data, error } = await admin
    .from("ticket_types")
    .select("id, name, price, total_available, sold_count, is_active")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ticketTypes: data ?? [] });
}
