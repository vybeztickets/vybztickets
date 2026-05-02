import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";
import ReporteButtonC2C from "../ReporteButtonC2C";

function fmt(n: number) { return "₡" + n.toLocaleString("en-US"); }

export default async function AdminFinanzasC2CPage() {
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: listings },
    { data: profiles },
  ] = await Promise.all([
    db.from("resale_listings").select("id, asking_price, status, created_at, seller_id, ticket_id"),
    db.from("profiles").select("id, full_name, email"),
  ]);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  const sold = (listings ?? []).filter(l => l.status === "sold");
  const active = (listings ?? []).filter(l => l.status === "active");
  const totalVolume = sold.reduce((s, l) => s + (l.asking_price ?? 0), 0);
  const totalListings = (listings ?? []).length;

  // Per seller stats
  type SellerRow = { seller_id: string; name: string; email: string; sold: number; volume: number };
  const sellerMap = new Map<string, SellerRow>();
  for (const l of sold) {
    const sid = l.seller_id;
    if (!sid) continue;
    const prof = profileMap.get(sid);
    const s = sellerMap.get(sid) ?? {
      seller_id: sid,
      name: prof?.full_name ?? "No name",
      email: prof?.email ?? "",
      sold: 0,
      volume: 0,
    };
    s.sold++;
    s.volume += l.asking_price ?? 0;
    sellerMap.set(sid, s);
  }
  const sortedSellers = Array.from(sellerMap.values()).sort((a, b) => b.volume - a.volume);

  // Monthly C2C chart
  type MonthData = { label: string; volume: number; count: number };
  const monthMap = new Map<string, MonthData>();
  for (const l of sold) {
    const d = new Date(l.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const m = monthMap.get(key) ?? { label, volume: 0, count: 0 };
    m.volume += l.asking_price ?? 0;
    m.count++;
    monthMap.set(key, m);
  }
  const now = new Date();
  const months: MonthData[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    months.push(monthMap.get(key) ?? { label, volume: 0, count: 0 });
  }
  const maxMonth = Math.max(...months.map(m => m.volume), 1);

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ C2C · Reventa</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
            C2C Finance
          </h1>
          <p className="text-[#0a0a0a]/35 text-sm mt-1">Fee model TBD — showing resale volume</p>
        </div>
        <ReporteButtonC2C />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl p-5" style={{ background: "#0a0a0a" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-white/35">C2C Volume Sold</p>
          <p className="font-[family-name:var(--font-bebas)] text-3xl leading-none mb-1 text-white">{fmt(totalVolume)}</p>
          <p className="text-[10px] text-white/25">{sold.length} completed resales</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#4338ca" }}>Vybz C2C Revenue</p>
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#4338ca" }}>TBD</span>
          </div>
          <p className="font-[family-name:var(--font-bebas)] text-3xl leading-none mb-1" style={{ color: "#312e81" }}>—</p>
          <p className="text-[10px]" style={{ color: "rgba(67,56,202,0.5)" }}>fee TBD</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-[#0a0a0a]/35">Active listings</p>
          <p className="font-[family-name:var(--font-bebas)] text-3xl leading-none mb-1 text-[#0a0a0a]">{active.length}</p>
          <p className="text-[10px] text-[#0a0a0a]/30">currently for resale</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-[#0a0a0a]/35">Total listings</p>
          <p className="font-[family-name:var(--font-bebas)] text-3xl leading-none mb-1 text-[#0a0a0a]">{totalListings}</p>
          <p className="text-[10px] text-[#0a0a0a]/30">{sortedSellers.length} active resellers</p>
        </div>
      </div>

      {/* Opciones de cobro */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: "rgba(99,102,241,0.04)", border: "1px dashed rgba(99,102,241,0.2)" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "#4338ca" }}>Fee models under consideration</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: "% of resale price", desc: "E.g. 5–10% of each completed C2C transaction. Scales with volume." },
            { title: "Fixed fee per transaction", desc: "E.g. ₡500–₡1000 per resale. Predictable, better for low-price tickets." },
            { title: "Combo: fixed + %", desc: "Base fee + percentage. Covers costs and scales with resale price." },
          ].map(o => (
            <div key={o.title} className="rounded-xl p-4" style={{ background: "rgba(99,102,241,0.06)" }}>
              <p className="text-sm font-semibold text-[#0a0a0a] mb-1">{o.title}</p>
              <p className="text-xs text-[#0a0a0a]/45 leading-relaxed">{o.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly chart */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-[#0a0a0a] font-semibold text-sm mb-1">Monthly C2C Volume</p>
        <p className="text-[#0a0a0a]/35 text-xs mb-5">completed resales per month</p>
        <div className="flex items-end gap-3 h-32">
          {months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              {m.count > 0 && <p className="text-[8px] font-semibold text-[#0a0a0a]/35">{m.count}</p>}
              <div className="w-full rounded-t-md" style={{ background: "#6366f1", height: `${Math.max(3, (m.volume / maxMonth) * 90)}px`, opacity: m.volume > 0 ? 0.75 : 0.08 }} />
              <p className="text-[9px] text-[#0a0a0a]/35 capitalize">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-seller breakdown */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm">Top resellers</p>
          <Link href="/admin/c2c/revendedores" className="text-[#0a0a0a]/35 hover:text-[#0a0a0a] text-xs transition-colors font-medium">View all →</Link>
        </div>
        {sortedSellers.length === 0 ? (
          <p className="text-[#0a0a0a]/25 text-sm p-8 text-center">No completed resales</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Reseller", "Completed resales", "Total volume", "% of total", ""].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSellers.map((s) => (
                <tr key={s.seller_id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4">
                    <p className="text-[#0a0a0a] font-medium text-sm">{s.name}</p>
                    <p className="text-[#0a0a0a]/35 text-xs">{s.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#0a0a0a]">{s.sold}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#0a0a0a]">{fmt(s.volume)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-full rounded-full" style={{ background: "#6366f1", width: `${totalVolume > 0 ? (s.volume / totalVolume) * 100 : 0}%` }} />
                      </div>
                      <p className="text-xs text-[#0a0a0a]/50 w-8 text-right">
                        {totalVolume > 0 ? Math.round((s.volume / totalVolume) * 100) : 0}%
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/usuarios/${s.seller_id}`} className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors">Ver →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Active listings table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm">Active listings</p>
          <Link href="/admin/c2c/listings" className="text-[#0a0a0a]/35 hover:text-[#0a0a0a] text-xs transition-colors font-medium">View all →</Link>
        </div>
        {active.length === 0 ? (
          <p className="text-[#0a0a0a]/25 text-sm p-8 text-center">No active listings</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Reseller", "Price", "Date", ""].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {active.slice(0, 10).map((l) => {
                const prof = profileMap.get(l.seller_id ?? "");
                return (
                  <tr key={l.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <p className="text-[#0a0a0a] text-sm">{prof?.full_name ?? "No name"}</p>
                      <p className="text-[#0a0a0a]/35 text-xs">{prof?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#0a0a0a]">{fmt(l.asking_price ?? 0)}</td>
                    <td className="px-6 py-4 text-xs text-[#0a0a0a]/40">
                      {new Date(l.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[9px] font-bold uppercase px-2 py-1 rounded-full" style={{ background: "rgba(99,102,241,0.1)", color: "#4338ca" }}>Active</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
