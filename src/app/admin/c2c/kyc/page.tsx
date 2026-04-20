import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import KycReviewList from "../../kyc/KycReviewList";

export default async function AdminC2CKycPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: records } = await db
    .from("kyc_verifications")
    .select("id, user_id, status, full_name_on_id, cedula_number, payment_method, sinpe_phone, bank_name, bank_account_iban, rejection_reason, submitted_at, cedula_front_url, cedula_back_url, selfie_url")
    .in("status", ["pending", "rejected"])
    .order("submitted_at", { ascending: true });

  const enriched = await Promise.all(
    (records ?? []).map(async (r) => {
      const signUrl = async (path: string | null) => {
        if (!path) return null;
        const { data } = await db.storage.from("kyc-documents").createSignedUrl(path, 3600);
        return data?.signedUrl ?? null;
      };
      return {
        ...r,
        cedula_front_signed: await signUrl(r.cedula_front_url),
        cedula_back_signed: await signUrl(r.cedula_back_url),
        selfie_signed: await signUrl(r.selfie_url),
      };
    })
  );

  const { count: approvedCount } = await db
    .from("kyc_verifications")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ REVENTA C2C</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Verificaciones KYC
        </h1>
        <p className="text-[#0a0a0a]/35 text-sm mt-1">
          {enriched.length} pendientes de revisión · {approvedCount ?? 0} aprobados
        </p>
      </div>

      <KycReviewList records={enriched} reviewerId={user.id} />
    </div>
  );
}
