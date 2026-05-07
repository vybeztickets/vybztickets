"use client";

import { useEffect, useState } from "react";

const CATEGORIES = ["drinks", "food", "merch", "other"] as const;
type Category = (typeof CATEGORIES)[number];
const CAT_LABEL: Record<Category, string> = { drinks: "Drinks", food: "Food", merch: "Merch", other: "Other" };
const CAT_COLOR: Record<Category, string> = {
  drinks: "rgba(59,130,246,0.1)",
  food: "rgba(16,185,129,0.1)",
  merch: "rgba(245,158,11,0.1)",
  other: "rgba(0,0,0,0.06)",
};
const CAT_TEXT: Record<Category, string> = {
  drinks: "#3b82f6",
  food: "#10b981",
  merch: "#f59e0b",
  other: "rgba(0,0,0,0.4)",
};

type Product = {
  id: string; name: string; price: number; category: Category;
  currency: string; is_active: boolean;
};

const EMPTY_FORM = { name: "", price: "", category: "drinks" as Category, currency: "USD" };

export default function PosProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<Category | "all">("all");

  async function load() {
    const res = await fetch("/api/organizador/pos/products");
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditId(p.id);
    setForm({ name: p.name, price: String(p.price), category: p.category, currency: p.currency });
    setError(null);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (!form.name.trim()) { setError("Name required"); return; }
    if (isNaN(price) || price < 0) { setError("Valid price required"); return; }
    setSaving(true); setError(null);

    const url = editId ? `/api/organizador/pos/products/${editId}` : "/api/organizador/pos/products";
    const res = await fetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), price, category: form.category, currency: form.currency }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setSaving(false); return; }
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/organizador/pos/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/organizador/pos/products/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = filterCat === "all" ? products : products.filter(p => p.category === filterCat);

  return (
    <div className="px-10 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-4xl tracking-wide">Products</h1>
          <p className="text-[#0a0a0a]/30 text-sm mt-1">Manage your POS product catalog</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
          style={{ background: "#0a0a0a", color: "#fff" }}
        >
          + Add product
        </button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(["all", ...CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize"
            style={{
              background: filterCat === cat ? "#0a0a0a" : "rgba(0,0,0,0.06)",
              color: filterCat === cat ? "#fff" : "rgba(0,0,0,0.5)",
            }}
          >
            {cat === "all" ? `All (${products.length})` : `${CAT_LABEL[cat]} (${products.filter(p => p.category === cat).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[#0a0a0a]/20 text-sm py-12 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.1)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(0,0,0,0.05)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
            </svg>
          </div>
          <p className="text-[#0a0a0a]/25 text-sm mb-3">No products yet</p>
          <button onClick={openAdd}
            className="text-sm font-semibold text-[#0a0a0a] hover:opacity-60 transition-opacity">
            + Add your first product
          </button>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div
            className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
            style={{ gridTemplateColumns: "1fr 120px 100px 100px 80px", background: "rgba(0,0,0,0.02)", color: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
          >
            <div>Product</div>
            <div>Category</div>
            <div className="text-right">Price</div>
            <div className="text-center">Active</div>
            <div />
          </div>
          {filtered.map((p, i) => (
            <div
              key={p.id}
              className="grid items-center px-5 py-3.5"
              style={{
                gridTemplateColumns: "1fr 120px 100px 100px 80px",
                borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                opacity: p.is_active ? 1 : 0.4,
              }}
            >
              <p className="text-[#0a0a0a] text-sm font-medium">{p.name}</p>
              <div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                  style={{ background: CAT_COLOR[p.category], color: CAT_TEXT[p.category] }}>
                  {CAT_LABEL[p.category]}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[#0a0a0a] text-sm font-semibold">
                  {p.currency === "USD" ? "$" : "₡"}{Number(p.price).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => toggleActive(p)}
                  className="w-10 h-5 rounded-full transition-colors relative shrink-0"
                  style={{ background: p.is_active ? "#0a0a0a" : "rgba(0,0,0,0.15)" }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: p.is_active ? "calc(100% - 18px)" : "2px" }}
                  />
                </button>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  onClick={() => openEdit(p)}
                  className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                  style={{ color: "rgba(0,0,0,0.3)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  style={{ color: "rgba(239,68,68,0.4)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}>
            <p className="text-[#0a0a0a] font-semibold text-lg mb-5">
              {editId ? "Edit product" : "New product"}
            </p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Vodka tonic"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/20 focus:outline-none"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/20 focus:outline-none"
                    style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                  />
                </div>
                <div>
                  <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] focus:outline-none"
                    style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CRC">CRC (₡)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat }))}
                      className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
                      style={{
                        background: form.category === cat ? "#0a0a0a" : "rgba(0,0,0,0.06)",
                        color: form.category === cat ? "#fff" : "rgba(0,0,0,0.5)",
                      }}
                    >
                      {CAT_LABEL[cat]}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: "#0a0a0a" }}
                >
                  {saving ? "Saving…" : editId ? "Save changes" : "Add product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
