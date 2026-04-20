import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KycForm from "./KycForm";

export const metadata = { title: "Verificación de identidad — Vybz" };

export default async function VerificacionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/revendedor/verificacion");

  const { data: kyc } = await supabase
    .from("kyc_verifications")
    .select("id, status, rejection_reason, submitted_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ VERIFICACIÓN</p>
        <h1
          className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide"
          style={{ fontSize: "clamp(28px,3vw,40px)" }}
        >
          Verificá tu identidad
        </h1>
        <p className="text-[#0a0a0a]/40 text-sm mt-2 max-w-md">
          Para vender entradas necesitás verificar tu identidad. Esto protege a compradores y vendedores, y cumple con las regulaciones de Costa Rica.
        </p>
      </div>

      {/* Status banners */}
      {kyc?.status === "pending" && (
        <div
          className="rounded-2xl p-5 mb-6 flex items-start gap-4"
          style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#0a0a0a]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <p className="text-[#0a0a0a] font-semibold text-sm">En revisión</p>
            <p className="text-[#0a0a0a]/45 text-xs mt-0.5">
              Tu solicitud está siendo revisada por nuestro equipo. Esto puede tardar hasta 48 horas hábiles. Te notificaremos por email.
            </p>
          </div>
        </div>
      )}

      {kyc?.status === "approved" && (
        <div
          className="rounded-2xl p-5 mb-6 flex items-start gap-4"
          style={{ background: "rgba(0,140,0,0.06)", border: "1px solid rgba(0,140,0,0.15)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(0,140,0,0.15)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#166534" }}>Identidad verificada</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(22,101,52,0.6)" }}>
              Tu cuenta está habilitada para vender entradas en Vybz.
            </p>
          </div>
        </div>
      )}

      {kyc?.status === "rejected" && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "rgba(200,0,0,0.04)", border: "1px solid rgba(200,0,0,0.12)" }}
        >
          <p className="font-semibold text-sm text-red-700 mb-1">Verificación rechazada</p>
          <p className="text-xs text-red-600/70 mb-3">
            {kyc.rejection_reason ?? "Los documentos enviados no pudieron ser verificados."}
          </p>
          <p className="text-xs text-red-600/50">Podés volver a enviar tu documentación corregida.</p>
        </div>
      )}

      {/* Form — show if not approved or pending */}
      {(!kyc || kyc.status === "rejected") && <KycForm />}

      {/* Approved state */}
      {kyc?.status === "approved" && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
        >
          <p className="text-[#0a0a0a]/40 text-sm mb-4">Tu cuenta está verificada y podés vender entradas.</p>
          <a
            href="/revendedor/nueva-venta"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
          >
            Vender una entrada
          </a>
        </div>
      )}

      {/* Why section */}
      {!kyc && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: "Protección legal", desc: "Cumplimos con la Ley 8204 y regulaciones de SUGEF sobre identificación de partes en transacciones." },
            { title: "Anti-fraude", desc: "La verificación de cédula + selfie impide que actores maliciosos vendan entradas fraudulentas." },
            { title: "Fondos seguros", desc: "Tu cuenta bancaria o SINPE verificado es el único destino posible para tus pagos. Sin sorpresas." },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-4"
              style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <p className="text-[#0a0a0a] font-semibold text-xs mb-1.5">{f.title}</p>
              <p className="text-[#0a0a0a]/35 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
