import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RevendedorSidebar from "./RevendedorSidebar";

export default async function RevendedorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/revendedor");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex" style={{ background: "#f7f7f7" }}>
      <RevendedorSidebar
        userName={profile?.full_name ?? user.email ?? ""}
        userEmail={profile?.email ?? user.email ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
