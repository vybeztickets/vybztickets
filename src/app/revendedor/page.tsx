import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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

const ESCROW_LABEL: Record<string, string> = {
  pending: "Sin comprador",
  held: "Pago retenido",
  released: "Cobrado",
  refunded: "Devuelto",
};

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
  tickets: { id: string; buyer_name: string | null; buyer_email: string; events: { id: string; name: string; date: string; venue: string; city: string; image_url: string | null } | null } | null;
};

export default async function RevendedorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: kyc } = await supabase
    .from("kyc_verifications")
    .select("status")
    .eq("user_id", user!.id)
    .maybeSingle();

  const kycApproved = kyc?.status === "approved";

  const { data: rawListings } = await supabase
    .from("resale_listings")
    .select(`
      id, resale_price, original_price, status, escrow_status, created_at,
      tickets (
        id, buyer_name, buyer_email,
        events ( id, name, date, venue, city, image_url )
      )
    `)
    .eq("seller_id", user!.id)
    .order("created_at", { ascending: false });

  const listings = (rawListings ?? []) as unknown as ListingRow[];

  const active = listings.filter((l) => l.status === "active");
  const sold = listings.filter((l) => l.status === "sold");
  const totalEarnings = sold.reduce((sum, l) => sum + l.resale_price, 0);
  const inEscrow = listings.filter((l) => l.escrow_status === "held").reduce((sum, l) => sum + l.resale_price, 0);

  return (
    <div className="p-8">
      {/* KYC gate banner */}
      {!kycApproved && (
        <div
          className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
          style={{
            background: kyc?.status === "pending" ? "rgba(0,0,0,0.04)" : "#0a0a0a",
            border: kyc?.status === "pending" ? "1px solid rgba(0,0,0,0.08)" : "none",
          }}
        >
          <div>
            <p
              className="font-semibold text-sm"
              style={{ color: kyc?.status === "pending" ? "#0a0a0a" : "#fff" }}
            >
              {kyc?.status === "pending"
                ? "Verificación en proceso"
                : "Verificá tu identidad para vender"}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: kyc?.status === "pending" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)" }}
            >
              {kyc?.status === "pending"
                ? "Nuestro equipo está revisando tu documentación. Esto tarda hasta 48h hábiles."
                : "Para publicar entradas en reventa necesitás verificar tu identidad (cédula + selfie)."}
            </p>
          </div>
          {kyc?.status !== "pending" && (
            <a
              href="/revendedor/verificacion"
              className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold bg-white text-[#0a0a0a] hover:bg-white/90 transition-colors"
            >
              Verificar ahora
            </a>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ DASHBOARD</p>
          <h1
            className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide"
            style={{ fontSize: "clamp(28px,3vw,40px)" }}
          >
            Mis ventas
          </h1>
        </div>
        <Link
          href="/revendedor/nueva-venta"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
        >
          + Vender entrada
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Anuncios activos", value: active.length.toString() },
          { label: "Vendidas", value: sold.length.toString() },
          { label: "Ganancias totales", value: formatPrice(totalEarnings) },
          { label: "Retenido (por cobrar)", value: formatPrice(inEscrow) },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
          >
            <p className="text-[#0a0a0a]/35 text-[10px] uppercase tracking-wider mb-2">{s.label}</p>
            <p className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-2xl leading-none tracking-wide">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Listings */}
      {!listings || listings.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
        >
          <p
            className="font-[family-name:var(--font-bebas)] text-[#0a0a0a]/15 tracking-wide mb-3"
            style={{ fontSize: "clamp(24px,3vw,36px)" }}
          >
            Sin anuncios
          </p>
          <p className="text-[#0a0a0a]/30 text-sm mb-6">
            Publica tu primera entrada en reventa.
          </p>
          <Link
            href="/revendedor/nueva-venta"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
          >
            Vender entrada
          </Link>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
        >
          <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[#0a0a0a] font-semibold text-sm">Todos los anuncios</p>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Evento", "Precio", "Original", "Estado", "Pago", "Fecha"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const event = l.tickets?.events ?? null;
                return (
                  <tr
                    key={l.id}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                    className="hover:bg-black/[0.01] transition-colors"
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
                      <span className="text-[#0a0a0a]/40 text-xs">
                        {ESCROW_LABEL[l.escrow_status] ?? l.escrow_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#0a0a0a]/30 text-xs">{formatDate(l.created_at)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {l.status === "active" && (
                        <CancelButton listingId={l.id} />
                      )}
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

function CancelButton({ listingId }: { listingId: string }) {
  return (
    <form action={`/api/revendedor/listings/${listingId}`} method="POST">
      <input type="hidden" name="_method" value="cancel" />
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
      >
        Cancelar
      </button>
    </form>
  );
}
