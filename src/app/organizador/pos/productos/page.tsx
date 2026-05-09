"use client";

import { useEffect, useState } from "react";

type Mixer = { name: string; extra_price: string };
type Product = {
  id: string; name: string; price: number; category: string;
  subcategory?: string; has_mixer?: boolean; mixers?: { name: string; extra_price: number }[];
  currency: string; is_active: boolean;
};

const DEFAULT_CATS = ["copas", "botellas", "vino", "cervezas", "seltzers", "sin_alcohol", "shots", "other"];

const DEFAULT_CAT_LABELS: Record<string, string> = {
  copas: "Drinks", botellas: "Bottles", vino: "Wine",
  cervezas: "Beer", seltzers: "Seltzers", sin_alcohol: "Non-alcoholic",
  shots: "Shots", other: "Other",
};

const DEFAULT_SUBCATS: Record<string, string[]> = {
  copas:       ["Rum", "Whiskey", "Vodka", "Gin", "Tequila", "Other"],
  botellas:    ["Rum", "Whiskey", "Vodka", "Gin", "Tequila", "Other"],
  vino:        ["Bottle", "Glass", "Other"],
  cervezas:    ["Lager", "IPA", "Craft", "Other"],
  seltzers:    [],
  sin_alcohol: ["Water", "Juice", "Soda", "Other"],
  shots:       [],
  other:       [],
};

type FormState = {
  name: string; price: string; category: string; currency: string;
  subcategory: string; has_mixer: boolean; mixers: Mixer[];
};
const EMPTY_FORM: FormState = { name: "", price: "", category: "copas", currency: "USD", subcategory: "", has_mixer: false, mixers: [] };

// ── Trash icon ────────────────────────────────────────────────────────────────
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}

