import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";

function fmt(n: number) { return "₡" + n.toLocaleString("es-CR"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

const KYC_COLORS: Record<string, { bg: string; color: string }> = {
  approved: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
  pending: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
  rejected: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
  suspended: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
};

export default async function AdminRevendedoresPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: kycs } = await db
    .from("kyc_verifications")
    .select("id, user_id, status, full_name_on_id, cedula_number, payment_method, sinpe_phone, bank_name, submitted_at")
    .order("submitted_at", { ascending: false });

  const userIds = (kycs ?? []).map((k) => k.user_id);
  const { data: profiles } = userIds.length > 0
    ? await db.from("profiles").select("id, email, role, created_at").in("id", userIds)
    : { data: [] };

  const { data: listings } = await db
    .from("resale_listings")
    .select("seller_id, status, asking_price");

  type SellerStats = { active: number; sold: number; revenue: number };
  const listingMap = new Map<string, SellerStats>();
  for (const l of listings ?? []) {
    const s = listingMap.get(l.seller_id) ?? { active: 0, sold: 0, revenue: 0 };
    if (l.status === "active") s.active++;
    if (l.status === "sold") { s.sold++; s.revenue += l.asking_price ?? 0; }
    listingMap.set(l.seller_id, s);
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ REVENTA C2C</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Revendedores
        </h1>
        <p className="text-[#0a0a0a]/35 text-sm mt-1">{(kycs ?? []).length} revendedores registrados</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Revendedor", "KYC", "Método de cobro", "Listings activos", "Vendidos", "Revenue", "Desde", ""].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(kycs ?? []).map((k) => {
              const p = profileMap.get(k.user_id);
              const s = listingMap.get(k.user_id) ?? { active: 0, sold: 0, revenue: 0 };
              const kc = KYC_COLORS[k.status] ?? KYC_COLORS.pending;
              return (
                <tr key={k.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] text-sm font-medium">{k.full_name_on_id}</p>
                    <p className="text-[#0a0a0a]/35 text-xs">{p?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={kc}>{k.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#0a0a0a]/60">
                    {k.payment_method === "sinpe_movil" ? `SINPE ${k.sinpe_phone ?? ""}` : k.bank_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]">{s.active}</td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]">{s.sold}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#0a0a0a]">{fmt(s.revenue)}</td>
                  <td className="px-6 py-4 text-xs text-[#0a0a0a]/50">{fmtDate(k.submitted_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/usuarios/${k.user_id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">Ver →</Link>
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
