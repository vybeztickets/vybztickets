import { createClient as createAdmin } from "@supabase/supabase-js";
import ListingsTable from "./ListingsTable";

type RawListing = {
  id: string;
  status: string;
  asking_price: number | null;
  created_at: string;
  seller_id: string;
  ticket_id: string;
  tickets: { event_id: string; events: { name: string; date: string } | null } | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

export default async function AdminListingsPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rawListings } = await db
    .from("resale_listings")
    .select("id, status, asking_price, created_at, seller_id, ticket_id, tickets(event_id, events(name, date)), profiles(full_name, email)")
    .order("created_at", { ascending: false });

  const listings = (rawListings ?? []) as unknown as RawListing[];

  const rows = listings.map(l => ({
    id: l.id,
    seller_id: l.seller_id,
    status: l.status,
    asking_price: l.asking_price,
    created_at: l.created_at,
    eventName: l.tickets?.events?.name ?? null,
    eventDate: l.tickets?.events?.date ?? null,
    sellerName: l.profiles?.full_name ?? null,
    sellerEmail: l.profiles?.email ?? null,
  }));

  const stats = {
    active: listings.filter(l => l.status === "active").length,
    sold: listings.filter(l => l.status === "sold").length,
    totalVolume: listings.filter(l => l.status === "sold").reduce((s, l) => s + (l.asking_price ?? 0), 0),
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ REVENTA C2C</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Active listings
        </h1>
      </div>
      <ListingsTable listings={rows} stats={stats} />
    </div>
  );
}
