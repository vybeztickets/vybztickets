import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import OrgSidebar from "./OrgSidebar";
import SuspendedBanner from "./SuspendedBanner";

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, role, business_details")
    .eq("id", user.id)
    .single();

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const organizerType = (profile?.business_details as Record<string, unknown> | null)?.organizer_type;
  if (!organizerType && !pathname.startsWith("/organizador/configuracion")) {
    redirect("/organizador/configuracion");
  }

  const role = profile?.role as string | undefined;
  const isSuspended = role === "suspended";
  const isPending = role === "pending_activation";
  const showBanner = isSuspended || isPending;

  return (
    <div className="min-h-screen" style={{ background: "#ffffff", paddingLeft: "220px" }}>
      <OrgSidebar
        userName={profile?.full_name ?? user.email ?? ""}
        userEmail={profile?.email ?? user.email ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <div className="flex flex-col min-h-screen">
        {showBanner && <SuspendedBanner isPending={isPending} />}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
