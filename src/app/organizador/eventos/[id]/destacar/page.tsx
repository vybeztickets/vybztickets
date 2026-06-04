import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import DestacarForm from "./DestacarForm";

export const metadata = { title: "Feature event — Vybz" };

export default async function DestacarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("id, name, date, status, image_url")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .maybeSingle();

  if (!event) redirect("/organizador/eventos");

  const today = new Date().toISOString().slice(0, 10);

  const { data: activeFeatured } = await (admin as any)
    .from("featured_events")
    .select("*")
    .eq("event_id", id)
    .eq("organizer_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Total spent on featuring for this event
  const { data: allFeatured } = await (admin as any)
    .from("featured_events")
    .select("total_cost, start_date, end_date, days, status, created_at")
    .eq("event_id", id)
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  const totalSpent = (allFeatured ?? [])
    .filter((f: { status: string }) => f.status !== "cancelled")
    .reduce((s: number, f: { total_cost: number }) => s + f.total_cost, 0);

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0a0a0a] mb-1">Feature on Homepage</h1>
        <p className="text-[#0a0a0a]/40 text-sm">
          Your event appears in the main homepage carousel for the selected period.
        </p>
      </div>

      <DestacarForm
        eventId={id}
        eventName={event.name}
        eventDate={event.date}
        eventImageUrl={event.image_url}
        today={today}
        activeFeatured={activeFeatured ?? null}
        totalSpent={totalSpent}
        history={allFeatured ?? []}
      />
    </div>
  );
}
