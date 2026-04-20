import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin: { bg: "#0a0a0a", color: "#fff" },
  organizer: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
  reseller: { bg: "rgba(0,80,200,0.1)", color: "#1e40af" },
  buyer: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
  suspended: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
};

export default async function AdminUsuariosPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: users, count } = await db
    .from("profiles")
    .select("id, full_name, email, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  const { data: ticketCounts } = await db
    .from("tickets")
    .select("user_id");

  const ticketMap = new Map<string, number>();
  for (const t of ticketCounts ?? []) {
    ticketMap.set(t.user_id, (ticketMap.get(t.user_id) ?? 0) + 1);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ GENERAL</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Usuarios
        </h1>
        <p className="text-[#0a0a0a]/35 text-sm mt-1">{count ?? 0} usuarios registrados</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Usuario", "Rol", "Tickets comprados", "Registrado", ""].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => {
              const rc = ROLE_COLORS[u.role] ?? ROLE_COLORS.buyer;
              return (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] font-medium text-sm">{u.full_name ?? "Sin nombre"}</p>
                    <p className="text-[#0a0a0a]/35 text-xs">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={rc}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#0a0a0a] text-sm">{ticketMap.get(u.id) ?? 0}</td>
                  <td className="px-6 py-4 text-[#0a0a0a]/50 text-xs">{fmtDate(u.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/usuarios/${u.id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">Ver →</Link>
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
