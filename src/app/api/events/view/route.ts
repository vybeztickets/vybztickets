/*
 * Run in Supabase SQL editor before deploying:
 *
 * CREATE TABLE IF NOT EXISTS event_views (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
 *   session_id text NOT NULL,
 *   referrer text,
 *   created_at timestamptz DEFAULT now()
 * );
 * CREATE INDEX IF NOT EXISTS event_views_event_id_idx ON event_views(event_id);
 * CREATE INDEX IF NOT EXISTS event_views_created_at_idx ON event_views(created_at);
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isValidUUID, isNonEmptyString } from "@/lib/validate";
import { checkRateLimit, getIP, rateLimitedResponse } from "@/lib/ratelimit";

export async function POST(request: Request) {
  if (!checkRateLimit("event-view", getIP(request), 20, 60_000)) {
    return rateLimitedResponse();
  }

  const { event_id, session_id, referrer } = await request.json();

  if (!isValidUUID(event_id) || !isNonEmptyString(session_id)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = createAdminClient();

  // Deduplicate: same session + event within 1 hour → skip
  const { data: existing } = await (admin as any)
    .from("event_views")
    .select("id")
    .eq("event_id", event_id)
    .eq("session_id", session_id)
    .gte("created_at", new Date(Date.now() - 60 * 60_000).toISOString())
    .limit(1)
    .maybeSingle();

  if (existing) return NextResponse.json({ ok: true });

  await (admin as any).from("event_views").insert({
    event_id,
    session_id,
    referrer: referrer || null,
  });

  return NextResponse.json({ ok: true });
}
