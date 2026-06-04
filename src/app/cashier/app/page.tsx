"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Session = { eventId: string; eventName: string; venue: string; city: string; code: string };
type Theme = "dark" | "light";
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

// ── Tables types ──────────────────────────────────────────────────────────────
type TableApiItem = {
  id: string; name: string; price: number; capacity: number | null;
  zone_id: string | null; zone_color: string | null;
  table_color: string | null; table_border_color: string | null; table_text_color: string | null;
  map_table_size: string | null; map_position_x: number | null; map_position_y: number | null;
  price_per_extra_person: number; max_extra_people: number;
  is_active: boolean; sold_count: number; total_available: number;
};
type TableBooking = {
  id: string; ticket_type_id: string; buyer_name: string | null; buyer_email: string | null;
  buyer_phone: string | null; buyer_notes: string | null; pax_count: number | null;
  status: string; purchase_price: number | null; created_at: string; qr_code: string | null;
};
type TableZone = { id: string; name: string; color: string; sort_order: number };
type TablesResponse = {
  venueMapUrl: string | null; eventName: string; currency: string;
  zones: TableZone[]; tables: TableApiItem[]; tickets: TableBooking[];
};
const TABLE_SZ: Record<string, number> = { small: 22, medium: 30, large: 40 };

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: "attendees", label: "Attendees", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: "door", label: "Door entry", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22v-5"/><path d="M9 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-5"/><path d="M12 2v13"/><path d="m9 5 3-3 3 3"/></svg> },
  { id: "tables", label: "Tables", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
];

function fmt(n: number) { return n === 0 ? "—" : "$" + n.toLocaleString("en-US"); }
function formatDate(d: string) { return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }); }

function getTokens(theme: Theme) {
  const dark = theme === "dark";
  return {
    bg:          dark ? "#080808"                    : "#f0f0f0",
    card:        dark ? "#141418"                    : "#ffffff",
    cardAlt:     dark ? "#0f0f13"                    : "#f7f7f7",
    border:      dark ? "rgba(255,255,255,0.07)"     : "rgba(0,0,0,0.07)",
    borderFaint: dark ? "rgba(255,255,255,0.04)"     : "rgba(0,0,0,0.04)",
    text:        dark ? "#ffffff"                    : "#0a0a0a",
    textMuted:   dark ? "rgba(255,255,255,0.35)"     : "rgba(0,0,0,0.35)",
    textFaint:   dark ? "rgba(255,255,255,0.2)"      : "rgba(0,0,0,0.2)",
    inputBg:     dark ? "rgba(255,255,255,0.06)"     : "rgba(0,0,0,0.04)",
    inputBorder: dark ? "rgba(255,255,255,0.08)"     : "rgba(0,0,0,0.08)",
    rowHover:    dark ? "rgba(255,255,255,0.03)"     : "rgba(0,0,0,0.02)",
  };
}

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview({ session, theme }: { session: Session; theme: Theme }) {
  const t = getTokens(theme);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch(`/api/frontdesk/stats?eventId=${session.eventId}&code=${session.code}`)
      .then(r => r.json()).then(d => { setStats(d); setLoading(false); });
  }
  useEffect(() => { load(); const id = setInterval(load, 30_000); return () => clearInterval(id); }, [session.eventId]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-sm" style={{ color: t.textFaint }}>Loading…</p></div>;
  if (!stats) return null;

  const total = stats.onlineCount + stats.doorCount;
  const scanPct = total > 0 ? Math.round((stats.scanned / total) * 100) : 0;
  const combinedRevenue = stats.onlineRevenue + stats.doorRevenue;

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide" style={{ color: t.text }}>{session.eventName}</h1>
        <p className="text-sm mt-0.5" style={{ color: t.textMuted }}>{session.venue}, {session.city}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Online tickets", value: stats.onlineCount, sub: "Sold through platform", accent: null },
          { label: "Sold at door",   value: stats.doorCount,   sub: "Registered on-site",   accent: null },
          { label: "Checked in",     value: stats.scanned,     sub: `${scanPct}% of total`,  accent: "#10b981" },
        ].map(c => (
          <div key={c.label} className="p-5 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: t.textMuted }}>{c.label}</p>
            <p className="font-[family-name:var(--font-bebas)] text-5xl leading-none mt-1" style={{ color: c.accent ?? t.text }}>{c.value}</p>
            <p className="text-xs mt-1" style={{ color: t.textFaint }}>{c.sub}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: t.textMuted }}>Check-in progress</p>
          <p className="font-semibold text-sm" style={{ color: t.text }}>{scanPct}%</p>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.inputBg }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${scanPct}%`, background: "#10b981" }} />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.border}`, background: t.cardAlt }}>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: t.textMuted }}>Revenue breakdown</p>
        </div>
        <div className="grid grid-cols-2" style={{ borderBottom: `1px solid ${t.border}`, background: t.card }}>
          <div className="p-5" style={{ borderRight: `1px solid ${t.border}` }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: t.textMuted }}>Online (via Stripe)</p>
            <p className="font-[family-name:var(--font-bebas)] text-4xl leading-none mt-1" style={{ color: t.text }}>{fmt(stats.onlineRevenue)}</p>
            <p className="text-xs mt-1" style={{ color: t.textFaint }}>Processed through Vybz</p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-widest" style={{ color: t.textMuted }}>Door (collected on-site)</p>
            <p className="font-[family-name:var(--font-bebas)] text-4xl leading-none mt-1" style={{ color: t.text }}>{fmt(stats.doorRevenue)}</p>
            <p className="text-xs mt-1" style={{ color: t.textFaint }}>Cash &amp; card at door</p>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: t.cardAlt }}>
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: t.textMuted }}>Combined total</p>
            <p className="font-[family-name:var(--font-bebas)] text-3xl leading-none mt-0.5" style={{ color: t.text }}>{fmt(combinedRevenue)}</p>
          </div>
          <p className="text-[10px] leading-relaxed max-w-xs text-right" style={{ color: t.textFaint }}>
            For accounting reference only. Door revenue is collected on-site by the organizer and is <strong>not</strong> processed through Vybz.
          </p>
        </div>
      </div>

      <button onClick={load} className="text-xs transition-colors" style={{ color: t.textFaint }}>↻ Refresh</button>
    </div>
  );
}

