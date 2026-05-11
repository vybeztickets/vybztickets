import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import TablesManager from "./TablesManager";

export default async function MesasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: event } = await (admin as any)
    .from("events")
    .select("id, name, venue_map_url, currency")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();
  if (!event) notFound();

  const [{ data: ticketTypes }, { data: usedCounts }, { data: zonesData }] = await Promise.all([
    (admin as any).from("ticket_types").select("*").eq("event_id", id).eq("category", "table").order("created_at", { ascending: true }),
    admin.from("tickets").select("ticket_type_id").eq("event_id", id).eq("status", "used"),
    (admin as any).from("table_zones").select("*").eq("event_id", id).eq("organizer_id", user.id).order("sort_order", { ascending: true }),
  ]);

  const usedByType: Record<string, number> = {};
  (usedCounts ?? []).forEach((t: { ticket_type_id: string }) => {
    usedByType[t.ticket_type_id] = (usedByType[t.ticket_type_id] ?? 0) + 1;
  });

  const enriched = (ticketTypes ?? []).map((tt: Record<string, unknown>) => ({
    ...tt,
    ingresados: usedByType[tt.id as string] ?? 0,
    totalRevenue: (tt.sold_count as number) * (tt.price as number),
  }));

  return (
    <div className="p-8">
      <TablesManager
        eventId={id}
        tableTypes={enriched}
        venueMapUrl={event.venue_map_url ?? null}
        initialZones={zonesData ?? []}
        initialTables={enriched}
        currency={(event as any).currency ?? "CRC"}
      />
    </div>
  );
}
