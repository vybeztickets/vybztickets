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
  const role = profile?.role ?? "organizer";

  return (
    <MarketingClient
      events={(eventsRes.data ?? []) as { id: string; name: string }[]}
      organizerName={profile?.full_name || user.email?.split("@")[0] || ""}
      role={role}
    />
  );
}
