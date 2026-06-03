"use client";

import { useEffect, useState } from "react";

type InventoryItem = {
  id: string; name: string; category: string; unit: string;
  current_stock: number; par_level: number; max_stock: number | null; cost_per_unit: number | null;
  supplier_id: string | null;
  inventory_suppliers?: { name: string } | null;
};
type Supplier = { id: string; name: string; contact_name: string | null; phone: string | null; email: string | null; notes: string | null };
type PurchaseOrder = { id: string; status: string; total_cost: number | null; created_at: string; inventory_suppliers?: { name: string } | null; items: { item_id: string; qty: number; unit_cost?: number }[] };
type Movement = { id: string; type: string; quantity_change: number; notes: string | null; created_at: string; inventory_items?: { name: string; unit: string } | null };
type CountRecord = { id: string; status: string; started_at: string; completed_at: string | null };
type CountItem = { id: string; item_id: string; expected_qty: number; actual_qty: number | null; inventory_items?: { name: string; unit: string; category: string } | null };

type Tab = "stock" | "movements" | "orders" | "suppliers" | "counts" | "financials";

const CATEGORY_LABELS: Record<string, string> = {
  botellas: "Bottles", cervezas: "Beer", vino: "Wine", seltzers: "Seltzers",
  sin_alcohol: "Non-alcoholic", shots: "Shots", food: "Food", other: "Other",
};
const CATEGORY_ORDER = ["botellas", "cervezas", "vino", "seltzers", "sin_alcohol", "shots", "food", "other"];

const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none";
const inputSt = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#0a0a0a" };
const labelCls = "block text-xs font-medium mb-1.5 text-[#0a0a0a]/55 uppercase tracking-wider";