// ── Attendees ─────────────────────────────────────────────────────────────────
const PAGE_SIZES = [25, 50, 100];

function Attendees({ session, theme }: { session: Session; theme: Theme }) {
  const t = getTokens(theme);
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
      .then(r => r.json()).then(d => { setAttendees(d.attendees ?? []); setTotal(d.total ?? 0); setLoading(false); });
  }
  useEffect(() => { load(""); }, [session.eventId]);

  function onSearch(val: string) {
    setSearch(val); setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(val), 300);
  }

  function isDoor(a: Attendee) { return a.email.includes("@frontdesk.local"); }

  const dark = theme === "dark";
  const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    used:      { bg: "rgba(16,185,129,0.15)",  color: "#10b981",                            label: "Checked in" },
    active:    { bg: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", label: "Active" },
    cancelled: { bg: "rgba(239,68,68,0.12)",   color: "#ef4444",                            label: "Cancelled" },
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = attendees.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.border}` }}>
        <p className="text-xs" style={{ color: t.textMuted }}>{total} attendee{total !== 1 ? "s" : ""}</p>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.textFaint} strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" value={search} onChange={e => onSearch(e.target.value)} placeholder="Search..."
            className="pl-8 pr-4 py-2 rounded-xl text-xs focus:outline-none"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text, width: 220 }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-32"><p className="text-sm" style={{ color: t.textFaint }}>Loading…</p></div>
        ) : attendees.length === 0 ? (
          <div className="flex items-center justify-center h-32 rounded-2xl mt-4" style={{ border: `1px dashed ${t.border}` }}>
            <p className="text-sm" style={{ color: t.textFaint }}>No results</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl overflow-hidden mt-4" style={{ border: `1px solid ${t.border}` }}>
              <div className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
                style={{ gridTemplateColumns: "1fr 140px 110px 80px 90px", background: t.cardAlt, color: t.textMuted, borderBottom: `1px solid ${t.border}` }}>
                <div>Attendee</div><div>Ticket type</div><div>Status</div><div className="text-right">Price</div><div className="text-right">Order</div>
              </div>
              {paged.map((a, i) => {
                const door = isDoor(a);
                const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.active;
                return (
                  <div key={a.id} className="grid items-center px-5 py-3.5"
                    style={{ gridTemplateColumns: "1fr 140px 110px 80px 90px", background: t.card, borderBottom: i < paged.length - 1 ? `1px solid ${t.borderFaint}` : "none" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
                        style={{ background: a.status === "used" ? "rgba(16,185,129,0.15)" : t.inputBg, color: a.status === "used" ? "#10b981" : t.textMuted }}>
                        {door ? "D" : (a.name?.charAt(0).toUpperCase() ?? "?")}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium" style={{ color: t.text }}>{door ? "Door Entry" : (a.name ?? "—")}</p>
                          {door && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: t.inputBg, color: t.textMuted }}>DOOR</span>}
                        </div>
                        <p className="text-[10px]" style={{ color: t.textFaint }}>{formatDate(a.createdAt)}</p>
                      </div>
                    </div>
                    <div><p className="text-xs truncate" style={{ color: t.textMuted }}>{a.ticketType}</p></div>
                    <div><span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></div>
                    <div className="text-right"><p className="text-sm font-medium" style={{ color: t.text }}>{a.price === 0 ? "Free" : `$${a.price}`}</p></div>
                    <div className="text-right"><p className="text-xs font-mono" style={{ color: t.textFaint }}>{a.id.slice(0, 8).toUpperCase()}</p></div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: t.textFaint }}>Rows per page:</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="text-xs rounded-lg px-2 py-1 focus:outline-none"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-xs" style={{ color: t.textFaint }}>Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg disabled:opacity-20" style={{ color: t.textMuted }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className="w-7 h-7 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: page === p ? t.inputBg : "transparent", color: page === p ? t.text : t.textMuted }}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg disabled:opacity-20" style={{ color: t.textMuted }}>
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
function DoorEntry({ session, theme }: { session: Session; theme: Theme }) {
  const t = getTokens(theme);
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
      .then(r => r.json()).then(d => { const types = d.ticketTypes ?? []; setTicketTypes(types); if (types.length > 0) setSelectedType(types[0].id); });
  }, [session.eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;
    setSubmitting(true); setError(null); setSuccess(null);
    const selected = ticketTypes.find(tt => tt.id === selectedType);
    const res = await fetch("/api/frontdesk/door-entry", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: session.eventId, code: session.code, name: null, email: null, ticketTypeId: selectedType, paymentMethod, quantity, price: selected?.price ?? 0 }),
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

  const dark = theme === "dark";

  return (
    <div className="p-8 flex gap-10 h-full">
      <div className="w-80 shrink-0">
        <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide mb-6" style={{ color: t.text }}>Door entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Ticket type</label>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
              {ticketTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}{tt.price > 0 ? ` · $${tt.price}` : " · Free"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Payment method</label>
            <div className="flex gap-2">
              {(["cash", "card"] as const).map(m => (
                <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all"
                  style={{
                    background: paymentMethod === m ? (dark ? "#fff" : "#0a0a0a") : t.inputBg,
                    color: paymentMethod === m ? (dark ? "#0a0a0a" : "#fff") : t.textMuted,
                    border: `1px solid ${t.inputBorder}`,
                  }}>
                  {m === "cash" ? "Cash" : "Card"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Quantity</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl font-bold text-lg transition-colors"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>−</button>
              <span className="font-[family-name:var(--font-bebas)] text-4xl w-8 text-center leading-none" style={{ color: t.text }}>{quantity}</span>
              <button type="button" onClick={() => setQuantity(q => Math.min(20, q + 1))}
                className="w-10 h-10 rounded-xl font-bold text-lg transition-colors"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>+</button>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={submitting || !selectedType}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
            style={success ? { background: "#10b981", color: "#fff" } : { background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff" }}>
            {submitting ? "Registering…" : success ? `✓ ${success}` : `Register ${quantity} ticket${quantity > 1 ? "s" : ""}`}
          </button>
        </form>
      </div>

      <div className="flex-1">
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: t.textFaint }}>Recent door entries</p>
        {recentEntries.length === 0 ? (
          <p className="text-sm" style={{ color: t.textFaint }}>No entries yet this session</p>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>✓</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: t.text }}>{e.type}</p>
                  <p className="text-xs" style={{ color: t.textMuted }}>{e.qty > 1 ? `×${e.qty} · ` : ""}{e.method === "cash" ? "Cash" : "Card"}</p>
                </div>
                <p className="text-xs shrink-0" style={{ color: t.textFaint }}>{e.time}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tables Booking Manager ────────────────────────────────────────────────────
function Tables({ session, theme }: { session: Session; theme: Theme }) {
  const t = getTokens(theme);
  const dark = theme === "dark";

  const [data, setData] = useState<TablesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [mode, setMode] = useState<"info" | "sell" | "checkin">("info");
  const [paxSell, setPaxSell] = useState(1);
  const [paxCheckin, setPaxCheckin] = useState(1);
  const [payMethod, setPayMethod] = useState<"cash" | "card">("cash");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);

  function showFlash(ok: boolean, msg: string) {
    setFlash({ ok, msg });
    setTimeout(() => setFlash(null), 3500);
  }

  function load(quiet = false) {
    if (!quiet) setLoading(true); else setRefreshing(true);
    fetch(`/api/frontdesk/tables?eventId=${session.eventId}&code=${session.code}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { load(); }, []);

  function fmtAmt(n: number) {
    if (!data) return String(n);
    try { return new Intl.NumberFormat("en-US", { style: "currency", currency: data.currency, maximumFractionDigits: 0 }).format(n); }
    catch { return `${data.currency} ${n.toLocaleString()}`; }
  }

  const selTable = selId && data ? data.tables.find(tt => tt.id === selId) ?? null : null;
  const selTicket = selId && data ? data.tickets.find(tk => tk.ticket_type_id === selId) ?? null : null;
  const selZone = selTable && data ? data.zones.find(z => z.id === selTable.zone_id) ?? null : null;

  function handleSelect(id: string) {
    if (selId === id) { setSelId(null); setMode("info"); return; }
    setSelId(id);
    setMode("info");
    const tt = data?.tables.find(x => x.id === id);
    const tk = data?.tickets.find(x => x.ticket_type_id === id);
    setPaxSell(tt?.capacity ?? 1);
    setPaxCheckin(tk?.pax_count ?? tt?.capacity ?? 1);
    setPayMethod("cash");
  }

  function calcExtra(table: TableApiItem, pax: number) {
    if (!table.capacity || pax <= table.capacity || !table.price_per_extra_person) return 0;
    return Math.min(pax - table.capacity, table.max_extra_people ?? 0) * table.price_per_extra_person;
  }

  function tableStatus(tt: TableApiItem): "available" | "reserved" | "checked_in" {
    const ticket = data?.tickets.find(tk => tk.ticket_type_id === tt.id);
    if (!ticket) return "available";
    return ticket.status === "used" ? "checked_in" : "reserved";
  }

  function arrivedPax(ticket: TableBooking): number | null {
    const m = ticket.buyer_notes?.match(/arrived:(\d+)/);
    return m ? parseInt(m[1]) : null;
  }

  async function doSell() {
    if (!selTable) return;
    setBusy(true);
    const fee = calcExtra(selTable, paxSell);
    const res = await fetch("/api/frontdesk/table-sale", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: session.eventId, code: session.code, tableTypeId: selTable.id, paxCount: paxSell, paymentMethod: payMethod, totalPrice: selTable.price + fee }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { showFlash(false, body.error ?? "Sale failed"); return; }
    showFlash(true, `Table #${selTable.name} sold · ${fmtAmt(selTable.price + fee)}`);
    setMode("info");
    load(true);
  }

  async function doCheckin() {
    if (!selTicket || !selTable) return;
    setBusy(true);
    const res = await fetch("/api/frontdesk/table-checkin", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: session.eventId, code: session.code, ticketId: selTicket.id, paxArrived: paxCheckin }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { showFlash(false, body.error ?? "Check-in failed"); return; }
    const partial = paxCheckin < (selTicket.pax_count ?? paxCheckin);
    showFlash(true, partial
      ? `${paxCheckin}/${selTicket.pax_count} guests arrived at table #${selTable.name}`
      : `Table #${selTable.name} fully checked in`);
    setMode("info");
    load(true);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-sm" style={{ color: t.textFaint }}>Loading tables…</p>
    </div>
  );
  if (!data) return null;

  const { tables, tickets, zones, venueMapUrl } = data;
  const placed = tables.filter(tt => tt.map_position_x != null && tt.map_position_y != null);
  const unplaced = tables.filter(tt => tt.map_position_x == null || tt.map_position_y == null);
  const reservedCount = tickets.length;
  const checkedInCount = tickets.filter(tk => tk.status === "used").length;
  const availableCount = tables.length - reservedCount;
  const panelAccent = selZone?.color || selTable?.table_color || (dark ? "#1e1e2a" : "#3d3d3d");

  return (
    <div className="flex" style={{ height: "100%" }}>

      {/* ── Left: map + list ── */}
      <div className="flex-1 min-w-0 overflow-y-auto flex flex-col">
        <div className="px-7 pt-7 pb-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide" style={{ color: t.text }}>Tables</h2>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{reservedCount} reserved · {checkedInCount} checked in · {availableCount} available</p>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-colors disabled:opacity-40"
            style={{ background: t.inputBg, color: t.textMuted, border: `1px solid ${t.inputBorder}` }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {flash && (
          <div className="mx-7 mb-3 px-4 py-3 rounded-xl text-sm font-medium shrink-0"
            style={{ background: flash.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: flash.ok ? "#10b981" : "#ef4444", border: `1px solid ${flash.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
            {flash.ok ? "✓ " : "✕ "}{flash.msg}
          </div>
        )}

        {!venueMapUrl ? (
          <div className="mx-7 mb-6 rounded-2xl flex items-center justify-center shrink-0" style={{ minHeight: 140, border: `1px dashed ${t.border}` }}>
            <div className="text-center py-8">
              <p className="text-sm font-medium" style={{ color: t.textMuted }}>No venue map uploaded</p>
              <p className="text-xs mt-1" style={{ color: t.textFaint }}>Add one in the organizer dashboard</p>
            </div>
          </div>
        ) : (
          <div className="mx-7 mb-4 rounded-2xl overflow-hidden shrink-0" style={{ background: t.cardAlt, border: `1px solid ${t.border}` }}>
            <div style={{ position: "relative", width: "100%", paddingTop: "60%" }}>
              <div style={{ position: "absolute", inset: 0 }}>
                <img src={venueMapUrl} alt="Venue map" className="w-full h-full" style={{ objectFit: "contain", pointerEvents: "none" }} />
                {placed.map(tt => {
                  const zone = zones.find(z => z.id === tt.zone_id);
                  const fill = tt.table_color || zone?.color || "#888";
                  const sz = TABLE_SZ[tt.map_table_size ?? "medium"] ?? 30;
                  const fs = sz >= 34 ? 12 : sz >= 24 ? 10 : 9;
                  const status = tableStatus(tt);
                  const isSel = selId === tt.id;
                  const shadow = isSel
                    ? `0 0 0 3px #fff, 0 4px 16px rgba(0,0,0,0.5)`
                    : status === "checked_in"
                      ? `0 0 0 2.5px rgba(16,185,129,0.9), 0 3px 10px rgba(0,0,0,0.35)`
                      : status === "reserved"
                        ? `0 0 0 2.5px rgba(251,191,36,0.9), 0 3px 10px rgba(0,0,0,0.35)`
                        : `0 2px 8px rgba(0,0,0,0.4)`;
                  return (
                    <button key={tt.id} onClick={() => handleSelect(tt.id)} style={{
                      position: "absolute", left: `${tt.map_position_x}%`, top: `${tt.map_position_y}%`,
                      width: sz, height: sz,
                      transform: `translate(-50%,-50%)${isSel ? " scale(1.2)" : ""}`,
                      background: fill, borderRadius: 6, border: "none",
                      color: tt.table_text_color || "#fff",
                      fontSize: fs, fontWeight: "bold",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: shadow, zIndex: isSel ? 20 : 10,
                      cursor: "pointer", transition: "transform 0.12s, box-shadow 0.12s",
                    }}>{tt.name}</button>
                  );
                })}
              </div>
            </div>
            <div className="px-4 py-2.5 flex items-center gap-6" style={{ borderTop: `1px solid ${t.border}` }}>
              {[
                { ring: "rgba(16,185,129,0.9)", label: "Checked in" },
                { ring: "rgba(251,191,36,0.9)", label: "Reserved" },
                { ring: t.border, label: "Available" },
              ].map(({ ring, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ boxShadow: `0 0 0 2px ${ring}`, background: "transparent" }} />
                  <span className="text-[10px]" style={{ color: t.textFaint }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {unplaced.length > 0 && (
          <div className="mx-7 mb-7">
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: t.textFaint }}>Tables not on map</p>
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
              {unplaced.map((tt, i) => {
                const zone = zones.find(z => z.id === tt.zone_id);
                const status = tableStatus(tt);
                const isSel = selId === tt.id;
                const ss = {
                  checked_in: { bg: "rgba(16,185,129,0.1)", color: "#10b981", label: "Checked in" },
                  reserved:   { bg: "rgba(251,191,36,0.1)", color: "#d97706", label: "Reserved" },
                  available:  { bg: t.inputBg, color: t.textFaint, label: "Available" },
                }[status];
                return (
                  <button key={tt.id} onClick={() => handleSelect(tt.id)} className="w-full text-left"
                    style={{ display: "block", background: isSel ? t.inputBg : t.card, borderBottom: i < unplaced.length - 1 ? `1px solid ${t.borderFaint}` : "none" }}>
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: tt.table_color || zone?.color || t.inputBg, color: tt.table_text_color || "#fff" }}>
                        {tt.name}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: t.text }}>Table #{tt.name}</p>
                        <p className="text-xs" style={{ color: t.textMuted }}>{zone?.name ?? "No zone"} · {fmtAmt(tt.price)}{tt.capacity ? ` · ${tt.capacity} pax` : ""}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Right: panel ── */}
      <div className="w-80 shrink-0 flex flex-col overflow-y-auto" style={{ borderLeft: `1px solid ${t.border}`, background: t.card }}>
        {!selTable ? (
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-4" style={{ color: t.textMuted }}>Summary</p>
            <div className="space-y-0">
              {[
                { label: "Total tables", value: tables.length, accent: null },
                { label: "Reserved", value: reservedCount, accent: null },
                { label: "Checked in", value: checkedInCount, accent: "#10b981" },
                { label: "Available", value: availableCount, accent: null },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${t.borderFaint}` }}>
                  <p className="text-xs" style={{ color: t.textMuted }}>{s.label}</p>
                  <p className="text-sm font-bold" style={{ color: s.accent ?? t.text }}>{s.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs mt-5 leading-relaxed" style={{ color: t.textFaint }}>Select a table on the map or list to view reservation details and take actions.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            <div className="p-5 shrink-0" style={{ background: panelAccent }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>{selZone?.name ?? "Table"}</p>
                  <p className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide leading-none" style={{ color: "#fff" }}>#{selTable.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{fmtAmt(selTable.price)}</span>
                    {selTable.capacity && <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{selTable.capacity} pax capacity</span>}
                  </div>
                </div>
                <button onClick={() => { setSelId(null); setMode("info"); }} style={{ color: "rgba(255,255,255,0.4)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto">

              {/* ── Info ── */}
              {mode === "info" && (
                <>
                  {selTicket ? (
                    <>
                      <div className="rounded-xl p-4 space-y-3"
                        style={{ background: selTicket.status === "used" ? "rgba(16,185,129,0.07)" : "rgba(251,191,36,0.06)", border: `1px solid ${selTicket.status === "used" ? "rgba(16,185,129,0.18)" : "rgba(251,191,36,0.18)"}` }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: selTicket.status === "used" ? "#10b981" : "#d97706" }} />
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: selTicket.status === "used" ? "#10b981" : "#d97706" }}>
                            {selTicket.status === "used" ? "Checked in" : "Reserved · pending arrival"}
                          </p>
                        </div>
                        {[
                          { label: "Name", value: selTicket.buyer_name },
                          { label: "Email", value: selTicket.buyer_email?.includes("@frontdesk.local") ? "Walk-in (door sale)" : selTicket.buyer_email },
                          { label: "Phone", value: selTicket.buyer_phone },
                          { label: "Guests", value: selTicket.pax_count ? `${selTicket.pax_count} pax` : null },
                          { label: "Paid", value: selTicket.purchase_price != null ? fmtAmt(selTicket.purchase_price) : null },
                        ].filter(r => r.value).map(({ label, value }) => (
                          <div key={label} className="flex items-start justify-between gap-3">
                            <p className="text-[10px] uppercase tracking-wider shrink-0 mt-0.5" style={{ color: t.textMuted }}>{label}</p>
                            <p className="text-sm font-medium text-right" style={{ color: t.text }}>{value}</p>
                          </div>
                        ))}
                        {(() => {
                          const arrived = arrivedPax(selTicket);
                          if (arrived === null) return null;
                          const remaining = (selTicket.pax_count ?? 0) - arrived;
                          return (
                            <div className="pt-2" style={{ borderTop: `1px solid ${selTicket.status === "used" ? "rgba(16,185,129,0.15)" : "rgba(251,191,36,0.15)"}` }}>
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.textMuted }}>Arrived</p>
                                <p className="text-sm font-bold" style={{ color: arrived >= (selTicket.pax_count ?? 0) ? "#10b981" : "#d97706" }}>
                                  {arrived} / {selTicket.pax_count ?? "?"}
                                </p>
                              </div>
                              {remaining > 0 && <p className="text-xs mt-1" style={{ color: "#d97706" }}>{remaining} guest{remaining !== 1 ? "s" : ""} still expected</p>}
                            </div>
                          );
                        })()}
                      </div>
                      {selTicket.status !== "used" && (
                        <button onClick={() => { setMode("checkin"); setPaxCheckin(selTicket.pax_count ?? selTable.capacity ?? 1); }}
                          className="w-full py-3 rounded-xl text-sm font-bold"
                          style={{ background: "#10b981", color: "#fff" }}>
                          Check in guests
                        </button>
                      )}
                      {selTicket.qr_code && (
                        <a href={`/ticket/${selTicket.qr_code}`} target="_blank" rel="noopener noreferrer"
                          className="block text-center text-xs py-2" style={{ color: t.textFaint }}>
                          View ticket →
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl p-4" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: t.textFaint }} />
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>Available</p>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: t.textFaint }}>No reservation. Sell it as a walk-in.</p>
                      </div>
                      <button onClick={() => { setMode("sell"); setPaxSell(selTable.capacity ?? 1); setPayMethod("cash"); }}
                        className="w-full py-3 rounded-xl text-sm font-bold"
                        style={{ background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff" }}>
                        Walk-in sale
                      </button>
                    </>
                  )}
                </>
              )}

              {/* ── Sell ── */}
              {mode === "sell" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.textMuted }}>Walk-in sale</p>
                    <button onClick={() => setMode("info")} className="text-xs" style={{ color: t.textFaint }}>Cancel</button>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>Number of guests</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPaxSell(p => Math.max(1, p - 1))} className="w-9 h-9 rounded-xl font-bold text-lg"
                        style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>−</button>
                      <span className="font-[family-name:var(--font-bebas)] text-3xl w-8 text-center leading-none" style={{ color: t.text }}>{paxSell}</span>
                      <button onClick={() => setPaxSell(p => Math.min(99, p + 1))} className="w-9 h-9 rounded-xl font-bold text-lg"
                        style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>+</button>
                      {selTable.capacity && <span className="text-xs" style={{ color: t.textFaint }}>cap. {selTable.capacity}</span>}
                    </div>
                  </div>
                  {selTable.capacity && paxSell > selTable.capacity && selTable.price_per_extra_person > 0 && (() => {
                    const extra = Math.min(paxSell - selTable.capacity, selTable.max_extra_people ?? 0);
                    if (extra <= 0) return null;
                    return (
                      <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}>
                        <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#d97706" }}>Extra guests fee</p>
                        <div className="flex justify-between">
                          <p className="text-xs" style={{ color: t.textMuted }}>{extra} × {fmtAmt(selTable.price_per_extra_person)}</p>
                          <p className="text-xs font-bold" style={{ color: t.text }}>+{fmtAmt(extra * selTable.price_per_extra_person)}</p>
                        </div>
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>Payment method</p>
                    <div className="flex gap-2">
                      {(["cash", "card"] as const).map(m => (
                        <button key={m} onClick={() => setPayMethod(m)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                          style={{ background: payMethod === m ? (dark ? "#fff" : "#0a0a0a") : t.inputBg, color: payMethod === m ? (dark ? "#0a0a0a" : "#fff") : t.textMuted, border: `1px solid ${t.inputBorder}` }}>
                          {m === "cash" ? "Cash" : "Tap / Card"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl px-4 py-3.5 flex items-center justify-between" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: t.textMuted }}>Total</p>
                    <p className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide" style={{ color: t.text }}>
                      {fmtAmt(selTable.price + calcExtra(selTable, paxSell))}
                    </p>
                  </div>
                  <button onClick={doSell} disabled={busy} className="w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-40"
                    style={{ background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff" }}>
                    {busy ? "Processing…" : "Confirm sale"}
                  </button>
                </div>
              )}

              {/* ── Check-in ── */}
              {mode === "checkin" && selTicket && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.textMuted }}>Check in</p>
                    <button onClick={() => setMode("info")} className="text-xs" style={{ color: t.textFaint }}>Cancel</button>
                  </div>
                  <div className="rounded-xl p-3.5" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                    <p className="text-xs" style={{ color: t.textMuted }}>
                      Reservation for <span className="font-semibold" style={{ color: t.text }}>{selTicket.buyer_name || "Walk-in"}</span>
                      {selTicket.pax_count ? <> · {selTicket.pax_count} pax expected</> : null}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>Guests arriving now</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPaxCheckin(p => Math.max(1, p - 1))} className="w-9 h-9 rounded-xl font-bold text-lg"
                        style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>−</button>
                      <span className="font-[family-name:var(--font-bebas)] text-3xl w-8 text-center leading-none" style={{ color: t.text }}>{paxCheckin}</span>
                      <button onClick={() => setPaxCheckin(p => Math.min(99, p + 1))} className="w-9 h-9 rounded-xl font-bold text-lg"
                        style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>+</button>
                      <span className="text-xs" style={{ color: t.textFaint }}>of {selTicket.pax_count ?? "?"}</span>
                    </div>
                    {selTicket.pax_count && paxCheckin < selTicket.pax_count && (
                      <p className="text-xs mt-2 font-medium" style={{ color: "#d97706" }}>
                        {selTicket.pax_count - paxCheckin} guest{selTicket.pax_count - paxCheckin !== 1 ? "s" : ""} still expected
                      </p>
                    )}
                  </div>
                  <button onClick={doCheckin} disabled={busy} className="w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-40"
                    style={{ background: "#10b981", color: "#fff" }}>
                    {busy ? "Processing…" : "Confirm check-in"}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
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
  const [theme, setTheme] = useState<Theme>("dark");

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
    const savedTheme = (localStorage.getItem("vybz_app_theme") as Theme) ?? "dark";
    setTheme(savedTheme);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!session) return;
    function beat() {
      fetch("/api/scan/heartbeat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: session!.code }) })
        .then(r => { if (r.status === 401) { localStorage.removeItem("vybz_cashier_session"); window.location.replace("/cashier"); } });
    }
    beat();
    const id = setInterval(beat, 30_000);
    return () => clearInterval(id);
  }, [session]);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("vybz_app_theme", next);
  }

  function disconnect() { localStorage.removeItem("vybz_cashier_session"); router.replace("/cashier"); }

  if (!ready || !session) return null;

  const t = getTokens(theme);

  return (
    <div className="fixed inset-0 flex" style={{ background: t.bg }}>
      {/* Sidebar — always dark */}
      <div className="flex flex-col shrink-0" style={{ width: 220, background: "#0f0f13", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="font-[family-name:var(--font-bebas)] text-white tracking-widest text-xl">VYBZ</p>
          <p className="text-white/20 text-[9px] uppercase tracking-widest mt-0.5">Front Desk</p>
          <div className="mt-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-white/80 text-xs font-semibold truncate">{session.eventName}</p>
            <p className="text-white/25 text-[10px] truncate mt-0.5">{session.venue}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{ background: tab === item.id ? "rgba(255,255,255,0.09)" : "transparent", color: tab === item.id ? "#fff" : "rgba(255,255,255,0.28)" }}>
              <span style={{ color: tab === item.id ? "#fff" : "rgba(255,255,255,0.22)" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
            <span className="text-xs font-medium">{theme === "dark" ? "Dark mode" : "Light mode"}</span>
            <span className="text-sm">{theme === "dark" ? "☾" : "☀︎"}</span>
          </button>
        </div>

        <div className="px-3 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 10 }}>
          <button onClick={() => setShowDisconnect(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.18)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Disconnect
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ background: t.bg }}>
        {tab === "overview"   && <Overview   session={session} theme={theme} />}
        {tab === "attendees"  && <Attendees  session={session} theme={theme} />}
        {tab === "door"       && <DoorEntry  session={session} theme={theme} />}
        {tab === "tables"     && <Tables session={session} theme={theme} />}
      </div>

      {/* Disconnect modal */}
      {showDisconnect && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-xs rounded-3xl p-6" style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/80 font-semibold mb-1">Disconnect</p>
            <p className="text-white/30 text-sm mb-5">You'll need your access code to reconnect.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDisconnect(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>Cancel</button>
              <button onClick={disconnect} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#ef4444" }}>Disconnect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
