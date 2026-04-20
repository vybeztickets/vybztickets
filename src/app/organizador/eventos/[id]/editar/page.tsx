import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import EditEventTabs from "./EditEventTabs";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();
  if (!event) notFound();

  const { data: ticketTypes } = await admin
    .from("ticket_types")
    .select("id, name, price, category")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  return <EditEventTabs event={event} ticketTypes={ticketTypes ?? []} />;
}
