import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import QRScanner from "./QRScanner";

export default async function ScannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador");

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, name, date, venue, city, organizer_id")
    .eq("id", id)
    .single();

  if (!event || event.organizer_id !== user.id) notFound();

  return (
    <div className="p-8">
      <p className="text-[#0a0a0a]/30 text-xs uppercase tracking-widest mb-2">Entry scanner</p>
      <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white mb-1">{event.name}</h1>
      <p className="text-[#0a0a0a]/30 text-sm mb-8">{event.venue}, {event.city}</p>
      <div className="max-w-lg">
        <QRScanner eventId={event.id} />
      </div>
    </div>
  );
}
