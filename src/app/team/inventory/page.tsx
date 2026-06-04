"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; name: string; category: string; unit: string; current_stock: number; par_level: number };
type View = "home" | "empty" | "count";

const CATEGORY_LABELS: Record<string, string> = {
  spirits: "Spirits", beer: "Beer", wine: "Wine", non_alcoholic: "Non-alcoholic", food: "Food", other: "Other",
};
const CATEGORY_ORDER = ["spirits", "beer", "wine", "non_alcoholic", "food", "other"];

function fmt(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(2); }

export default function TeamInventoryPage() {
  const router = useRouter();
  const [member, setMember] = useState<{ name: string | null; email: string; role: string } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [view, setView] = useState<View>("home");
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Empty bottle state
  const [emptyQtys, setEmptyQtys] = useState<Record<string, string>>({});
  const [submittingEmpty, setSubmittingEmpty] = useState(false);
  const [emptySuccess, setEmptySuccess] = useState(false);

  // Count state
  const [countId, setCountId] = useState<string | null>(null);
  const [countActuals, setCountActuals] = useState<Record<string, string>>({});
  const [countItems, setCountItems] = useState<{ id: string; item_id: string; expected_qty: number; item: Item }[]>([]);
  const [startingCount, setStartingCount] = useState(false);
  const [completingCount, setCompletingCount] = useState(false);
  const [countDone, setCountDone] = useState(false);

  function getToken(): string | null {
    try {
      const stored = localStorage.getItem("vybz_team_session");
      if (!stored) return null;
      return JSON.parse(stored).token ?? null;
    } catch { return null; }
  }

  useEffect(() => {
    const t = getToken();
    if (!t) { router.replace("/team/login"); return; }
    setToken(t);
    fetch("/api/team/me", { headers: { Authorization: `Bearer ${t}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setMember(d.member))
      .catch(() => { localStorage.removeItem("vybz_team_session"); router.replace("/team/login"); });

    fetch("/api/team/inventory", { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false); });
  }, [router]);

  function logout() {
    const t = getToken();
    if (t) fetch("/api/team/logout", { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    localStorage.removeItem("vybz_team_session");
    router.replace("/team/login");
  }

  async function submitEmpty() {
    const linesToSubmit = Object.entries(emptyQtys).filter(([, v]) => v && Number(v) > 0);
    if (linesToSubmit.length === 0) return;
    setSubmittingEmpty(true);
    for (const [item_id, qty] of linesToSubmit) {
      await fetch("/api/team/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "empty_bottle", item_id, quantity: Number(qty) }),
      });
    }
    setEmptyQtys({});
    setSubmittingEmpty(false);
    setEmptySuccess(true);
    setTimeout(() => setEmptySuccess(false), 3000);
    fetch("/api/team/inventory", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setItems(d.items ?? []));
  }

  async function startCount() {
    setStartingCount(true);
    const res = await fetch("/api/team/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "start_count" }),
    }).then(r => r.json());
    setCountId(res.count_id);
    const withItems = items.map(item => ({ id: "", item_id: item.id, expected_qty: item.current_stock, item }));
    setCountItems(withItems);
    const initActuals: Record<string, string> = {};
    items.forEach(item => { initActuals[item.id] = ""; });
    setCountActuals(initActuals);
    setStartingCount(false);
    setView("count");
  }

  async function submitCount() {
    if (!countId) return;
    setCompletingCount(true);
    const updates = Object.entries(countActuals)
      .filter(([, v]) => v !== "")
      .map(([item_id, actual_qty]) => {
        const ci = countItems.find(c => c.item_id === item_id);
        return ci ? { count_item_id: ci.id || item_id, actual_qty: Number(actual_qty) } : null;
      }).filter(Boolean);

    await fetch("/api/team/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "submit_count", count_id: countId, updates }),
    });
    setCompletingCount(false);
    setCountDone(true);
    setTimeout(() => { setCountDone(false); setView("home"); setCountId(null); }, 3000);
  }

  const lowStock = items.filter(i => i.par_level > 0 && i.current_stock <= i.par_level);
  const grouped = CATEGORY_ORDER.map(cat => ({ cat, label: CATEGORY_LABELS[cat] ?? cat, items: items.filter(i => i.category === cat) })).filter(g => g.items.length > 0);
  const canCount = member?.role === "bar_manager" || member?.role === "inventory_staff";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <p style={{ color: "#888" }}>Loading…</p>
      </div>
    );
  }

  // ── Count view ───────────────────────────────────────────────────────────────
  if (view === "count") {
    if (countDone) return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3" style={{ background: "#0a0a0a" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <p className="text-white font-semibold">Count completed!</p>
        <p style={{ color: "#888" }} className="text-sm">Stock has been updated</p>
      </div>
    );

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
        <div className="px-4 pt-6 pb-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setView("home")} style={{ color: "#888" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <p className="text-white font-semibold">Physical count</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="text-sm mb-4" style={{ color: "#888" }}>Enter the quantity you physically count for each item.</p>
          {grouped.map(({ cat, label, items: catItems }) => (
            <div key={cat} className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#666" }}>{label}</p>
              <div className="flex flex-col gap-2">
                {catItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      <p className="text-xs" style={{ color: "#666" }}>Expected: {fmt(item.current_stock)} {item.unit}s</p>
                    </div>
                    <input
                      type="number" min="0" step="0.5"
                      placeholder={fmt(item.current_stock)}
                      value={countActuals[item.id] ?? ""}
                      onChange={e => setCountActuals(prev => ({ ...prev, [item.id]: e.target.value }))}
                      className="w-20 px-3 py-1.5 rounded-lg text-sm text-center text-white focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-6 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={submitCount} disabled={completingCount} className="w-full py-3.5 rounded-full font-semibold disabled:opacity-40" style={{ background: "#fff", color: "#0a0a0a" }}>
            {completingCount ? "Submitting…" : "Complete count"}
          </button>
        </div>
      </div>
    );
  }

  // ── Empty bottle view ────────────────────────────────────────────────────────
  if (view === "empty") {
    const spiritsAndWine = items.filter(i => ["spirits", "wine", "other"].includes(i.category));
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
        <div className="px-4 pt-6 pb-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setView("home")} style={{ color: "#888" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <p className="text-white font-semibold">Mark empty bottles</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {emptySuccess && (
            <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              <p className="text-sm font-medium" style={{ color: "#10b981" }}>Logged successfully!</p>
            </div>
          )}
          <p className="text-sm mb-4" style={{ color: "#888" }}>Enter how many bottles you finished for each spirit or mixer.</p>
          <div className="flex flex-col gap-2">
            {spiritsAndWine.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{item.name}</p>
                  <p className="text-xs" style={{ color: "#666" }}>{fmt(item.current_stock)} {item.unit}s in stock</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEmptyQtys(p => ({ ...p, [item.id]: String(Math.max(0, (Number(p[item.id]) || 0) - 1)) }))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </button>
                  <span className="text-white font-bold w-6 text-center">{emptyQtys[item.id] || "0"}</span>
                  <button onClick={() => setEmptyQtys(p => ({ ...p, [item.id]: String((Number(p[item.id]) || 0) + 1) }))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 pb-6 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={submitEmpty} disabled={submittingEmpty || !Object.values(emptyQtys).some(v => Number(v) > 0)} className="w-full py-3.5 rounded-full font-semibold disabled:opacity-40" style={{ background: "#fff", color: "#0a0a0a" }}>
            {submittingEmpty ? "Logging…" : `Log ${Object.values(emptyQtys).reduce((s, v) => s + (Number(v) || 0), 0)} empty bottle${Object.values(emptyQtys).reduce((s, v) => s + (Number(v) || 0), 0) !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    );
  }

  // ── Home view ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-1">
          <p className="font-[family-name:var(--font-bebas)] text-white tracking-widest">VYBZ</p>
          <button onClick={logout} className="text-xs" style={{ color: "#666" }}>Sign out</button>
        </div>
        <p className="text-white font-semibold">Hey, {member?.name ?? member?.email?.split("@")[0]}</p>
        <p className="text-xs capitalize" style={{ color: "#666" }}>{member?.role?.replace("_", " ")}</p>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="mx-4 mt-4 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
            {lowStock.length} item{lowStock.length !== 1 ? "s" : ""} below par
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#ef4444" }}>{lowStock.map(i => i.name).join(", ")}</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <button onClick={() => setView("empty")} className="flex flex-col items-start p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(245,158,11,0.15)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
              <path d="M8 2h8l1 7H7L8 2z" /><path d="M7 9c0 8 2 12 5 12s5-4 5-12" /><path d="M9 14h6" />
            </svg>
          </div>
          <p className="text-white text-sm font-semibold">Empty bottles</p>
          <p className="text-[11px] mt-0.5" style={{ color: "#666" }}>Log finished spirits</p>
        </button>
        {canCount && (
          <button onClick={startCount} disabled={startingCount} className="flex flex-col items-start p-4 rounded-2xl disabled:opacity-50" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(99,102,241,0.15)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <p className="text-white text-sm font-semibold">{startingCount ? "Starting…" : "Physical count"}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#666" }}>Count all items</p>
          </button>
        )}
      </div>

      {/* Stock list */}
      <div className="px-4 flex-1 overflow-y-auto pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#555" }}>Current stock</p>
        {grouped.map(({ cat, label, items: catItems }) => (
          <div key={cat} className="mb-4">
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#555" }}>{label}</p>
            <div className="flex flex-col gap-1.5">
              {catItems.map(item => {
                const isLow = item.par_level > 0 && item.current_stock <= item.par_level;
                return (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${isLow ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                    <div className="flex items-center gap-2">
                      {isLow && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                      <p className="text-white text-sm">{item.name}</p>
                    </div>
                    <p className="text-sm font-bold" style={{ color: isLow ? "#ef4444" : "#fff" }}>{fmt(item.current_stock)} <span className="font-normal text-xs" style={{ color: "#555" }}>{item.unit}s</span></p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
