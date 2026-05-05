import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code } = await request.json();
  if (!code) return NextResponse.json({ ok: false }, { status: 400 });

  const admin = createAdminClient();
  const { data: session } = await (admin as any)
    .from("scan_sessions")
    .select("id, is_active, expires_at")
    .eq("code", (code as string).toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (!session) return NextResponse.json({ ok: false, revoked: true }, { status: 401 });
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ ok: false, expired: true }, { status: 401 });
  }

  await (admin as any)
    .from("scan_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", session.id);

  return NextResponse.json({ ok: true });
}
