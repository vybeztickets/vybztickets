import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";

const SERVICE_FEE = 0.15;

function fmt(n: number) { return "₡" + n.toLocaleString("es-CR"); }
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
  published: "Activo",
  draft: "Borrador",
  cancelled: "Cancelado",
  ended: "Finalizado",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  published: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
  draft: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
  cancelled: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
  ended: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
};

// Sort order: published first, then draft, then ended/cancelled
const STATUS_ORDER: Record<string, number> = { published: 0, draft: 1, ended: 2, cancelled: 3 };

export default async function AdminEventosPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().slice(0, 10);

  const { data: events } = await db
    .from("events")
    .select("id, name, date, status, category, city, organizer_id, created_at");

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

  // Sort: published upcoming first, published past next, then draft, then ended/cancelled
  const sorted = [...(events ?? [])].sort((a, b) => {
    const ao = STATUS_ORDER[a.status] ?? 4;
    const bo = STATUS_ORDER[b.status] ?? 4;
    if (ao !== bo) return ao - bo;
    // Within same status: published → ascending date (upcoming first); others → descending
    if (a.status === "published") return a.date.localeCompare(b.date);
    return b.date.localeCompare(a.date);
  });

  const totalRevenue = Array.from(statsMap.values()).reduce((s, v) => s + v.revenue, 0);
  const totalTickets = Array.from(statsMap.values()).reduce((s, v) => s + v.sold, 0);
  const totalVybzFee = Math.round(totalRevenue * SERVICE_FEE);
  const activeCount = (events ?? []).filter(e => e.status === "published" && e.date >= today).length;
  const finalizedCount = (events ?? []).filter(e => e.status === "ended" || (e.status === "published" && e.date < today)).length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ B2B</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Eventos
        </h1>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Activos", value: activeCount.toString(), color: "#166534", bg: "rgba(0,140,0,0.07)", border: "rgba(0,140,0,0.15)" },
          { label: "Finalizados", value: finalizedCount.toString(), color: "rgba(0,0,0,0.45)", bg: "#fff", border: "rgba(0,0,0,0.07)" },
          { label: "Revenue total", value: fmt(totalRevenue), color: "#0a0a0a", bg: "#fff", border: "rgba(0,0,0,0.07)", sub: `${totalTickets} tickets` },
          { label: "Ingresos Vybz", value: fmt(totalVybzFee), color: "#047857", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>{s.label}</p>
            <p className="font-[family-name:var(--font-bebas)] text-2xl leading-none" style={{ color: s.color }}>{s.value}</p>
            {s.sub && <p className="text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.3)" }}>{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Evento", "Organizador", "Fecha", "Estado", "Tickets", "Revenue", "Vybz fee", ""].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => {
              const org = orgMap.get(e.organizer_id) ?? null;
              const s = statsMap.get(e.id) ?? { sold: 0, revenue: 0 };
              const sc = STATUS_COLORS[e.status] ?? STATUS_COLORS.draft;
              const isUpcoming = e.status === "published" && e.date >= today;
              return (
                <tr key={e.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isUpcoming && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
                      <div>
                        <p className="text-[#0a0a0a] text-sm font-medium">{e.name}</p>
                        <p className="text-[#0a0a0a]/35 text-xs">{e.city}{e.category ? ` · ${e.category}` : ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] text-xs">{org?.full_name ?? "Sin nombre"}</p>
                    <p className="text-[#0a0a0a]/35 text-[10px]">{org?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-[#0a0a0a]/50 text-xs whitespace-nowrap">{fmtDate(e.date)}</td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={sc}>
                      {STATUS_LABEL[e.status] ?? e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm">{s.sold}</td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm font-semibold">{fmt(s.revenue)}</td>
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#047857" }}>{fmt(Math.round(s.revenue * SERVICE_FEE))}</td>
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
