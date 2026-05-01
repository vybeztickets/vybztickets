import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import PedidosManager from "@/app/organizador/eventos/[id]/pedidos/PedidosManager";

function fmt(n: number) { return "$" + n.toLocaleString("en-US"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  published: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
  draft: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
  cancelled: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
  ended: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
};

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: event } = await db
    .from("events")
    .select("id, name, date, status, category, city, description, organizer_id, created_at")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const { data: orgProfile } = await db
    .from("profiles")
    .select("full_name, email")
    .eq("id", event.organizer_id)
    .maybeSingle();

  const org = orgProfile;

  const { data: ticketTypes } = await db
    .from("ticket_types")
    .select("id, name, price, total_available, sold_count")
    .eq("event_id", id);

  const { data: rawTickets } = await db
    .from("tickets")
    .select("id, event_id, buyer_name, buyer_email, buyer_phone, buyer_notes, purchase_price, status, promo_code, created_at, qr_code, ticket_type_id, ticket_types(id, name, price)")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  const tickets = rawTickets ?? [];

  const sold = tickets.filter((t) => t.status !== "refunded").length;
  const revenue = tickets.filter((t) => t.status !== "refunded").reduce((s, t) => s + (t.purchase_price ?? 0), 0);
  const refunded = tickets.filter((t) => t.status === "refunded").length;

  const sc = STATUS_COLORS[event.status] ?? STATUS_COLORS.draft;

  return (
    <div className="p-8">
      <div className="mb-2">
        <Link href="/admin/eventos" className="text-[#0a0a0a]/35 text-xs hover:text-[#0a0a0a] transition-colors">
          ← Eventos
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 mt-4">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(24px,3vw,36px)" }}>
            {event.name}
          </h1>
          <p className="text-[#0a0a0a]/40 text-sm mt-1">{event.city} · {event.category} · {fmtDate(event.date)}</p>
          <p className="text-[#0a0a0a]/25 text-xs mt-0.5">
            Organizador: <Link href={`/admin/organizadores/${event.organizer_id}`} className="hover:text-[#0a0a0a] transition-colors">{org?.full_name ?? org?.email ?? "—"}</Link>
          </p>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full" style={sc}>
          {event.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tickets vendidos", value: sold },
          { label: "Revenue", value: fmt(revenue) },
          { label: "Reembolsados", value: refunded },
          { label: "Tipos de ticket", value: (ticketTypes ?? []).length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[#0a0a0a]/35 text-[10px] uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-2xl leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Ticket types */}
      {(ticketTypes ?? []).length > 0 && (
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[#0a0a0a] font-semibold text-sm">Tipos de ticket</p>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Nombre", "Precio", "Capacidad", "Vendidos", "Disponibles"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(ticketTypes ?? []).map((tt) => (
                <tr key={tt.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <td className="px-6 py-3 text-sm text-[#0a0a0a] font-medium">{tt.name}</td>
                  <td className="px-6 py-3 text-sm text-[#0a0a0a]">{fmt(tt.price ?? 0)}</td>
                  <td className="px-6 py-3 text-sm text-[#0a0a0a]/60">{tt.total_available ?? "∞"}</td>
                  <td className="px-6 py-3 text-sm text-[#0a0a0a]">{tt.sold_count ?? 0}</td>
                  <td className="px-6 py-3 text-sm text-[#0a0a0a]/60">
                    {tt.total_available != null ? Math.max(0, (tt.total_available ?? 0) - (tt.sold_count ?? 0)) : "∞"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendees */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm">Compradores ({tickets.length})</p>
        </div>
        <div className="p-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <PedidosManager tickets={tickets as any} />
        </div>
      </div>
    </div>
  );
}
