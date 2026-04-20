import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";

function fmt(n: number) { return "₡" + n.toLocaleString("es-CR"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
  sold: { bg: "rgba(0,80,200,0.1)", color: "#1e40af" },
  cancelled: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
  expired: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
};

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

  const active = listings.filter((l) => l.status === "active").length;
  const sold = listings.filter((l) => l.status === "sold").length;
  const totalVolume = listings.filter((l) => l.status === "sold").reduce((s, l) => s + (l.asking_price ?? 0), 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ REVENTA C2C</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Listings activos
        </h1>
        <p className="text-[#0a0a0a]/35 text-sm mt-1">{active} activos · {sold} vendidos · {fmt(totalVolume)} en volumen</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Evento", "Vendedor", "Precio", "Estado", "Fecha", ""].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => {
              const ev = l.tickets?.events;
              const sc = STATUS_COLORS[l.status] ?? STATUS_COLORS.expired;
              return (
                <tr key={l.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] text-sm font-medium">{ev?.name ?? "—"}</p>
                    <p className="text-[#0a0a0a]/35 text-xs">{ev?.date ? fmtDate(ev.date) : ""}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] text-xs">{l.profiles?.full_name ?? "Sin nombre"}</p>
                    <p className="text-[#0a0a0a]/35 text-[10px]">{l.profiles?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#0a0a0a]">{fmt(l.asking_price ?? 0)}</td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={sc}>{l.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#0a0a0a]/50">{fmtDate(l.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/usuarios/${l.seller_id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">Ver vendedor →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
