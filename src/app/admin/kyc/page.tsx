import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import KycReviewList from "./KycReviewList";

export const metadata = { title: "KYC Review — Admin" };

export default async function AdminKycPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/admin/kyc");

  // Only admins
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  // Fetch pending verifications via admin client
  const adminSupabase = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pending } = await adminSupabase
    .from("kyc_verifications")
    .select(`
      id, status, full_name_on_id, cedula_number,
      payment_method, sinpe_phone, bank_name, bank_account_iban,
      cedula_front_url, cedula_back_url, selfie_url,
      rejection_reason, submitted_at, user_id
    `)
    .in("status", ["pending", "rejected"])
    .order("submitted_at", { ascending: true });

  // Generate signed URLs for each document (1h expiry)
  type KycRow = NonNullable<typeof pending>[number];
  const BUCKET = "kyc-documents";

  async function signedUrl(path: string | null): Promise<string | null> {
    if (!path) return null;
    const { data } = await adminSupabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  }

  const records = await Promise.all(
    (pending ?? []).map(async (row: KycRow) => ({
      ...row,
      cedula_front_signed: await signedUrl(row.cedula_front_url),
      cedula_back_signed: await signedUrl(row.cedula_back_url),
      selfie_signed: await signedUrl(row.selfie_url),
    }))
  );

  // Also fetch approved count for stats
  const { count: approvedCount } = await adminSupabase
    .from("kyc_verifications")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  return (
    <div className="min-h-screen p-8" style={{ background: "#f7f7f7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ ADMIN</p>
          <h1
            className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide"
            style={{ fontSize: "clamp(28px,3vw,40px)" }}
          >
            Verificaciones KYC
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Pendientes", value: records.filter(r => r.status === "pending").length, color: "#0a0a0a" },
            { label: "Aprobadas", value: approvedCount ?? 0, color: "#166534" },
            { label: "Rechazadas", value: records.filter(r => r.status === "rejected").length, color: "#991b1b" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[#0a0a0a]/35 text-[10px] uppercase tracking-wider mb-1">{s.label}</p>
              <p className="font-[family-name:var(--font-bebas)] text-2xl leading-none" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[#0a0a0a]/30 text-sm">No hay verificaciones pendientes.</p>
          </div>
        ) : (
          <KycReviewList records={records} reviewerId={user.id} />
        )}
      </div>
    </div>
  );
}
