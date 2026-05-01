import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToggleAccount from "../ToggleAccount";

function fmt(n: number) { return "$" + n.toLocaleString("en-US"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: org } = await db
    .from("profiles")
    .select("id, full_name, email, role, created_at, avatar_url")
    .eq("id", id)
    .single();

  if (!org) notFound();

  const { data: events } = await db
    .from("events")
    .select("id, name, date, status, category, city")
    .eq("organizer_id", id)
    .order("date", { ascending: false });

  // Tickets per event
  const eventIds = (events ?? []).map((e) => e.id);
  const { data: tickets } = eventIds.length > 0
    ? await db.from("tickets").select("event_id, purchase_price, status, created_at").in("event_id", eventIds)
    : { data: [] };

  type EventStats = { sold: number; revenue: number; refunded: number };
  const ticketMap = new Map<string, EventStats>();
  for (const t of tickets ?? []) {
    const s = ticketMap.get(t.event_id) ?? { sold: 0, revenue: 0, refunded: 0 };
    if (t.status === "refunded") s.refunded++;
    else { s.sold++; s.revenue += t.purchase_price ?? 0; }
    ticketMap.set(t.event_id, s);
  }

  const totalRevenue = Array.from(ticketMap.values()).reduce((s, v) => s + v.revenue, 0);
  const totalTickets = Array.from(ticketMap.values()).reduce((s, v) => s + v.sold, 0);

  return (
    <div className="p-8">
      <div className="mb-2">
        <Link href="/admin/organizadores" className="text-[#0a0a0a]/35 text-xs hover:text-[#0a0a0a] transition-colors">
          ← Organizadores
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 mt-4">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(24px,3vw,36px)" }}>
            {org.full_name ?? "Sin nombre"}
          </h1>
          <p className="text-[#0a0a0a]/40 text-sm mt-1">{org.email}</p>
          <p className="text-[#0a0a0a]/25 text-xs mt-0.5">Desde {fmtDate(org.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          {org.role !== "admin" && <ToggleAccount userId={org.id} role={org.role} />}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Eventos", value: (events ?? []).length },
          { label: "Tickets vendidos", value: totalTickets },
          { label: "Revenue total", value: fmt(totalRevenue) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[#0a0a0a]/35 text-[10px] uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-2xl leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Activation request alert */}
      {org.role === "pending_activation" && (
        <div className="mb-6 rounded-2xl p-5 flex items-start gap-4" style={{ background: "rgba(180,83,9,0.06)", border: "1px solid rgba(180,83,9,0.2)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#92400e" }}>Solicitud de activación de cuenta</p>
            <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>El organizador ha solicitado la activación de su cuenta. Usa el toggle para aprobarla o rechazarla.</p>
          </div>
        </div>
      )}

      {/* Events table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm">Eventos</p>
        </div>
        {(events ?? []).length === 0 ? (
          <p className="text-[#0a0a0a]/25 text-sm p-8 text-center">Sin eventos</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Evento", "Fecha", "Estado", "Tickets", "Revenue", ""].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(events ?? []).map((e) => {
                const s = ticketMap.get(e.id) ?? { sold: 0, revenue: 0, refunded: 0 };
                return (
                  <tr key={e.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <p className="text-[#0a0a0a] text-sm font-medium">{e.name}</p>
                      <p className="text-[#0a0a0a]/35 text-xs">{e.city} · {e.category}</p>
                    </td>
                    <td className="px-6 py-4 text-[#0a0a0a]/50 text-xs">{fmtDate(e.date)}</td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                        style={{ background: e.status === "published" ? "rgba(0,140,0,0.1)" : "rgba(0,0,0,0.06)", color: e.status === "published" ? "#166534" : "rgba(0,0,0,0.4)" }}>
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
        )}
      </div>
    </div>
  );
}
