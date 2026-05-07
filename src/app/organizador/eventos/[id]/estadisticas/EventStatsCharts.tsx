"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatPrice } from "@/lib/currency";

type Day = { date: string; revenue: number; tickets: number; views: number };
type BarDay = { date: string; barRevenue: number };

function shortDate(d: string) {
  if (typeof window === "undefined") return d;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const tickStyle = { fill: "rgba(0,0,0,0.2)", fontSize: 10 };
const tooltipStyle = {
  background: "#0a0a0a", border: "none", borderRadius: 10,
  color: "#fff", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
};
const cardStyle = { background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" };

export default function EventStatsCharts({
  data,
  currency = "CRC",
  barData,
}: {
  data: Day[];
  currency?: string;
  barData?: BarDay[];
}) {
  const fmt = (n: number) => formatPrice(n, currency);
  const hasBarData = (barData ?? []).some(d => d.barRevenue > 0);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Ticket Revenue */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-4">Ticket revenue · last 28 days</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="ev-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={shortDate} tick={tickStyle} axisLine={false} tickLine={false} interval={6} />
            <YAxis tickFormatter={fmt} tick={tickStyle} axisLine={false} tickLine={false} width={70} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(Number(v)), "Ticket revenue"]} labelFormatter={(l) => shortDate(l)} />
            <Area type="monotone" dataKey="revenue" stroke="#0a0a0a" strokeWidth={2} fill="url(#ev-rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Revenue (only if POS data exists for this event) */}
      {hasBarData && barData && (
        <div className="rounded-2xl p-6" style={cardStyle}>
          <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-4">Bar revenue · last 28 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={barData} margin={{ top: 4, right: 0, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="ev-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#555" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#555" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={shortDate} tick={tickStyle} axisLine={false} tickLine={false} interval={6} />
              <YAxis tickFormatter={fmt} tick={tickStyle} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(Number(v)), "Bar revenue"]} labelFormatter={(l) => shortDate(l)} />
              <Area type="monotone" dataKey="barRevenue" stroke="#555" strokeWidth={2} fill="url(#ev-bar)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tickets Sold */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-4">Tickets sold · last 28 days</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ev-tix" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#555" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#555" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={shortDate} tick={tickStyle} axisLine={false} tickLine={false} interval={6} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v), "Tickets"]} labelFormatter={(l) => shortDate(l)} />
            <Area type="monotone" dataKey="tickets" stroke="#555" strokeWidth={2} fill="url(#ev-tix)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Page Visits */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-4">Page visits · last 28 days</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ev-views" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={shortDate} tick={tickStyle} axisLine={false} tickLine={false} interval={6} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v), "Visits"]} labelFormatter={(l) => shortDate(l)} />
            <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} fill="url(#ev-views)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
