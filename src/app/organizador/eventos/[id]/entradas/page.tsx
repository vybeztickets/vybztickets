import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import EntradasManager from "./EntradasManager";

export default async function EntradasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, name, venue_map_url")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();
  if (!event) notFound();

  const { data: ticketTypes } = await admin
    .from("ticket_types")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  // Count used tickets per ticket type
  const { data: usedCounts } = await admin
    .from("tickets")
    .select("ticket_type_id")
    .eq("event_id", id)
    .eq("status", "used");

  const usedByType: Record<string, number> = {};
  (usedCounts ?? []).forEach((t) => {
    usedByType[t.ticket_type_id] = (usedByType[t.ticket_type_id] ?? 0) + 1;
  });

  const enriched = (ticketTypes ?? []).map((tt) => ({
    ...tt,
    ingresados: usedByType[tt.id] ?? 0,
    totalRevenue: tt.sold_count * tt.price,
  }));

  return (
    <div className="p-8">
      <EntradasManager eventId={id} ticketTypes={enriched} venueMapUrl={event?.venue_map_url ?? null} />
    </div>
  );
}
