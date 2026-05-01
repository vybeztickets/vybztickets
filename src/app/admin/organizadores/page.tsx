import { createClient as createAdmin } from "@supabase/supabase-js";
import OrganizadoresTable from "./OrganizadoresTable";

export default async function AdminOrganizadoresPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: organizers } = await db
    .from("profiles")
    .select("id, full_name, email, role, country, created_at")
    .order("created_at", { ascending: false });

  const { data: eventStats } = await db.from("events").select("organizer_id, status");
  const { data: ticketStats } = await db.from("tickets").select("event_id, purchase_price, events(organizer_id)");

  type OrgStats = { events: number; revenue: number };
  const statsMap = new Map<string, OrgStats>();
  for (const e of eventStats ?? []) {
    const s = statsMap.get(e.organizer_id) ?? { events: 0, revenue: 0 };
    s.events++;
    statsMap.set(e.organizer_id, s);
  }
  for (const t of ticketStats ?? []) {
    const ev = t.events as unknown as { organizer_id: string } | null;
    if (!ev) continue;
    const s = statsMap.get(ev.organizer_id) ?? { events: 0, revenue: 0 };
    s.revenue += t.purchase_price ?? 0;
    statsMap.set(ev.organizer_id, s);
  }

  const ORG_ROLES = new Set(["organizer", "suspended", "pending_activation"]);

  const orgsWithEvents = (organizers ?? [])
    .filter((o: any) => ORG_ROLES.has(o.role))
    .map((o: any) => ({
      id: o.id,
      full_name: o.full_name,
      email: o.email,
      role: o.role,
      country: o.country ?? null,
      events: statsMap.get(o.id)?.events ?? 0,
      revenue: statsMap.get(o.id)?.revenue ?? 0,
    }));

  const pendingCount = orgsWithEvents.filter(o => o.role === "pending_activation").length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ B2B</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Organizadores
        </h1>
        <p className="text-[#0a0a0a]/35 text-sm mt-1">{orgsWithEvents.length} organizadores con eventos</p>
      </div>
      <OrganizadoresTable orgs={orgsWithEvents} total={orgsWithEvents.length} pendingCount={pendingCount} />
    </div>
  );
}
