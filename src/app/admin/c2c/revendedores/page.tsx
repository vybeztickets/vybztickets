import { createClient as createAdmin } from "@supabase/supabase-js";
import RevendedoresTable from "./RevendedoresTable";

export default async function AdminRevendedoresPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: kycs } = await db
    .from("kyc_verifications")
    .select("id, user_id, status, full_name_on_id, cedula_number, payment_method, sinpe_phone, bank_name, submitted_at")
    .order("submitted_at", { ascending: false });

  const userIds = (kycs ?? []).map((k: any) => k.user_id);
  const { data: profiles } = userIds.length > 0
    ? await db.from("profiles").select("id, email, role, country, created_at").in("id", userIds)
    : { data: [] };

  const { data: listings } = await db.from("resale_listings").select("seller_id, status, asking_price");

  type SellerStats = { active: number; sold: number; revenue: number };
  const listingMap = new Map<string, SellerStats>();
  for (const l of listings ?? []) {
    const s = listingMap.get((l as any).seller_id) ?? { active: 0, sold: 0, revenue: 0 };
    if ((l as any).status === "active") s.active++;
    if ((l as any).status === "sold") { s.sold++; s.revenue += (l as any).asking_price ?? 0; }
    listingMap.set((l as any).seller_id, s);
  }

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const rows = (kycs ?? []).map((k: any) => {
    const p = profileMap.get(k.user_id) as any;
    const s = listingMap.get(k.user_id) ?? { active: 0, sold: 0, revenue: 0 };
    return {
      id: k.id,
      user_id: k.user_id,
      status: k.status,
      full_name_on_id: k.full_name_on_id,
      cedula_number: k.cedula_number,
      payment_method: k.payment_method,
      sinpe_phone: k.sinpe_phone,
      bank_name: k.bank_name,
      submitted_at: k.submitted_at,
      email: p?.email ?? null,
      country: p?.country ?? null,
      active: s.active,
      sold: s.sold,
      revenue: s.revenue,
    };
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ REVENTA C2C</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Revendedores
        </h1>
        <p className="text-[#0a0a0a]/35 text-sm mt-1">{rows.length} revendedores registrados</p>
      </div>
      <RevendedoresTable rows={rows} total={rows.length} />
    </div>
  );
}
