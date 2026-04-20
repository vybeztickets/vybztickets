import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";
import ToggleAccount from "./ToggleAccount";

function fmt(n: number) { return "₡" + n.toLocaleString("es-CR"); }

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  admin: { bg: "rgba(255,255,255,0.15)", color: "#fff" },
  organizer: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
  suspended: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
  pending_activation: { bg: "rgba(180,83,9,0.12)", color: "#b45309" },
};

export default async function AdminOrganizadoresPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: organizers } = await db
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false });

  const { data: eventStats } = await db
    .from("events")
    .select("organizer_id, status");

  const { data: ticketStats } = await db
    .from("tickets")
    .select("event_id, purchase_price, events(organizer_id)");

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

  const orgsWithEvents = (organizers ?? []).filter((o) => statsMap.has(o.id));
  const pendingCount = orgsWithEvents.filter((o) => o.role === "pending_activation").length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ B2B</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Organizadores
        </h1>
        <p className="text-[#0a0a0a]/35 text-sm mt-1">
          {orgsWithEvents.length} organizadores con eventos
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(180,83,9,0.12)", color: "#b45309" }}>
              {pendingCount} solicitud{pendingCount > 1 ? "es" : ""} de activación
            </span>
          )}
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Organizador", "Eventos", "Revenue total", "Rol", "Cuenta", ""].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orgsWithEvents.map((o) => {
              const s = statsMap.get(o.id) ?? { events: 0, revenue: 0 };
              const rs = ROLE_STYLE[o.role] ?? ROLE_STYLE.organizer;
              const isPending = o.role === "pending_activation";
              return (
                <tr
                  key={o.id}
                  style={{
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                    background: isPending ? "rgba(180,83,9,0.03)" : undefined,
                  }}
                  className="hover:bg-black/[0.01]"
                >
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] font-medium text-sm">{o.full_name ?? "Sin nombre"}</p>
                    <p className="text-[#0a0a0a]/35 text-xs">{o.email}</p>
                  </td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm">{s.events}</td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm font-semibold">{fmt(s.revenue)}</td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={rs}>
                      {o.role === "pending_activation" ? "Pendiente" : o.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ToggleAccount userId={o.id} role={o.role} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/organizadores/${o.id}`}
                      className="text-xs font-semibold text-[#0a0a0a]/40 hover:text-[#0a0a0a] transition-colors">
                      Ver detalle →
                    </Link>
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
