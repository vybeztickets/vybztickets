import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

async function uniqueCode(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const { data } = await (admin as any)
      .from("scan_sessions")
      .select("id")
      .eq("code", code)
      .eq("is_active", true)
      .single();
    if (!data) return code;
  }
  throw new Error("Could not generate unique code");
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");
  const typeFilter = searchParams.get("type");
  if (!eventId) return NextResponse.json({ error: "event_id required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: event } = await admin.from("events").select("organizer_id").eq("id", eventId).single();
  if (!event || event.organizer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let query = (admin as any)
    .from("scan_sessions")
    .select("id, code, type, label, expires_at, is_active, last_active_at, created_at")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (typeFilter) query = query.eq("type", typeFilter);

  const { data: codes } = await query;

  return NextResponse.json({ codes: codes ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { event_id, label, type = "scanner", expires_in_hours } = body;
  if (!event_id) return NextResponse.json({ error: "event_id required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: event } = await admin.from("events").select("organizer_id").eq("id", event_id).single();
  if (!event || event.organizer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const code = await uniqueCode(admin);
  const expires_at = expires_in_hours
    ? new Date(Date.now() + expires_in_hours * 3600 * 1000).toISOString()
    : null;

  const { data: newSession, error } = await (admin as any)
    .from("scan_sessions")
    .insert({ event_id, code, type, label: label || null, created_by: user.id, expires_at, is_active: true })
    .select("id, code, type, label, expires_at, is_active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ session: newSession }, { status: 201 });
}
