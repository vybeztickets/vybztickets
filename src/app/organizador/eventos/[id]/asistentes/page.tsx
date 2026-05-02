import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import AsistentesManager from "./AsistentesManager";

export default async function AsistentesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: event } = await admin.from("events").select("id, name").eq("id", id).eq("organizer_id", user.id).single();
  if (!event) notFound();

  const { data: tickets } = await admin
    .from("tickets")
    .select("id, buyer_name, buyer_email, buyer_phone, purchase_price, status, created_at, qr_code, transferred_from, transferred_to, ticket_types(id, name, price)")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <AsistentesManager tickets={tickets ?? []} />
    </div>
  );
}
