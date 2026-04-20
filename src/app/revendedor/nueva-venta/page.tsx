import { createClient } from "@/lib/supabase/server";
import NuevaVentaForm from "./NuevaVentaForm";

export const metadata = { title: "Vender entrada — Vybz" };

export default async function NuevaVentaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's active tickets that are not already listed
  const { data: myTickets } = await supabase
    .from("tickets")
    .select(`
      id, purchase_price, buyer_name,
      events ( id, name, date, venue, city )
    `)
    .eq("attendee_id", user!.id)
    .eq("status", "active");

  type TicketRow = {
    id: string;
    purchase_price: number;
    buyer_name: string | null;
    events: { id: string; name: string; date: string; venue: string; city: string } | null;
  };

  // Get ticket IDs already listed (active)
  const { data: existingListings } = await supabase
    .from("resale_listings")
    .select("ticket_id")
    .eq("seller_id", user!.id)
    .eq("status", "active");

  const listedIds = new Set(existingListings?.map((l) => l.ticket_id) ?? []);
  const allTickets = (myTickets ?? []) as unknown as TicketRow[];
  const availableTickets = allTickets.filter((t) => !listedIds.has(t.id));

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ NUEVA VENTA</p>
        <h1
          className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide"
          style={{ fontSize: "clamp(28px,3vw,40px)" }}
        >
          Vender una entrada
        </h1>
        <p className="text-[#0a0a0a]/40 text-sm mt-2">
          El dinero queda en escrow hasta que el comprador confirma el ingreso.
        </p>
      </div>

      <NuevaVentaForm tickets={availableTickets} />
    </div>
  );
}
