"use client";

import { useState, useRef } from "react";

type Zone = { id: string; name: string; color: string };
type TableItem = {
  id: string;
  name: string;
  zone_id: string | null;
  zone_color: string | null;
  table_color?: string | null;
  table_border_color?: string | null;
  table_text_color?: string | null;
  map_table_size?: string | null;
  map_position_x?: number | null;
  map_position_y?: number | null;
  capacity: number | null;
};

const SIZE_PX: Record<string, number> = { small: 28, medium: 40, large: 54 };

function ColorSwatch({ value, fallback, onChange }: { value: string; fallback?: string; onChange: (v: string) => void }) {
  const display = value || fallback || "transparent";
  return (
    <div className="relative w-6 h-6 rounded-md shrink-0"
      style={{ background: display, border: value ? "1px solid rgba(0,0,0,0.1)" : "1px dashed rgba(0,0,0,0.2)" }}>
      <input type="color" tabIndex={-1} value={value || fallback || "#3b6fd4"} onChange={e => onChange(e.target.value)}
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
    </div>
  );
}

export default function TableLayoutEditor({
  zones,
  tables: initialTables,
  venueMapUrl,
}: {
  zones: Zone[];
  tables: TableItem[];
  venueMapUrl: string | null;
}) {
  const [tables, setTables] = useState(initialTables);
  const [saving, setSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zonePanel, setZonePanel] = useState<{ zoneId: string; fill: string; border: string; text: string; size: string } | null>(null);
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLDivElement>(null);

  const placed = tables.filter(t => t.map_position_x != null && t.map_position_y != null);
  const tablesByZone = zones.map(z => ({
    zone: z,
    items: tables.filter(t => t.zone_id === z.id && (t.map_position_x == null || t.map_position_y == null)),
    placedItems: tables.filter(t => t.zone_id === z.id && t.map_position_x != null && t.map_position_y != null),
  }));

  function toggleZone(zoneId: string) {
    setExpandedZones(prev => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId); else next.add(zoneId);
      return next;
    });
  }

  function openZonePanel(zone: Zone, e: React.MouseEvent) {
    e.stopPropagation();
    if (zonePanel?.zoneId === zone.id) { setZonePanel(null); return; }
    const firstTable = tables.find(t => t.zone_id === zone.id);
    setZonePanel({
      zoneId: zone.id,
      fill: firstTable?.table_color || zone.color,
      border: firstTable?.table_border_color || "",
      text: firstTable?.table_text_color || "#ffffff",
      size: firstTable?.map_table_size || "medium",
    });
  }

  async function applyZoneStyle() {
    if (!zonePanel) return;
    const { zoneId, fill, border, text, size } = zonePanel;
    const zoneTables = tables.filter(t => t.zone_id === zoneId);
    const patch = { table_color: fill || null, table_border_color: border || null, table_text_color: text || null, map_table_size: size };
    setTables(prev => prev.map(t => t.zone_id === zoneId ? { ...t, ...patch } : t));
    setSaving(true);
    await Promise.all(zoneTables.map(t =>
      fetch(`/api/organizador/ticket-types/${t.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
      })
    ));
    setSaving(false);
    setZonePanel(null);
  }

  async function savePos(id: string, x: number, y: number) {
    const cx = Math.max(1, Math.min(96, x));
    const cy = Math.max(1, Math.min(94, y));
    setTables(prev => prev.map(t => t.id === id ? { ...t, map_position_x: cx, map_position_y: cy } : t));
    setSaving(true);
    await fetch(`/api/organizador/ticket-types/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ map_position_x: cx, map_position_y: cy }),
    });
    setSaving(false);
  }

  async function removePos(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setTables(prev => prev.map(t => t.id === id ? { ...t, map_position_x: null, map_position_y: null } : t));
    await fetch(`/api/organizador/ticket-types/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ map_position_x: null, map_position_y: null }),
    });
  }

  function onSidebarDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "copy";
  }

  function onCanvasDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }

  function onCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const id = e.dataTransfer.getData("text/plain");
    if (!id || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    savePos(id, x, y);
  }

  function onTablePointerDown(e: React.PointerEvent<HTMLDivElement>, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!canvasRef.current) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const rect = canvasRef.current.getBoundingClientRect();
    const table = tables.find(t => t.id === id);
    if (!table || table.map_position_x == null || table.map_position_y == null) return;
    const startPX = e.clientX;
    const startPY = e.clientY;
    const startX = table.map_position_x;
    const startY = table.map_position_y;
    let hasMoved = false;

    function onMove(me: PointerEvent) {
      if (Math.abs(me.clientX - startPX) > 4 || Math.abs(me.clientY - startPY) > 4) hasMoved = true;
      const dx = ((me.clientX - startPX) / rect.width) * 100;
      const dy = ((me.clientY - startPY) / rect.height) * 100;
      setTables(prev => prev.map(t => t.id === id
        ? { ...t, map_position_x: Math.max(1, Math.min(96, startX + dx)), map_position_y: Math.max(1, Math.min(94, startY + dy)) }
        : t));
    }
    function onUp(ue: PointerEvent) {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      if (!hasMoved) return;
      const dx = ((ue.clientX - startPX) / rect.width) * 100;
      const dy = ((ue.clientY - startPY) / rect.height) * 100;
      savePos(id, startX + dx, startY + dy);
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  }

  const sizes = ["small", "medium", "large"] as const;

  return (
    <div className="flex gap-5" style={{ height: 580 }}>

      {/* ── Sidebar ── */}
      <div className="w-48 shrink-0 flex flex-col gap-2 overflow-y-auto pr-0.5">

        {/* Zone panel (style all) */}
        {zonePanel && (() => {
          const zone = zones.find(z => z.id === zonePanel.zoneId);
          const count = tables.filter(t => t.zone_id === zonePanel.zoneId).length;
          return (
            <div className="rounded-xl p-3 flex flex-col gap-2.5 shrink-0" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: zone?.color || "rgba(0,0,0,0.4)" }}>
                  {zone?.name} — all
                </p>
                <button onClick={() => setZonePanel(null)} className="text-[#0a0a0a]/20 hover:text-[#0a0a0a]/50 shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Fill", value: zonePanel.fill, onChange: (v: string) => setZonePanel(p => p ? { ...p, fill: v } : p) },
                  { label: "Border", value: zonePanel.border, onChange: (v: string) => setZonePanel(p => p ? { ...p, border: v } : p) },
                  { label: "Text", value: zonePanel.text, onChange: (v: string) => setZonePanel(p => p ? { ...p, text: v } : p) },
                ].map(({ label, value, onChange }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[#0a0a0a]/30 text-[10px] w-8 shrink-0">{label}</span>
                    <ColorSwatch value={value} onChange={onChange} />
                    <span className="text-[#0a0a0a]/20 text-[10px] font-mono truncate flex-1">{value || "—"}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[#0a0a0a]/30 text-[10px] mb-1">Size</p>
                <div className="flex gap-1">
                  {sizes.map(s => (
                    <button key={s} type="button" onClick={() => setZonePanel(p => p ? { ...p, size: s } : p)}
                      className="flex-1 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                      style={{ background: zonePanel.size === s ? "#0a0a0a" : "rgba(0,0,0,0.05)", color: zonePanel.size === s ? "#fff" : "rgba(0,0,0,0.4)" }}>
                      {s === "small" ? "S" : s === "medium" ? "M" : "L"}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={applyZoneStyle}
                className="w-full py-1.5 rounded-lg text-[10px] font-semibold"
                style={{ background: zone?.color || "#0a0a0a", color: "#fff" }}>
                {saving ? "Saving..." : `Apply to ${count} tables`}
              </button>
            </div>
          );
        })()}

        {/* Zone accordion */}
        {zones.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-[#0a0a0a]/20 text-xs">Create zones first</p>
          </div>
        )}

        {tablesByZone.map(({ zone, items, placedItems }) => {
          const isOpen = expandedZones.has(zone.id);
          const total = items.length + placedItems.length;
          return (
            <div key={zone.id} className="rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              {/* Zone header */}
              <div
                className="flex items-center gap-2 px-2.5 py-2 cursor-pointer select-none"
                style={{ background: isOpen ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.02)" }}
                onClick={() => toggleZone(zone.id)}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: zone.color }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider flex-1 truncate" style={{ color: zone.color }}>{zone.name}</span>
                <span className="text-[#0a0a0a]/25 text-[9px] shrink-0">{items.length}/{total}</span>
                <button type="button" onClick={e => openZonePanel(zone, e)}
                  title="Style all" className="shrink-0 text-[#0a0a0a]/20 hover:text-[#0a0a0a]/50 transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                </button>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ color: "rgba(0,0,0,0.2)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>

              {/* Unplaced tables */}
              {isOpen && items.length > 0 && (
                <div className="p-1.5 flex flex-col gap-1" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  {items.map(tt => {
                    const fill = tt.table_color || zone.color;
                    return (
                      <div key={tt.id} draggable onDragStart={e => onSidebarDragStart(e, tt.id)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing select-none"
                        style={{ background: "rgba(0,0,0,0.02)" }}>
                        <div className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold"
                          style={{ background: fill, border: tt.table_border_color ? `2px solid ${tt.table_border_color}` : "none", color: tt.table_text_color || "#fff" }}>
                          {tt.name}
                        </div>
                        <span className="text-[#0a0a0a]/45 text-[11px] flex-1">#{tt.name}</span>
                        {tt.capacity && <span className="text-[#0a0a0a]/20 text-[10px] shrink-0">{tt.capacity}p</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Placed tables indicator */}
              {isOpen && placedItems.length > 0 && (
                <div className="px-2.5 py-1.5" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                  <div className="flex flex-wrap gap-1">
                    {placedItems.map(tt => (
                      <div key={tt.id}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: tt.table_color || zone.color,
                          color: tt.table_text_color || "#fff",
                          border: tt.table_border_color ? `1.5px solid ${tt.table_border_color}` : "none",
                          opacity: 0.7,
                        }}>
                        {tt.name}
                      </div>
                    ))}
                  </div>
                  <p className="text-[#0a0a0a]/20 text-[9px] mt-1">{placedItems.length} on map</p>
                </div>
              )}

              {isOpen && items.length === 0 && placedItems.length === 0 && (
                <p className="px-2.5 py-2 text-[#0a0a0a]/20 text-[10px]" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>No tables</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 rounded-2xl overflow-hidden relative transition-all"
        style={{ border: isDragOver ? "2px dashed rgba(0,0,0,0.2)" : "1px solid rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.018)" }}>
        <div ref={canvasRef} className="absolute inset-0"
          onDragOver={onCanvasDragOver}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onCanvasDrop}
          onClick={() => setZonePanel(null)}
        >
          {venueMapUrl && (
            <img src={venueMapUrl} alt="Venue map" className="absolute inset-0 w-full h-full"
              style={{ objectFit: "contain", pointerEvents: "none" }} />
          )}
          {!venueMapUrl && placed.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <p className="text-[#0a0a0a]/15 text-sm">Drag tables here to position them</p>
              <p className="text-[#0a0a0a]/10 text-xs">Upload a venue map in the Venue map tab to use as background</p>
            </div>
          )}
          {venueMapUrl && placed.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-4 py-2 rounded-xl" style={{ background: "rgba(0,0,0,0.45)" }}>
                <p className="text-white/50 text-xs">Drag tables from the left panel</p>
              </div>
            </div>
          )}

          {placed.map(tt => {
            const zone = zones.find(z => z.id === tt.zone_id);
            const fill = tt.table_color || zone?.color || tt.zone_color || "#3b6fd4";
            const border = tt.table_border_color;
            const sz = SIZE_PX[tt.map_table_size ?? "medium"] ?? 40;
            const fontSize = sz >= 50 ? 15 : sz >= 36 ? 13 : 10;
            return (
              <div key={tt.id}
                onPointerDown={e => onTablePointerDown(e, tt.id)}
                className="absolute select-none cursor-grab active:cursor-grabbing group"
                style={{ left: `${tt.map_position_x}%`, top: `${tt.map_position_y}%`, width: sz, height: sz, transform: "translate(-50%, -50%)", touchAction: "none", zIndex: 10 }}>
                <div className="w-full h-full rounded-xl flex items-center justify-center font-bold"
                  style={{
                    background: fill, border: border ? `2.5px solid ${border}` : "none", fontSize,
                    color: tt.table_text_color || "#ffffff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  }}>
                  {tt.name}
                </div>
                <button
                  type="button"
                  onClick={e => removePos(tt.id, e)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white items-center justify-center hidden group-hover:flex"
                  style={{ border: "1px solid rgba(0,0,0,0.15)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                >
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            );
          })}
        </div>

        {saving && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-[10px] pointer-events-none"
            style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.7)" }}>
            Saving...
          </div>
        )}
      </div>
    </div>
  );
}
