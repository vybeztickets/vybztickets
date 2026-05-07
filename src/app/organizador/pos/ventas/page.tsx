"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { formatPrice } from "@/lib/currency";

type ProductRow = { name: string; units: number; revenue: number };
type ChartPoint = { date: string; revenue: number };
type EventOption = { id: string; name: string; date: string };

type SalesData = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  avgTicketPerPerson: number;
  checkedIn: number;
  productBreakdown: ProductRow[];
  chart: ChartPoint[];
  events: EventOption[];
};

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const tickStyle = { fill: "rgba(0,0,0,0.2)", fontSize: 10 };
const tooltipStyle = {
  background: "#0a0a0a", border: "none", borderRadius: 10,
  color: "#fff", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
};

export default function PosSalesPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState("");
  const [days, setDays] = useState(20);
  const currency = "USD";
  const fmt = (n: number) => formatPrice(n, currency);

  async function load(evId: string, d: number) {
    setLoading(true);
    const params = new URLSearchParams({ days: String(d) });
    if (evId) params.set("event_id", evId);
    const res = await fetch(`/api/organizador/pos/sales?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => { load(eventFilter, days); }, [eventFilter, days]);

  return (
    <div className="px-10 py-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] text-4xl tracking-wide">Bar Sales</h1>
          <p className="text-[#0a0a0a]/30 text-sm mt-1">Gross bar revenue breakdown</p>
        </div>
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
      </div>

      {loading ? (
        <p className="text-[#0a0a0a]/20 text-sm py-16 text-center">Loading…</p>
      ) : !data ? (
        <p className="text-[#0a0a0a]/20 text-sm py-16 text-center">No data available</p>
      ) : (
        <>
          {/* ── KPI row ── */}
          <div className="flex mb-8 pb-8" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex-1 pr-8" style={{ borderRight: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-[0.2em] mb-2">Gross Bar Revenue</p>
              <p className="font-[family-name:var(--font-bebas)] text-[60px] text-[#0a0a0a] leading-none">
                {fmt(data.totalRevenue)}
              </p>
              <p className="text-[#0a0a0a]/25 text-xs mt-1">Last {days} days</p>
            </div>
            {[
              { label: "Orders", value: data.totalOrders.toString() },
              { label: "Avg order", value: fmt(data.avgOrderValue) },
              { label: "Avg / person", value: data.checkedIn > 0 ? fmt(data.avgTicketPerPerson) : "—" },
              { label: "Checked in", value: data.checkedIn.toString() },
            ].map(s => (
              <div key={s.label} className="px-7" style={{ borderLeft: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider mb-2 whitespace-nowrap">{s.label}</p>
                <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#0a0a0a] leading-none">{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Revenue area chart ── */}
          <div className="rounded-2xl p-6 mb-6" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
            <p className="text-[#0a0a0a]/35 text-[10px] uppercase tracking-[0.18em] mb-1">Bar revenue · last {days} days</p>
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
                <Tooltip contentStyle={tooltipStyle} formatter={((v: number) => [fmt(v), "Bar revenue"]) as any} labelFormatter={fmtDate as any} />
                <Area type="monotone" dataKey="revenue" stroke="#0a0a0a" strokeWidth={2} fill="url(#barRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Product breakdown ── */}
          {data.productBreakdown.length > 0 ? (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
              <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.02)" }}>
                <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider font-semibold">Product breakdown</p>
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
                  style={{ gridTemplateColumns: "24px 1fr 70px 70px 100px", color: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
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
                      <span className="text-[10px] font-bold" style={{ color: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.25)" }}>{i + 1}</span>
                      <p className="text-[#0a0a0a] text-sm font-medium truncate pr-4">{p.name}</p>
                      <p className="text-right text-[#0a0a0a] text-sm tabular-nums">{p.units}</p>
                      <p className="text-right text-black/30 text-sm tabular-nums">{pct.toFixed(0)}%</p>
                      <p className="text-right text-[#0a0a0a] text-sm font-bold tabular-nums">{fmt(p.revenue)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={{ border: "1px dashed rgba(0,0,0,0.1)" }}>
              <p className="text-[#0a0a0a]/20 text-sm">No POS sales in this period</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
