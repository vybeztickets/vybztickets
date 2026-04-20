import { createClient } from "@/lib/supabase/server";

function formatPrice(n: number) {
  return "₡" + n.toLocaleString("es-CR");
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  sold: "Vendida",
  cancelled: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  active: "rgba(0,150,0,0.12)",
  sold: "rgba(0,0,0,0.07)",
  cancelled: "rgba(200,0,0,0.08)",
};

const STATUS_TEXT: Record<string, string> = {
  active: "#166534",
  sold: "rgba(0,0,0,0.5)",
  cancelled: "#991b1b",
};

type ListingRow = {
  id: string;
  resale_price: number;
  original_price: number;
  status: string;
  escrow_status: string;
  created_at: string;
  tickets: { events: { name: string; date: string; venue: string } | null } | null;
};

export default async function HistorialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawListings } = await supabase
    .from("resale_listings")
    .select(`
      id, resale_price, original_price, status, escrow_status, created_at,
      tickets (
        events ( name, date, venue )
      )
    `)
    .eq("seller_id", user!.id)
    .neq("status", "active")
    .order("created_at", { ascending: false });

  const listings = (rawListings ?? []) as unknown as ListingRow[];

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ HISTORIAL</p>
        <h1
          className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide"
          style={{ fontSize: "clamp(28px,3vw,40px)" }}
        >
          Historial de ventas
        </h1>
      </div>

      {!listings || listings.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
        >
          <p className="text-[#0a0a0a]/30 text-sm">No hay ventas cerradas aún.</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Evento", "Precio vendido", "Original", "Estado", "Escrow", "Fecha"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const event = l.tickets?.events ?? null;
                return (
                  <tr
                    key={l.id}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                  >
                    <td className="px-6 py-4">
                      <p className="text-[#0a0a0a] text-sm font-medium">
                        {event ? event.name : "—"}
                      </p>
                      {event && (
                        <p className="text-[#0a0a0a]/30 text-xs mt-0.5">
                          {event.date} · {event.venue}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#0a0a0a] font-semibold text-sm">{formatPrice(l.resale_price)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#0a0a0a]/40 text-sm">{formatPrice(l.original_price)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                        style={{
                          background: STATUS_COLOR[l.status] ?? "rgba(0,0,0,0.06)",
                          color: STATUS_TEXT[l.status] ?? "rgba(0,0,0,0.5)",
                        }}
                      >
                        {STATUS_LABEL[l.status] ?? l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#0a0a0a]/40 text-xs capitalize">
                        {l.escrow_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#0a0a0a]/30 text-xs">{formatDate(l.created_at)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
