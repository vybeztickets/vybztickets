"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ImageUploadField from "@/app/components/ImageUploadField";

type TicketType = {
  id: string;
  name: string;
  price: number;
  total_available: number;
  sold_count: number;
  is_active: boolean;
  is_hidden: boolean | null;
  category: string | null;
  capacity: number | null;
  zone_color: string | null;
  description: string | null;
  min_per_order: number | null;
  max_per_order: number | null;
  sales_start_date: string | null;
  sales_end_date: string | null;
  entry_deadline: string | null;
  ingresados: number;
  totalRevenue: number;
};

function formatPrice(n: number) { return "₡" + n.toLocaleString("es-CR"); }

type Tab = "stats" | "entradas" | "mapa";
type FilterKey = "all" | "general" | "table" | "hidden";

const ZONE_COLORS = ["#0a0a0a", "#b87333", "#2d6a4f", "#6b2d2d", "#2d3d6b", "#6b5a2d", "#2d5a6b", "#5a2d6b"];

export default function EntradasManager({ eventId, ticketTypes: initial, venueMapUrl: initialMapUrl }: { eventId: string; ticketTypes: TicketType[]; venueMapUrl: string | null }) {
  const router = useRouter();
  const [types, setTypes] = useState(initial);
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [venueMapUrl, setVenueMapUrl] = useState(initialMapUrl);
  const [mapSaving, setMapSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Shared form fields
  const [fName, setFName] = useState("");
  const [fPrice, setFPrice] = useState("");
  const [fTotal, setFTotal] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fHidden, setFHidden] = useState(false);
  const [fMin, setFMin] = useState("1");
  const [fMax, setFMax] = useState("");
  const [fSalesStart, setFSalesStart] = useState("");
  const [fSalesEnd, setFSalesEnd] = useState("");
  const [fEntryDeadline, setFEntryDeadline] = useState("");
  const [fCapacity, setFCapacity] = useState("");
  const [fZoneColor, setFZoneColor] = useState(ZONE_COLORS[0]);
  const [fCategory, setFCategory] = useState<"general" | "table" | "seat">("general");

  function resetForm() {
    setFName(""); setFPrice(""); setFTotal(""); setFDesc(""); setFHidden(false);
    setFMin("1"); setFMax(""); setFSalesStart(""); setFSalesEnd(""); setFEntryDeadline("");
    setFCapacity(""); setFZoneColor(ZONE_COLORS[0]); setFCategory("general"); setError("");
  }

  function openEdit(tt: TicketType) {
    setEditId(tt.id);
    setFName(tt.name);
    setFPrice(String(tt.price));
    setFTotal(tt.total_available >= 999999 ? "" : String(tt.total_available));
    setFDesc(tt.description ?? "");
    setFHidden(tt.is_hidden ?? false);
    setFMin(String(tt.min_per_order ?? 1));
    setFMax(tt.max_per_order ? String(tt.max_per_order) : "");
    setFSalesStart(tt.sales_start_date ?? "");
    setFSalesEnd(tt.sales_end_date ?? "");
    setFEntryDeadline(tt.entry_deadline ?? "");
    setFCapacity(tt.capacity ? String(tt.capacity) : "");
    setFZoneColor(tt.zone_color ?? ZONE_COLORS[0]);
    setFCategory((tt.category as "general" | "table" | "seat") ?? "general");
    setEditError("");
  }

  async function handleCreate() {
    if (!fName || fPrice === "") { setError("Nombre y precio son requeridos"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/organizador/ticket-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId, name: fName, price: parseFloat(fPrice),
          total_available: fTotal ? parseInt(fTotal) : null,
          description: fDesc || null,
          category: fCategory,
          capacity: fCapacity ? parseInt(fCapacity) : null,
          zone_color: fCategory !== "general" ? fZoneColor : null,
          is_hidden: fHidden,
          min_per_order: parseInt(fMin) || 1,
          max_per_order: fMax ? parseInt(fMax) : null,
          sales_start_date: fSalesStart || null,
          sales_end_date: fSalesEnd || null,
          entry_deadline: fEntryDeadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setShowCreate(false); resetForm(); router.refresh();
      setTypes((prev) => [...prev, { ...data.ticketType, ingresados: 0, totalRevenue: 0 }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally { setSaving(false); }
  }

  async function handleUpdate() {
    if (!editId) return;
    setEditSaving(true); setEditError("");
    try {
      const res = await fetch(`/api/organizador/ticket-types/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fName, price: parseFloat(fPrice),
          total_available: fTotal ? parseInt(fTotal) : null,
          description: fDesc || null,
          is_hidden: fHidden,
          min_per_order: parseInt(fMin) || 1,
          max_per_order: fMax ? parseInt(fMax) : null,
          sales_start_date: fSalesStart || null,
          sales_end_date: fSalesEnd || null,
          entry_deadline: fEntryDeadline || null,
          capacity: fCapacity ? parseInt(fCapacity) : null,
          zone_color: fZoneColor,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Error"); }
      const newPrice = parseFloat(fPrice) || 0;
      setTypes((prev) => prev.map((t) => t.id === editId ? {
        ...t, name: fName, price: newPrice,
        total_available: fTotal ? parseInt(fTotal) : 999999,
        description: fDesc || null, is_hidden: fHidden,
        min_per_order: parseInt(fMin) || 1,
        max_per_order: fMax ? parseInt(fMax) : null,
        zone_color: fZoneColor,
        totalRevenue: t.sold_count * newPrice,
      } : t));
      setEditId(null);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Error inesperado");
    } finally { setEditSaving(false); }
  }

  async function toggleActive(tt: TicketType) {
    setTypes((prev) => prev.map((t) => t.id === tt.id ? { ...t, is_active: !t.is_active } : t));
    await fetch(`/api/organizador/ticket-types/${tt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !tt.is_active }),
    });
  }

  const inputStyle = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" };
  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";

  const filteredTypes = types.filter((tt) => {
    if (filter === "general") return !tt.category || tt.category === "general";
    if (filter === "table") return tt.category === "table" || tt.category === "seat";
    if (filter === "hidden") return !!tt.is_hidden;
    return true;
  });

  const totalSold = types.reduce((s, t) => s + t.sold_count, 0);
  const totalRevenue = types.reduce((s, t) => s + t.totalRevenue, 0);
  const totalIngresados = types.reduce((s, t) => s + t.ingresados, 0);
  const pieData = types.filter((t) => t.sold_count > 0).map((t, i) => ({
    name: t.name, value: t.sold_count, color: ZONE_COLORS[i % ZONE_COLORS.length],
  }));

  const TABS: { key: Tab; label: string }[] = [
    { key: "stats", label: "Estadísticas" },
    { key: "entradas", label: "Entradas" },
    { key: "mapa", label: "Mapa de mesas" },
  ];

  const formFields = (
    <>
      <div>
        <label className="block text-[#0a0a0a]/40 text-xs mb-1">Nombre *</label>
        <input type="text" placeholder="Ej: Entrada General" value={fName} onChange={(e) => setFName(e.target.value)} className={inputClass} style={inputStyle} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[#0a0a0a]/40 text-xs mb-1">Precio (₡) *</label>
          <input type="number" min="0" placeholder="15000" value={fPrice} onChange={(e) => setFPrice(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-[#0a0a0a]/40 text-xs mb-1">Cantidad disponible</label>
          <input type="number" min="1" placeholder="Vacío = ilimitado" value={fTotal} onChange={(e) => setFTotal(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
      </div>
      <div>
        <label className="block text-[#0a0a0a]/40 text-xs mb-1">Descripción</label>
        <input type="text" placeholder="Descripción opcional" value={fDesc} onChange={(e) => setFDesc(e.target.value)} className={inputClass} style={inputStyle} />
      </div>
      {fCategory !== "general" && (
        <>
          <div>
            <label className="block text-[#0a0a0a]/40 text-xs mb-1">Capacidad de personas</label>
            <input type="number" min="1" placeholder="Ej: 8" value={fCapacity} onChange={(e) => setFCapacity(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[#0a0a0a]/40 text-xs mb-2">Color de zona</label>
            <div className="flex gap-2 flex-wrap pl-1" style={{ overflow: "visible" }}>
              {ZONE_COLORS.map((c) => (
                <button key={c} onClick={() => setFZoneColor(c)} className="w-7 h-7 rounded-full transition-all"
                  style={{ background: c, boxShadow: fZoneColor === c ? `0 0 0 2px rgba(0,0,0,0.2), 0 0 0 4px ${c}` : "none" }} />
              ))}
            </div>
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[#0a0a0a]/40 text-xs mb-1">Mín. por pedido</label>
          <input type="number" min="1" value={fMin} onChange={(e) => setFMin(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-[#0a0a0a]/40 text-xs mb-1">Máx. por pedido</label>
          <input type="number" min="1" placeholder="Sin límite" value={fMax} onChange={(e) => setFMax(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
      </div>
      <div>
        <label className="block text-[#0a0a0a]/40 text-xs mb-1">Inicio de venta</label>
        <input type="datetime-local" value={fSalesStart} onChange={(e) => setFSalesStart(e.target.value)} className={inputClass} style={{ ...inputStyle, colorScheme: "light" }} />
      </div>
      <div>
        <label className="block text-[#0a0a0a]/40 text-xs mb-1">Fin de venta</label>
        <input type="datetime-local" value={fSalesEnd} onChange={(e) => setFSalesEnd(e.target.value)} className={inputClass} style={{ ...inputStyle, colorScheme: "light" }} />
      </div>
      <div>
        <label className="block text-[#0a0a0a]/40 text-xs mb-1">Fecha límite de ingreso</label>
        <input type="datetime-local" value={fEntryDeadline} onChange={(e) => setFEntryDeadline(e.target.value)} className={inputClass} style={{ ...inputStyle, colorScheme: "light" }} />
      </div>
      <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <span className="text-[#0a0a0a]/50 text-xs">Entrada oculta (solo con link directo)</span>
        <button type="button" onClick={() => setFHidden(!fHidden)} className="relative w-9 h-5 rounded-full transition-colors shrink-0" style={{ background: fHidden ? "#0a0a0a" : "rgba(0,0,0,0.08)" }}>
          <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: fHidden ? "17px" : "2px" }} />
        </button>
      </label>
    </>
  );

  return (
    <div>
      {/* Header: tabs + add button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-5 py-2 text-xs font-medium transition-colors"
              style={{
                background: activeTab === t.key ? "rgba(0,0,0,0.08)" : "transparent",
                color: activeTab === t.key ? "#0a0a0a" : "rgba(0,0,0,0.35)",
                borderRight: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "#0a0a0a", color: "#fff" }}
        >
          <span>+</span> Entrada
        </button>
      </div>

      {/* ── TAB: ESTADÍSTICAS ── */}
      {activeTab === "stats" && (
        <div>
          {types.length === 0 ? (
            <div className="py-16 text-center text-[#0a0a0a]/20 text-sm">Sin entradas todavía</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Pie chart */}
                <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-4">Distribución de ventas</p>
                  {pieData.length > 0 ? (
                    <div>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ percent }: { percent?: number }) => (percent ?? 0) > 0.04 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ""}
                            labelLine={{ stroke: "rgba(0,0,0,0.3)", strokeWidth: 1 }}
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8 }}
                            itemStyle={{ color: "#fff" }}
                            formatter={(v: unknown) => [`${v} vendidas`, ""]}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span style={{ color: "rgba(0,0,0,0.4)", fontSize: 11 }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[220px] text-[#0a0a0a]/20 text-xs">Sin ventas aún</div>
                  )}
                </div>

                {/* Summary stats */}
                <div className="grid grid-rows-3 gap-3">
                  {[
                    { label: "Total vendidas", value: String(totalSold) },
                    { label: "Ingresos totales", value: formatPrice(totalRevenue) },
                    { label: "Asistentes ingresados", value: String(totalIngresados) },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl px-5 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
                      <p className="text-[#0a0a0a]/40 text-xs">{s.label}</p>
                      <p className="text-[#0a0a0a] font-bold text-xl">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bars per type */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="px-5 py-3" style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                  <p className="text-[#0a0a0a]/30 text-xs uppercase tracking-wider font-semibold">Por tipo de entrada</p>
                </div>
                {types.map((tt, i) => {
                  const pct = tt.total_available >= 999999 ? 0 : Math.min(100, (tt.sold_count / tt.total_available) * 100);
                  const ingPct = tt.sold_count > 0 ? Math.min(100, (tt.ingresados / tt.sold_count) * 100) : 0;
                  return (
                    <div key={tt.id} className="px-5 py-4" style={{ borderBottom: i < types.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {tt.zone_color && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: tt.zone_color }} />}
                          <span className="text-[#0a0a0a] text-sm font-medium">{tt.name}</span>
                          <span className="text-[#0a0a0a]/30 text-xs">{formatPrice(tt.price)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#0a0a0a]/40">
                          <span><span className="text-[#0a0a0a] font-semibold">{tt.sold_count}</span> vendidas</span>
                          <span><span className="text-[#0a0a0a] font-semibold">{tt.ingresados}</span> ingresados</span>
                          <span className="text-[#0a0a0a]/60 font-semibold">{formatPrice(tt.totalRevenue)}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full mb-1.5" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: tt.zone_color ?? "#0a0a0a" }} />
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.04)" }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${ingPct}%`, background: "rgba(0,0,0,0.35)" }} />
                      </div>
                      <div className="flex gap-4 mt-1.5">
                        <span className="text-[10px] text-[#0a0a0a]/25">Vendidas {pct.toFixed(0)}%</span>
                        <span className="text-[10px] text-[#0a0a0a]/40">Ingresados {ingPct.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: ENTRADAS ── */}
      {activeTab === "entradas" && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              {([
                { key: "all", label: "Todos" },
                { key: "general", label: "Generales" },
                { key: "table", label: "Mesas" },
                { key: "hidden", label: "Oculto" },
              ] as { key: FilterKey; label: string }[]).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="px-4 py-2 text-xs font-medium transition-colors"
                  style={{
                    background: filter === f.key ? "rgba(0,0,0,0.08)" : "transparent",
                    color: filter === f.key ? "#0a0a0a" : "rgba(0,0,0,0.35)",
                    borderRight: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTypes.length === 0 ? (
            <div className="rounded-2xl py-16 text-center" style={{ border: "1px dashed rgba(0,0,0,0.08)" }}>
              <p className="text-[#0a0a0a]/20 text-sm">Sin entradas en este filtro</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div
                className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
                style={{ gridTemplateColumns: "1fr 90px 90px 130px 110px 36px", background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
              >
                <div>Entrada</div>
                <div className="text-center">Vendidas</div>
                <div className="text-center">Restante</div>
                <div className="text-right">Ingresos</div>
                <div className="text-center">Estado</div>
                <div />
              </div>

              {filteredTypes.map((tt, i) => {
                const restante = tt.total_available >= 999999 ? "∞" : String(Math.max(0, tt.total_available - tt.sold_count));
                return (
                  <div
                    key={tt.id}
                    className="grid items-center px-5 py-4 transition-colors hover:bg-white/[0.02]"
                    style={{ gridTemplateColumns: "1fr 90px 90px 130px 110px 36px", borderBottom: i < filteredTypes.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", opacity: tt.is_active ? 1 : 0.55 }}
                  >
                    <div className="flex items-center gap-2.5">
                      {tt.zone_color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tt.zone_color }} />}
                      <div>
                        <p className="text-[#0a0a0a] text-sm font-medium">{tt.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" }}>
                            {tt.category === "table" ? "Mesa" : tt.category === "seat" ? "Asiento" : "General"}
                          </span>
                          <span className="text-[#0a0a0a]/30 text-xs">{formatPrice(tt.price)}</span>
                          {tt.is_hidden && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Oculta</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[#0a0a0a] text-sm font-medium">{tt.sold_count}</p>
                      <p className="text-[#0a0a0a]/25 text-[10px]">/{tt.total_available >= 999999 ? "∞" : tt.total_available}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-[#0a0a0a] text-sm font-medium">{restante}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[#0a0a0a] text-sm font-medium">{formatPrice(tt.totalRevenue)}</p>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={() => toggleActive(tt)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
                        style={tt.is_active
                          ? { background: "rgba(16,185,129,0.15)", color: "#10b981" }
                          : { background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.3)" }}
                      >
                        {tt.is_active ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        )}
                        {tt.is_active ? "Activa" : "Oculta"}
                      </button>
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => openEdit(tt)} className="text-[#0a0a0a]/20 hover:text-[#0a0a0a]/60 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: MAPA DE MESAS ── */}
      {activeTab === "mapa" && (
        <div>
          <p className="text-[#0a0a0a]/40 text-xs mb-5">Sube la imagen del mapa de tu venue. Se mostrará en la página pública del evento antes de las mesas VIP.</p>
          <ImageUploadField
            label="Mapa de mesas"
            value={venueMapUrl ?? ""}
            onChange={async (url) => {
              setVenueMapUrl(url);
              setMapSaving(true);
              await fetch(`/api/organizador/eventos/${eventId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ venue_map_url: url }),
              });
              setMapSaving(false);
            }}
            aspectRatio="16:9"
          />
          {mapSaving && <p className="text-[#0a0a0a]/30 text-xs mt-2">Guardando...</p>}
          {venueMapUrl && !mapSaving && <p className="text-green-400/60 text-xs mt-2">Mapa guardado correctamente</p>}
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCreate(false); resetForm(); } }}
        >
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#0a0a0a] font-bold text-lg">Nueva entrada</h3>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex gap-2 mb-5">
              {([{ key: "general", label: "General" }, { key: "table", label: "Mesa VIP" }, { key: "seat", label: "Asiento" }] as { key: "general" | "table" | "seat"; label: string }[]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFCategory(t.key)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={fCategory === t.key
                    ? { background: "#0a0a0a", color: "#fff" }
                    : { background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {formFields}
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60 mt-1"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                {saving ? "Creando..." : "Crear entrada"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT SLIDE PANEL ── */}
      {editId && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setEditId(null)} />
          <div
            className="fixed right-0 top-0 h-full z-50 flex flex-col"
            style={{ width: 420, background: "#fff", borderLeft: "1px solid rgba(0,0,0,0.08)" }}
          >
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div>
                <h3 className="text-[#0a0a0a] font-bold text-base">Editar entrada</h3>
                <p className="text-[#0a0a0a]/30 text-xs mt-0.5">{types.find((t) => t.id === editId)?.name}</p>
              </div>
              <button onClick={() => setEditId(null)} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
              {formFields}
              {editError && <p className="text-red-400 text-xs">{editError}</p>}
            </div>
            <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <button
                onClick={handleUpdate}
                disabled={editSaving}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                {editSaving ? "Guardando..." : "Actualizar entrada"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
