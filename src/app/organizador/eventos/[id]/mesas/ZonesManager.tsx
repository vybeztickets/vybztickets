"use client";

import { useState, useEffect } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { formatPrice, currencySymbol } from "@/lib/currency";

type Zone = { id: string; name: string; color: string; sort_order: number };
type TableType = {
  id: string; zone_id: string | null; name: string; price: number;
  capacity: number | null; zone_color: string | null;
  price_per_extra_person: number; max_extra_people: number;
  includes: string | null; deposit_enabled: boolean; deposit_percent: number;
  min_hours_before_event: number;
  deposit_refund_percent: number; deposit_warning_text: string | null;
  is_active: boolean; sold_count: number; total_available: number;
  table_color?: string | null; table_border_color?: string | null; map_table_size?: string | null;
};

const EMPTY_TABLE = {
  name: "", price: "", capacity: "", price_per_extra_person: "0", max_extra_people: "0",
  includes: "", deposit_enabled: false, deposit_percent: "30",
  min_hours_before_event: "24",
  deposit_refund_percent: "0", deposit_warning_text: "",
  table_color: "", table_border_color: "", map_table_size: "medium",
};


export default function ZonesManager({ eventId, initialZones, initialTables, currency, onZonesChange }: {
  eventId: string;
  initialZones: Zone[];
  initialTables: TableType[];
  currency: string;
  onZonesChange?: (zones: Zone[]) => void;
}) {
  const sym = currencySymbol(currency);
  const [zones, setZones] = useState(initialZones);
  const [tables, setTables] = useState(initialTables);
  const [confirmState, setConfirmState] = useState<{ message: string; label?: string; fn: () => void } | null>(null);

  // Zone form
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editZoneId, setEditZoneId] = useState<string | null>(null);
  const [zName, setZName] = useState("");
  const [zColor, setZColor] = useState("#3b6fd4");
  const [zoneSaving, setZoneSaving] = useState(false);
  const [zoneError, setZoneError] = useState("");

  // Table form (slide panel)
  const [showTablePanel, setShowTablePanel] = useState(false);
  const [editTableId, setEditTableId] = useState<string | null>(null);
  const [targetZoneId, setTargetZoneId] = useState<string | null>(null);
  const [tableSaving, setTableSaving] = useState(false);
  const [tableError, setTableError] = useState("");
  const [renumbering, setRenumbering] = useState(false);
  const [f, setF] = useState({ ...EMPTY_TABLE });

  function setFField(key: string, val: unknown) {
    setF(prev => ({ ...prev, [key]: val }));
  }

  useEffect(() => {
    if (initialTables.some(t => !/^\d+$/.test(t.name))) renumberAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Zone actions ─────────────────────────────────────────────────────────────

  function openCreateZone() {
    setEditZoneId(null); setZName(""); setZColor("#3b6fd4"); setZoneError(""); setShowZoneForm(true);
  }
  function openEditZone(z: Zone) {
    setEditZoneId(z.id); setZName(z.name); setZColor(z.color); setZoneError(""); setShowZoneForm(true);
  }

  async function saveZone() {
    if (!zName.trim()) return;
    setZoneSaving(true); setZoneError("");
    try {
      if (editZoneId) {
        const res = await fetch(`/api/organizador/table-zones/${editZoneId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: zName, color: zColor }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Error saving zone");
        const next = zones.map(z => z.id === editZoneId ? { ...z, name: zName, color: zColor } : z);
        setZones(next);
        onZonesChange?.(next);
      } else {
        const res = await fetch("/api/organizador/table-zones", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, name: zName, color: zColor }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error creating zone");
        if (data.zone) {
          const next = [...zones, data.zone];
          setZones(next);
          onZonesChange?.(next);
        }
      }
      setShowZoneForm(false);
    } catch (e: unknown) {
      setZoneError(e instanceof Error ? e.message : "Unexpected error");
    } finally { setZoneSaving(false); }
  }

  function deleteZone(z: Zone) {
    setConfirmState({
      message: `Delete zone "${z.name}" and all its tables?`,
      label: "Delete",
      fn: async () => {
        setConfirmState(null);
        await fetch(`/api/organizador/table-zones/${z.id}`, { method: "DELETE" });
        const next = zones.filter(x => x.id !== z.id);
        setZones(next);
        onZonesChange?.(next);
        setTables(prev => prev.filter(t => t.zone_id !== z.id));
      },
    });
  }

  // ── Table actions ────────────────────────────────────────────────────────────

  function computeNextGlobalNumber(zoneId: string): number {
    const sortedZones = [...zones].sort((a, b) => a.sort_order - b.sort_order);
    const targetIdx = sortedZones.findIndex(z => z.id === zoneId);
    let count = 1;
    for (let i = 0; i <= targetIdx; i++) {
      const zTables = tables.filter(t => t.zone_id === sortedZones[i].id);
      count += i < targetIdx ? zTables.length : zTables.length + 1;
    }
    return count - (targetIdx < 0 ? 0 : 0);
  }

  async function renumberAll() {
    setRenumbering(true);
    try {
      const sortedZones = [...zones].sort((a, b) => a.sort_order - b.sort_order);
      let counter = 1;
      const nameMap: Record<string, string> = {};
      for (const zone of sortedZones) {
        const zoneTables = tables.filter(t => t.zone_id === zone.id);
        for (const t of zoneTables) { nameMap[t.id] = String(counter); counter++; }
      }
      setTables(prev => prev.map(t => nameMap[t.id] ? { ...t, name: nameMap[t.id] } : t));
      await fetch(`/api/organizador/eventos/${eventId}/renumber-tables`, { method: "POST" });
    } finally {
      setRenumbering(false);
    }
  }

  function openCreateTable(zoneId: string) {
    const nextNum = computeNextGlobalNumber(zoneId);
    setEditTableId(null);
    setTargetZoneId(zoneId);
    setF({ ...EMPTY_TABLE, name: String(nextNum) });
    setTableError("");
    setShowTablePanel(true);
  }

  function openEditTable(tt: TableType) {
    setEditTableId(tt.id);
    setTargetZoneId(tt.zone_id);
    const parsedNum = parseInt(tt.name, 10);
    setF({
      name: parsedNum > 0 ? String(parsedNum) : tt.name,
      price: String(tt.price),
      capacity: tt.capacity ? String(tt.capacity) : "",
      price_per_extra_person: String(tt.price_per_extra_person ?? 0),
      max_extra_people: String(tt.max_extra_people ?? 0),
      includes: tt.includes ?? "",
      deposit_enabled: tt.deposit_enabled ?? false,
      deposit_percent: String(tt.deposit_percent ?? 30),
      min_hours_before_event: String(tt.min_hours_before_event ?? 24),
      deposit_refund_percent: String(tt.deposit_refund_percent ?? 0),
      deposit_warning_text: tt.deposit_warning_text ?? "",
      table_color: tt.table_color ?? "",
      table_border_color: tt.table_border_color ?? "",
      map_table_size: tt.map_table_size ?? "medium",
    });
    setTableError("");
    setShowTablePanel(true);
  }

  async function saveTable() {
    if (!f.name || !f.price) { setTableError("Number and price are required"); return; }
    setTableSaving(true); setTableError("");
    const zone = zones.find(z => z.id === targetZoneId);
    try {
      const body = {
        name: f.name, price: parseFloat(f.price),
        capacity: f.capacity ? parseInt(f.capacity) : null,
        zone_id: targetZoneId,
        zone_color: zone?.color ?? null,
        price_per_extra_person: parseFloat(f.price_per_extra_person) || 0,
        max_extra_people: parseInt(f.max_extra_people) || 0,
        includes: f.includes || null,
        deposit_enabled: f.deposit_enabled,
        deposit_percent: f.deposit_enabled ? parseInt(f.deposit_percent) || 0 : 0,
        min_hours_before_event: f.deposit_enabled ? parseInt(f.min_hours_before_event) || 24 : 24,
        deposit_refund_percent: f.deposit_enabled ? parseInt(f.deposit_refund_percent) || 0 : 0,
        deposit_warning_text: f.deposit_enabled ? f.deposit_warning_text || null : null,
        table_color: f.table_color || null,
        table_border_color: f.table_border_color || null,
        map_table_size: f.map_table_size || "medium",
      };

      if (editTableId) {
        const res = await fetch(`/api/organizador/ticket-types/${editTableId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Error"); }
        setTables(prev => prev.map(t => t.id === editTableId ? { ...t, ...body, id: editTableId, is_active: t.is_active, sold_count: t.sold_count, total_available: t.total_available } : t));
      } else {
        const res = await fetch("/api/organizador/ticket-types", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, eventId, category: "table", total_available: 1 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error");
        setTables(prev => [...prev, { ...data.ticketType, ...body, zone_id: targetZoneId, sold_count: 0, total_available: 1, is_active: true }]);
        await renumberAll();
      }
      setShowTablePanel(false);
    } catch (e: unknown) {
      setTableError(e instanceof Error ? e.message : "Unexpected error");
    } finally { setTableSaving(false); }
  }

  function deleteTable(tt: TableType) {
    setConfirmState({
      message: `Delete table "${tt.name}"?`,
      label: "Delete",
      fn: async () => {
        setConfirmState(null);
        setShowTablePanel(false);
        await fetch(`/api/organizador/ticket-types/${tt.id}`, { method: "DELETE" });
        setTables(prev => prev.filter(t => t.id !== tt.id));
        await renumberAll();
      },
    });
  }

  async function duplicateTable(tt: TableType) {
    const newName = String(tables.filter(t => t.zone_id === tt.zone_id).length + 1);
    const zone = zones.find(z => z.id === tt.zone_id);
    const body = {
      eventId, name: newName, price: tt.price, capacity: tt.capacity,
      zone_id: tt.zone_id, zone_color: zone?.color ?? tt.zone_color,
      price_per_extra_person: tt.price_per_extra_person, max_extra_people: tt.max_extra_people,
      includes: tt.includes, deposit_enabled: tt.deposit_enabled,
      deposit_percent: tt.deposit_percent, min_hours_before_event: tt.min_hours_before_event,
      deposit_refund_percent: tt.deposit_refund_percent, deposit_warning_text: tt.deposit_warning_text,
      category: "table", total_available: tt.total_available,
    };
    const res = await fetch("/api/organizador/ticket-types", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setTables(prev => [...prev, { ...data.ticketType, ...body, sold_count: 0, is_active: true }]);
      await renumberAll();
    }
  }

  async function toggleTableActive(tt: TableType) {
    setTables(prev => prev.map(t => t.id === tt.id ? { ...t, is_active: !t.is_active } : t));
    await fetch(`/api/organizador/ticket-types/${tt.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !tt.is_active }),
    });
  }

  // ── Input styles ─────────────────────────────────────────────────────────────
  const iS = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" };
  const iC = "w-full px-3 py-2.5 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-[#0a0a0a]/40 text-xs">{zones.length} zone{zones.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={renumberAll}
            disabled={renumbering || tables.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
            style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#0a0a0a", background: renumbering ? "rgba(0,0,0,0.04)" : "#fff" }}
            title="Fix duplicate table numbers"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ transform: renumbering ? "rotate(360deg)" : "none", transition: renumbering ? "transform 0.6s linear" : "none" }}>
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {renumbering ? "Renumbering…" : "Renumber"}
          </button>
          <button
            onClick={openCreateZone}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "#0a0a0a", color: "#fff" }}
          >
            <span>+</span> Zone
          </button>
        </div>
      </div>

      {/* Empty state */}
      {zones.length === 0 && (
        <div className="rounded-2xl py-16 text-center" style={{ border: "1px dashed rgba(0,0,0,0.08)" }}>
          <p className="text-[#0a0a0a]/20 text-sm mb-1">No zones yet</p>
          <p className="text-[#0a0a0a]/10 text-xs">Create zones like "VIP Area", "Backstage", "Rooftop"…</p>
        </div>
      )}

      {/* Zones list */}
      <div className="flex flex-col gap-4">
        {zones.map(zone => {
          const zoneTables = tables.filter(t => t.zone_id === zone.id);
          return (
            <div key={zone.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              {/* Zone header */}
              <div className="flex items-center justify-between px-5 py-3.5" style={{ background: "rgba(0,0,0,0.025)", borderBottom: zoneTables.length > 0 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: zone.color }} />
                  <span className="text-[#0a0a0a] text-sm font-semibold">{zone.name}</span>
                  <span className="text-[#0a0a0a]/30 text-xs">{zoneTables.length} table{zoneTables.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditZone(zone)} className="p-1.5 text-[#0a0a0a]/20 hover:text-[#0a0a0a]/60 transition-colors" title="Edit zone">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => deleteZone(zone)} className="p-1.5 text-[#0a0a0a]/20 hover:text-red-500 transition-colors" title="Delete zone">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>

              {/* Tables within zone */}
              {zoneTables.map((tt, i) => (
                <div key={tt.id} className="flex items-center px-5 py-3.5 gap-4 transition-colors hover:bg-black/[0.015]"
                  style={{ borderBottom: i < zoneTables.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", opacity: tt.is_active ? 1 : 0.5 }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0a0a0a] text-[13px]">{tt.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[#0a0a0a]/40 text-[11px]">{formatPrice(tt.price, currency)}</span>
                      {tt.capacity && <span className="text-[#0a0a0a]/30 text-[11px]">{tt.capacity} pax</span>}
                      {tt.deposit_enabled && (
                        <span className="text-[10px] px-1.5 py-px rounded-full" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                          {tt.deposit_percent}% deposit
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[#0a0a0a]/25 text-[11px] mr-1">{tt.sold_count}/{tt.total_available} sold</span>
                    <button
                      type="button"
                      onClick={() => toggleTableActive(tt)}
                      className="relative rounded-full transition-colors shrink-0"
                      style={{ width: 24, height: 13, minWidth: 24, background: tt.is_active ? "#0a0a0a" : "rgba(0,0,0,0.08)" }}
                    >
                      <span className="absolute rounded-full bg-white transition-all" style={{ width: 9, height: 9, top: 2, left: tt.is_active ? 13 : 2 }} />
                    </button>
                    <button onClick={() => duplicateTable(tt)} className="p-1.5 text-[#0a0a0a]/20 hover:text-[#0a0a0a]/60 transition-colors" title="Duplicate">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <button onClick={() => openEditTable(tt)} className="p-1.5 text-[#0a0a0a]/20 hover:text-[#0a0a0a]/60 transition-colors" title="Edit">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Add table button */}
              <button
                onClick={() => openCreateTable(zone.id)}
                className="w-full flex items-center gap-2 px-5 py-3 text-xs font-medium transition-colors"
                style={{ color: "rgba(0,0,0,0.3)", borderTop: zoneTables.length > 0 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add table
              </button>
            </div>
          );
        })}
      </div>

      {/* ── CREATE/EDIT ZONE MODAL ── */}
      {showZoneForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowZoneForm(false); }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#0a0a0a] font-bold text-base">{editZoneId ? "Edit zone" : "New zone"}</h3>
              <button onClick={() => setShowZoneForm(false)} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1">Zone name *</label>
                <input type="text" placeholder="E.g.: VIP Area, Backstage, Rooftop" value={zName} onChange={e => setZName(e.target.value)} className={iC} style={iS} />
              </div>
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-2">Color</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative w-9 h-9 rounded-xl shrink-0" style={{ border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", background: zColor }}>
                    <input type="color" value={zColor} onChange={e => setZColor(e.target.value)}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
                  </div>
                  <span className="text-[#0a0a0a]/35 text-xs font-mono">{zColor}</span>
                </label>
              </div>
              {zoneError && <p className="text-red-400 text-xs">{zoneError}</p>}
              <button onClick={saveZone} disabled={zoneSaving || !zName.trim()} className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50 mt-1" style={{ background: "#0a0a0a", color: "#fff" }}>
                {zoneSaving ? "Saving..." : editZoneId ? "Update zone" : "Create zone"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLE EDIT PANEL ── */}
      {showTablePanel && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowTablePanel(false)} />
          <div className="fixed right-0 top-0 h-full z-50 flex flex-col" style={{ width: 460, background: "#fff", borderLeft: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div>
                <h3 className="text-[#0a0a0a] font-bold text-base">{editTableId ? "Edit table" : "New table"}</h3>
                <p className="text-[#0a0a0a]/30 text-xs mt-0.5">{zones.find(z => z.id === targetZoneId)?.name}</p>
              </div>
              <button onClick={() => setShowTablePanel(false)} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              {/* Basic info */}
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1">Table number *</label>
                <select value={f.name} onChange={e => setFField("name", e.target.value)} className={iC} style={iS}>
                  {Array.from({ length: Math.max(50, tables.length + 10) }, (_, i) => i + 1).map(n => (
                    <option key={n} value={String(n)}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a0a0a]/40 text-xs mb-1">Price ({sym}) *</label>
                  <input type="number" min="0" placeholder="150000" value={f.price} onChange={e => setFField("price", e.target.value)} className={iC} style={iS} />
                </div>
                <div>
                  <label className="block text-[#0a0a0a]/40 text-xs mb-1">Max people</label>
                  <input type="number" min="1" placeholder="8" value={f.capacity} onChange={e => setFField("capacity", e.target.value)} className={iC} style={iS} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a0a0a]/40 text-xs mb-1">Price per extra person ({sym})</label>
                  <input type="number" min="0" placeholder="0" value={f.price_per_extra_person} onChange={e => setFField("price_per_extra_person", e.target.value)} className={iC} style={iS} />
                </div>
                <div>
                  <label className="block text-[#0a0a0a]/40 text-xs mb-1">Max extra people</label>
                  <input type="number" min="0" placeholder="0" value={f.max_extra_people} onChange={e => setFField("max_extra_people", e.target.value)} className={iC} style={iS} />
                </div>
              </div>
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1">Includes</label>
                <textarea
                  placeholder="E.g.: 1 bottle of vodka, mixer, 2 seats"
                  value={f.includes}
                  onChange={e => setFField("includes", e.target.value)}
                  rows={3}
                  className={iC + " resize-none"}
                  style={iS}
                />
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

              {/* Deposit */}
              <div>
                <label className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div>
                    <p className="text-[#0a0a0a] text-sm font-medium">Enable deposit</p>
                    <p className="text-[#0a0a0a]/35 text-xs mt-0.5">Customer pays a % upfront, rest later</p>
                  </div>
                  <button type="button" onClick={() => setFField("deposit_enabled", !f.deposit_enabled)}
                    className="relative w-9 h-5 rounded-full transition-colors shrink-0"
                    style={{ background: f.deposit_enabled ? "#0a0a0a" : "rgba(0,0,0,0.08)" }}>
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: f.deposit_enabled ? "17px" : "2px" }} />
                  </button>
                </label>

                {f.deposit_enabled && (
                  <div className="mt-3 flex flex-col gap-3">
                    <div>
                      <label className="block text-[#0a0a0a]/40 text-xs mb-1">Deposit % of total price</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="5" max="100" step="5" value={f.deposit_percent}
                          onChange={e => setFField("deposit_percent", e.target.value)} className="flex-1" />
                        <span className="text-[#0a0a0a] text-sm font-semibold w-12 text-right">{f.deposit_percent}%</span>
                      </div>
                      <p className="text-[#0a0a0a]/30 text-xs mt-1">
                        Customer pays {formatPrice(Math.round(parseFloat(f.price || "0") * parseInt(f.deposit_percent) / 100), currency)} upfront
                      </p>
                    </div>

                    <div>
                      <label className="block text-[#0a0a0a]/40 text-xs mb-1">Minimum hours before event to complete payment</label>
                      <input type="number" min="1" placeholder="24" value={f.min_hours_before_event}
                        onChange={e => setFField("min_hours_before_event", e.target.value)} className={iC} style={iS} />
                      <p className="text-[#0a0a0a]/25 text-xs mt-1">
                        Reminders will be sent {parseInt(f.min_hours_before_event) + 48}h and {parseInt(f.min_hours_before_event) + 24}h before the event
                      </p>
                    </div>

                    <div>
                      <label className="block text-[#0a0a0a]/40 text-xs mb-1">
                        Deposit refund if reservation is lost (%)
                      </label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="100" step="10" value={f.deposit_refund_percent}
                          onChange={e => setFField("deposit_refund_percent", e.target.value)} className="flex-1" />
                        <span className="text-[#0a0a0a] text-sm font-semibold w-12 text-right">{f.deposit_refund_percent}%</span>
                      </div>
                      {parseInt(f.deposit_refund_percent) === 0 && (
                        <p className="text-[#0a0a0a]/30 text-xs mt-1">Deposit is non-refundable if reservation is cancelled</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[#0a0a0a]/40 text-xs mb-1">
                        Deposit policy warning <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        placeholder={`E.g.: If full payment is not received ${f.min_hours_before_event}h before the event, the reservation will be automatically cancelled and the deposit ${parseInt(f.deposit_refund_percent) === 0 ? "will not be refunded" : `will be ${f.deposit_refund_percent}% refunded`}.`}
                        value={f.deposit_warning_text}
                        onChange={e => setFField("deposit_warning_text", e.target.value)}
                        rows={4}
                        className={iC + " resize-none"}
                        style={{ ...iS, borderColor: f.deposit_enabled && !f.deposit_warning_text ? "rgba(239,68,68,0.4)" : undefined }}
                      />
                      <p className="text-[#0a0a0a]/25 text-xs mt-1">Shown to the customer before and after checkout</p>
                    </div>
                  </div>
                )}
              </div>

              {tableError && <p className="text-red-400 text-xs">{tableError}</p>}
            </div>

            <div className="px-6 py-4 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <button onClick={saveTable} disabled={tableSaving} className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: "#0a0a0a", color: "#fff" }}>
                {tableSaving ? "Saving..." : editTableId ? "Update table" : "Create table"}
              </button>
              {editTableId && (
                <button
                  onClick={() => { const tt = tables.find(t => t.id === editTableId); if (tt) deleteTable(tt); }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium"
                  style={{ color: "#ef4444" }}
                >
                  Delete table
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          confirmLabel={confirmState.label}
          onConfirm={confirmState.fn}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
