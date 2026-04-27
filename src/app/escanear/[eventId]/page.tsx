import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import ScannerApp from "./ScannerApp";

export default async function EscanearPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirectTo=/escanear/${eventId}`);

  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("id, name, date, venue, city, organizer_id")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  // Allow if organizer or has scanner_access
  const isOrganizer = event.organizer_id === user.id;
  if (!isOrganizer) {
    const { data: profile } = await admin.from("profiles").select("email").eq("id", user.id).single();
    const userEmail = profile?.email ?? "";
    const { data: access } = await (admin as any).from("scanner_access")
      .select("id").eq("event_id", eventId).eq("email", userEmail).single();
    if (!access) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
          <div className="text-center px-6">
            <p className="text-white/20 text-sm mb-2">Sin acceso</p>
            <p className="text-white font-semibold">No tenés permiso para escanear este evento.</p>
            <p className="text-white/30 text-xs mt-2">Pedile al organizador que agregue tu email como escáner.</p>
          </div>
        </div>
      );
    }
  }

  return <ScannerApp eventId={event.id} eventName={event.name} />;
}
