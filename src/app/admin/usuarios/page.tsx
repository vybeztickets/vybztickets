import { createClient as createAdmin } from "@supabase/supabase-js";
import UsuariosTable from "./UsuariosTable";

export default async function AdminUsuariosPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: users, count } = await db
    .from("profiles")
    .select("id, full_name, email, role, country, created_at", { count: "exact" })
    .eq("role", "user")
    .order("created_at", { ascending: false });

  const { data: ticketCounts } = await db.from("tickets").select("user_id");
  const ticketMap = new Map<string, number>();
  for (const t of ticketCounts ?? []) {
    ticketMap.set(t.user_id, (ticketMap.get(t.user_id) ?? 0) + 1);
  }

  const enriched = (users ?? []).map((u: any) => ({
    ...u,
    ticketCount: ticketMap.get(u.id) ?? 0,
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ GENERAL</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Usuarios
        </h1>
        <p className="text-[#0a0a0a]/35 text-sm mt-1">{count ?? 0} usuarios registrados</p>
      </div>
      <UsuariosTable users={enriched} total={count ?? 0} />
    </div>
  );
}
