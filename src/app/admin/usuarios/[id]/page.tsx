import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToggleAccount from "../../organizadores/ToggleAccount";

function fmt(n: number) { return "$" + n.toLocaleString("en-US"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin: { bg: "#0a0a0a", color: "#fff" },
  organizer: { bg: "rgba(0,140,0,0.1)", color: "#166534" },
  reseller: { bg: "rgba(0,80,200,0.1)", color: "#1e40af" },
  buyer: { bg: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" },
  suspended: { bg: "rgba(200,0,0,0.08)", color: "#991b1b" },
};

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: user } = await db
    .from("profiles")
    .select("id, full_name, email, role, created_at, avatar_url")
    .eq("id", id)
    .single();

  if (!user) notFound();

  const { data: tickets } = await db
    .from("tickets")
    .select("id, status, purchase_price, created_at, event_id, events(name, date, city)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const { data: kycRecord } = await db
    .from("kyc_verifications")
    .select("status, submitted_at, full_name_on_id, cedula_number, payment_method")
    .eq("user_id", id)
    .maybeSingle();

  const spent = (tickets ?? []).filter((t) => t.status !== "refunded").reduce((s, t) => s + (t.purchase_price ?? 0), 0);
  const suspended = user.role === "suspended";
  const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.buyer;

  return (
    <div className="p-8">
      <div className="mb-2">
        <Link href="/admin/usuarios" className="text-[#0a0a0a]/35 text-xs hover:text-[#0a0a0a] transition-colors">
          ← Users
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 mt-4">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(24px,3vw,36px)" }}>
            {user.full_name ?? "No name"}
          </h1>
          <p className="text-[#0a0a0a]/40 text-sm mt-1">{user.email}</p>
          <p className="text-[#0a0a0a]/25 text-xs mt-0.5">Since {fmtDate(user.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full" style={rc}>
            {user.role}
          </span>
          {user.role !== "admin" && (
            <ToggleAccount userId={user.id} role={user.role} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Tickets purchased", value: (tickets ?? []).length },
          { label: "Total spent", value: fmt(spent) },
          { label: "KYC", value: kycRecord ? kycRecord.status : "N/A" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[#0a0a0a]/35 text-[10px] uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-2xl leading-none capitalize">{s.value}</p>
          </div>
        ))}
      </div>

      {/* KYC info if exists */}
      {kycRecord && (
        <div className="rounded-2xl p-5 mb-6 flex gap-8" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#0a0a0a]/30 mb-0.5">Name on ID</p>
            <p className="text-sm text-[#0a0a0a] font-medium">{kycRecord.full_name_on_id}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#0a0a0a]/30 mb-0.5">ID Number</p>
            <p className="text-sm text-[#0a0a0a] font-medium font-mono">{kycRecord.cedula_number}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#0a0a0a]/30 mb-0.5">Payment Method</p>
            <p className="text-sm text-[#0a0a0a] font-medium">
              {kycRecord.payment_method === "sinpe_movil" ? "SINPE Mobile" : kycRecord.payment_method === "bank_transfer" ? "Bank Transfer" : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#0a0a0a]/30 mb-0.5">Submitted</p>
            <p className="text-sm text-[#0a0a0a]/60">{fmtDate(kycRecord.submitted_at)}</p>
          </div>
          <Link href="/admin/c2c/kyc" className="ml-auto text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors self-center">
            View KYC panel →
          </Link>
        </div>
      )}

      {/* Ticket history */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm">Purchase history</p>
        </div>
        {(tickets ?? []).length === 0 ? (
          <p className="text-[#0a0a0a]/25 text-sm p-8 text-center">No purchases</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Event", "Price", "Status", "Date"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(tickets ?? []).map((t) => {
                const ev = t.events as unknown as { name: string; date: string; city: string } | null;
                const statusBg = t.status === "refunded" ? "rgba(200,0,0,0.08)" : "rgba(0,0,0,0.06)";
                const statusColor = t.status === "refunded" ? "#991b1b" : "rgba(0,0,0,0.4)";
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-3">
                      <p className="text-[#0a0a0a] text-sm font-medium">{ev?.name ?? "—"}</p>
                      <p className="text-[#0a0a0a]/35 text-xs">{ev?.city} · {ev?.date ? fmtDate(ev.date) : ""}</p>
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-[#0a0a0a]">{fmt(t.purchase_price ?? 0)}</td>
                    <td className="px-6 py-3">
                      <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: statusBg, color: statusColor }}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-[#0a0a0a]/50">{fmtDateTime(t.created_at)}</td>
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
