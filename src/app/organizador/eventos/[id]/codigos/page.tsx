import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import CodigosManager from "./CodigosManager";

export default async function CodigosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: event } = await admin.from("events").select("id, name").eq("id", id).eq("organizer_id", user.id).single();
  if (!event) notFound();

  const [{ data: codes }, { data: ticketTypes }] = await Promise.all([
    admin.from("promo_links").select("*").eq("event_id", id).eq("organizer_id", user.id).order("created_at", { ascending: false }),
    admin.from("ticket_types").select("id, name, price").eq("event_id", id).order("created_at", { ascending: true }),
  ]);

  return (
    <div className="p-8">
      <CodigosManager eventId={id} initialCodes={codes ?? []} ticketTypes={ticketTypes ?? []} />
    </div>
  );
}
