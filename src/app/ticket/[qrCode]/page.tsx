import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import TicketCard from "./TicketCard";

export default async function TicketPage({ params }: { params: Promise<{ qrCode: string }> }) {
  const { qrCode } = await params;
  const admin = createAdminClient();

  const { data: rawTicket } = await admin
    .from("tickets")
    .select("*, ticket_types(id, name, category, zone_color, price), events(id, name, date, time, end_time, venue, city, country, image_url, ticket_bg_color, ticket_text_color, ticket_accent_color, ticket_border_color, organizer_id)")
    .eq("qr_code", qrCode)
    .single();
  const ticket = rawTicket as unknown as Record<string, unknown> | null;

  if (!ticket) notFound();

  const { data: organizer } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", (ticket.events as Record<string, unknown>)?.organizer_id as string)
    .maybeSingle();

  return (
    <TicketCard
      ticket={ticket}
      organizerName={(organizer?.full_name as string) ?? "Organizador"}
    />
  );
}
