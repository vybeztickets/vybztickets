import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ConfigTabs from "./ConfigTabs";

export const metadata = { title: "Configuración — Dashboard Vybz" };

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador/configuracion");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#0a0a0a] mb-8">Configuración del organizador</h1>
      <ConfigTabs profile={profile} userId={user.id} userEmail={user.email ?? ""} />
    </div>
  );
}
