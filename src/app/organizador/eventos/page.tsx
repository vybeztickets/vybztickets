import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
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

  const total = events?.length ?? 0;

  return (
    <div className="px-10 py-8 max-w-6xl mx-auto">
      <div
        className="flex items-end justify-between mb-8 pb-6"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      >
        <div>
          <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-[0.2em] mb-2">
            {total} evento{total !== 1 ? "s" : ""}
          </p>
          <h1 className="font-[family-name:var(--font-bebas)] text-5xl text-[#0a0a0a] leading-none">
            Eventos
          </h1>
        </div>
      </div>
      <EventsTable events={events ?? []} />
    </div>
  );
}
