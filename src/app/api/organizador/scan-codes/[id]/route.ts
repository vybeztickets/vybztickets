import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
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

async function getOwnerEventId(admin: ReturnType<typeof createAdminClient>, sessionId: string) {
  const { data } = await (admin as any)
    .from("scan_sessions")
    .select("event_id")
    .eq("id", sessionId)
    .single();
  return data?.event_id ?? null;
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const eventId = await getOwnerEventId(admin, id);
  if (!eventId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: event } = await admin.from("events").select("organizer_id").eq("id", eventId).single();
  if (!event || event.organizer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await (admin as any).from("scan_sessions").update({ is_active: false, last_active_at: null }).eq("id", id);

  return new NextResponse(null, { status: 204 });
}

// Regenerate code for an existing slot
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const eventId = await getOwnerEventId(admin, id);
  if (!eventId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: event } = await admin.from("events").select("organizer_id").eq("id", eventId).single();
  if (!event || event.organizer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const newCode = await uniqueCode(admin);

  const { data: updated } = await (admin as any)
    .from("scan_sessions")
    .update({ code: newCode, last_active_at: null })
    .eq("id", id)
    .select("id, code, type, label, expires_at, is_active, last_active_at, created_at")
    .single();

  return NextResponse.json({ session: updated });
}