function fmt(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(2); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

// ── Stock Tab ─────────────────────────────────────────────────────────────────
function StockTab() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [form, setForm] = useState({ name: "", category: "botellas", unit: "bottle", unit_size_ml: "", par_level: "0", max_stock: "", cost_per_unit: "", supplier_id: "", current_stock: "0" });
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function load() {
    Promise.all([
      fetch("/api/organizador/inventario/items").then(r => r.json()),
      fetch("/api/organizador/inventario/suppliers").then(r => r.json()),
    ]).then(([itemsData, suppData]) => {
      setItems(itemsData.items ?? []);
      setSuppliers(suppData.suppliers ?? []);
      setLoading(false);
    });
  }
  useEffect(() => { load(); }, []);

  const grouped = CATEGORY_ORDER.map(cat => ({
    cat, label: CATEGORY_LABELS[cat] ?? cat,
    items: items.filter(i => i.category === cat),
  })).filter(g => g.items.length > 0);

  const lowStock = items.filter(i => i.par_level > 0 && i.current_stock <= i.par_level);

  async function handleSave() {
    setSaving(true);
    const url = editItem ? `/api/organizador/inventario/items/${editItem.id}` : "/api/organizador/inventario/items";
    await fetch(url, {
      method: editItem ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        unit_size_ml: form.unit_size_ml ? Number(form.unit_size_ml) : null,
        par_level: Number(form.par_level),
        max_stock: form.max_stock ? Number(form.max_stock) : null,
        cost_per_unit: form.cost_per_unit ? Number(form.cost_per_unit) : null,
        supplier_id: form.supplier_id || null,
        current_stock: Number(form.current_stock) || 0,
      }),
    });
    setSaving(false); setShowAdd(false); setEditItem(null);
    setForm({ name: "", category: "botellas", unit: "bottle", unit_size_ml: "", par_level: "0", max_stock: "", cost_per_unit: "", supplier_id: "", current_stock: "0" });
    load();
  }

  async function handleAdjust() {
    if (!adjustItem || !adjustQty) return;
    setSaving(true);
    await fetch("/api/organizador/inventario/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: adjustItem.id, type: "adjustment", quantity_change: Number(adjustQty), notes: adjustNote || null }),
    });
    setSaving(false); setAdjustItem(null); setAdjustQty(""); setAdjustNote("");
    load();
  }

  async function handleDelete(id: string) {
    setPendingDelete(id);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await fetch(`/api/organizador/inventario/items/${pendingDelete}`, { method: "DELETE" });
    setPendingDelete(null);
    load();
  }

  const isOpen = showAdd || !!editItem;

  return (
    <div className="flex flex-col gap-6">
      {pendingDelete && (
        <ConfirmModal
          title="Remove item"
          message="This item will be hidden from inventory. Its movement history will be preserved."
          confirmLabel="Remove"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="p-4 rounded-2xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: "#ef4444" }}>
            {lowStock.length} item{lowStock.length > 1 ? "s" : ""} below par level
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(i => (
              <span key={i.id} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                {i.name} — {fmt(i.current_stock)} {i.unit}s left
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#777" }}>{items.length} items tracked</p>
        <button
          onClick={() => { setShowAdd(true); setEditItem(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: "#0a0a0a", color: "#fff" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add item
        </button>
      </div>

      {/* Add/Edit form */}
      {isOpen && (
        <div className="p-5 rounded-2xl flex flex-col gap-4" style={{ border: "1px solid rgba(0,0,0,0.1)", background: "rgba(0,0,0,0.01)" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#0a0a0a]">{editItem ? "Edit item" : "New inventory item"}</h3>
            {editItem && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "#888" }}>Current stock</label>
                <input
                  type="number" min="0" step="0.5"
                  className="w-16 text-sm font-bold text-center bg-transparent focus:outline-none"
                  style={{ color: Number(form.current_stock) <= (Number(form.par_level) || 0) && Number(form.par_level) > 0 ? "#ef4444" : "#0a0a0a" }}
                  value={form.current_stock}
                  onChange={e => setForm(f => ({ ...f, current_stock: e.target.value }))}
                />
                <span className="text-xs" style={{ color: "#aaa" }}>{form.unit}s</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Name</label>
              <input className={inputCls} style={inputSt} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Tanqueray 750ml" />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} style={inputSt} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORY_ORDER.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <select className={inputCls} style={inputSt} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                <option value="bottle">Bottle</option>
                <option value="keg">Keg</option>
                <option value="can">Can</option>
                <option value="unit">Unit</option>
                <option value="liter">Liter</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Min stock (par level)</label>
              <input type="number" min="0" className={inputCls} style={inputSt} value={form.par_level} onChange={e => setForm(f => ({ ...f, par_level: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Max stock (optional)</label>
              <input type="number" min="0" className={inputCls} style={inputSt} value={form.max_stock} onChange={e => setForm(f => ({ ...f, max_stock: e.target.value }))} placeholder="e.g. 24" />
            </div>
            <div>
              <label className={labelCls}>Cost per unit ($)</label>
              <input type="number" min="0" step="0.01" className={inputCls} style={inputSt} value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Size (ml, optional)</label>
              <input type="number" min="0" className={inputCls} style={inputSt} value={form.unit_size_ml} onChange={e => setForm(f => ({ ...f, unit_size_ml: e.target.value }))} placeholder="e.g. 750" />
            </div>
            <div>
              <label className={labelCls}>Supplier</label>
              <select className={inputCls} style={inputSt} value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}>
                <option value="">No supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!form.name || saving} className="px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-40" style={{ background: "#0a0a0a", color: "#fff" }}>
              {saving ? "Saving…" : editItem ? "Save changes" : "Add item"}
            </button>
            <button onClick={() => { setShowAdd(false); setEditItem(null); }} className="px-5 py-2 rounded-full text-sm font-medium" style={{ background: "rgba(0,0,0,0.06)", color: "#0a0a0a" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Adjust stock modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 bg-white flex flex-col gap-4">
            <h3 className="font-semibold text-[#0a0a0a]">Adjust stock — {adjustItem.name}</h3>
            <p className="text-sm" style={{ color: "#777" }}>Current: {fmt(adjustItem.current_stock)} {adjustItem.unit}s</p>
            <div>
              <label className={labelCls}>Quantity change (+ add / - remove)</label>
              <input type="number" className={inputCls} style={inputSt} value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="+2 or -1" />
            </div>
            <div>
              <label className={labelCls}>Reason (optional)</label>
              <input className={inputCls} style={inputSt} value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="e.g. Spillage, correction..." />
              <p className="text-[11px] mt-1.5" style={{ color: "#999" }}>Saved in the Movements log so you can track why stock changed.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdjust} disabled={!adjustQty || saving} className="flex-1 py-2.5 rounded-full text-sm font-semibold disabled:opacity-40" style={{ background: "#0a0a0a", color: "#fff" }}>
                {saving ? "Saving…" : "Apply adjustment"}
              </button>
              <button onClick={() => setAdjustItem(null)} className="px-4 py-2.5 rounded-full text-sm font-medium" style={{ background: "#e8e8e8", color: "#333" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Item list */}
      {loading ? <p className="text-sm" style={{ color: "#888" }}>Loading…</p> : items.length === 0 ? (
        <div className="py-12 text-center rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.15)" }}>
          <p className="font-medium text-[#0a0a0a] mb-1">No items yet</p>
          <p className="text-sm" style={{ color: "#888" }}>Add your first inventory item above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ cat, label, items: catItems }) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>{label}</p>
              <div className="flex flex-col gap-1">
                {catItems.map(item => {
                  const isLow = item.par_level > 0 && item.current_stock <= item.par_level;
                  const isOver = item.max_stock != null && item.current_stock > item.max_stock;
                  const borderColor = isLow ? "rgba(239,68,68,0.2)" : isOver ? "rgba(245,158,11,0.2)" : "rgba(0,0,0,0.07)";
                  const bgColor = isLow ? "rgba(239,68,68,0.02)" : isOver ? "rgba(245,158,11,0.02)" : "#fff";
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ border: `1px solid ${borderColor}`, background: bgColor }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#0a0a0a]">{item.name}</p>
                          {isLow && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>LOW</span>}
                          {isOver && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>OVER</span>}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "#888" }}>
                          Min: {fmt(item.par_level)}{item.max_stock != null ? ` · Max: ${fmt(item.max_stock)}` : ""} {item.unit}s
                          {item.cost_per_unit ? ` · $${item.cost_per_unit}/${item.unit}` : ""}
                          {item.inventory_suppliers?.name ? ` · ${item.inventory_suppliers.name}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold" style={{ color: isLow ? "#ef4444" : isOver ? "#f59e0b" : "#0a0a0a" }}>{fmt(item.current_stock)}</p>
                        <p className="text-[10px]" style={{ color: "#aaa" }}>{item.unit}s</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setAdjustItem(item)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#e8e8e8", color: "#333" }} title="Adjust stock">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        </button>
                        <button onClick={() => { setEditItem(item); setShowAdd(false); setForm({ name: item.name, category: item.category, unit: item.unit, unit_size_ml: "", par_level: String(item.par_level), max_stock: String(item.max_stock ?? ""), cost_per_unit: String(item.cost_per_unit ?? ""), supplier_id: item.supplier_id ?? "", current_stock: String(item.current_stock) }); }} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#e8e8e8", color: "#333" }} title="Edit">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#e8e8e8", color: "#888" }} title="Remove">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Movements Tab ─────────────────────────────────────────────────────────────
function MovementsTab() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/organizador/inventario/movements?limit=100")
      .then(r => r.json())
      .then(d => { setMovements(d.movements ?? []); setLoading(false); });
  }, []);

  const TYPE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    purchase:     { bg: "rgba(16,185,129,0.1)",  color: "#10b981", label: "Purchase" },
    sale:         { bg: "rgba(99,102,241,0.1)",  color: "#6366f1", label: "Sale" },
    empty_bottle: { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b", label: "Empty bottle" },
    waste:        { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", label: "Waste" },
    adjustment:   { bg: "rgba(0,0,0,0.06)",      color: "#555",    label: "Adjustment" },
    count:        { bg: "rgba(0,0,0,0.06)",      color: "#555",    label: "Count" },
  };

  return loading ? <p className="text-sm" style={{ color: "#888" }}>Loading…</p> : movements.length === 0 ? (
    <div className="py-12 text-center rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.15)" }}>
      <p className="font-medium text-[#0a0a0a] mb-1">No movements yet</p>
      <p className="text-sm" style={{ color: "#888" }}>Stock changes will appear here</p>
    </div>
  ) : (
    <div className="flex flex-col gap-1">
      {movements.map(m => {
        const ts = TYPE_STYLE[m.type] ?? TYPE_STYLE.adjustment;
        const positive = m.quantity_change > 0;
        return (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0a0a0a]">{m.inventory_items?.name ?? "—"}</p>
              {m.notes && <p className="text-xs" style={{ color: "#888" }}>{m.notes}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold" style={{ color: positive ? "#10b981" : "#ef4444" }}>
                {positive ? "+" : ""}{fmt(m.quantity_change)} {m.inventory_items?.unit ?? ""}
              </p>
              <p className="text-[10px]" style={{ color: "#aaa" }}>{fmtDate(m.created_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Suppliers Tab ─────────────────────────────────────────────────────────────
type SupplierForm = { name: string; contact_name: string; phone: string; email: string; notes: string };
const emptySupplierForm: SupplierForm = { name: "", contact_name: "", phone: "", email: "", notes: "" };

function SupplierFormFields({ form, setForm }: { form: SupplierForm; setForm: (f: SupplierForm) => void }) {
  return (
    <>
      <div>
        <label className={labelCls}>Company name *</label>
        <input autoComplete="off" className={inputCls} style={inputSt} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Distribuidora Norte" />
      </div>
      <div>
        <label className={labelCls}>Contact name</label>
        <input autoComplete="off" className={inputCls} style={inputSt} value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="e.g. Juan Pérez" />
      </div>
      <div>
        <label className={labelCls}>Phone</label>
        <input autoComplete="off" className={inputCls} style={inputSt} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+506 8888-0000" />
      </div>
      <div>
        <label className={labelCls}>Email</label>
        <input autoComplete="off" className={inputCls} style={inputSt} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="orders@supplier.com" />
      </div>
      <div>
        <label className={labelCls}>Notes</label>
        <input autoComplete="off" className={inputCls} style={inputSt} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Delivery days, terms..." />
      </div>
    </>
  );
}

function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<SupplierForm>(emptySupplierForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SupplierForm>(emptySupplierForm);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/organizador/inventario/suppliers").then(r => r.json()).then(d => { setSuppliers(d.suppliers ?? []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); if (!addForm.name) return;
    setSaving(true);
    await fetch("/api/organizador/inventario/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) });
    setSaving(false); setShowAdd(false); setAddForm(emptySupplierForm); load();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault(); if (!editForm.name || !editId) return;
    setSaving(true);
    await fetch(`/api/organizador/inventario/suppliers/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setSaving(false); setEditId(null); load();
  }

  const [pendingDeleteSupplier, setPendingDeleteSupplier] = useState<string | null>(null);

  async function confirmDeleteSupplier() {
    if (!pendingDeleteSupplier) return;
    await fetch(`/api/organizador/inventario/suppliers/${pendingDeleteSupplier}`, { method: "DELETE" });
    setPendingDeleteSupplier(null);
    load();
  }

  function startEdit(s: Supplier) {
    setEditId(s.id);
    setEditForm({ name: s.name, contact_name: s.contact_name ?? "", phone: s.phone ?? "", email: s.email ?? "", notes: s.notes ?? "" });
    setShowAdd(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {pendingDeleteSupplier && (
        <ConfirmModal
          title="Delete supplier"
          message="This supplier will be removed. Items linked to it won't be affected."
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteSupplier}
          onCancel={() => setPendingDeleteSupplier(null)}
        />
      )}
      <div className="flex justify-end">
        <button onClick={() => { setShowAdd(true); setEditId(null); }} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#0a0a0a", color: "#fff" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add supplier
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 rounded-2xl flex flex-col gap-3" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
          <h3 className="font-semibold">New supplier</h3>
          <SupplierFormFields form={addForm} setForm={setAddForm} />
          <div className="flex gap-2">
            <button type="submit" disabled={!addForm.name || saving} className="px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-40" style={{ background: "#0a0a0a", color: "#fff" }}>{saving ? "Saving…" : "Add supplier"}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-full text-sm" style={{ background: "rgba(0,0,0,0.06)" }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-sm" style={{ color: "#888" }}>Loading…</p> : suppliers.length === 0 ? (
        <div className="py-12 text-center rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.15)" }}>
          <p className="font-medium text-[#0a0a0a] mb-1">No suppliers yet</p>
          <p className="text-sm" style={{ color: "#888" }}>Add your distributors and vendors</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {suppliers.map(s => (
            <div key={s.id}>
              {editId === s.id ? (
                <form onSubmit={handleEdit} className="p-5 rounded-2xl flex flex-col gap-3" style={{ border: "1px solid rgba(0,0,0,0.15)" }}>
                  <h3 className="font-semibold">Edit supplier</h3>
                  <SupplierFormFields form={editForm} setForm={setEditForm} />
                  <div className="flex gap-2">
                    <button type="submit" disabled={!editForm.name || saving} className="px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-40" style={{ background: "#0a0a0a", color: "#fff" }}>{saving ? "Saving…" : "Save changes"}</button>
                    <button type="button" onClick={() => setEditId(null)} className="px-5 py-2 rounded-full text-sm" style={{ background: "rgba(0,0,0,0.06)" }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0a0a0a]">{s.name}</p>
                    {s.contact_name && <p className="text-xs" style={{ color: "#777" }}>{s.contact_name}</p>}
                    <div className="flex gap-3 mt-1 flex-wrap">
                      {s.phone && <p className="text-xs" style={{ color: "#888" }}>{s.phone}</p>}
                      {s.email && <p className="text-xs" style={{ color: "#888" }}>{s.email}</p>}
                    </div>
                    {s.notes && <p className="text-xs mt-1" style={{ color: "#aaa" }}>{s.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(s)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)", color: "#555" }} title="Edit">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => setPendingDeleteSupplier(s.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#e8e8e8", color: "#888" }} title="Delete">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Receive Order Modal ───────────────────────────────────────────────────────
type ReceiveLine = { item_id: string; qty: number; unit_cost?: number; received_qty: string };

function ReceiveOrderModal({ order, items, saving, onConfirm, onCancel }: {
  order: PurchaseOrder;
  items: InventoryItem[];
  saving: boolean;
  onConfirm: (lines: ReceiveLine[]) => void;
  onCancel: () => void;
}) {
  const [lines, setLines] = useState<ReceiveLine[]>(
    order.items.map(l => ({ ...l, received_qty: String(l.qty) }))
  );
  const itemMap = new Map(items.map(i => [i.id, i]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 bg-white flex flex-col gap-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "80vh", overflowY: "auto" }}>
        <div>
          <p className="font-semibold text-[#0a0a0a] text-base">Confirm receipt</p>
          <p className="text-sm mt-1" style={{ color: "#666" }}>Adjust quantities if the supplier delivered different amounts than ordered.</p>
        </div>
        <div className="flex flex-col gap-2">
          {lines.map((line, i) => {
            const inv = itemMap.get(line.item_id);
            const different = Number(line.received_qty) !== line.qty;
            return (
              <div key={line.item_id} className="px-3 py-3 rounded-xl" style={{ border: `1px solid ${different ? "rgba(245,158,11,0.3)" : "rgba(0,0,0,0.08)"}` }}>
                <p className="text-sm font-medium text-[#0a0a0a] mb-2">{inv?.name ?? line.item_id}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(0,0,0,0.04)", color: "#888" }}>
                    Ordered: <span className="font-semibold text-[#0a0a0a]">{line.qty}</span> {inv?.unit ?? "units"}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={different ? "#f59e0b" : "#ccc"} strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg shrink-0" style={{ background: different ? "rgba(245,158,11,0.08)" : "rgba(0,0,0,0.04)", border: `1px solid ${different ? "rgba(245,158,11,0.25)" : "rgba(0,0,0,0.1)"}` }}>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={line.received_qty}
                      onChange={e => setLines(ls => ls.map((l, j) => j === i ? { ...l, received_qty: e.target.value } : l))}
                      className="w-12 text-sm font-bold text-center bg-transparent focus:outline-none"
                      style={{ color: different ? "#f59e0b" : "#0a0a0a", MozAppearance: "textfield" } as React.CSSProperties}
                    />
                    <span className="text-xs shrink-0" style={{ color: different ? "#f59e0b" : "#888" }}>{inv?.unit ?? "units"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(lines)}
            disabled={saving}
            className="flex-1 py-2.5 rounded-full text-sm font-semibold disabled:opacity-40"
            style={{ background: "#0a0a0a", color: "#fff" }}
          >
            {saving ? "Receiving…" : "Confirm receipt & update stock"}
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 rounded-full text-sm font-medium" style={{ background: "#e8e8e8", color: "#333" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [orderLines, setOrderLines] = useState<{ item_id: string; qty: string; unit_cost: string }[]>([{ item_id: "", qty: "", unit_cost: "" }]);
  const [orderSupplier, setOrderSupplier] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [receiveOrder, setReceiveOrder] = useState<PurchaseOrder | null>(null);
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);
  const [pendingSent, setPendingSent] = useState<string | null>(null);

  function load() {
    Promise.all([
      fetch("/api/organizador/inventario/orders").then(r => r.json()),
      fetch("/api/organizador/inventario/items").then(r => r.json()),
      fetch("/api/organizador/inventario/suppliers").then(r => r.json()),
    ]).then(([o, i, s]) => { setOrders(o.orders ?? []); setItems(i.items ?? []); setSuppliers(s.suppliers ?? []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const lines = orderLines.filter(l => l.item_id && l.qty).map(l => ({ item_id: l.item_id, qty: Number(l.qty), unit_cost: l.unit_cost ? Number(l.unit_cost) : undefined }));
    await fetch("/api/organizador/inventario/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ supplier_id: orderSupplier || null, items: lines, notes: orderNotes || null }) });
    setSaving(false); setShowAdd(false); setOrderLines([{ item_id: "", qty: "", unit_cost: "" }]); setOrderSupplier(""); setOrderNotes(""); load();
  }

  async function handleReceive(lines: ReceiveLine[]) {
    if (!receiveOrder) return;
    setSaving(true);
    await fetch(`/api/organizador/inventario/orders/${receiveOrder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "received",
        items: lines.map(l => ({ item_id: l.item_id, qty: l.qty, unit_cost: l.unit_cost, received_qty: Number(l.received_qty) || 0 })),
      }),
    });
    setSaving(false); setReceiveOrder(null); load();
  }

  async function confirmSent() {
    if (!pendingSent) return;
    await fetch(`/api/organizador/inventario/orders/${pendingSent}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "sent" }) });
    setPendingSent(null); load();
  }

  async function confirmCancel() {
    if (!pendingCancel) return;
    await fetch(`/api/organizador/inventario/orders/${pendingCancel}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
    setPendingCancel(null); load();
  }

  function downloadPDF(id: string) {
    window.open(`/api/organizador/inventario/orders/${id}/print`, "_blank");
  }

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    draft:    { bg: "rgba(0,0,0,0.06)", color: "#555" },
    sent:     { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
    received: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
    cancelled:{ bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  };

  return (
    <div className="flex flex-col gap-4">
      {receiveOrder && (
        <ReceiveOrderModal
          order={receiveOrder}
          items={items}
          saving={saving}
          onConfirm={handleReceive}
          onCancel={() => setReceiveOrder(null)}
        />
      )}
      {pendingSent && (
        <ConfirmModal
          title="Mark as sent"
          message="This will mark the PO as sent to the supplier. You can still receive or cancel it later."
          confirmLabel="Mark as sent"
          onConfirm={confirmSent}
          onCancel={() => setPendingSent(null)}
        />
      )}
      {pendingCancel && (
        <ConfirmModal
          title="Cancel order"
          message="This purchase order will be marked as cancelled. Stock will not be affected."
          confirmLabel="Cancel order"
          danger
          onConfirm={confirmCancel}
          onCancel={() => setPendingCancel(null)}
        />
      )}
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "#0a0a0a", color: "#fff" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New order
        </button>
      </div>
      {showAdd && (
        <form onSubmit={handleCreate} className="p-5 rounded-2xl flex flex-col gap-4" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
          <h3 className="font-semibold">New purchase order</h3>
          <div>
            <label className={labelCls}>Supplier (optional)</label>
            <select className={inputCls} style={inputSt} value={orderSupplier} onChange={e => setOrderSupplier(e.target.value)}>
              <option value="">No supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Items to order</label>
            <div className="flex flex-col gap-2">
              {orderLines.map((line, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 items-center">
                  <select className={`${inputCls} col-span-1`} style={inputSt} value={line.item_id} onChange={e => setOrderLines(ls => ls.map((l, j) => j === i ? { ...l, item_id: e.target.value } : l))}>
                    <option value="">Select item</option>
                    {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                  <input type="number" min="1" placeholder="Qty" className={inputCls} style={inputSt} value={line.qty} onChange={e => setOrderLines(ls => ls.map((l, j) => j === i ? { ...l, qty: e.target.value } : l))} />
                  <input type="number" min="0" step="0.01" placeholder="Unit cost" className={inputCls} style={inputSt} value={line.unit_cost} onChange={e => setOrderLines(ls => ls.map((l, j) => j === i ? { ...l, unit_cost: e.target.value } : l))} />
                </div>
              ))}
              <button type="button" onClick={() => setOrderLines(ls => [...ls, { item_id: "", qty: "", unit_cost: "" }])} className="text-xs font-medium text-left" style={{ color: "#0a0a0a" }}>+ Add line</button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <input className={inputCls} style={inputSt} value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder="Delivery instructions, etc." />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-40" style={{ background: "#0a0a0a", color: "#fff" }}>{saving ? "Saving…" : "Create order"}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-full text-sm" style={{ background: "rgba(0,0,0,0.06)" }}>Cancel</button>
          </div>
        </form>
      )}
      {loading ? <p className="text-sm" style={{ color: "#888" }}>Loading…</p> : orders.length === 0 ? (
        <div className="py-12 text-center rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.15)" }}>
          <p className="font-medium text-[#0a0a0a] mb-1">No purchase orders yet</p>
          <p className="text-sm" style={{ color: "#888" }}>Create your first order above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map(o => {
            const ss = STATUS_STYLE[o.status] ?? STATUS_STYLE.draft;
            const canSend = o.status === "draft";
            const canReceive = o.status === "draft" || o.status === "sent";
            const canCancel = o.status === "draft" || o.status === "sent";
            return (
              <div key={o.id} className="px-4 py-3 rounded-xl" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#0a0a0a]">{o.inventory_suppliers?.name ?? "No supplier"}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.color }}>{o.status}</span>
                    </div>
                    <p className="text-xs" style={{ color: "#888" }}>{o.items.length} item{o.items.length !== 1 ? "s" : ""} · {fmtDate(o.created_at)}</p>
                  </div>
                  {o.total_cost != null && <p className="text-sm font-bold text-[#0a0a0a] shrink-0">${o.total_cost.toFixed(2)}</p>}
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  {canSend && (
                    <button onClick={() => setPendingSent(o.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                      Mark as sent
                    </button>
                  )}
                  {canReceive && (
                    <button onClick={() => setReceiveOrder(o)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                      Receive order
                    </button>
                  )}
                  {canCancel && (
                    <button onClick={() => setPendingCancel(o.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.05)", color: "#888" }}>
                      Cancel
                    </button>
                  )}
                  <button onClick={() => downloadPDF(o.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: "#e8e8e8", color: "#333" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Counts Tab ────────────────────────────────────────────────────────────────
function CountsTab() {
  const [counts, setCounts] = useState<CountRecord[]>([]);
  const [activeCount, setActiveCount] = useState<{ count: CountRecord; items: CountItem[] } | null>(null);
  const [localActuals, setLocalActuals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);

  function load() {
    fetch("/api/organizador/inventario/counts").then(r => r.json()).then(d => { setCounts(d.counts ?? []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function openCount(id: string) {
    const res = await fetch(`/api/organizador/inventario/counts/${id}`).then(r => r.json());
    setActiveCount({ count: res.count, items: res.items ?? [] });
    const initActuals: Record<string, string> = {};
    (res.items ?? []).forEach((ci: CountItem) => { initActuals[ci.id] = ci.actual_qty != null ? String(ci.actual_qty) : ""; });
    setLocalActuals(initActuals);
  }

  async function startCount() {
    setStarting(true);
    const res = await fetch("/api/organizador/inventario/counts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const data = await res.json();
    setStarting(false); load();
    if (data.count) openCount(data.count.id);
  }

  async function completeCount() {
    if (!activeCount) return;
    setCompleting(true);
    const updates = Object.entries(localActuals).map(([id, v]) => ({ count_item_id: id, actual_qty: Number(v) || 0 }));
    await fetch(`/api/organizador/inventario/counts/${activeCount.count.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_updates: updates, status: "completed" }),
    });
    setCompleting(false); setActiveCount(null); load();
  }

  const categorized = CATEGORY_ORDER.map(cat => ({
    cat, label: CATEGORY_LABELS[cat] ?? cat,
    items: (activeCount?.items ?? []).filter(ci => ci.inventory_items?.category === cat),
  })).filter(g => g.items.length > 0);

  if (activeCount) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveCount(null)} className="flex items-center gap-1.5 text-sm" style={{ color: "#777" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Back
          </button>
          <p className="text-sm font-semibold text-[#0a0a0a]">Physical count — {fmtDate(activeCount.count.started_at)}</p>
        </div>
        <p className="text-sm" style={{ color: "#777" }}>Enter the actual quantity you count physically for each item. Leave blank to skip.</p>
        {categorized.map(({ cat, label, items: catItems }) => (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>{label}</p>
            <div className="flex flex-col gap-1">
              {catItems.map(ci => {
                const variance = localActuals[ci.id] !== "" ? Number(localActuals[ci.id]) - ci.expected_qty : null;
                return (
                  <div key={ci.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0a0a0a]">{ci.inventory_items?.name}</p>
                      <p className="text-xs" style={{ color: "#888" }}>Expected: {fmt(ci.expected_qty)} {ci.inventory_items?.unit}s</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {variance !== null && (
                        <span className="text-xs font-semibold" style={{ color: variance === 0 ? "#10b981" : variance > 0 ? "#10b981" : "#ef4444" }}>
                          {variance > 0 ? "+" : ""}{fmt(variance)}
                        </span>
                      )}
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder={String(fmt(ci.expected_qty))}
                        value={localActuals[ci.id] ?? ""}
                        onChange={e => setLocalActuals(prev => ({ ...prev, [ci.id]: e.target.value }))}
                        className="w-20 px-3 py-1.5 rounded-lg text-sm text-center focus:outline-none"
                        style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <button onClick={completeCount} disabled={completing} className="px-6 py-3 rounded-full font-semibold disabled:opacity-40" style={{ background: "#0a0a0a", color: "#fff" }}>
          {completing ? "Completing…" : "Complete count & update stock"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm" style={{ color: "#777" }}>Run a physical count to compare actual stock against what the system expects. Differences are recorded as variance.</p>
        </div>
        <button onClick={startCount} disabled={starting} className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-40" style={{ background: "#0a0a0a", color: "#fff" }}>
          {starting ? "Starting…" : "Start count"}
        </button>
      </div>
      {loading ? <p className="text-sm" style={{ color: "#888" }}>Loading…</p> : counts.length === 0 ? (
        <div className="py-12 text-center rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.15)" }}>
          <p className="font-medium text-[#0a0a0a] mb-1">No counts yet</p>
          <p className="text-sm" style={{ color: "#888" }}>Start your first physical count above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {counts.map(c => (
            <button key={c.id} onClick={() => openCount(c.id)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-black/[0.02]" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0a0a0a]">{fmtDate(c.started_at)}</p>
                {c.completed_at && <p className="text-xs" style={{ color: "#888" }}>Completed {fmtDate(c.completed_at)}</p>}
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: c.status === "completed" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: c.status === "completed" ? "#10b981" : "#f59e0b" }}>
                {c.status === "completed" ? "Completed" : "In progress"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = "Confirm", danger = false }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void;
  confirmLabel?: string; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6 bg-white flex flex-col gap-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div>
          <p className="font-semibold text-[#0a0a0a] text-base">{title}</p>
          <p className="text-sm mt-1" style={{ color: "#666" }}>{message}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: danger ? "#ef4444" : "#0a0a0a", color: "#fff" }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-sm font-medium"
            style={{ background: "#e8e8e8", color: "#333" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Financials Tab ─────────────────────────────────────────────────────────────
type CogsData = {
  days: number; inventoryValue: number; valueByCategory: Record<string, number>;
  cogs: number; cogsByCategory: Record<string, number>;
  topConsumed: { name: string; category: string; qty: number; cost: number }[];
  barRevenue: number; pourCostPct: number | null;
};

function FinancialsTab() {
  const [data, setData] = useState<CogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/organizador/inventario/cogs?days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [days]);

  const fmtMoney = (n: number) => `$${n.toFixed(2)}`;

  if (loading) return <p className="text-sm" style={{ color: "#888" }}>Loading…</p>;
  if (!data) return null;

  const catEntries = Object.entries(data.cogsByCategory).sort((a, b) => b[1] - a[1]);
  const maxCatCost = catEntries[0]?.[1] ?? 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-[#0a0a0a]">Period:</p>
        {[7, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{ background: days === d ? "#0a0a0a" : "#e8e8e8", color: days === d ? "#fff" : "#555" }}>
            {d}d
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Inventory value", value: fmtMoney(data.inventoryValue), sub: "Current stock × cost", color: "#0a0a0a" },
          { label: `COGS (${days}d)`, value: fmtMoney(data.cogs), sub: "Cost of consumed stock", color: "#0a0a0a" },
          { label: `Bar revenue (${days}d)`, value: fmtMoney(data.barRevenue), sub: "From POS sales", color: "#0a0a0a" },
          { label: "Pour cost %", value: data.pourCostPct != null ? `${data.pourCostPct.toFixed(1)}%` : "—", sub: "COGS / bar revenue", color: data.pourCostPct != null && data.pourCostPct > 30 ? "#ef4444" : "#10b981" },
        ].map(k => (
          <div key={k.label} className="p-5 rounded-2xl" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#999" }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[11px] mt-1" style={{ color: "#aaa" }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* COGS by category */}
      {catEntries.length > 0 && (
        <div className="p-5 rounded-2xl" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          <p className="text-[10px] uppercase tracking-wider font-semibold mb-4" style={{ color: "#999" }}>COGS by category</p>
          <div className="flex flex-col gap-3">
            {catEntries.map(([cat, cost]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-[#0a0a0a]">{CATEGORY_LABELS[cat] ?? cat}</p>
                  <p className="text-sm font-bold text-[#0a0a0a]">{fmtMoney(cost)}</p>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(cost / maxCatCost) * 100}%`, background: "#0a0a0a" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top consumed items */}
      {data.topConsumed.length > 0 && (
        <div className="p-5 rounded-2xl" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          <p className="text-[10px] uppercase tracking-wider font-semibold mb-4" style={{ color: "#999" }}>Top consumed items</p>
          <div className="flex flex-col gap-0" style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, overflow: "hidden" }}>
            {data.topConsumed.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < data.topConsumed.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: i === 0 ? "#0a0a0a" : "#e8e8e8", color: i === 0 ? "#fff" : "#555" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0a0a0a] truncate">{item.name}</p>
                  <p className="text-[11px]" style={{ color: "#aaa" }}>{CATEGORY_LABELS[item.category] ?? item.category} · {item.qty.toFixed(1)} units consumed</p>
                </div>
                <p className="text-sm font-bold text-[#0a0a0a] shrink-0">{fmtMoney(item.cost)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.cogs === 0 && data.inventoryValue === 0 && (
        <div className="py-12 text-center rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.15)" }}>
          <p className="font-medium text-[#0a0a0a] mb-1">No financial data yet</p>
          <p className="text-sm" style={{ color: "#888" }}>Add cost per unit to your items to see COGS and inventory value</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InventarioPage() {
  const [tab, setTab] = useState<Tab>("stock");

  const TABS: { key: Tab; label: string }[] = [
    { key: "stock", label: "Stock" },
    { key: "movements", label: "Movements" },
    { key: "orders", label: "Purchase orders" },
    { key: "suppliers", label: "Suppliers" },
    { key: "counts", label: "Physical counts" },
    { key: "financials", label: "Financials" },
  ];

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0a0a0a]">Inventory</h1>
        <p className="text-sm mt-1" style={{ color: "#777" }}>Track stock levels, manage suppliers, and run physical counts.</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 mb-8" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
            style={tab === t.key ? { color: "#0a0a0a", borderBottom: "2px solid #0a0a0a" } : { color: "#666" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stock"       && <StockTab />}
      {tab === "movements"   && <MovementsTab />}
      {tab === "orders"      && <OrdersTab />}
      {tab === "suppliers"   && <SuppliersTab />}
      {tab === "counts"      && <CountsTab />}
      {tab === "financials"  && <FinancialsTab />}
    </div>
  );
}
