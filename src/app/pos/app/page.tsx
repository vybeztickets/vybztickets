"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Session = { eventId: string; eventName: string; venue: string; city: string; code: string };
type Product = { id: string; name: string; price: number; category: string; currency: string };
type CartItem = { id: string; name: string; price: number; currency: string; quantity: number };
type PayState = "idle" | "cash" | "card";

const CAT_LABEL: Record<string, string> = { drinks: "Drinks", food: "Food", merch: "Merch", other: "Other" };

function fmtPrice(price: number, currency: string) {
  return `${currency === "CRC" ? "₡" : "$"}${price % 1 === 0 ? price : price.toFixed(2)}`;
}

// ── Product card ────────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const [flash, setFlash] = useState(false);

  function handleTap() {
    onAdd();
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
  }

  return (
    <button
      onClick={handleTap}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-95"
      style={{
        background: flash ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${flash ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.07)"}`,
      }}
    >
      <p className="text-[#0a0a0a] font-semibold text-sm leading-tight mb-2">{product.name}</p>
      <p className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-2xl leading-none">
        {fmtPrice(product.price, product.currency)}
      </p>
    </button>
  );
}

// ── Main app ─────────────────────────────────────────────────────────────────
export default function PosApp() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payState, setPayState] = useState<PayState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load session
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
        if (r.status === 401) { localStorage.removeItem("vybz_pos_session"); window.location.replace("/pos"); }
      });
    }
    beat();
    const id = setInterval(beat, 30_000);
    return () => clearInterval(id);
  }, [session]);

  // Load products
  useEffect(() => {
    if (!session) return;
    fetch(`/api/pos/products?code=${session.code}&eventId=${session.eventId}`)
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setLoadingProducts(false); })
      .catch(() => setLoadingProducts(false));
  }, [session]);

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];
  const visibleProducts = activeCategory === "all"
    ? products
    : products.filter(p => p.category === activeCategory);

  const cartTotal = cart.reduce((s, item) => s + item.price * item.quantity, 0);
  const cartCount = cart.reduce((s, item) => s + item.quantity, 0);
  const cartCurrency = cart[0]?.currency ?? "USD";

  function addToCart(p: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, currency: p.currency, quantity: 1 }];
    });
  }

  function changeQty(id: string, delta: number) {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i);
      return updated.filter(i => i.quantity > 0);
    });
  }

  function clearCart() {
    setCart([]);
    setPayState("idle");
  }

  async function submitOrder(method: "cash" | "card") {
    if (!session || cart.length === 0) return;
    setSubmitting(true);

    const items = cart.map(i => ({
      product_id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      subtotal: i.price * i.quantity,
    }));

    const res = await fetch("/api/pos/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: session.code,
        eventId: session.eventId,
        items,
        total: cartTotal,
        paymentMethod: method,
      }),
    });

    setSubmitting(false);
    if (!res.ok) return;

    // Success: flash and reset
    clearCart();
    setPayState("idle");
    if (successTimer.current) clearTimeout(successTimer.current);
    setSuccessMsg(`${fmtPrice(cartTotal, cartCurrency)} — order saved`);
    successTimer.current = setTimeout(() => setSuccessMsg(null), 3000);
  }

  function disconnect() {
    localStorage.removeItem("vybz_pos_session");
    router.replace("/pos");
  }

  if (!ready || !session) return null;

  return (
    <div className="fixed inset-0 flex" style={{ background: "#fff" }}>

      {/* ── Left sidebar (categories + event) ────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0"
        style={{ width: 200, background: "#111", borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-[family-name:var(--font-bebas)] text-white tracking-widest text-xl">VYBZ</p>
          <p className="text-white/30 text-[10px] uppercase tracking-widest mt-0.5">POS</p>
          <div className="mt-3 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-white text-xs font-semibold truncate">{session.eventName}</p>
            <p className="text-white/30 text-[10px] truncate">{session.venue}</p>
          </div>
        </div>

        {/* Category nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-white/20 text-[9px] uppercase tracking-widest px-3 mb-2">Category</p>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left capitalize"
              style={{
                background: activeCategory === cat ? "rgba(255,255,255,0.1)" : "transparent",
                color: activeCategory === cat ? "#fff" : "rgba(255,255,255,0.35)",
              }}
            >
              {cat === "all" ? "All products" : (CAT_LABEL[cat] ?? cat)}
              <span className="ml-auto text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.2)" }}>
                {cat === "all" ? products.length : products.filter(p => p.category === cat).length}
              </span>
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Disconnect
          </button>
        </div>
      </div>

      {/* ── Product grid ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Success toast */}
        {successMsg && (
          <div
            className="mx-6 mt-4 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"
            style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {successMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-black/20 text-sm">Loading products…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.1)" }}>
              <p className="text-black/20 text-sm mb-2">No products configured</p>
              <p className="text-black/15 text-xs">Ask the organizer to add products at Dashboard → POS → Products</p>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-black/20 text-sm">No products in this category</p>
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
              {visibleProducts.map(p => (
                <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Cart panel ───────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0"
        style={{ width: 280, background: "#fafafa", borderLeft: "1px solid rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm">
            Order {cartCount > 0 && <span className="text-black/30">({cartCount})</span>}
          </p>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-black/30 hover:text-black/60 transition-colors">
              Clear
            </button>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-black/20 text-sm">No items yet</p>
              <p className="text-black/15 text-xs mt-1">Tap a product to add it</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0a0a0a] text-sm font-medium truncate">{item.name}</p>
                    <p className="text-black/30 text-xs">{fmtPrice(item.price * item.quantity, item.currency)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => changeQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center transition-colors"
                      style={{ background: "rgba(0,0,0,0.07)", color: "#0a0a0a" }}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-[#0a0a0a] tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => changeQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center transition-colors"
                      style={{ background: "rgba(0,0,0,0.07)", color: "#0a0a0a" }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total + payment */}
        <div className="px-5 pb-6" style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 16 }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-black/40 text-xs uppercase tracking-wider">Total</p>
            <p className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-3xl leading-none">
              {cart.length > 0 ? fmtPrice(cartTotal, cartCurrency) : "—"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={cart.length === 0}
              onClick={() => setPayState("cash")}
              className="py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-25"
              style={{ background: "#0a0a0a", color: "#fff" }}
            >
              Cash
            </button>
            <button
              disabled={cart.length === 0}
              onClick={() => setPayState("card")}
              className="py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-25"
              style={{ background: "rgba(0,0,0,0.08)", color: "#0a0a0a" }}
            >
              Card
            </button>
          </div>
        </div>
      </div>

      {/* ── Cash payment modal ────────────────────────────────────────────────── */}
      {payState === "cash" && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}>
            <p className="text-black/40 text-xs uppercase tracking-widest mb-1">Cash payment</p>
            <p className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-5xl leading-none mb-6">
              {fmtPrice(cartTotal, cartCurrency)}
            </p>
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-black/60 text-sm">{item.quantity}× {item.name}</span>
                  <span className="text-[#0a0a0a] text-sm font-medium">{fmtPrice(item.price * item.quantity, item.currency)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPayState("idle")}
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl text-sm font-medium"
                style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => submitOrder("cash")}
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: "#10b981" }}
              >
                {submitting ? "Saving…" : "Paid — close order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Card payment modal ────────────────────────────────────────────────── */}
      {payState === "card" && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}>
            <p className="text-black/40 text-xs uppercase tracking-widest mb-1">Card payment</p>
            <p className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-5xl leading-none mb-4">
              {fmtPrice(cartTotal, cartCurrency)}
            </p>

            {/* Tap to pay visual */}
            <div
              className="flex flex-col items-center justify-center py-6 rounded-2xl mb-6"
              style={{ background: "rgba(0,0,0,0.03)", border: "1px dashed rgba(0,0,0,0.12)" }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" className="mb-3">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
              <p className="text-black/40 text-sm font-medium">Tap to pay</p>
              <p className="text-black/20 text-xs mt-1">Present card or device to reader</p>
            </div>

            <div className="space-y-2 mb-6 max-h-36 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-black/60 text-sm">{item.quantity}× {item.name}</span>
                  <span className="text-[#0a0a0a] text-sm font-medium">{fmtPrice(item.price * item.quantity, item.currency)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPayState("idle")}
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl text-sm font-medium"
                style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => submitOrder("card")}
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: "#0a0a0a" }}
              >
                {submitting ? "Saving…" : "Payment received"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Disconnect modal ─────────────────────────────────────────────────── */}
      {showDisconnect && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-xs rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}>
            <p className="text-[#0a0a0a] font-semibold mb-1">Disconnect</p>
            <p className="text-black/40 text-sm mb-5">You&apos;ll need your access code to reconnect.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnect(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-black/50"
                style={{ background: "rgba(0,0,0,0.05)" }}
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
