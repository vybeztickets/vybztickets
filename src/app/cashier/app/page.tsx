"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type Session = { eventId: string; eventName: string; venue: string; city: string; code: string };
type Stats = {
  onlineCount: number; doorCount: number; scanned: number; remaining: number;
  guestlistCount: number; onlineRevenue: number; doorRevenue: number;
};
type Attendee = {
  id: string; name: string | null; email: string; ticketType: string;
  status: string; promoCode: string | null; price: number; createdAt: string;
};
type TicketType = { id: string; name: string; price: number; total_available: number; sold_count: number };
type Tab = "overview" | "attendees" | "door" | "tables";

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview", label: "Overview",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    id: "attendees", label: "Attendees",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: "door", label: "Door entry",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22v-5"/><path d="M9 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-5"/><path d="M12 2v13"/><path d="m9 5 3-3 3 3"/></svg>,
  },
  {
    id: "tables", label: "Tables",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  },
];

function fmt(n: number) {
  return n === 0 ? "—" : "$" + n.toLocaleString("en-US");
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// ── Overview ─────────────────────────────────────────────────────────────────
function Overview({ session }: { session: Session }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch(`/api/frontdesk/stats?eventId=${session.eventId}&code=${session.code}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); });
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [session.eventId]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-black/20 text-sm">Loading…</p></div>;
  if (!stats) return null;

  const total = stats.onlineCount + stats.doorCount;
  const scanPct = total > 0 ? Math.round((stats.scanned / total) * 100) : 0;
  const combinedRevenue = stats.onlineRevenue + stats.doorRevenue;

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-4xl tracking-wide">{session.eventName}</h1>
        <p className="text-black/30 text-sm mt-0.5">{session.venue}, {session.city}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Online tickets", value: stats.onlineCount, sub: "Sold through platform" },
          { label: "Sold at door", value: stats.doorCount, sub: "Registered on-site" },
          { label: "Checked in", value: stats.scanned, sub: `${scanPct}% of total`, accent: "#10b981" },
        ].map(c => (
          <div key={c.label} className="p-5 rounded-2xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-black/35 text-xs uppercase tracking-widest">{c.label}</p>
            <p className="font-[family-name:var(--font-bebas)] text-5xl leading-none mt-1" style={{ color: c.accent ?? "#0a0a0a" }}>{c.value}</p>
            <p className="text-black/30 text-xs mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Check-in progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-black/35 text-xs uppercase tracking-widest">Check-in progress</p>
          <p className="text-[#0a0a0a] font-semibold text-sm">{scanPct}%</p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${scanPct}%`, background: "#10b981" }} />
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.02)" }}>
          <p className="text-black/35 text-xs uppercase tracking-widest font-semibold">Revenue breakdown</p>
        </div>
        <div className="grid grid-cols-2 divide-x" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="p-5">
            <p className="text-black/35 text-xs uppercase tracking-widest">Online (via Stripe)</p>
            <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a] leading-none mt-1">{fmt(stats.onlineRevenue)}</p>
            <p className="text-black/25 text-xs mt-1">Processed through Vybz</p>
          </div>
          <div className="p-5">
            <p className="text-black/35 text-xs uppercase tracking-widest">Door (collected on-site)</p>
            <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a] leading-none mt-1">{fmt(stats.doorRevenue)}</p>
            <p className="text-black/25 text-xs mt-1">Cash &amp; card at door</p>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.02)" }}>
          <div>
            <p className="text-black/35 text-xs uppercase tracking-widest">Combined total</p>
            <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#0a0a0a] leading-none mt-0.5">{fmt(combinedRevenue)}</p>
          </div>
          <div className="max-w-xs text-right">
            <p className="text-[10px] leading-relaxed" style={{ color: "rgba(0,0,0,0.3)" }}>
              For accounting reference only. Door revenue is collected on-site by the organizer and is <strong>not</strong> processed through Vybz.
            </p>
          </div>
        </div>
      </div>

      <button onClick={load} className="text-black/25 text-xs hover:text-black/50 transition-colors">
        ↻ Refresh
      </button>
    </div>
  );
}

// ── Attendees ─────────────────────────────────────────────────────────────────
const PAGE_SIZES = [25, 50, 100];

