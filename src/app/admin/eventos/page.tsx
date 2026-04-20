import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";

function fmt(n: number) { return "₡" + n.toLocaleString("es-CR"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  published: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
  draft: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
  cancelled: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
  ended: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
};

export default async function AdminEventosPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: events } = await db
    .from("events")
    .select("id, name, date, status, category, city, organizer_id, created_at")
    .order("created_at", { ascending: false });

  const orgIds = [...new Set((events ?? []).map((e) => e.organizer_id).filter(Boolean))];
  const { data: orgProfiles } = orgIds.length > 0
    ? await db.from("profiles").select("id, full_name, email").in("id", orgIds)
    : { data: [] };
  const orgMap = new Map((orgProfiles ?? []).map((p) => [p.id, p]));

  const eventIds = (events ?? []).map((e) => e.id);
  const { data: tickets } = eventIds.length > 0
    ? await db.from("tickets").select("event_id, purchase_price, status").in("event_id", eventIds)
    : { data: [] };

  type Stats = { sold: number; revenue: number };
  const statsMap = new Map<string, Stats>();
  for (const t of tickets ?? []) {
    const s = statsMap.get(t.event_id) ?? { sold: 0, revenue: 0 };
    if (t.status !== "refunded") { s.sold++; s.revenue += t.purchase_price ?? 0; }
    statsMap.set(t.event_id, s);
  }

  const totalRevenue = Array.from(statsMap.values()).reduce((s, v) => s + v.revenue, 0);
  const totalTickets = Array.from(statsMap.values()).reduce((s, v) => s + v.sold, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ B2B</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Eventos
        </h1>
        <p className="text-[#0a0a0a]/35 text-sm mt-1">{(events ?? []).length} eventos · {totalTickets} tickets · {fmt(totalRevenue)} en revenue</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Evento", "Organizador", "Fecha", "Estado", "Tickets", "Revenue", ""].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((e) => {
              const org = orgMap.get(e.organizer_id) ?? null;
              const s = statsMap.get(e.id) ?? { sold: 0, revenue: 0 };
              const sc = STATUS_COLORS[e.status] ?? STATUS_COLORS.draft;
              return (
                <tr key={e.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] text-sm font-medium">{e.name}</p>
                    <p className="text-[#0a0a0a]/35 text-xs">{e.city} · {e.category}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] text-xs">{org?.full_name ?? "Sin nombre"}</p>
                    <p className="text-[#0a0a0a]/35 text-[10px]">{org?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-[#0a0a0a]/50 text-xs">{fmtDate(e.date)}</td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={sc}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm">{s.sold}</td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm font-semibold">{fmt(s.revenue)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/eventos/${e.id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">Ver →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
