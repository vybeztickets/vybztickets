import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import PedidosManager from "./PedidosManager";

export default async function PedidosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: event } = await admin.from("events").select("id, name").eq("id", id).eq("organizer_id", user.id).single();
  if (!event) notFound();

  const { data: tickets } = await admin
    .from("tickets")
    .select("id, event_id, buyer_name, buyer_email, buyer_phone, buyer_notes, purchase_price, status, promo_code, created_at, qr_code, ticket_type_id, ticket_types(id, name, price)")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <PedidosManager tickets={tickets ?? []} />
    </div>
  );
}
