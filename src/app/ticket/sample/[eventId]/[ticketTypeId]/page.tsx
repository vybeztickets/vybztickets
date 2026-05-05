import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import SampleTicketCard from "./SampleTicketCard";

export default async function SampleTicketPage({
  params,
}: {
  params: Promise<{ eventId: string; ticketTypeId: string }>;
}) {
  const { eventId, ticketTypeId } = await params;
  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("id, name, date, time, end_time, venue, city, country, image_url, ticket_bg_color, ticket_text_color, ticket_accent_color, ticket_border_color, organizer_id")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const { data: ticketType } = await admin
    .from("ticket_types")
    .select("id, name, category, zone_color, price")
    .eq("id", ticketTypeId)
    .eq("event_id", eventId)
    .single();

  if (!ticketType) notFound();

  const { data: organizer } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", event.organizer_id)
    .maybeSingle();

  return (
    <SampleTicketCard
      event={event}
      ticketType={ticketType}
      organizerName={organizer?.full_name ?? "Organizer"}
      backHref={`/organizador/eventos/${eventId}/entradas`}
    />
  );
}
