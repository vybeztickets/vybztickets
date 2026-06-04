"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  unit_size_ml?: number | null;
  cost_per_unit?: number | null;
};

type Ingredient = {
  item_id: string;
  qty: number;
  unit: "oz" | "ml" | "each" | "dash" | "splash";
};

type Recipe = {
  id: string;
  name: string;
  price: number;
  category: string;
  currency: string;
  is_active: boolean;
  chief_product_id?: string | null;
  product_type?: string | null;
  product_category?: string | null;
  ingredients: Ingredient[];
  inventory_item_id?: string | null;
  inventory_qty_per_sale?: number | null;
};

function isSimpleItem(r: Recipe): boolean {
  return (!r.ingredients || r.ingredients.length === 0) && !r.chief_product_id;
}

type IngredientRow = {
  item_id: string;
  qty: string;
  unit: "oz" | "ml" | "each" | "dash" | "splash";
};

type FormState = {
  name: string;
  product_type: string;
  product_category: string;
  chief_product_id: string;
  price: string;
  category: string;
  ingredients: IngredientRow[];
};

const EMPTY_FORM: FormState = {
  name: "",
  product_type: "",
  product_category: "",
  chief_product_id: "",
  price: "",
  category: "cocktails",
  ingredients: [],
};

const UNITS: Array<"oz" | "ml" | "each" | "dash" | "splash"> = ["oz", "ml", "each", "dash", "splash"];
const PRODUCT_TYPES = ["Cocktail", "Liquor", "Beer", "Wine", "Non-Alcoholic", "Shot", "Other"];
const DASH_ML = 0.625;
const SPLASH_ML = 5;
const OZ_ML = 29.5735;

// ── Cost helpers ──────────────────────────────────────────────────────────────

function calcIngredientCost(row: IngredientRow, item: InventoryItem | undefined): number {
  if (!item || !item.cost_per_unit) return 0;
  const qty = parseFloat(row.qty) || 0;
  if (qty === 0) return 0;

  const costPerUnit = item.cost_per_unit;
  const unitSizeMl = item.unit_size_ml;

  // If item is measured in a volume unit we can convert
  if (unitSizeMl && unitSizeMl > 0) {
    // cost per ml of the item
    const costPerMl = costPerUnit / unitSizeMl;
    let usedMl = 0;
    if (row.unit === "ml") usedMl = qty;
    else if (row.unit === "oz") usedMl = qty * OZ_ML;
    else if (row.unit === "dash") usedMl = qty * DASH_ML;
    else if (row.unit === "splash") usedMl = qty * SPLASH_ML;
    else usedMl = qty; // each — fall back to direct
    return costPerMl * usedMl;
  }

  // No unit_size_ml — use cost_per_unit directly with qty
  return costPerUnit * qty;
}

function calcTotalCost(ingredients: IngredientRow[], itemMap: Map<string, InventoryItem>): number {
  return ingredients.reduce((sum, row) => sum + calcIngredientCost(row, itemMap.get(row.item_id)), 0);
}

// ── Small icons ───────────────────────────────────────────────────────────────

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Input / Select helpers (consistent styling) ───────────────────────────────

const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/20 focus:outline-none";
const inputStyle = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" };
const labelClass = "block text-[#888] text-xs uppercase tracking-widest mb-2";

