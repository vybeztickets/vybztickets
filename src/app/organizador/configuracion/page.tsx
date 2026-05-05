import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ConfigTabs from "./ConfigTabs";

export const metadata = { title: "Settings — Dashboard Vybz" };

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador/configuracion");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();

  const organizerType = ((profile as any)?.business_details as Record<string, unknown> | null)?.organizer_type as string | undefined;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#0a0a0a] mb-8">Organizer settings</h1>
      <ConfigTabs
        profile={profile}
        userId={user.id}
        userEmail={user.email ?? ""}
        organizerType={organizerType}
      />
    </div>
  );
}
