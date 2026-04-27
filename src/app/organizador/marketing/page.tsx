import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import MarketingClient from "./MarketingClient";

export const metadata = { title: "Marketing — Vybz Tickets" };

export default async function MarketingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();

  const [profileRes, eventsRes] = await Promise.all([
    admin.from("profiles").select("role, full_name, email, avatar_url").eq("id", user.id).single(),
    admin.from("events").select("id, name").eq("organizer_id", user.id).eq("status", "published").order("date", { ascending: false }),
  ]);

  const profile = profileRes.data as { role: string; full_name: string | null; email: string | null; avatar_url: string | null } | null;
  const role = profile?.role;
  const blocked = role === "suspended" || role === "pending_activation";

  if (blocked) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(180,83,9,0.1)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#0a0a0a] tracking-wide mb-2">Marketing bloqueado</h2>
          <p className="text-[#0a0a0a]/50 text-sm leading-relaxed">El envío de comunicaciones está deshabilitado mientras tu cuenta esté inactiva.</p>
        </div>
      </div>
    );
  }

  return (
    <MarketingClient
      events={(eventsRes.data ?? []) as { id: string; name: string }[]}
      organizerName={profile?.full_name || user.email?.split("@")[0] || ""}
    />
  );
}
