import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as any)?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data: rows, error } = await (admin as any)
    .from("featured_events")
    .select("id, status, banner_url, banner_status, start_date, end_date, days, total_cost, created_at, event_id, organizer_id")
    .not("banner_url", "is", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const eventIds = [...new Set((rows ?? []).map((r: any) => r.event_id))];
  const organizerIds = [...new Set((rows ?? []).map((r: any) => r.organizer_id))];

  const [{ data: events }, { data: organizers }] = await Promise.all([
    admin.from("events").select("id, name").in("id", eventIds as string[]),
    admin.from("profiles").select("id, full_name, email").in("id", organizerIds as string[]),
  ]);

  const eventMap = new Map((events ?? []).map((e: any) => [e.id, e.name]));
  const orgMap = new Map((organizers ?? []).map((o: any) => [o.id, o]));

  const enriched = (rows ?? []).map((r: any) => ({
    ...r,
    eventName: eventMap.get(r.event_id) ?? null,
    organizerName: orgMap.get(r.organizer_id)?.full_name ?? null,
    organizerEmail: orgMap.get(r.organizer_id)?.email ?? null,
  }));

  return NextResponse.json(enriched);
}
