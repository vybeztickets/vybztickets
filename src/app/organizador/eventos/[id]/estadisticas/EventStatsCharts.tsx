"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatPrice } from "@/lib/currency";

type Day = { date: string; revenue: number; tickets: number; views: number };

function shortDate(d: string) {
  if (typeof window === "undefined") return d;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const gridStroke = "rgba(0,0,0,0.04)";
const axisStyle = { fill: "rgba(0,0,0,0.2)", fontSize: 10 };
const tooltipStyle = { background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12 };
const cardStyle = { background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" };

export default function EventStatsCharts({ data, currency = "CRC" }: { data: Day[]; currency?: string }) {
  const fmt = (n: number) => formatPrice(n, currency);
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Revenue */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-4">Sales volume (last 28 days)</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="ev-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => fmt(v)} tick={axisStyle} axisLine={false} tickLine={false} width={80} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "rgba(0,0,0,0.4)" }}
              formatter={(v) => [fmt(Number(v)), "Revenue"]} labelFormatter={(l) => shortDate(l)} />
            <Area type="monotone" dataKey="revenue" stroke="#0a0a0a" strokeWidth={2} fill="url(#ev-rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tickets */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-4">Tickets sold (last 28 days)</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ev-tix" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#555" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#555" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "rgba(0,0,0,0.4)" }}
              formatter={(v) => [Number(v), "Tickets"]} labelFormatter={(l) => shortDate(l)} />
            <Area type="monotone" dataKey="tickets" stroke="#555" strokeWidth={2} fill="url(#ev-tix)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Page views */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-4">Page visits (last 28 days)</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ev-views" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "rgba(0,0,0,0.4)" }}
              formatter={(v) => [Number(v), "Visits"]} labelFormatter={(l) => shortDate(l)} />
            <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} fill="url(#ev-views)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