// ── Toggle component ──────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-10 h-5 rounded-full transition-colors relative shrink-0"
      style={{ background: value ? "#0a0a0a" : "rgba(0,0,0,0.15)" }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: value ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PosProductsPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Recipe modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Simple item modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ name: "", price: "", category: "drinks", inventory_item_id: "", inventory_qty_per_sale: "1" });
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  // itemMap for O(1) lookups
  const itemMap = useMemo(() => {
    const m = new Map<string, InventoryItem>();
    inventoryItems.forEach(it => m.set(it.id, it));
    return m;
  }, [inventoryItems]);

  // ── Data fetching ───────────────────────────────────────────────────────────

  const loadRecipes = useCallback(async () => {
    const res = await fetch("/api/organizador/pos/products");
    const data = await res.json();
    setRecipes((data.products ?? []).map((p: Recipe) => ({
      ...p,
      ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
    })));
  }, []);

  const loadInventory = useCallback(async () => {
    const res = await fetch("/api/organizador/inventario/items");
    const data = await res.json();
    setInventoryItems(data.items ?? []);
  }, []);

  useEffect(() => {
    Promise.all([loadRecipes(), loadInventory()]).finally(() => setLoading(false));
  }, [loadRecipes, loadInventory]);

  // ── Filtered list ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.product_type ?? "").toLowerCase().includes(q) ||
      (r.product_category ?? "").toLowerCase().includes(q)
    );
  }, [recipes, search]);

  // ── Live cost calculations for the form ─────────────────────────────────────

  const formTotalCost = useMemo(
    () => calcTotalCost(form.ingredients, itemMap),
    [form.ingredients, itemMap]
  );
  const formSalePrice = parseFloat(form.price) || 0;
  const formCostPct = formSalePrice > 0 ? (formTotalCost / formSalePrice) * 100 : 0;
  const formProfit = formSalePrice - formTotalCost;

  // ── Modal helpers ───────────────────────────────────────────────────────────

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, ingredients: [] });
    setFormError(null);
    setShowModal(true);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(itemForm.price);
    if (!itemForm.name.trim()) { setItemError("Name is required"); return; }
    if (isNaN(price) || price < 0) { setItemError("Invalid price"); return; }
    setItemSaving(true); setItemError(null);
    const url = editItemId ? `/api/organizador/pos/products/${editItemId}` : "/api/organizador/pos/products";
    const method = editItemId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: itemForm.name.trim(), price, category: itemForm.category, currency: "USD", ingredients: [],
        inventory_item_id: itemForm.inventory_item_id || null,
        inventory_qty_per_sale: itemForm.inventory_item_id ? Number(itemForm.inventory_qty_per_sale) || 1 : 0,
      }),
    });
    setItemSaving(false);
    if (!res.ok) { setItemError("Failed to save"); return; }
    setShowItemModal(false);
    setEditItemId(null);
    setItemForm({ name: "", price: "", category: "drinks", inventory_item_id: "", inventory_qty_per_sale: "1" });
    loadRecipes();
  }

  function openEdit(r: Recipe) {
    if (isSimpleItem(r)) {
      // Simple item → open simple modal
      setEditItemId(r.id);
      setItemForm({
        name: r.name,
        price: String(r.price),
        category: r.category ?? "drinks",
        inventory_item_id: r.inventory_item_id ?? "",
        inventory_qty_per_sale: String(r.inventory_qty_per_sale ?? 1),
      });
      setItemError(null);
      setShowItemModal(true);
    } else {
      // Recipe → open recipe modal
      setEditId(r.id);
      setForm({
        name: r.name,
        product_type: r.product_type ?? "",
        product_category: r.product_category ?? "",
        chief_product_id: r.chief_product_id ?? "",
        price: String(r.price),
        category: r.category ?? "cocktails",
        ingredients: (r.ingredients ?? []).map(ing => ({
          item_id: ing.item_id,
          qty: String(ing.qty),
          unit: ing.unit,
        })),
      });
      setFormError(null);
      setShowModal(true);
    }
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
  }

  // ── Ingredient row management ───────────────────────────────────────────────

  function addIngredientRow() {
    setForm(f => ({
      ...f,
      ingredients: [...f.ingredients, { item_id: "", qty: "1", unit: "oz" }],
    }));
  }

  function removeIngredientRow(i: number) {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }));
  }

  function updateIngredient(i: number, patch: Partial<IngredientRow>) {
    setForm(f => ({
      ...f,
      ingredients: f.ingredients.map((row, j) => j === i ? { ...row, ...patch } : row),
    }));
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (!form.name.trim()) { setFormError("Recipe name is required"); return; }
    if (isNaN(price) || price < 0) { setFormError("Invalid sale price"); return; }

    setSaving(true);
    setFormError(null);

    const ingredients: Ingredient[] = form.ingredients
      .filter(row => row.item_id && parseFloat(row.qty) > 0)
      .map(row => ({ item_id: row.item_id, qty: parseFloat(row.qty), unit: row.unit }));

    const payload = {
      name: form.name.trim(),
      price,
      category: form.category || "cocktails",
      currency: "USD",
      chief_product_id: form.chief_product_id || null,
      product_type: form.product_type || null,
      product_category: form.product_category || null,
      ingredients,
    };

    const url = editId ? `/api/organizador/pos/products/${editId}` : "/api/organizador/pos/products";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) { setFormError(data.error ?? "Failed to save"); setSaving(false); return; }
    setSaving(false);
    setShowModal(false);
    loadRecipes();
  }

  // ── Active toggle ───────────────────────────────────────────────────────────

  async function toggleActive(r: Recipe) {
    await fetch(`/api/organizador/pos/products/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !r.is_active }),
    });
    loadRecipes();
  }

  // ── Per-row cost display (in table) ─────────────────────────────────────────

  function getRecipeCost(r: Recipe): number {
    return calcTotalCost(
      (r.ingredients ?? []).map(ing => ({ item_id: ing.item_id, qty: String(ing.qty), unit: ing.unit })),
      itemMap
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="px-10 py-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-4xl tracking-wide">Recipes</h1>
          <p className="text-sm mt-1" style={{ color: "#888" }}>Bar recipe & cost builder</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditItemId(null); setShowItemModal(true); setItemError(null); setItemForm({ name: "", price: "", category: "drinks", inventory_item_id: "", inventory_qty_per_sale: "1" }); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "rgba(0,0,0,0.06)", color: "#0a0a0a" }}
          >
            <PlusIcon />
            Add item
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "#0a0a0a", color: "#fff" }}
          >
            <PlusIcon />
            Create recipe
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/25" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search recipes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2.5 rounded-full text-sm w-full text-[#0a0a0a] placeholder-black/25 focus:outline-none"
          style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.07)" }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm py-16 text-center" style={{ color: "#888" }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.1)" }}>
          <p className="text-sm mb-3" style={{ color: "#888" }}>
            {search ? "No recipes match your search" : "No recipes yet"}
          </p>
          {!search && (
            <button onClick={openCreate} className="text-sm font-semibold text-[#0a0a0a] hover:opacity-60 transition-opacity">
              + Create your first recipe
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          {/* Table header */}
          <div
            className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
            style={{
              gridTemplateColumns: "1.6fr 1fr 1fr 88px 88px 72px 80px 60px 48px",
              background: "rgba(0,0,0,0.02)",
              color: "#888",
              borderBottom: "1px solid rgba(0,0,0,0.07)",
            }}
          >
            <div>Recipe</div>
            <div>Chief Product</div>
            <div>Category</div>
            <div className="text-right">Cost</div>
            <div className="text-right">Price</div>
            <div className="text-right">Cost%</div>
            <div className="text-right">Profit</div>
            <div className="text-center">Active</div>
            <div />
          </div>

          {/* Table rows */}
          {filtered.map((r, i) => {
            const cost = getRecipeCost(r);
            const costPct = r.price > 0 ? (cost / r.price) * 100 : 0;
            const profit = r.price - cost;
            const chiefItem = r.chief_product_id ? itemMap.get(r.chief_product_id) : undefined;

            return (
              <div
                key={r.id}
                className="grid items-center px-5 py-3.5"
                style={{
                  gridTemplateColumns: "1.6fr 1fr 1fr 88px 88px 72px 80px 60px 48px",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                  opacity: r.is_active ? 1 : 0.45,
                }}
              >
                {/* Recipe name */}
                <div>
                  <p className="text-[#0a0a0a] text-sm font-medium leading-tight">{r.name}</p>
                  {r.product_type && (
                    <p className="text-xs mt-0.5" style={{ color: "#888" }}>{r.product_type}</p>
                  )}
                </div>

                {/* Chief product */}
                <div>
                  {chiefItem ? (
                    <span className="text-sm text-[#0a0a0a]/70">{chiefItem.name}</span>
                  ) : (
                    <span className="text-sm text-black/20">—</span>
                  )}
                </div>

                {/* Category */}
                <div>
                  {r.product_category ? (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>
                      {r.product_category}
                    </span>
                  ) : (
                    <span className="text-sm text-black/20">—</span>
                  )}
                </div>

                {/* Cost */}
                <div className="text-right">
                  <span className="text-sm" style={{ color: "#555" }}>${cost.toFixed(2)}</span>
                </div>

                {/* Price */}
                <div className="text-right">
                  <span className="text-sm font-semibold text-[#0a0a0a]">${Number(r.price).toFixed(2)}</span>
                </div>

                {/* Cost% */}
                <div className="text-right">
                  {r.price > 0 ? (
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        background: costPct > 35 ? "rgba(239,68,68,0.1)" : costPct > 25 ? "rgba(0,0,0,0.06)" : "rgba(34,197,94,0.1)",
                        color: costPct > 35 ? "#dc2626" : costPct > 25 ? "#555" : "#16a34a",
                      }}
                    >
                      {costPct.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-sm text-black/20">—</span>
                  )}
                </div>

                {/* Profit */}
                <div className="text-right">
                  <span className="text-sm font-medium" style={{ color: profit >= 0 ? "#0a0a0a" : "#dc2626" }}>
                    ${profit.toFixed(2)}
                  </span>
                </div>

                {/* Active toggle */}
                <div className="flex justify-center">
                  <Toggle value={r.is_active} onChange={() => toggleActive(r)} />
                </div>

                {/* Edit */}
                <div className="flex justify-end">
                  <button
                    onClick={() => openEdit(r)}
                    className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                    style={{ color: "rgba(0,0,0,0.55)" }}
                  >
                    <PencilIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Recipe Modal ─────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl my-6"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[#0a0a0a] font-semibold text-lg">
                {editId ? "Edit recipe" : "New recipe"}
              </p>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-black/5 transition-colors"
                style={{ color: "rgba(0,0,0,0.55)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="px-6 py-6 space-y-5">

                {/* Recipe name */}
                <div>
                  <label className={labelClass}>Recipe Name</label>
                  <input
                    type="text"
                    autoFocus
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Cosmopolitan"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                {/* Product type + category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Product Type</label>
                    <select
                      value={form.product_type}
                      onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))}
                      className={inputClass}
                      style={inputStyle}
                    >
                      <option value="">— Select type —</option>
                      {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Product Category</label>
                    <input
                      type="text"
                      value={form.product_category}
                      onChange={e => setForm(f => ({ ...f, product_category: e.target.value }))}
                      placeholder="e.g. Vodka, Whiskey"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Chief product + Sale price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Chief Product</label>
                    <select
                      value={form.chief_product_id}
                      onChange={e => setForm(f => ({ ...f, chief_product_id: e.target.value }))}
                      className={inputClass}
                      style={inputStyle}
                    >
                      <option value="">— None —</option>
                      {inventoryItems.map(it => (
                        <option key={it.id} value={it.id}>
                          {it.name} ({it.unit}{it.cost_per_unit != null ? ` · $${Number(it.cost_per_unit).toFixed(2)}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Sale Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="0.00"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Ingredients table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={labelClass} style={{ marginBottom: 0 }}>Ingredients</label>
                    <span className="text-xs" style={{ color: "#888" }}>{form.ingredients.length} item{form.ingredients.length !== 1 ? "s" : ""}</span>
                  </div>

                  {form.ingredients.length > 0 && (
                    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                      {/* Ingredient header */}
                      <div
                        className="grid text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5"
                        style={{ gridTemplateColumns: "1fr 90px 90px 72px 32px", background: "rgba(0,0,0,0.02)", color: "#888", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
                      >
                        <div>Item</div>
                        <div>Qty</div>
                        <div>Unit</div>
                        <div className="text-right">Cost</div>
                        <div />
                      </div>

                      {/* Ingredient rows */}
                      {form.ingredients.map((row, i) => {
                        const item = itemMap.get(row.item_id);
                        const rowCost = calcIngredientCost(row, item);
                        return (
                          <div
                            key={i}
                            className="grid items-center gap-2 px-4 py-2.5"
                            style={{ gridTemplateColumns: "1fr 90px 90px 72px 32px", borderBottom: i < form.ingredients.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
                          >
                            {/* Item selector */}
                            <select
                              value={row.item_id}
                              onChange={e => updateIngredient(i, { item_id: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-sm text-[#0a0a0a] focus:outline-none"
                              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                            >
                              <option value="">— Select item —</option>
                              {inventoryItems.map(it => (
                                <option key={it.id} value={it.id}>
                                  {it.name} ({it.unit}{it.cost_per_unit != null ? ` · $${Number(it.cost_per_unit).toFixed(2)}` : ""})
                                </option>
                              ))}
                            </select>

                            {/* Qty */}
                            <input
                              type="number"
                              min="0"
                              step="0.25"
                              value={row.qty}
                              onChange={e => updateIngredient(i, { qty: e.target.value })}
                              placeholder="1"
                              className="w-full px-3 py-2 rounded-lg text-sm text-[#0a0a0a] focus:outline-none"
                              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                            />

                            {/* Unit */}
                            <select
                              value={row.unit}
                              onChange={e => updateIngredient(i, { unit: e.target.value as IngredientRow["unit"] })}
                              className="w-full px-3 py-2 rounded-lg text-sm text-[#0a0a0a] focus:outline-none"
                              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                            >
                              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>

                            {/* Cost */}
                            <div className="text-right text-sm tabular-nums" style={{ color: "#555" }}>
                              {rowCost > 0 ? `$${rowCost.toFixed(3)}` : "—"}
                            </div>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => removeIngredientRow(i)}
                              className="flex items-center justify-center p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              style={{ color: "rgba(239,68,68,0.5)" }}
                            >
                              <TrashIcon size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-colors hover:bg-black/5"
                    style={{ color: "#0a0a0a" }}
                  >
                    <PlusIcon />
                    Add ingredient
                  </button>
                </div>

                {/* Cost summary footer */}
                <div className="rounded-xl px-5 py-4 space-y-2.5" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#888" }}>Cost Summary</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "#555" }}>Total Cost</span>
                    <span className="text-sm font-semibold text-[#0a0a0a]">${formTotalCost.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "#555" }}>Cost %</span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: formCostPct > 35 ? "#dc2626" : formCostPct > 25 ? "#555" : formCostPct > 0 ? "#16a34a" : "#888" }}
                    >
                      {formSalePrice > 0 ? `${formCostPct.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="text-sm font-semibold text-[#0a0a0a]">Profit</span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: formProfit >= 0 ? "#0a0a0a" : "#dc2626" }}
                    >
                      {formSalePrice > 0 ? `$${formProfit.toFixed(2)}` : "—"}
                    </span>
                  </div>
                </div>

                {formError && (
                  <p className="text-red-500 text-sm">{formError}</p>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 px-6 py-5" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium"
                  style={{ background: "rgba(0,0,0,0.06)", color: "#0a0a0a" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold disabled:opacity-40"
                  style={{ background: "#0a0a0a", color: "#fff" }}
                >
                  {saving ? "Saving…" : editId ? "Save changes" : "Create recipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Simple item modal ─────────────────────────────────────────────── */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 flex flex-col gap-4" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0a0a0a]">{editItemId ? "Edit item" : "Add item"}</h2>
              <button onClick={() => { setShowItemModal(false); setEditItemId(null); }} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)", color: "#0a0a0a" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="text-sm" style={{ color: "#888" }}>For simple products — bottles, cans, glasses of wine, shots — no recipe needed.</p>
            <form onSubmit={handleSaveItem} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>Name</label>
                <input
                  type="text" required autoFocus
                  placeholder="e.g. Corona, Glass of Wine, Shot of Tequila"
                  value={itemForm.name}
                  onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#0a0a0a" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>Category</label>
                <select
                  value={itemForm.category}
                  onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#0a0a0a" }}
                >
                  <option value="drinks">Drinks</option>
                  <option value="beer">Beer</option>
                  <option value="wine">Wine</option>
                  <option value="shots">Shots</option>
                  <option value="non_alcoholic">Non-alcoholic</option>
                  <option value="food">Food</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>Sale price ($)</label>
                <input
                  type="number" min="0" step="0.01" required
                  placeholder="0.00"
                  value={itemForm.price}
                  onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#0a0a0a" }}
                />
              </div>
              <div className="pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#888" }}>Inventory link (optional)</p>
                {inventoryItems.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: "#aaa" }}>
                    Set up inventory to link items and auto-deduct stock on each sale.
                  </p>
                ) : (
                <div className="flex flex-col gap-2">
                  <select
                    value={itemForm.inventory_item_id}
                    onChange={e => setItemForm(f => ({ ...f, inventory_item_id: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#0a0a0a" }}
                  >
                    <option value="">No inventory link</option>
                    {inventoryItems.map(it => (
                      <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                    ))}
                  </select>
                  {itemForm.inventory_item_id && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#888" }}>Units deducted per sale</label>
                      <input
                        type="number" min="0.01" step="0.01"
                        value={itemForm.inventory_qty_per_sale}
                        onChange={e => setItemForm(f => ({ ...f, inventory_qty_per_sale: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#0a0a0a" }}
                      />
                      <p className="text-[11px] mt-1" style={{ color: "#888" }}>e.g. 1 for a full bottle, 0.5 for half</p>
                    </div>
                  )}
                </div>
                )}
              </div>
              {itemError && <p className="text-xs text-[#dc2626]">{itemError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowItemModal(false); setEditItemId(null); }} className="flex-1 py-2.5 rounded-full text-sm font-semibold" style={{ background: "rgba(0,0,0,0.06)", color: "#0a0a0a" }}>Cancel</button>
                <button type="submit" disabled={itemSaving} className="flex-1 py-2.5 rounded-full text-sm font-semibold disabled:opacity-40" style={{ background: "#0a0a0a", color: "#fff" }}>
                  {itemSaving ? "Saving…" : editItemId ? "Save changes" : "Add item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
