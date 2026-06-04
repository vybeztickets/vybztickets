"use client";

import { useState } from "react";
import ImageUploadField from "@/app/components/ImageUploadField";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import ZonesManager from "./ZonesManager";
import TableLayoutEditor from "./TableLayoutEditor";
import { formatPrice } from "@/lib/currency";

type TableType = {
  id: string;
  name: string;
  price: number;
  total_available: number;
  sold_count: number;
  is_active: boolean;
  capacity: number | null;
  zone_color: string | null;
  ingresados: number;
  totalRevenue: number;
};

type Zone = { id: string; name: string; color: string; sort_order: number };

type ZoneTableType = {
  id: string; zone_id: string | null; name: string; price: number;
  capacity: number | null; zone_color: string | null;
  price_per_extra_person: number; max_extra_people: number;
  includes: string | null; deposit_enabled: boolean; deposit_percent: number;
  min_hours_before_event: number;
  deposit_refund_percent: number; deposit_warning_text: string | null;
  is_active: boolean; sold_count: number; total_available: number;
  map_position_x?: number | null; map_position_y?: number | null;
  table_color?: string | null; table_border_color?: string | null; table_text_color?: string | null; map_table_size?: string | null;
};

type Tab = "stats" | "zones" | "layout" | "map";

export default function TablesManager({
  eventId,
  tableTypes: initial,
  venueMapUrl: initialMapUrl,
  initialZones,
  initialTables,
  currency,
}: {
  eventId: string;
  tableTypes: TableType[];
  venueMapUrl: string | null;
  initialZones: Zone[];
  initialTables: ZoneTableType[];
  currency: string;
}) {
  const [tables] = useState(initial);
  const [activeTab, setActiveTab] = useState<Tab>("zones");
  const [zonesForLayout, setZonesForLayout] = useState(initialZones);
  const [venueMapUrl, setVenueMapUrl] = useState(initialMapUrl);
  const [mapSaving, setMapSaving] = useState(false);
  const [mapDeleting, setMapDeleting] = useState(false);
  const [confirm, setConfirm] = useState<{ message: string; label?: string; fn: () => void } | null>(null);

  const totalSold = tables.reduce((s, t) => s + t.sold_count, 0);
  const totalRevenue = tables.reduce((s, t) => s + t.totalRevenue, 0);
  const totalCapacity = tables.reduce((s, t) => s + (t.capacity ?? 0) * t.total_available, 0);

  async function saveMap(url: string) {
    setVenueMapUrl(url);
    setMapSaving(true);
    await fetch(`/api/organizador/eventos/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venue_map_url: url }),
    });
    setMapSaving(false);
  }

  function deleteMap() {
    setConfirm({
      message: "Remove the venue map?",
      label: "Remove",
      fn: async () => {
        setConfirm(null);
        setMapDeleting(true);
        await fetch(`/api/organizador/eventos/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venue_map_url: null }),
        });
        setVenueMapUrl(null);
        setMapDeleting(false);
      },
    });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "stats", label: "Statistics" },
    { key: "zones", label: "Zones" },
    { key: "layout", label: "Table layout" },
    { key: "map", label: "Venue map" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center mb-6">
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
      </div>

      {/* ── STATS ── */}
      {activeTab === "stats" && (
        <div>
          {tables.length === 0 ? (
            <div className="py-16 text-center text-[#0a0a0a]/20 text-sm">No tables yet</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Tables sold", value: String(totalSold) },
                  { label: "Total revenue", value: formatPrice(totalRevenue, currency) },
                  { label: "Total capacity", value: totalCapacity > 0 ? `${totalCapacity} pax` : "—" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl px-5 py-4" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
                    <p className="text-[#0a0a0a]/40 text-xs mb-1">{s.label}</p>
                    <p className="text-[#0a0a0a] font-bold text-2xl">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="px-5 py-3" style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                  <p className="text-[#0a0a0a]/30 text-xs uppercase tracking-wider font-semibold">By table type</p>
                </div>
                {tables.map((tt, i) => {
                  const pct = tt.total_available >= 999999 ? 0 : Math.min(100, (tt.sold_count / tt.total_available) * 100);
                  return (
                    <div key={tt.id} className="px-5 py-4" style={{ borderBottom: i < tables.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {tt.zone_color && <div className="w-2 h-2 rounded-full" style={{ background: tt.zone_color }} />}
                          <span className="text-[#0a0a0a] text-sm font-medium">#{tt.name}</span>
                          <span className="text-[#0a0a0a]/30 text-xs">{formatPrice(tt.price, currency)}</span>
                          {tt.capacity && <span className="text-[#0a0a0a]/25 text-xs">{tt.capacity} pax</span>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#0a0a0a]/40">
                          <span><span className="text-[#0a0a0a] font-semibold">{tt.sold_count}</span> sold</span>
                          <span className="text-[#0a0a0a]/60 font-semibold">{formatPrice(tt.totalRevenue, currency)}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: tt.zone_color ?? "#c4a050" }} />
                      </div>
                      <div className="mt-1.5">
                        <span className="text-[10px] text-[#0a0a0a]/25">{pct.toFixed(0)}% sold</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ZONES ── always mounted */}
      <div style={{ display: activeTab === "zones" ? "block" : "none" }}>
        <ZonesManager eventId={eventId} initialZones={initialZones} initialTables={initialTables} currency={currency} onZonesChange={setZonesForLayout} />
      </div>

      {/* ── TABLE LAYOUT ── always mounted */}
      <div style={{ display: activeTab === "layout" ? "block" : "none" }}>
        <TableLayoutEditor
          zones={zonesForLayout}
          tables={initialTables}
          venueMapUrl={venueMapUrl}
        />
      </div>

      {/* ── VENUE MAP ── */}
      {activeTab === "map" && (
        <div>
          <p className="text-[#0a0a0a]/40 text-xs mb-5">Upload your venue map. It will be shown on the event public page before VIP tables.</p>
          <ImageUploadField
            label="Venue map"
            value={venueMapUrl ?? ""}
            onChange={saveMap}
            aspectRatio="16:9"
          />
          <div className="flex items-center gap-3 mt-3">
            {mapSaving && <p className="text-[#0a0a0a]/30 text-xs">Saving...</p>}
            {venueMapUrl && !mapSaving && (
              <>
                <p className="text-green-500/60 text-xs">Map saved</p>
                <button
                  onClick={deleteMap}
                  disabled={mapDeleting}
                  className="text-xs font-medium transition-colors disabled:opacity-40"
                  style={{ color: "rgba(239,68,68,0.6)" }}
                >
                  {mapDeleting ? "Removing..." : "Remove map"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          confirmLabel={confirm.label}
          onConfirm={confirm.fn}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