export default function PosProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("all");

  // Product form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Categories / subcategories stored in localStorage
  const [hiddenDefaultCats, setHiddenDefaultCats] = useState<string[]>([]);
  const [extraCats, setExtraCats] = useState<string[]>([]);           // { key, label }
  const [extraCatLabels, setExtraCatLabels] = useState<Record<string, string>>({});
  const [hiddenDefaultSubcats, setHiddenDefaultSubcats] = useState<Record<string, string[]>>({});
  const [extraSubcats, setExtraSubcats] = useState<Record<string, string[]>>({});

  // Manage modals
  const [showManageCats, setShowManageCats] = useState(false);
  const [showManageSubcats, setShowManageSubcats] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newSubcatCat, setNewSubcatCat] = useState("copas");
  const [newSubcatName, setNewSubcatName] = useState("");

  // Delete confirmation
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);
  const [confirmDeleteSubcat, setConfirmDeleteSubcat] = useState<{ cat: string; sub: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load localStorage ─────────────────────────────────────────────────────
  useEffect(() => {
    try {
      setHiddenDefaultCats(JSON.parse(localStorage.getItem("vybz_hidden_default_cats") ?? "[]"));
      setExtraCats(JSON.parse(localStorage.getItem("vybz_extra_cats") ?? "[]"));
      setExtraCatLabels(JSON.parse(localStorage.getItem("vybz_extra_cat_labels") ?? "{}"));
      setHiddenDefaultSubcats(JSON.parse(localStorage.getItem("vybz_hidden_default_subcats") ?? "{}"));
      setExtraSubcats(JSON.parse(localStorage.getItem("vybz_extra_subcats") ?? "{}"));
    } catch {}
  }, []);

  // ── Derived lists ─────────────────────────────────────────────────────────
  const visibleDefaultCats = DEFAULT_CATS.filter(c => !hiddenDefaultCats.includes(c));
  const allCats = [...visibleDefaultCats, ...extraCats];

  function catLabel(cat: string) {
    return DEFAULT_CAT_LABELS[cat] ?? extraCatLabels[cat] ?? cat;
  }

  function subcatsFor(cat: string): string[] {
    const hidden = hiddenDefaultSubcats[cat] ?? [];
    const defaults = (DEFAULT_SUBCATS[cat] ?? []).filter(s => !hidden.includes(s));
    const extras = (extraSubcats[cat] ?? []).filter(s => !defaults.includes(s));
    return [...defaults, ...extras];
  }

  // All cats for the manage modal (includes hidden defaults so user can see them)
  const allCatsForManage = [
    ...DEFAULT_CATS.map(c => ({ key: c, label: catLabel(c), isDefault: true, hidden: hiddenDefaultCats.includes(c) })),
    ...extraCats.map(c => ({ key: c, label: catLabel(c), isDefault: false, hidden: false })),
  ];

  // ── API ───────────────────────────────────────────────────────────────────
  async function load() {
    const res = await fetch("/api/organizador/pos/products");
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // ── Product form ──────────────────────────────────────────────────────────
  function openAdd() { setEditId(null); setForm({ ...EMPTY_FORM }); setFormError(null); setShowForm(true); }
  function openEdit(p: Product) {
    setEditId(p.id);
    setForm({ name: p.name, price: String(p.price), category: p.category ?? "other", currency: p.currency, subcategory: p.subcategory ?? "", has_mixer: p.has_mixer ?? false, mixers: (p.mixers ?? []).map(m => ({ name: m.name, extra_price: String(m.extra_price) })) });
    setFormError(null); setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (!form.name.trim()) { setFormError("Name required"); return; }
    if (isNaN(price) || price < 0) { setFormError("Invalid price"); return; }
    setSaving(true); setFormError(null);
    const mixers = form.has_mixer ? form.mixers.filter(m => m.name.trim()).map(m => ({ name: m.name.trim(), extra_price: parseFloat(m.extra_price) || 0 })) : [];
    const url = editId ? `/api/organizador/pos/products/${editId}` : "/api/organizador/pos/products";
    const res = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name.trim(), price, category: form.category, currency: form.currency, subcategory: form.subcategory || null, has_mixer: form.has_mixer, mixers }) });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error ?? "Error"); setSaving(false); return; }
    setSaving(false); setShowForm(false); load();
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/organizador/pos/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !p.is_active }) });
    load();
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/organizador/pos/products/${id}`, { method: "DELETE" });
    load();
  }

  function addMixer() { setForm(f => ({ ...f, mixers: [...f.mixers, { name: "", extra_price: "0" }] })); }
  function removeMixer(i: number) { setForm(f => ({ ...f, mixers: f.mixers.filter((_, j) => j !== i) })); }
  function updateMixer(i: number, field: keyof Mixer, val: string) { setForm(f => ({ ...f, mixers: f.mixers.map((m, j) => j === i ? { ...m, [field]: val } : m) })); }

  // ── Category management ───────────────────────────────────────────────────
  function addCustomCat() {
    const name = newCatName.trim();
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, "_");
    if (allCats.includes(key)) return;
    const updatedCats = [...extraCats, key];
    const updatedLabels = { ...extraCatLabels, [key]: name };
    setExtraCats(updatedCats);
    setExtraCatLabels(updatedLabels);
    localStorage.setItem("vybz_extra_cats", JSON.stringify(updatedCats));
    localStorage.setItem("vybz_extra_cat_labels", JSON.stringify(updatedLabels));
    setNewCatName("");
  }

  function requestDeleteCat(cat: string) {
    const count = products.filter(p => p.category === cat).length;
    if (count > 0) { setConfirmDeleteCat(cat); return; }
    doDeleteCat(cat);
  }

  async function doDeleteCat(cat: string, deleteProducts = false) {
    if (deleteProducts) {
      setDeleting(true);
      const affected = products.filter(p => p.category === cat);
      await Promise.all(affected.map(p => fetch(`/api/organizador/pos/products/${p.id}`, { method: "DELETE" })));
      setDeleting(false);
      load();
    }
    if (DEFAULT_CATS.includes(cat)) {
      const updated = [...hiddenDefaultCats, cat];
      setHiddenDefaultCats(updated);
      localStorage.setItem("vybz_hidden_default_cats", JSON.stringify(updated));
    } else {
      const updated = extraCats.filter(c => c !== cat);
      setExtraCats(updated);
      localStorage.setItem("vybz_extra_cats", JSON.stringify(updated));
    }
    if (filterCat === cat) setFilterCat("all");
    setConfirmDeleteCat(null);
  }

  function restoreCat(cat: string) {
    const updated = hiddenDefaultCats.filter(c => c !== cat);
    setHiddenDefaultCats(updated);
    localStorage.setItem("vybz_hidden_default_cats", JSON.stringify(updated));
  }

  // ── Subcategory management ────────────────────────────────────────────────
  function addCustomSubcat() {
    const name = newSubcatName.trim();
    if (!name) return;
    const current = extraSubcats[newSubcatCat] ?? [];
    if (current.includes(name)) return;
    const updated = { ...extraSubcats, [newSubcatCat]: [...current, name] };
    setExtraSubcats(updated);
    localStorage.setItem("vybz_extra_subcats", JSON.stringify(updated));
    setNewSubcatName("");
  }

  function requestDeleteSubcat(cat: string, sub: string) {
    const count = products.filter(p => p.category === cat && p.subcategory === sub).length;
    if (count > 0) { setConfirmDeleteSubcat({ cat, sub }); return; }
    doDeleteSubcat(cat, sub);
  }

  async function doDeleteSubcat(cat: string, sub: string, deleteProducts = false) {
    if (deleteProducts) {
      setDeleting(true);
      const affected = products.filter(p => p.category === cat && p.subcategory === sub);
      await Promise.all(affected.map(p => fetch(`/api/organizador/pos/products/${p.id}`, { method: "DELETE" })));
      setDeleting(false);
      load();
    }
    if ((DEFAULT_SUBCATS[cat] ?? []).includes(sub)) {
      const current = hiddenDefaultSubcats[cat] ?? [];
      const updated = { ...hiddenDefaultSubcats, [cat]: [...current, sub] };
      setHiddenDefaultSubcats(updated);
      localStorage.setItem("vybz_hidden_default_subcats", JSON.stringify(updated));
    } else {
      const current = extraSubcats[cat] ?? [];
      const updated = { ...extraSubcats, [cat]: current.filter(s => s !== sub) };
      setExtraSubcats(updated);
      localStorage.setItem("vybz_extra_subcats", JSON.stringify(updated));
    }
    setConfirmDeleteSubcat(null);
  }

  function restoreSubcat(cat: string, sub: string) {
    const current = hiddenDefaultSubcats[cat] ?? [];
    const updated = { ...hiddenDefaultSubcats, [cat]: current.filter(s => s !== sub) };
    setHiddenDefaultSubcats(updated);
    localStorage.setItem("vybz_hidden_default_subcats", JSON.stringify(updated));
  }

  // ── Derived for display ───────────────────────────────────────────────────
  const presentCats = Array.from(new Set(products.map(p => p.category)));
  const filtered = filterCat === "all" ? products : products.filter(p => p.category === filterCat);
  const currentSubcats = subcatsFor(form.category);

  return (
    <div className="px-10 py-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-4xl tracking-wide">Products</h1>
          <p className="text-[#0a0a0a]/30 text-sm mt-1">Bar POS product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setConfirmDeleteSubcat(null); setShowManageSubcats(true); }} className="px-4 py-2.5 rounded-full text-sm font-medium" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>
            Subcategories
          </button>
          <button onClick={() => { setConfirmDeleteCat(null); setShowManageCats(true); }} className="px-4 py-2.5 rounded-full text-sm font-medium" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>
            Categories
          </button>
          <button onClick={openAdd} className="px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#0a0a0a", color: "#fff" }}>
            + Add product
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilterCat("all")} className="px-4 py-1.5 rounded-full text-sm font-medium transition-all" style={{ background: filterCat === "all" ? "#0a0a0a" : "rgba(0,0,0,0.06)", color: filterCat === "all" ? "#fff" : "rgba(0,0,0,0.55)" }}>
          All ({products.length})
        </button>
        {allCats.filter(c => presentCats.includes(c)).map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)} className="px-4 py-1.5 rounded-full text-sm font-medium transition-all" style={{ background: filterCat === cat ? "#0a0a0a" : "rgba(0,0,0,0.06)", color: filterCat === cat ? "#fff" : "rgba(0,0,0,0.55)" }}>
            {catLabel(cat)} ({products.filter(p => p.category === cat).length})
          </button>
        ))}
      </div>

      {/* Product table */}
      {loading ? (
        <p className="text-[#0a0a0a]/20 text-sm py-12 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.1)" }}>
          <p className="text-[#0a0a0a]/25 text-sm mb-3">No products yet</p>
          <button onClick={openAdd} className="text-sm font-semibold text-[#0a0a0a] hover:opacity-60 transition-opacity">+ Add your first product</button>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3" style={{ gridTemplateColumns: "1fr 130px 110px 100px 90px 60px", background: "rgba(0,0,0,0.02)", color: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div>Product</div><div>Category</div><div>Subcategory</div><div className="text-right">Price</div><div className="text-center">Active</div><div />
          </div>
          {filtered.map((p, i) => (
            <div key={p.id} className="grid items-center px-5 py-3.5" style={{ gridTemplateColumns: "1fr 130px 110px 100px 90px 60px", borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", opacity: p.is_active ? 1 : 0.4 }}>
              <div>
                <p className="text-[#0a0a0a] text-sm font-medium">{p.name}</p>
                {p.has_mixer && <p className="text-[#0a0a0a]/30 text-xs mt-0.5">{(p.mixers ?? []).length} mix{(p.mixers ?? []).length !== 1 ? "es" : ""}</p>}
              </div>
              <div><span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>{catLabel(p.category)}</span></div>
              <div>{p.subcategory && <span className="text-xs text-[#0a0a0a]/35">{p.subcategory}</span>}</div>
              <div className="text-right"><span className="text-[#0a0a0a] text-sm font-semibold">{p.currency === "USD" ? "$" : "₡"}{Number(p.price).toFixed(2)}</span></div>
              <div className="flex justify-center">
                <button onClick={() => toggleActive(p)} className="w-10 h-5 rounded-full transition-colors relative shrink-0" style={{ background: p.is_active ? "#0a0a0a" : "rgba(0,0,0,0.15)" }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: p.is_active ? "calc(100% - 18px)" : "2px" }} />
                </button>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: "rgba(0,0,0,0.3)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "rgba(239,68,68,0.4)" }}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit product modal ──────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", maxHeight: "90vh" }}>
            <p className="text-[#0a0a0a] font-semibold text-lg mb-5">{editId ? "Edit product" : "New product"}</p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Name</label>
                <input type="text" value={form.name} autoFocus onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Barceló Gran Añejo" className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/20 focus:outline-none" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Price</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/20 focus:outline-none" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                </div>
                <div>
                  <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Currency</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] focus:outline-none" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <option value="USD">USD ($)</option>
                    <option value="CRC">CRC (₡)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {allCats.map(cat => (
                    <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, category: cat, subcategory: "" }))} className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all" style={{ background: form.category === cat ? "#0a0a0a" : "rgba(0,0,0,0.06)", color: form.category === cat ? "#fff" : "rgba(0,0,0,0.55)" }}>
                      {catLabel(cat)}
                    </button>
                  ))}
                </div>
              </div>
              {currentSubcats.length > 0 && (
                <div>
                  <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Subcategory</label>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={() => setForm(f => ({ ...f, subcategory: "" }))} className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all" style={{ background: form.subcategory === "" ? "#0a0a0a" : "rgba(0,0,0,0.06)", color: form.subcategory === "" ? "#fff" : "rgba(0,0,0,0.55)" }}>None</button>
                    {currentSubcats.map(sub => (
                      <button key={sub} type="button" onClick={() => setForm(f => ({ ...f, subcategory: sub }))} className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all" style={{ background: form.subcategory === sub ? "#0a0a0a" : "rgba(0,0,0,0.06)", color: form.subcategory === sub ? "#fff" : "rgba(0,0,0,0.55)" }}>
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div>
                  <p className="text-[#0a0a0a] text-sm font-medium">Mix options</p>
                  <p className="text-black/35 text-xs mt-0.5">Bartender selects a mix when adding</p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, has_mixer: !f.has_mixer }))} className="w-11 h-6 rounded-full transition-colors relative shrink-0" style={{ background: form.has_mixer ? "#0a0a0a" : "rgba(0,0,0,0.15)" }}>
                  <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: form.has_mixer ? "calc(100% - 20px)" : "4px" }} />
                </button>
              </div>
              {form.has_mixer && (
                <div>
                  <label className="block text-black/40 text-xs uppercase tracking-widest mb-2">Mixes</label>
                  <div className="space-y-2">
                    {form.mixers.map((mixer, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input type="text" value={mixer.name} onChange={e => updateMixer(i, "name", e.target.value)} placeholder="e.g. Coca Cola" className="flex-1 px-3 py-2.5 rounded-xl text-sm text-[#0a0a0a] placeholder-black/20 focus:outline-none" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                        <div className="flex items-center gap-1.5">
                          <span className="text-black/25 text-sm">+</span>
                          <input type="number" min="0" step="0.01" value={mixer.extra_price} onChange={e => updateMixer(i, "extra_price", e.target.value)} placeholder="0.00" className="w-20 px-3 py-2.5 rounded-xl text-sm text-[#0a0a0a] focus:outline-none" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                        </div>
                        <button type="button" onClick={() => removeMixer(i)} className="p-2 rounded-lg hover:bg-red-50" style={{ color: "rgba(239,68,68,0.5)" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addMixer} className="text-sm font-medium hover:opacity-60 transition-opacity" style={{ color: "rgba(0,0,0,0.4)" }}>+ Add mix</button>
                  </div>
                </div>
              )}
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ background: "#0a0a0a" }}>{saving ? "Saving…" : editId ? "Save changes" : "Add product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage categories modal ───────────────────────────────────────── */}
      {showManageCats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) { setShowManageCats(false); setConfirmDeleteCat(null); } }}>
          <div className="w-full max-w-sm rounded-2xl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[#0a0a0a] font-semibold">Manage categories</p>
              <p className="text-black/30 text-xs mt-1">Delete or add categories</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5">
              {allCatsForManage.map(({ key, label, isDefault, hidden }) => {
                const count = products.filter(p => p.category === key).length;
                const isConfirming = confirmDeleteCat === key;
                if (hidden) {
                  return (
                    <div key={key} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "rgba(0,0,0,0.02)", opacity: 0.5 }}>
                      <span className="text-sm text-[#0a0a0a]/50 line-through">{label}</span>
                      <button onClick={() => restoreCat(key)} className="text-xs font-medium text-[#0a0a0a]/40 hover:text-[#0a0a0a] transition-colors">Restore</button>
                    </div>
                  );
                }
                return (
                  <div key={key}>
                    <div className="group flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: isConfirming ? "rgba(239,68,68,0.04)" : "rgba(0,0,0,0.03)" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0a0a0a]">{label}</span>
                        <span className="text-xs text-black/25">{count > 0 ? `${count}` : ""}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConfirming ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setConfirmDeleteCat(null)} className="text-xs text-black/40 hover:text-black/70">Cancel</button>
                            <button onClick={() => doDeleteCat(key, true)} disabled={deleting} className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: "#ef4444" }}>
                              {deleting ? "…" : "Delete all"}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => requestDeleteCat(key)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(0,0,0,0.3)" }}>
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </div>
                    {isConfirming && (
                      <p className="text-xs px-3 mt-1" style={{ color: "#ef4444", opacity: 0.7 }}>
                        This will permanently delete {count} product{count !== 1 ? "s" : ""} inside this category.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-black/35 text-xs uppercase tracking-widest mb-2">Add new category</p>
              <div className="flex gap-2">
                <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomCat()} placeholder="e.g. Cocktails" className="flex-1 px-4 py-2.5 rounded-xl text-sm text-[#0a0a0a] placeholder-black/20 focus:outline-none" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                <button onClick={addCustomCat} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#0a0a0a" }}>Add</button>
              </div>
              <button onClick={() => { setShowManageCats(false); setConfirmDeleteCat(null); }} className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)" }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage subcategories modal ────────────────────────────────────── */}
      {showManageSubcats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) { setShowManageSubcats(false); setConfirmDeleteSubcat(null); } }}>
          <div className="w-full max-w-sm rounded-2xl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[#0a0a0a] font-semibold">Manage subcategories</p>
              <p className="text-black/30 text-xs mt-1">Delete or add subcategories per category</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {allCats.map(cat => {
                const allSubs = [
                  ...(DEFAULT_SUBCATS[cat] ?? []).map(s => ({ key: s, isDefault: true, hidden: (hiddenDefaultSubcats[cat] ?? []).includes(s) })),
                  ...(extraSubcats[cat] ?? []).map(s => ({ key: s, isDefault: false, hidden: false })),
                ];
                if (allSubs.length === 0) return null;
                return (
                  <div key={cat} className="mb-5">
                    <p className="text-black/35 text-[10px] uppercase tracking-widest mb-2 font-semibold">{catLabel(cat)}</p>
                    <div className="space-y-1">
                      {allSubs.map(({ key: sub, isDefault, hidden }) => {
                        const count = products.filter(p => p.category === cat && p.subcategory === sub).length;
                        const isConfirming = confirmDeleteSubcat?.cat === cat && confirmDeleteSubcat?.sub === sub;
                        if (hidden) {
                          return (
                            <div key={sub} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "rgba(0,0,0,0.02)", opacity: 0.5 }}>
                              <span className="text-sm text-[#0a0a0a]/50 line-through">{sub}</span>
                              <button onClick={() => restoreSubcat(cat, sub)} className="text-xs font-medium text-[#0a0a0a]/40 hover:text-[#0a0a0a] transition-colors">Restore</button>
                            </div>
                          );
                        }
                        return (
                          <div key={sub}>
                            <div className="group flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: isConfirming ? "rgba(239,68,68,0.04)" : "rgba(0,0,0,0.03)" }}>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[#0a0a0a]">{sub}</span>
                                <span className="text-xs text-black/25">{count > 0 ? `${count}` : ""}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isConfirming ? (
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => setConfirmDeleteSubcat(null)} className="text-xs text-black/40 hover:text-black/70">Cancel</button>
                                    <button onClick={() => doDeleteSubcat(cat, sub, true)} disabled={deleting} className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: "#ef4444" }}>
                                      {deleting ? "…" : "Delete all"}
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => requestDeleteSubcat(cat, sub)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(0,0,0,0.3)" }}>
                                    <TrashIcon />
                                  </button>
                                )}
                              </div>
                            </div>
                            {isConfirming && (
                              <p className="text-xs px-3 mt-1" style={{ color: "#ef4444", opacity: 0.7 }}>
                                This will permanently delete {count} product{count !== 1 ? "s" : ""} with this subcategory.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-black/35 text-xs uppercase tracking-widest mb-2">Add new subcategory</p>
              <div className="mb-2">
                <select value={newSubcatCat} onChange={e => setNewSubcatCat(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm text-[#0a0a0a] focus:outline-none mb-2" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                  {allCats.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="text" value={newSubcatName} onChange={e => setNewSubcatName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomSubcat()} placeholder="e.g. Single Malt" className="flex-1 px-4 py-2.5 rounded-xl text-sm text-[#0a0a0a] placeholder-black/20 focus:outline-none" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  <button onClick={addCustomSubcat} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#0a0a0a" }}>Add</button>
                </div>
              </div>
              <button onClick={() => { setShowManageSubcats(false); setConfirmDeleteSubcat(null); }} className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)" }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
