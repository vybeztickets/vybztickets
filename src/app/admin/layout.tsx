import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { count: pendingCount },
    { count: pendingKyc },
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "pending_activation"),
    db.from("kyc_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <div className="min-h-screen flex" style={{ background: "#f4f4f5" }}>
      <AdminSidebar
        userName={profile?.full_name ?? user.email ?? ""}
        userEmail={profile?.email ?? user.email ?? ""}
        pendingCount={pendingCount ?? 0}
        pendingKyc={pendingKyc ?? 0}
      />
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
