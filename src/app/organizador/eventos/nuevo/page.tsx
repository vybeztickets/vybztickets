import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewEventForm from "./NewEventForm";

export const metadata = { title: "Nuevo Evento — Vybz Tickets" };

export default async function NewEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  const blocked = role === "suspended" || role === "pending_activation";

  if (blocked) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(180,83,9,0.1)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
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

  return (
    <div className="p-8">
      <p className="text-[#0a0a0a]/30 text-sm font-medium tracking-widest uppercase mb-2">Eventos</p>
      <h1 className="font-[family-name:var(--font-bebas)] text-5xl tracking-wide text-[#0a0a0a] mb-10">
        Nuevo Evento
      </h1>
      <div className="max-w-2xl">
        <NewEventForm organizerId={user.id} />
      </div>
    </div>
  );
}
