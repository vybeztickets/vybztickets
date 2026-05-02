import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import TransferClient from "./TransferClient";

export const metadata = { title: "Transfer a ticket — Vybz Tickets" };

export default async function TransferPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/transfer");
  }

  const admin = createAdminClient();

  // Get user email from profiles, fallback to auth email
  const { data: profile } = await (admin as any)
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  const userEmail: string = (
    profile?.email ?? user.email ?? ""
  ).toLowerCase();

  // Fetch user tickets
  const { data: tickets } = await (admin as any)
    .from("tickets")
    .select(
      `id, qr_code, buyer_name, buyer_email, purchase_price, status, created_at,
       transferred_from, transferred_to, transferred_at, ticket_type_id,
       ticket_types(id, name),
       events(id, name, date, time, venue, city, currency)`
    )
    .eq("buyer_email", userEmail)
    .in("status", ["active", "used", "transferred"])
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <Navbar />
      <TransferClient tickets={tickets ?? []} userEmail={userEmail} />
    </div>
  );
}
