import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import FinanzasTabs from "./FinanzasTabs";

export const metadata = { title: "Finanzas — Dashboard Vybz" };

export default async function FinanzasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador/finanzas");

  const admin = createAdminClient();

  const { data: events } = await admin
    .from("events")
    .select("id")
    .eq("organizer_id", user.id);

  const eventIds = (events ?? []).map((e) => e.id);

  const { data: tickets } = await admin
    .from("tickets")
    .select("purchase_price, created_at, status")
    .in("event_id", eventIds.length > 0 ? eventIds : ["none"]);

  const allTickets = tickets ?? [];
  const totalRevenue = allTickets.filter((t) => t.status === "active" || t.status === "used")
    .reduce((s, t) => s + t.purchase_price, 0);

  const platformFee = Math.round(totalRevenue * 0.15);
  const available = totalRevenue - platformFee;

  // Group by date for transactions
  const txByDate: Record<string, number> = {};
  allTickets.forEach((t) => {
    if (t.status !== "active" && t.status !== "used") return;
    const date = t.created_at.slice(0, 10);
    txByDate[date] = (txByDate[date] ?? 0) + t.purchase_price;
  });

  const transactions = Object.entries(txByDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 20)
    .map(([date, amount]) => ({ date, amount }));

  const { data: bankAccountsData } = await (admin as any)
    .from("bank_accounts")
    .select("*")
    .eq("organizer_id", user.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  // Featured event costs (unpaid, deducted at withdrawal)
  const { data: featuredData } = await (admin as any)
    .from("featured_events")
    .select("total_cost, currency, event_id, start_date, end_date, days, status")
    .eq("organizer_id", user.id)
    .neq("status", "cancelled");

  const featuredCostsUSD = (featuredData ?? [])
    .reduce((s: number, f: { total_cost: number }) => s + f.total_cost, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Finanzas</h1>
        <button
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.6)" }}
        >
          Retirar fondos
        </button>
      </div>
      <FinanzasTabs
        available={available}
        totalRevenue={totalRevenue}
        platformFee={platformFee}
        transactions={transactions}
        initialAccounts={bankAccountsData ?? []}
        featuredCostsUSD={featuredCostsUSD}
        featuredItems={featuredData ?? []}
      />
    </div>
  );
}
