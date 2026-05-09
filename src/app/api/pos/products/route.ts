import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const eventId = searchParams.get("eventId");

  if (!code || !eventId)
    return NextResponse.json({ error: "code and eventId required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: session } = await (admin as any)
    .from("scan_sessions")
    .select("id, type, event_id, expires_at, is_active")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (!session || session.type !== "pos" || session.event_id !== eventId)
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  if (session.expires_at && new Date(session.expires_at) < new Date())
    return NextResponse.json({ error: "Code expired" }, { status: 401 });

  const { data: event } = await admin.from("events").select("organizer_id").eq("id", eventId).single();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data: products } = await (admin as any)
    .from("pos_products")
    .select("id, name, price, category, subcategory, has_mixer, mixers, currency")
    .eq("organizer_id", event.organizer_id)
    .eq("is_active", true)
    .order("category")
    .order("name");

  return NextResponse.json({ products: products ?? [] });
}
