import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import EventsTable from "./EventsTable";

export const metadata = { title: "Eventos — Dashboard Vybz" };

export default async function OrgEventosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador/eventos");

  const admin = createAdminClient();
  const { data: events } = await admin
    .from("events")
    .select(`*, ticket_types(id, price, total_available, sold_count, is_active)`)
    .eq("organizer_id", user.id)
    .order("date", { ascending: false });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[#0a0a0a]/35 text-xs uppercase tracking-[0.2em] font-semibold mb-1">Panel de control</p>
          <h1 className="text-2xl font-bold text-[#0a0a0a]">Eventos</h1>
        </div>
        <Link
          href="/organizador/eventos/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
        >
          + Evento
        </Link>
      </div>
      <EventsTable events={events ?? []} />
    </div>
  );
}
