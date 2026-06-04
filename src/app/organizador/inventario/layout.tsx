import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function InventarioLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador/inventario");

  const { data: profile } = await supabase
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

  return <>{children}</>;
}
