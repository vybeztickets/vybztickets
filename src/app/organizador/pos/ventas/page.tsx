"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { formatPrice } from "@/lib/currency";

// ── Types ─────────────────────────────────────────────────────────────────────

type ProductRow = { name: string; units: number; revenue: number };
type ChartPoint = { date: string; revenue: number };
type EventOption = { id: string; name: string; date: string };

type TopQtyItem = { name: string; qty: number; revenue: number };
type TopMarginItem = {
  name: string; qty: number; revenue: number;
  cost: number | null; profit: number | null; marginPct: number | null;
};

type SalesData = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  avgTicketPerPerson: number;
  checkedIn: number;
  productBreakdown: ProductRow[];
  chart: ChartPoint[];
  events: EventOption[];
  topByQty: TopQtyItem[];
  topByMargin: TopMarginItem[];
};

type VarianceRow = {
  category: string; name: string; noSold: number; posSales: number;
  expectedUseOz: number | null; actualUseOz: number | null;
  overShortOz: number | null; idealPcPct: number | null;
  actualPcPct: number | null; variancePct: number | null;
};
type VarianceSubtotal = {
  noSold: number; posSales: number;
  expectedUseOz: number | null; actualUseOz: number | null; overShortOz: number | null;
};
type VarianceGroup = { category: string; rows: VarianceRow[]; subtotal: VarianceSubtotal };
type VarianceData = {
  grouped: VarianceGroup[];
  grandTotal: VarianceSubtotal;
  month: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtMoney(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtOz(n: number | null) {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number | null) {
  if (n === null) return "—";
  return n.toFixed(1) + "%";
}

function varianceColor(v: number | null): string {
  if (v === null) return "#0a0a0a";
  if (v > 5) return "#dc2626";
  if (v < 0) return "#15803d";
  return "#0a0a0a";
}

function getMonthLabel(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getMonthKey(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const tickStyle = { fill: "#888", fontSize: 10 };
const tooltipStyle = {
  background: "#0a0a0a", border: "none", borderRadius: 10,
  color: "#fff", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
};

// ── CSV export ────────────────────────────────────────────────────────────────

function exportVarianceCSV(grouped: VarianceGroup[], grandTotal: VarianceSubtotal, month: string) {
  const headers = ["Category", "Product", "No. Sold", "POS Sales ($)", "Expected Use (oz)", "Actual Use (oz)", "Over/Short (oz)", "Ideal PC%", "Actual PC%", "Variance%"];
  const rows: string[][] = [headers];

  for (const group of grouped) {
    for (const row of group.rows) {
      rows.push([
        row.category,
        row.name,
        String(row.noSold),
        fmtMoney(row.posSales),
        fmtOz(row.expectedUseOz),
        fmtOz(row.actualUseOz),
        fmtOz(row.overShortOz),
        fmtPct(row.idealPcPct),
        fmtPct(row.actualPcPct),
        fmtPct(row.variancePct),
      ]);
    }
    rows.push([
      `${group.category} — Subtotal`, "",
      String(group.subtotal.noSold),
      fmtMoney(group.subtotal.posSales),
      fmtOz(group.subtotal.expectedUseOz),
      fmtOz(group.subtotal.actualUseOz),
      fmtOz(group.subtotal.overShortOz),
      "", "", "",
    ]);
    rows.push(Array(headers.length).fill(""));
  }

  rows.push([
    "GRAND TOTAL", "",
    String(grandTotal.noSold),
    fmtMoney(grandTotal.posSales),
    fmtOz(grandTotal.expectedUseOz),
    fmtOz(grandTotal.actualUseOz),
    fmtOz(grandTotal.overShortOz),
    "", "", "",
  ]);

  const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `variance-report-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page tabs ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "variance";

// ── Component ─────────────────────────────────────────────────────────────────

export default function PosSalesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Overview state
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState("");
  const [days, setDays] = useState(20);
  const [topView, setTopView] = useState<"qty" | "margin">("qty");

  // Variance state
  const [varianceData, setVarianceData] = useState<VarianceData | null>(null);
  const [varianceLoading, setVarianceLoading] = useState(false);
  const [varianceMonthOffset, setVarianceMonthOffset] = useState(0);

  const currency = "USD";
  const fmt = (n: number) => formatPrice(n, currency);

  // Load overview data
  const loadOverview = useCallback(async (evId: string, d: number) => {
    setLoading(true);
    const params = new URLSearchParams({ days: String(d) });
    if (evId) params.set("event_id", evId);
    const res = await fetch(`/api/organizador/pos/sales?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  // Load variance data
  const loadVariance = useCallback(async (offset: number) => {
    setVarianceLoading(true);
    const month = getMonthKey(offset);
    const res = await fetch(`/api/organizador/pos/variance-report?month=${month}`);
    if (!res.ok) { setVarianceLoading(false); return; }
    const json = await res.json();
    setVarianceData(json);
    setVarianceLoading(false);
  }, []);

  useEffect(() => { loadOverview(eventFilter, days); }, [eventFilter, days, loadOverview]);
  useEffect(() => {
    if (activeTab === "variance") loadVariance(varianceMonthOffset);
  }, [activeTab, varianceMonthOffset, loadVariance]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="px-10 py-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-4xl tracking-wide">Bar Sales</h1>
          <p className="text-sm mt-1" style={{ color: "#888" }}>Gross bar revenue breakdown</p>
        </div>

        {/* Overview filters (only visible on overview tab) */}
        {activeTab === "overview" && (
          <div className="flex items-center gap-3">
            {data && data.events.length > 0 && (
              <select
                value={eventFilter}
                onChange={e => setEventFilter(e.target.value)}
                className="px-4 py-2 rounded-xl text-sm text-[#0a0a0a] focus:outline-none"
                style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <option value="">All events</option>
                {data.events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            )}
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="px-4 py-2 rounded-xl text-sm text-[#0a0a0a] focus:outline-none"
              style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <option value={7}>Last 7 days</option>
              <option value={20}>Last 20 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        )}
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
        {(["overview", "variance"] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              activeTab === tab
                ? { background: "#0a0a0a", color: "#fff" }
                : { background: "transparent", color: "rgba(0,0,0,0.45)" }
            }
          >
            {tab === "overview" ? "Overview" : "Variance Report"}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════ OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          {loading ? (
            <p className="text-sm py-16 text-center" style={{ color: "#888" }}>Loading…</p>
          ) : !data ? (
            <p className="text-sm py-16 text-center" style={{ color: "#888" }}>No data available</p>
          ) : (
            <>
              {/* KPI row */}
              <div className="flex mb-8 pb-8" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex-1 pr-8" style={{ borderRight: "1px solid rgba(0,0,0,0.07)" }}>
                  <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: "#888" }}>Gross Bar Revenue</p>
                  <p className="font-[family-name:var(--font-bebas)] text-[60px] text-[#0a0a0a] leading-none">
                    {fmt(data.totalRevenue)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#888" }}>Last {days} days</p>
                </div>
                {[
                  { label: "Orders", value: data.totalOrders.toString() },
                  { label: "Avg order", value: fmt(data.avgOrderValue) },
                  { label: "Avg / person", value: data.checkedIn > 0 ? fmt(data.avgTicketPerPerson) : "—" },
                  { label: "Checked in", value: data.checkedIn.toString() },
                ].map(s => (
                  <div key={s.label} className="px-7" style={{ borderLeft: "1px solid rgba(0,0,0,0.07)" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-2 whitespace-nowrap" style={{ color: "#888" }}>{s.label}</p>
                    <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#0a0a0a] leading-none">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Revenue area chart */}
              <div className="rounded-2xl p-6 mb-6" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
                <p className="text-[10px] uppercase tracking-[0.18em] mb-1" style={{ color: "#888" }}>Bar revenue · last {days} days</p>
                <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a] leading-none mb-4">{fmt(data.totalRevenue)}</p>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={data.chart} margin={{ top: 4, right: 0, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={tickStyle} axisLine={false} tickLine={false} interval={Math.floor(data.chart.length / 5)} />
                    <YAxis tickFormatter={fmt} tick={tickStyle} axisLine={false} tickLine={false} width={70} allowDecimals={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={((v: number) => [fmt(v), "Bar revenue"]) as any}
                      labelFormatter={((label: string, payload: any[]) => {
                        const rev = payload?.[0]?.value;
                        return rev != null ? `${fmtDate(label)}  ·  ${fmt(rev)}` : fmtDate(label);
                      }) as any}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0a0a0a" strokeWidth={2} fill="url(#barRevGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Product breakdown */}
              {data.productBreakdown.length > 0 ? (
                <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
                  <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.02)" }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#888" }}>Product breakdown</p>
                  </div>

                  {/* Recharts horizontal bar chart */}
                  <div className="px-6 pt-6 pb-4">
                    <ResponsiveContainer width="100%" height={Math.max(120, data.productBreakdown.length * 40)}>
                      <BarChart
                        data={data.productBreakdown}
                        layout="vertical"
                        margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
                      >
                        <XAxis type="number" tickFormatter={fmt} tick={tickStyle} axisLine={false} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: "rgba(0,0,0,0.55)", fontSize: 12, fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                          width={130}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={((v: number, _name: string, entry: any) => [
                            `${fmt(v)}  ·  ${entry.payload.units} units`,
                            "Revenue",
                          ]) as any}
                        />
                        <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                          {data.productBreakdown.map((_entry, index) => (
                            <Cell key={index} fill={index === 0 ? "#0a0a0a" : `rgba(0,0,0,${0.12 + (1 - index / data.productBreakdown.length) * 0.15})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table underneath */}
                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <div
                      className="grid text-xs font-semibold uppercase tracking-wider px-6 py-3"
                      style={{ gridTemplateColumns: "24px 1fr 70px 70px 100px", color: "#888", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
                    >
                      <div>#</div>
                      <div>Product</div>
                      <div className="text-right">Units</div>
                      <div className="text-right">Share</div>
                      <div className="text-right">Revenue</div>
                    </div>
                    {data.productBreakdown.map((p, i) => {
                      const pct = data.totalRevenue > 0 ? (p.revenue / data.totalRevenue) * 100 : 0;
                      return (
                        <div
                          key={p.name}
                          className="grid items-center px-6 py-3"
                          style={{
                            gridTemplateColumns: "24px 1fr 70px 70px 100px",
                            borderBottom: i < data.productBreakdown.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                          }}
                        >
                          <span className="text-[10px] font-bold" style={{ color: i === 0 ? "#0a0a0a" : "#888" }}>{i + 1}</span>
                          <p className="text-[#0a0a0a] text-sm font-medium truncate pr-4">{p.name}</p>
                          <p className="text-right text-[#0a0a0a] text-sm tabular-nums">{p.units}</p>
                          <p className="text-right text-sm tabular-nums" style={{ color: "#555" }}>{pct.toFixed(0)}%</p>
                          <p className="text-right text-[#0a0a0a] text-sm font-bold tabular-nums">{fmt(p.revenue)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl mb-6" style={{ border: "1px dashed rgba(0,0,0,0.1)" }}>
                  <p className="text-sm" style={{ color: "#888" }}>No POS sales in this period</p>
                </div>
              )}

              {/* ── TOP ITEMS ── */}
              {(data.topByQty.length > 0 || data.topByMargin.length > 0) && (
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
                  {/* Section header with toggle */}
                  <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.02)" }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#888" }}>Top items</p>
                    <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <button
                        onClick={() => setTopView("qty")}
                        className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                        style={topView === "qty" ? { background: "#0a0a0a", color: "#fff" } : { color: "rgba(0,0,0,0.4)" }}
                      >
                        By quantity
                      </button>
                      <button
                        onClick={() => setTopView("margin")}
                        className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                        style={topView === "margin" ? { background: "#0a0a0a", color: "#fff" } : { color: "rgba(0,0,0,0.4)" }}
                      >
                        By margin
                      </button>
                    </div>
                  </div>

                  {/* By quantity view */}
                  {topView === "qty" && (
                    <div>
                      <div
                        className="grid text-xs font-semibold uppercase tracking-wider px-6 py-3"
                        style={{ gridTemplateColumns: "32px 1fr 80px 110px", color: "#888", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.03)" }}
                      >
                        <div>#</div>
                        <div>Item</div>
                        <div className="text-right">Units sold</div>
                        <div className="text-right">Revenue</div>
                      </div>
                      {data.topByQty.map((item, i) => (
                        <div
                          key={item.name}
                          className="grid items-center px-6 py-3.5"
                          style={{
                            gridTemplateColumns: "32px 1fr 80px 110px",
                            borderBottom: i < data.topByQty.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                          }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                            style={i === 0 ? { background: "#0a0a0a", color: "#fff" } : { background: "rgba(0,0,0,0.08)", color: "#888" }}
                          >
                            {i + 1}
                          </span>
                          <p className="text-[#0a0a0a] text-sm font-medium truncate pr-4">{item.name}</p>
                          <p className="text-right text-[#0a0a0a] text-sm tabular-nums font-semibold">{item.qty}</p>
                          <p className="text-right text-[#0a0a0a] text-sm tabular-nums">{fmtMoney(item.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* By margin view */}
                  {topView === "margin" && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ minWidth: 620, width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            {["#", "Item", "Units", "Revenue", "Cost", "Profit", "Margin %"].map((h, idx) => (
                              <th
                                key={h}
                                className="text-xs font-semibold uppercase tracking-wider py-3"
                                style={{
                                  color: "#888",
                                  textAlign: idx === 0 || idx === 1 ? "left" : "right",
                                  paddingLeft: idx === 0 ? 24 : 12,
                                  paddingRight: idx === 6 ? 24 : 12,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.topByMargin.map((item, i) => (
                            <tr
                              key={item.name}
                              style={{ borderBottom: i < data.topByMargin.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
                            >
                              <td className="py-3.5" style={{ paddingLeft: 24, paddingRight: 12, width: 44 }}>
                                <span
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                                  style={i === 0 ? { background: "#0a0a0a", color: "#fff" } : { background: "rgba(0,0,0,0.08)", color: "#888" }}
                                >
                                  {i + 1}
                                </span>
                              </td>
                              <td className="py-3.5 text-sm font-medium text-[#0a0a0a] max-w-[180px] truncate" style={{ paddingLeft: 0, paddingRight: 12 }}>
                                {item.name}
                              </td>
                              <td className="py-3.5 text-sm text-right tabular-nums text-[#0a0a0a]" style={{ paddingLeft: 12, paddingRight: 12 }}>
                                {item.qty}
                              </td>
                              <td className="py-3.5 text-sm text-right tabular-nums text-[#0a0a0a]" style={{ paddingLeft: 12, paddingRight: 12 }}>
                                {fmtMoney(item.revenue)}
                              </td>
                              <td className="py-3.5 text-sm text-right tabular-nums" style={{ paddingLeft: 12, paddingRight: 12, color: "#555" }}>
                                {item.cost !== null ? fmtMoney(item.cost) : "—"}
                              </td>
                              <td className="py-3.5 text-sm text-right tabular-nums font-semibold" style={{ paddingLeft: 12, paddingRight: 12, color: item.profit !== null && item.profit >= 0 ? "#15803d" : "#dc2626" }}>
                                {item.profit !== null ? fmtMoney(item.profit) : "—"}
                              </td>
                              <td className="py-3.5 text-sm text-right tabular-nums" style={{ paddingLeft: 12, paddingRight: 24, color: "#555" }}>
                                {item.marginPct !== null ? item.marginPct.toFixed(1) + "%" : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {data.topByMargin.every(i => i.cost === null) && (
                        <p className="px-6 py-4 text-xs text-center" style={{ color: "#888" }}>
                          Add recipes to your products to see margin data
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ VARIANCE TAB */}
      {activeTab === "variance" && (
        <div>
          {/* Month selector */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
              {[0, 1, 2].map(offset => (
                <button
                  key={offset}
                  onClick={() => setVarianceMonthOffset(offset)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={
                    varianceMonthOffset === offset
                      ? { background: "#0a0a0a", color: "#fff" }
                      : { background: "transparent", color: "rgba(0,0,0,0.4)" }
                  }
                >
                  {offset === 0 ? "This month" : offset === 1 ? "Last month" : getMonthLabel(2)}
                </button>
              ))}
            </div>

            {varianceData && varianceData.grouped.length > 0 && (
              <button
                onClick={() => exportVarianceCSV(varianceData.grouped, varianceData.grandTotal, varianceData.month)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
            )}
          </div>

          {varianceLoading ? (
            <p className="text-sm py-16 text-center" style={{ color: "#888" }}>Loading variance data…</p>
          ) : !varianceData || varianceData.grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.1)" }}>
              <p className="text-sm" style={{ color: "#888" }}>No sales data for {getMonthLabel(varianceMonthOffset)}</p>
            </div>
          ) : (
            <>
              {/* Column key */}
              <p className="text-xs mb-4 font-medium" style={{ color: "#555" }}>
                Over/Short: <span style={{ color: "#15803d" }}>positive = poured less (favorable)</span> · <span style={{ color: "#dc2626" }}>negative = poured more than expected (loss)</span>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <span style={{ color: "#dc2626", fontWeight: 600 }}>Red</span> = variance &gt;5% &nbsp;
                <span style={{ color: "#15803d", fontWeight: 600 }}>Green</span> = favorable
              </p>

              {/* Table */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ minWidth: 900, width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.04)", borderBottom: "2px solid rgba(0,0,0,0.1)" }}>
                        {[
                          { label: "Category", align: "left" },
                          { label: "Product", align: "left" },
                          { label: "No. Sold", align: "right" },
                          { label: "POS Sales", align: "right" },
                          { label: "Expected (oz)", align: "right" },
                          { label: "Actual (oz)", align: "right" },
                          { label: "Over/Short (oz)", align: "right" },
                          { label: "Ideal PC%", align: "right" },
                          { label: "Actual PC%", align: "right" },
                          { label: "Variance%", align: "right" },
                        ].map((h, idx) => (
                          <th
                            key={h.label}
                            className="text-[11px] font-bold uppercase tracking-wider py-3.5 whitespace-nowrap"
                            style={{
                              color: "#0a0a0a",
                              textAlign: h.align as "left" | "right",
                              paddingLeft: idx === 0 ? 20 : 12,
                              paddingRight: idx === 9 ? 20 : 12,
                            }}
                          >
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {varianceData.grouped.map((group, gi) => (
                        <React.Fragment key={group.category}>
                          {/* Category header row */}
                          <tr key={`cat-${group.category}`} style={{ background: "rgba(0,0,0,0.03)", borderTop: gi > 0 ? "2px solid rgba(0,0,0,0.08)" : "none" }}>
                            <td
                              colSpan={10}
                              className="text-xs font-bold uppercase tracking-wider py-2.5"
                              style={{ paddingLeft: 20, color: "#0a0a0a" }}
                            >
                              {group.category}
                            </td>
                          </tr>

                          {/* Product rows */}
                          {group.rows.map((row) => (
                            <tr
                              key={`${group.category}-${row.name}`}
                              style={{
                                borderBottom: "1px solid rgba(0,0,0,0.04)",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <td className="py-3" style={{ paddingLeft: 20, paddingRight: 10 }} />
                              <td className="py-3 text-sm font-medium text-[#0a0a0a] max-w-[180px] truncate" style={{ paddingLeft: 0, paddingRight: 10 }}>
                                {row.name}
                              </td>
                              <td className="py-3 text-sm text-right tabular-nums text-[#0a0a0a]" style={{ paddingLeft: 10, paddingRight: 10 }}>{row.noSold}</td>
                              <td className="py-3 text-sm text-right tabular-nums text-[#0a0a0a]" style={{ paddingLeft: 10, paddingRight: 10 }}>{fmtMoney(row.posSales)}</td>
                              <td className="py-3 text-sm text-right tabular-nums" style={{ paddingLeft: 10, paddingRight: 10, color: "#555" }}>{fmtOz(row.expectedUseOz)}</td>
                              <td className="py-3 text-sm text-right tabular-nums" style={{ paddingLeft: 10, paddingRight: 10, color: "#555" }}>{fmtOz(row.actualUseOz)}</td>
                              <td
                                className="py-3 text-sm text-right tabular-nums font-medium"
                                style={{
                                  paddingLeft: 10, paddingRight: 10,
                                  color: row.overShortOz === null ? "#888" : row.overShortOz < 0 ? "#dc2626" : "#15803d",
                                }}
                              >
                                {fmtOz(row.overShortOz)}
                              </td>
                              <td className="py-3 text-sm text-right tabular-nums" style={{ paddingLeft: 10, paddingRight: 10, color: "#555" }}>{fmtPct(row.idealPcPct)}</td>
                              <td className="py-3 text-sm text-right tabular-nums" style={{ paddingLeft: 10, paddingRight: 10, color: "#555" }}>{fmtPct(row.actualPcPct)}</td>
                              <td
                                className="py-3 text-sm text-right tabular-nums font-semibold"
                                style={{ paddingLeft: 10, paddingRight: 20, color: varianceColor(row.variancePct) }}
                              >
                                {fmtPct(row.variancePct)}
                              </td>
                            </tr>
                          ))}

                          {/* Category subtotal */}
                          <tr style={{ background: "rgba(0,0,0,0.05)", borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                            <td className="py-3" style={{ paddingLeft: 20, paddingRight: 12 }}>
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#888" }}>Sub</span>
                            </td>
                            <td className="py-3 text-xs font-bold text-[#0a0a0a]" style={{ paddingLeft: 0, paddingRight: 12 }}>{group.category} total</td>
                            <td className="py-3 text-xs text-right font-bold tabular-nums text-[#0a0a0a]" style={{ paddingLeft: 12, paddingRight: 12 }}>{group.subtotal.noSold}</td>
                            <td className="py-3 text-xs text-right font-bold tabular-nums text-[#0a0a0a]" style={{ paddingLeft: 12, paddingRight: 12 }}>{fmtMoney(group.subtotal.posSales)}</td>
                            <td className="py-3 text-xs text-right font-bold tabular-nums text-[#0a0a0a]" style={{ paddingLeft: 12, paddingRight: 12 }}>{fmtOz(group.subtotal.expectedUseOz)}</td>
                            <td className="py-3 text-xs text-right font-bold tabular-nums text-[#0a0a0a]" style={{ paddingLeft: 12, paddingRight: 12 }}>{fmtOz(group.subtotal.actualUseOz)}</td>
                            <td
                              className="py-3 text-xs text-right font-bold tabular-nums"
                              style={{
                                paddingLeft: 12, paddingRight: 12,
                                color: group.subtotal.overShortOz === null ? "#888" : group.subtotal.overShortOz < 0 ? "#dc2626" : "#15803d",
                              }}
                            >
                              {fmtOz(group.subtotal.overShortOz)}
                            </td>
                            <td colSpan={3} />
                          </tr>
                        </React.Fragment>
                      ))}

                      {/* Grand total */}
                      <tr style={{ background: "#0a0a0a", borderTop: "2px solid #0a0a0a" }}>
                        <td className="py-4" style={{ paddingLeft: 20, paddingRight: 12 }}>
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Total</span>
                        </td>
                        <td className="py-4 text-sm font-bold text-white" style={{ paddingLeft: 0, paddingRight: 12 }}>Grand Total</td>
                        <td className="py-4 text-sm text-right font-bold tabular-nums text-white" style={{ paddingLeft: 12, paddingRight: 12 }}>{varianceData.grandTotal.noSold}</td>
                        <td className="py-4 text-sm text-right font-bold tabular-nums text-white" style={{ paddingLeft: 12, paddingRight: 12 }}>{fmtMoney(varianceData.grandTotal.posSales)}</td>
                        <td className="py-4 text-sm text-right font-bold tabular-nums" style={{ paddingLeft: 12, paddingRight: 12, color: "rgba(255,255,255,0.7)" }}>{fmtOz(varianceData.grandTotal.expectedUseOz)}</td>
                        <td className="py-4 text-sm text-right font-bold tabular-nums" style={{ paddingLeft: 12, paddingRight: 12, color: "rgba(255,255,255,0.7)" }}>{fmtOz(varianceData.grandTotal.actualUseOz)}</td>
                        <td
                          className="py-4 text-sm text-right font-bold tabular-nums"
                          style={{
                            paddingLeft: 12, paddingRight: 12,
                            color: varianceData.grandTotal.overShortOz === null ? "rgba(255,255,255,0.4)" : varianceData.grandTotal.overShortOz < 0 ? "#fca5a5" : "#86efac",
                          }}
                        >
                          {fmtOz(varianceData.grandTotal.overShortOz)}
                        </td>
                        <td colSpan={3} style={{ paddingRight: 20 }} />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
