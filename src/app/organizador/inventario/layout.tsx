import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function InventarioLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login?redirectTo=/organizador/inventario");

    const admin = createAdminClient();
    const { data: profile } = await (admin as any)
      .from("profiles")
      .select("business_details")
      .eq("id", user.id)
      .single();

    const biz = (profile as any)?.business_details as Record<string, unknown> | null;
    const organizerType = biz?.organizer_type as string | undefined;
    const inventoryEnabled = (biz?.inventory_enabled as boolean | undefined) ?? false;
    const canHaveInventory = organizerType === "discoteca" || organizerType === "festival";

    if (!canHaveInventory || !inventoryEnabled) {
      redirect("/organizador");
    }
  } catch (e: any) {
    // If it's a redirect, re-throw it — redirects use special error types in Next.js
    if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    // Any other error: fall through and let the page render (parent layout handles auth)
  }

  return <>{children}</>;
}
