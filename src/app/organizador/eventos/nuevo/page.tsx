import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewEventForm from "./NewEventForm";

export const metadata = { title: "Nuevo Evento — Vybz Tickets" };

export default async function NewEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, currency, avatar_url, full_name, description")
    .eq("id", user.id)
    .single();

  const role = (profile as any)?.role as string | undefined;
  const profileCurrency: string = (profile as any)?.currency ?? "CRC";
  const blocked = role === "suspended" || role === "pending_activation";
  const profileIncomplete = !(profile as any)?.avatar_url || !(profile as any)?.full_name;

  if (blocked) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(220,38,38,0.08)" }}>
            <span className="text-3xl font-black" style={{ color: "#dc2626", lineHeight: 1 }}>!</span>
          </div>
          <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#0a0a0a] tracking-wide mb-2">Cuenta inactiva</h2>
          <p className="text-[#0a0a0a]/50 text-sm leading-relaxed">
            {role === "pending_activation"
              ? "Tu solicitud de activación está en revisión. Te notificaremos cuando tu cuenta sea activada."
              : "Tu cuenta está inactiva. Usa el botón de activación en la barra superior para enviar una solicitud al equipo."}
          </p>
        </div>
      </div>
    );
  }

  if (profileIncomplete) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#0a0a0a] tracking-wide mb-2">Completa tu perfil primero</h2>
          <p className="text-[#0a0a0a]/50 text-sm leading-relaxed mb-6">
            Antes de crear un evento necesitás tener tu nombre y foto de perfil configurados. Esto aparecerá en tu página pública de organizador.
          </p>
          <Link
            href="/organizador/configuracion"
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "#0a0a0a", color: "#fff" }}
          >
            Completar perfil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <p className="text-[#0a0a0a]/30 text-sm font-medium tracking-widest uppercase mb-2">Eventos</p>
      <h1 className="font-[family-name:var(--font-bebas)] text-5xl tracking-wide text-[#0a0a0a] mb-10">
        Nuevo Evento
      </h1>
      <div className="max-w-2xl">
        <NewEventForm organizerId={user.id} defaultCurrency={profileCurrency} />
      </div>
    </div>
  );
}
