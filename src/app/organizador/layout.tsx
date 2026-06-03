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

  const p = profile as any;
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const organizerType = (p?.business_details as Record<string, unknown> | null)?.organizer_type;
  if (!organizerType && !pathname.startsWith("/organizador/configuracion")) {
    redirect("/organizador/configuracion");
  }

  const hasInventory = organizerType === "discoteca" || organizerType === "festival";
  let lowStockCount = 0;
  if (hasInventory) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: invItems } = await (admin as any)
      .from("inventory_items")
      .select("current_stock, par_level")
      .eq("organizer_id", user.id)
      .eq("is_active", true)
      .gt("par_level", 0);
    lowStockCount = (invItems as any[] ?? []).filter((i: any) => Number(i.current_stock) <= Number(i.par_level)).length;
  }

  const role = p?.role as string | undefined;
  const isSuspended = role === "suspended";
  const isPending = role === "pending_activation";
  const showBanner = isSuspended || isPending;

  return (
    <div className="min-h-screen" style={{ background: "#ffffff", paddingLeft: "280px" }}>
      <OrgSidebar
        userName={p?.full_name ?? user.email ?? ""}
        userEmail={p?.email ?? user.email ?? ""}
        avatarUrl={p?.avatar_url ?? null}
        organizerType={organizerType as string | undefined}
        lowStockCount={lowStockCount}
      />
      <div className="flex flex-col min-h-screen">
        {showBanner && <SuspendedBanner isPending={isPending} />}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