function Attendees({ session }: { session: Session }) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function load(q: string) {
    setLoading(true);
    fetch(`/api/frontdesk/attendees?eventId=${session.eventId}&code=${session.code}&search=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(d => { setAttendees(d.attendees ?? []); setTotal(d.total ?? 0); setLoading(false); });
  }

  useEffect(() => { load(""); }, [session.eventId]);

  function onSearch(val: string) {
    setSearch(val);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(val), 300);
  }

  function isDoor(a: Attendee) { return a.email.includes("@frontdesk.local"); }

  const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    used:      { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Checked in" },
    active:    { bg: "rgba(0,0,0,0.06)",      color: "rgba(0,0,0,0.45)", label: "Active" },
    cancelled: { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", label: "Cancelled" },
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = attendees.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-black/35 text-xs">{total} attendee{total !== 1 ? "s" : ""}</p>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-4 py-2 rounded-xl text-xs text-[#0a0a0a] placeholder-black/25 focus:outline-none"
            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)", width: 220 }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-8 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-32"><p className="text-black/20 text-sm">Loading…</p></div>
        ) : attendees.length === 0 ? (
          <div className="flex items-center justify-center h-32 rounded-2xl mt-4" style={{ border: "1px dashed rgba(0,0,0,0.1)" }}>
            <p className="text-black/20 text-sm">No results</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl overflow-hidden mt-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              {/* Header */}
              <div
                className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
                style={{ gridTemplateColumns: "1fr 140px 110px 80px 90px", background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
              >
                <div>Attendee</div>
                <div>Ticket type</div>
                <div>Status</div>
                <div className="text-right">Price</div>
                <div className="text-right">Order</div>
              </div>

              {/* Rows */}
              {paged.map((a, i) => {
                const door = isDoor(a);
                const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.active;
                return (
                  <div
                    key={a.id}
                    className="grid items-center px-5 py-3.5"
                    style={{
                      gridTemplateColumns: "1fr 140px 110px 80px 90px",
                      borderBottom: i < paged.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
                        style={{ background: a.status === "used" ? "rgba(16,185,129,0.12)" : "rgba(0,0,0,0.05)", color: a.status === "used" ? "#10b981" : "rgba(0,0,0,0.3)" }}
                      >
                        {door ? "D" : (a.name?.charAt(0).toUpperCase() ?? "?")}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[#0a0a0a] text-sm font-medium">{door ? "Door Entry" : (a.name ?? "—")}</p>
                          {door && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.45)" }}>DOOR</span>
                          )}
                        </div>
                        {!door && <p className="text-black/25 text-[10px]">{formatDate(a.createdAt)}</p>}
                        {door && <p className="text-black/25 text-[10px]">{formatDate(a.createdAt)}</p>}
                      </div>
                    </div>
                    <div>
                      <p className="text-black/60 text-xs truncate">{a.ticketType}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[#0a0a0a] text-sm font-medium">{a.price === 0 ? "Free" : `$${a.price}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-black/30 text-xs font-mono">{a.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-black/25 text-xs">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="text-xs rounded-lg px-2 py-1 text-[#0a0a0a] focus:outline-none"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-black/25 text-xs">Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-black/30 disabled:opacity-20">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className="w-7 h-7 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: page === p ? "rgba(0,0,0,0.1)" : "transparent", color: page === p ? "#0a0a0a" : "rgba(0,0,0,0.3)" }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg text-black/30 disabled:opacity-20">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Door entry ────────────────────────────────────────────────────────────────
function DoorEntry({ session }: { session: Session }) {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentEntries, setRecentEntries] = useState<{ type: string; method: string; qty: number; time: string }[]>([]);

  useEffect(() => {
    fetch(`/api/frontdesk/ticket-types?eventId=${session.eventId}&code=${session.code}`)
      .then(r => r.json())
      .then(d => {
        const types = d.ticketTypes ?? [];
        setTicketTypes(types);
        if (types.length > 0) setSelectedType(types[0].id);
      });
  }, [session.eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;
    setSubmitting(true); setError(null); setSuccess(null);

    const selected = ticketTypes.find(t => t.id === selectedType);

    const res = await fetch("/api/frontdesk/door-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: session.eventId,
        code: session.code,
        name: null,
        email: null,
        ticketTypeId: selectedType,
        paymentMethod,
        quantity,
        price: selected?.price ?? 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setSubmitting(false); return; }

    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setSuccess(`${quantity} ticket${quantity > 1 ? "s" : ""} registered`);
    setRecentEntries(prev => [{ type: selected?.name ?? "Ticket", method: paymentMethod, qty: quantity, time: now }, ...prev.slice(0, 9)]);
    setQuantity(1);
    setTimeout(() => setSuccess(null), 3000);
    setSubmitting(false);
  }

  const btnStyle = success
    ? { background: "#10b981", color: "#fff" }
    : { background: "#0a0a0a", color: "#fff" };

  return (
    <div className="p-8 flex gap-10 h-full">
      {/* Form */}
      <div className="w-80 shrink-0">
        <h2 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-3xl tracking-wide mb-6">Door entry</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticket type */}
          <div>
            <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Ticket type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] focus:outline-none"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              {ticketTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}{t.price > 0 ? ` · $${t.price}` : " · Free"}</option>
              ))}
            </select>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Payment method</label>
            <div className="flex gap-2">
              {(["cash", "card"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all"
                  style={{
                    background: paymentMethod === m ? "#0a0a0a" : "rgba(0,0,0,0.04)",
                    color: paymentMethod === m ? "#fff" : "rgba(0,0,0,0.45)",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  {m === "cash" ? "💵 Cash" : "💳 Card"}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl text-[#0a0a0a] font-bold text-lg transition-colors"
                style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.08)" }}>−</button>
              <span className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-4xl w-8 text-center leading-none">{quantity}</span>
              <button type="button" onClick={() => setQuantity(q => Math.min(20, q + 1))}
                className="w-10 h-10 rounded-xl text-[#0a0a0a] font-bold text-lg transition-colors"
                style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.08)" }}>+</button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !selectedType}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
            style={btnStyle}
          >
            {submitting ? "Registering…" : success ? `✓ ${success}` : `Register ${quantity} ticket${quantity > 1 ? "s" : ""}`}
          </button>
        </form>
      </div>

      {/* Recent entries */}
      <div className="flex-1">
        <p className="text-black/30 text-xs uppercase tracking-widest mb-4">Recent door entries</p>
        {recentEntries.length === 0 ? (
          <p className="text-black/20 text-sm">No entries yet this session</p>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>✓</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[#0a0a0a] text-sm font-medium">{e.type}</p>
                  <p className="text-black/35 text-xs">{e.qty > 1 ? `×${e.qty} · ` : ""}{e.method === "cash" ? "Cash" : "Card"}</p>
                </div>
                <p className="text-black/25 text-xs shrink-0">{e.time}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tables placeholder ────────────────────────────────────────────────────────
function Tables() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4" style={{ minHeight: 400 }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-black/40 font-semibold text-sm">Tables & VIP reservations</p>
        <p className="text-black/20 text-xs mt-1">Coming soon — table management and VIP tracking</p>
      </div>
    </div>
  );
}

// ── Main app ─────────────────────────────────────────────────────────────────
export default function FrontDeskApp() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [showDisconnect, setShowDisconnect] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("vybz_cashier_session");
    if (!stored) { router.replace("/cashier"); return; }
    try {
      const s = JSON.parse(stored);
      if (!s.eventId || !s.code) throw new Error();
      setSession(s);
    } catch {
      localStorage.removeItem("vybz_cashier_session");
      router.replace("/cashier");
    }
    setReady(true);
  }, [router]);

  // Heartbeat
  useEffect(() => {
    if (!session) return;
    function beat() {
      fetch("/api/scan/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: session!.code }),
      }).then(r => {
        if (r.status === 401) { localStorage.removeItem("vybz_cashier_session"); window.location.replace("/cashier"); }
      });
    }
    beat();
    const id = setInterval(beat, 30_000);
    return () => clearInterval(id);
  }, [session]);

  function disconnect() {
    localStorage.removeItem("vybz_cashier_session");
    router.replace("/cashier");
  }

  if (!ready || !session) return null;

  return (
    <div className="fixed inset-0 flex" style={{ background: "#ffffff" }}>
      {/* Sidebar */}
      <div
        className="flex flex-col shrink-0"
        style={{ width: 220, background: "#111", borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Logo + event */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-[family-name:var(--font-bebas)] text-white tracking-widest text-xl">VYBZ</p>
          <p className="text-white/30 text-[10px] uppercase tracking-widest mt-0.5">Front Desk</p>
          <div className="mt-3 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-white text-xs font-semibold truncate">{session.eventName}</p>
            <p className="text-white/30 text-[10px] truncate">{session.venue}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{
                background: tab === item.id ? "rgba(255,255,255,0.1)" : "transparent",
                color: tab === item.id ? "#fff" : "rgba(255,255,255,0.35)",
              }}
            >
              <span style={{ color: tab === item.id ? "#fff" : "rgba(255,255,255,0.25)" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Disconnect */}
        <div className="px-3 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
          <button
            onClick={() => setShowDisconnect(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Disconnect
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#ffffff" }}>
        {tab === "overview" && <Overview session={session} />}
        {tab === "attendees" && <Attendees session={session} />}
        {tab === "door" && <DoorEntry session={session} />}
        {tab === "tables" && <Tables />}
      </div>

      {/* Disconnect modal */}
      {showDisconnect && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-xs rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}>
            <p className="text-[#0a0a0a] font-semibold mb-1">Disconnect</p>
            <p className="text-black/40 text-sm mb-5">You'll need your access code to reconnect.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDisconnect(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-black/50" style={{ background: "rgba(0,0,0,0.05)" }}>Cancel</button>
              <button onClick={disconnect} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#ef4444" }}>Disconnect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
