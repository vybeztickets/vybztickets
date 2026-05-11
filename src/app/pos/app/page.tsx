"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Session = { eventId: string; eventName: string; venue: string; city: string; code: string };
type Mixer = { name: string; extra_price: number };
type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  subcategory?: string;
  has_mixer?: boolean;
  mixers?: Mixer[];
  currency: string;
  is_pinned?: boolean;
};
type CartItem = {
  cartKey: string;
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
};
type PayState = "idle" | "cash" | "card" | "comp";

const CAT_COLOR: Record<string, string> = {
  copas:       "#f59e0b",
  botellas:    "#8b5cf6",
  vino:        "#ec4899",
  cervezas:    "#10b981",
  seltzers:    "#06b6d4",
  sin_alcohol: "#3b82f6",
  shots:       "#ef4444",
  food:        "#f97316",
  merch:       "#a855f7",
  drinks:      "#f59e0b",
  other:       "#6b7280",
};

const CAT_LABEL: Record<string, string> = {
  copas: "Drinks", botellas: "Bottles", vino: "Wine",
  cervezas: "Beer", seltzers: "Seltzers", sin_alcohol: "Non-alcoholic",
  shots: "Shots", other: "Other",
};

const CAT_ORDER = ["copas", "botellas", "vino", "cervezas", "seltzers", "sin_alcohol", "shots", "other"];
const MIXER_COLORS = ["#ef4444", "#3b82f6", "#f97316", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

function fmtPrice(price: number, currency: string) {
  return `${currency === "CRC" ? "₡" : "$"}${price % 1 === 0 ? price : price.toFixed(2)}`;
}

function catColor(cat: string) {
  return CAT_COLOR[cat] ?? "#6b7280";
}

// ── Mixer Modal ───────────────────────────────────────────────────────────────
function MixerModal({ product, onSelect, onCancel }: {
  product: Product;
  onSelect: (mixer: Mixer) => void;
  onCancel: () => void;
}) {
  const mixers = product.mixers ?? [];
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="text-white/35 text-[10px] uppercase tracking-widest mb-1">Mix for</p>
        <p className="text-white font-semibold text-lg mb-5">{product.name}</p>
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {mixers.map((mixer, i) => (
            <button
              key={mixer.name}
              onClick={() => onSelect(mixer)}
              className="rounded-2xl p-4 text-left transition-all active:scale-95"
              style={{ background: MIXER_COLORS[i % MIXER_COLORS.length] }}
            >
              <p className="text-white font-semibold text-sm leading-tight">{mixer.name}</p>
              <p className="text-white/70 text-xs mt-1.5">
                {mixer.extra_price > 0 ? `+${fmtPrice(mixer.extra_price, product.currency)}` : "included"}
              </p>
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-2xl text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const [flash, setFlash] = useState(false);
  const color = catColor(product.category);

  function handleTap() {
    onAdd();
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  }

  return (
    <button
      onClick={handleTap}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-95 flex flex-col justify-between"
      style={{
        background: flash ? `${color}cc` : color,
        minHeight: 130,
        boxShadow: flash ? `0 0 0 3px ${color}55` : "none",
      }}
    >
      <p className="text-white font-semibold text-base leading-snug">{product.name}</p>
      <div className="mt-3">
        {product.has_mixer && (
          <p className="text-white/55 text-[10px] uppercase tracking-wider mb-1">+ mixer</p>
        )}
        <p className="font-[family-name:var(--font-bebas)] text-white text-3xl leading-none">
          {fmtPrice(product.price, product.currency)}
        </p>
      </div>
    </button>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function PosApp() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payState, setPayState] = useState<PayState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [mixerProduct, setMixerProduct] = useState<Product | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("vybz_pos_session");
    if (!stored) { router.replace("/pos"); return; }
    try {
      const s = JSON.parse(stored);
      if (!s.eventId || !s.code) throw new Error();
      setSession(s);
    } catch {
      localStorage.removeItem("vybz_pos_session");
      router.replace("/pos");
    }
    const savedTheme = (localStorage.getItem("vybz_app_theme") as "dark" | "light") ?? "dark";
    setTheme(savedTheme);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!session) return;
    function beat() {
      fetch("/api/scan/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: session!.code }),
      }).then(r => {
        if (r.status === 401) { localStorage.removeItem("vybz_pos_session"); window.location.replace("/pos"); }
      });
    }
    beat();
    const id = setInterval(beat, 30_000);
    return () => clearInterval(id);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/pos/products?code=${session.code}&eventId=${session.eventId}`)
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setLoadingProducts(false); })
      .catch(() => setLoadingProducts(false));
  }, [session]);

  useEffect(() => { setActiveSubcategory("all"); }, [activeCategory]);

  const presentCats = Array.from(new Set(products.map(p => p.category)));
  const orderedCats = CAT_ORDER.filter(c => presentCats.includes(c));
  const extraCats = presentCats.filter(c => !CAT_ORDER.includes(c));

  const pinnedProducts = products.filter(p => p.is_pinned);

  const catProducts = activeCategory === "pinned"
    ? pinnedProducts
    : activeCategory === "all"
    ? products
    : products.filter(p => p.category === activeCategory);

  const subcategories = Array.from(
    new Set(catProducts.map(p => p.subcategory).filter((s): s is string => !!s))
  );

  const visibleProducts = activeSubcategory === "all"
    ? catProducts
    : catProducts.filter(p => p.subcategory === activeSubcategory);

  const cartTotal = cart.reduce((s, item) => s + item.price * item.quantity, 0);
  const cartCount = cart.reduce((s, item) => s + item.quantity, 0);
  const cartCurrency = cart[0]?.currency ?? "USD";

  function handleProductTap(p: Product) {
    if (p.has_mixer && p.mixers && p.mixers.length > 0) {
      setMixerProduct(p);
    } else {
      addToCart(p, null);
    }
  }

  function addToCart(p: Product, mixer: Mixer | null) {
    const cartKey = mixer ? `${p.id}:${mixer.name}` : p.id;
    const name = mixer ? `${p.name} + ${mixer.name}` : p.name;
    const price = p.price + (mixer?.extra_price ?? 0);
    setCart(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) return prev.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { cartKey, id: p.id, name, price, currency: p.currency, quantity: 1 }];
    });
    setMixerProduct(null);
  }

  function changeQty(cartKey: string, delta: number) {
    setCart(prev =>
      prev.map(i => i.cartKey === cartKey ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter(i => i.quantity > 0)
    );
  }

  function clearCart() { setCart([]); setPayState("idle"); }

  async function submitOrder(method: "cash" | "card" | "comp") {
    if (!session || cart.length === 0) return;
    setSubmitting(true);
    const items = cart.map(i => ({
      product_id: i.id, name: i.name, price: i.price,
      quantity: i.quantity, subtotal: i.price * i.quantity,
    }));
    const res = await fetch("/api/pos/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: session.code, eventId: session.eventId, items, total: method === "comp" ? 0 : cartTotal, paymentMethod: method }),
    });
    setSubmitting(false);
    if (!res.ok) return;
    const saved = cartTotal;
    const cur = cartCurrency;
    clearCart();
    if (successTimer.current) clearTimeout(successTimer.current);
    setSuccessMsg(method === "comp" ? `Comp — order saved` : `${fmtPrice(saved, cur)} — order saved`);
    successTimer.current = setTimeout(() => setSuccessMsg(null), 3000);
  }

  function disconnect() { localStorage.removeItem("vybz_pos_session"); router.replace("/pos"); }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("vybz_app_theme", next);
  }

  const dark = theme === "dark";
  const contentBg  = dark ? "#080808" : "#f0f0f0";
  const cartBg     = dark ? "#0f0f13" : "#ffffff";
  const ct = {
    text:       dark ? "rgba(255,255,255,0.85)" : "#0a0a0a",
    textMuted:  dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.45)",
    textFaint:  dark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.25)",
    border:     dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)",
    btnBg:      dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    btnColor:   dark ? "rgba(255,255,255,0.5)"  : "rgba(0,0,0,0.5)",
    qty:        dark ? "#ffffff"                : "#0a0a0a",
    pillBg:     dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    pillColor:  dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)",
    emptyBorder:dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.1)",
    totalLabel: dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)",
    totalAmt:   dark ? "#ffffff"                : "#0a0a0a",
  };

  if (!ready || !session) return null;

  return (
    <div className="fixed inset-0 flex" style={{ background: contentBg }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0"
        style={{ width: 220, background: "#0f0f13", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="font-[family-name:var(--font-bebas)] text-white tracking-widest text-xl">VYBZ</p>
          <p className="text-white/20 text-[9px] uppercase tracking-widest">BAR POS</p>
          <div className="mt-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-white/80 text-xs font-semibold truncate">{session.eventName}</p>
            <p className="text-white/25 text-[10px] truncate mt-0.5">{session.venue}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          {pinnedProducts.length > 0 && (
            <button
              onClick={() => setActiveCategory("pinned")}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left mb-1"
              style={{
                background: activeCategory === "pinned" ? "rgba(245,158,11,0.15)" : "transparent",
                color: activeCategory === "pinned" ? "#f59e0b" : "rgba(255,255,255,0.35)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={activeCategory === "pinned" ? "#f59e0b" : "none"} stroke={activeCategory === "pinned" ? "#f59e0b" : "rgba(255,255,255,0.3)"} strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Pinned
              <span className="ml-auto text-xs tabular-nums" style={{ color: activeCategory === "pinned" ? "rgba(245,158,11,0.55)" : "rgba(255,255,255,0.15)" }}>
                {pinnedProducts.length}
              </span>
            </button>
          )}
          <button
            onClick={() => setActiveCategory("all")}
            className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
            style={{
              background: activeCategory === "all" ? "rgba(255,255,255,0.09)" : "transparent",
              color: activeCategory === "all" ? "#fff" : "rgba(255,255,255,0.28)",
            }}
          >
            All
            <span className="ml-auto text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.18)" }}>
              {products.length}
            </span>
          </button>
          {[...orderedCats, ...extraCats].map(cat => {
            const count = products.filter(p => p.category === cat).length;
            const active = activeCategory === cat;
            const color = catColor(cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  background: active ? `${color}1a` : "transparent",
                  color: active ? color : "rgba(255,255,255,0.28)",
                }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: active ? color : "rgba(255,255,255,0.12)" }} />
                {CAT_LABEL[cat] ?? cat}
                <span className="ml-auto text-xs tabular-nums" style={{ color: active ? `${color}88` : "rgba(255,255,255,0.13)" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
            <span className="text-xs font-medium">{theme === "dark" ? "Dark mode" : "Light mode"}</span>
            <span className="text-sm">{theme === "dark" ? "☾" : "☀︎"}</span>
          </button>
        </div>

        <div className="px-3 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 10 }}>
          <button
            onClick={() => setShowDisconnect(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.18)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Disconnect
          </button>
        </div>
      </div>

      {/* ── Product area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {successMsg && (
          <div
            className="mx-5 mt-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0"
            style={{ background: dark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.18)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {successMsg}
          </div>
        )}

        {subcategories.length > 0 && (
          <div className="px-5 pt-4 pb-1 flex gap-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setActiveSubcategory("all")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
              style={{
                background: activeSubcategory === "all" ? (dark ? "#fff" : "#0a0a0a") : ct.pillBg,
                color: activeSubcategory === "all" ? (dark ? "#000" : "#fff") : ct.pillColor,
              }}
            >
              All
            </button>
            {subcategories.map(sub => {
              const active = activeSubcategory === sub;
              const color = catColor(activeCategory);
              return (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all capitalize"
                  style={{
                    background: active ? color : ct.pillBg,
                    color: active ? "#fff" : ct.pillColor,
                  }}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm" style={{ color: ct.textMuted }}>Loading products…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 rounded-2xl" style={{ border: `1px dashed ${ct.emptyBorder}` }}>
              <p className="text-sm mb-1" style={{ color: ct.textMuted }}>No products configured</p>
              <p className="text-xs" style={{ color: ct.textFaint }}>Add products in Dashboard → POS → Products</p>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm" style={{ color: ct.textMuted }}>No products in this category</p>
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))" }}>
              {visibleProducts.map(p => (
                <ProductCard key={p.id} product={p} onAdd={() => handleProductTap(p)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Cart panel ───────────────────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0"
        style={{ width: 290, background: cartBg, borderLeft: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.07)" }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${ct.border}` }}>
          <p className="font-semibold text-sm" style={{ color: ct.text }}>
            Order{cartCount > 0 && <span className="ml-1.5" style={{ color: ct.textMuted }}>({cartCount})</span>}
          </p>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all" style={{ background: "rgba(239,68,68,0.12)", color: "rgba(239,68,68,0.6)" }}>
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-sm" style={{ color: ct.textFaint }}>No items</p>
              <p className="text-xs mt-1" style={{ color: ct.textFaint }}>Tap a product to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.cartKey} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium leading-snug" style={{ color: ct.text }}>{item.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: ct.textMuted }}>{fmtPrice(item.price * item.quantity, item.currency)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => changeQty(item.cartKey, -1)}
                      className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center"
                      style={{ background: ct.btnBg, color: ct.btnColor }}>−</button>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums" style={{ color: ct.qty }}>{item.quantity}</span>
                    <button onClick={() => changeQty(item.cartKey, 1)}
                      className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center"
                      style={{ background: ct.btnBg, color: ct.btnColor }}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 pb-6" style={{ borderTop: `1px solid ${ct.border}`, paddingTop: 16 }}>
          <div className="flex items-end justify-between mb-5">
            <p className="text-xs uppercase tracking-wider" style={{ color: ct.totalLabel }}>Total</p>
            <p className="font-[family-name:var(--font-bebas)] text-4xl leading-none" style={{ color: ct.totalAmt }}>
              {cart.length > 0 ? fmtPrice(cartTotal, cartCurrency) : "—"}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={cart.length === 0}
                onClick={() => setPayState("cash")}
                className="py-4 rounded-2xl text-sm font-bold transition-all disabled:opacity-20"
                style={{ background: "#10b981", color: "#fff" }}
              >
                Cash
              </button>
              <button
                disabled={cart.length === 0}
                onClick={() => setPayState("card")}
                className="py-4 rounded-2xl text-sm font-bold transition-all disabled:opacity-20"
                style={{ background: "#3b82f6", color: "#fff" }}
              >
                Card
              </button>
            </div>
            <button
              disabled={cart.length === 0}
              onClick={() => setPayState("comp")}
              className="w-full py-4 rounded-2xl text-sm font-bold transition-all disabled:opacity-20"
              style={{ background: "#8b5cf6", color: "#fff" }}
            >
              Courtesy
            </button>
          </div>
        </div>
      </div>

      {/* ── Mixer modal ──────────────────────────────────────────────────── */}
      {mixerProduct && (
        <MixerModal
          product={mixerProduct}
          onSelect={(mixer) => addToCart(mixerProduct, mixer)}
          onCancel={() => setMixerProduct(null)}
        />
      )}

      {/* ── Cash modal ──────────────────────────────────────────────────── */}
      {payState === "cash" && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)" }}
        >
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/35 text-[10px] uppercase tracking-widest mb-1">Cash payment</p>
            <p className="font-[family-name:var(--font-bebas)] text-white text-5xl leading-none mb-6">
              {fmtPrice(cartTotal, cartCurrency)}
            </p>
            <div className="space-y-2.5 mb-6 max-h-48 overflow-y-auto">
              {cart.map(item => (
                <div key={item.cartKey} className="flex items-center justify-between">
                  <span className="text-white/45 text-sm">{item.quantity}× {item.name}</span>
                  <span className="text-white/75 text-sm font-medium">{fmtPrice(item.price * item.quantity, item.currency)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPayState("idle")}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => submitOrder("cash")}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "#10b981" }}
              >
                {submitting ? "Saving…" : "Paid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Card modal ──────────────────────────────────────────────────── */}
      {payState === "card" && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)" }}
        >
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/35 text-[10px] uppercase tracking-widest mb-1">Card payment</p>
            <p className="font-[family-name:var(--font-bebas)] text-white text-5xl leading-none mb-4">
              {fmtPrice(cartTotal, cartCurrency)}
            </p>
            <div
              className="flex flex-col items-center justify-center py-7 rounded-2xl mb-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.07)" }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" className="mb-3">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
              <p className="text-white/28 text-sm font-medium">Tap to pay</p>
              <p className="text-white/15 text-xs mt-1">Hold card to reader</p>
            </div>
            <div className="space-y-2.5 mb-5 max-h-36 overflow-y-auto">
              {cart.map(item => (
                <div key={item.cartKey} className="flex items-center justify-between">
                  <span className="text-white/45 text-sm">{item.quantity}× {item.name}</span>
                  <span className="text-white/75 text-sm font-medium">{fmtPrice(item.price * item.quantity, item.currency)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPayState("idle")}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => submitOrder("card")}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50"
                style={{ background: "#fff", color: "#0a0a0a" }}
              >
                {submitting ? "Saving…" : "Payment received"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Comp modal ──────────────────────────────────────────────────── */}
      {payState === "comp" && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)" }}
        >
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/35 text-[10px] uppercase tracking-widest mb-1">Courtesy · $0</p>
            <p className="font-[family-name:var(--font-bebas)] text-white/30 text-5xl leading-none line-through mb-1">
              {fmtPrice(cartTotal, cartCurrency)}
            </p>
            <p className="font-[family-name:var(--font-bebas)] text-[#818cf8] text-3xl leading-none mb-6">$0.00</p>
            <div className="space-y-2.5 mb-6 max-h-48 overflow-y-auto">
              {cart.map(item => (
                <div key={item.cartKey} className="flex items-center justify-between">
                  <span className="text-white/45 text-sm">{item.quantity}× {item.name}</span>
                  <span className="text-white/30 text-sm line-through">{fmtPrice(item.price * item.quantity, item.currency)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPayState("idle")}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => submitOrder("comp")}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50"
                style={{ background: "#8b5cf6", color: "#fff" }}
              >
                {submitting ? "Saving…" : "Confirm courtesy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Disconnect modal ─────────────────────────────────────────────── */}
      {showDisconnect && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
        >
          <div className="w-full max-w-xs rounded-3xl p-6" style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/80 font-semibold mb-1">Disconnect</p>
            <p className="text-white/30 text-sm mb-5">You'll need your access code to reconnect.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnect(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}
              >
                Cancel
              </button>
              <button
                onClick={disconnect}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#ef4444" }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
