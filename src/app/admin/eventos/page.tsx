import { createClient as createAdmin } from "@supabase/supabase-js";
import EventosAdminTable from "./EventosAdminTable";

const SERVICE_FEE = 0.15;

export default async function AdminEventosPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().slice(0, 10);

  const { data: events } = await db
    .from("events")
    .select("id, name, date, status, category, city, organizer_id, created_at");

  const orgIds = [...new Set((events ?? []).map((e: any) => e.organizer_id).filter(Boolean))];
  const { data: orgProfiles } = orgIds.length > 0
    ? await db.from("profiles").select("id, full_name, email").in("id", orgIds)
    : { data: [] };
  const orgMap = new Map((orgProfiles ?? []).map((p: any) => [p.id, p]));

  const eventIds = (events ?? []).map((e: any) => e.id);
  const { data: tickets } = eventIds.length > 0
    ? await db.from("tickets").select("event_id, purchase_price, status").in("event_id", eventIds)
    : { data: [] };

  type Stats = { sold: number; revenue: number };
  const statsMap = new Map<string, Stats>();
  for (const t of tickets ?? []) {
    const s = statsMap.get((t as any).event_id) ?? { sold: 0, revenue: 0 };
    if ((t as any).status !== "refunded") { s.sold++; s.revenue += (t as any).purchase_price ?? 0; }
    statsMap.set((t as any).event_id, s);
  }

  const STATUS_ORDER: Record<string, number> = { published: 0, draft: 1, ended: 2, cancelled: 3 };
  const sorted = [...(events ?? [])].sort((a: any, b: any) => {
    const ao = STATUS_ORDER[a.status] ?? 4;
    const bo = STATUS_ORDER[b.status] ?? 4;
    if (ao !== bo) return ao - bo;
    return a.status === "published" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
  });

  const rows = sorted.map((e: any) => {
    const org = orgMap.get(e.organizer_id) as any ?? null;
    const s = statsMap.get(e.id) ?? { sold: 0, revenue: 0 };
    return {
      id: e.id,
      name: e.name,
      date: e.date,
      status: e.status,
      category: e.category ?? null,
      city: e.city ?? null,
      orgName: org?.full_name ?? null,
      orgEmail: org?.email ?? null,
      sold: s.sold,
      revenue: s.revenue,
      vybzFee: Math.round(s.revenue * SERVICE_FEE),
      isUpcoming: e.status === "published" && e.date >= today,
    };
  });

  const totalRevenue = Array.from(statsMap.values()).reduce((s, v) => s + v.revenue, 0);
  const totalTickets = Array.from(statsMap.values()).reduce((s, v) => s + v.sold, 0);
  const stats = {
    active: (events ?? []).filter((e: any) => e.status === "published" && e.date >= today).length,
    finalized: (events ?? []).filter((e: any) => e.status === "ended" || (e.status === "published" && e.date < today)).length,
    totalRevenue,
    totalTickets,
    vybzFee: Math.round(totalRevenue * SERVICE_FEE),
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ B2B</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Eventos
        </h1>
      </div>
      <EventosAdminTable events={rows} stats={stats} />
    </div>
  );
}
