"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatPrice } from "@/lib/currency";

type DayData = { date: string; revenue: number; tickets: number };
type PosDay = { date: string; barRevenue: number };

function shortDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

function compactPrice(n: number, currency: string): string {
  const sym = currency === "CRC" ? "₡" : "$";
  if (n === 0) return `${sym}0`;
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(0)}k`;
  return `${sym}${n}`;
}

const tickStyle = { fill: "#666666", fontSize: 11 };
const tooltipStyle = {
  background: "#0a0a0a", border: "none", borderRadius: 10,
  color: "#fff", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
};
const cardStyle = { border: "1px solid rgba(0,0,0,0.07)", background: "#fff" };

export default function DashboardCharts({
  chartData,
  currency = "CRC",
  posChartData,
}: {
  chartData: DayData[];
  currency?: string;
  posChartData?: PosDay[];
}) {
  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalTickets = chartData.reduce((s, d) => s + d.tickets, 0);
  const totalBarRevenue = (posChartData ?? []).reduce((s, d) => s + d.barRevenue, 0);
  const hasBarData = totalBarRevenue > 0;

  const [now, setNow] = useState("");
  useEffect(() => {
    setNow(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const fmt = (n: number) => formatPrice(n, currency);
  const tickFmt = (n: number) => compactPrice(n, currency);

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Ticket Revenue */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <p className="text-[#555555] text-[10px] uppercase tracking-[0.18em] mb-1">Ticket revenue · Last 28 days</p>
        <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a] leading-none mb-4">{fmt(totalRevenue)}</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" axisLine={false} tickLine={false} interval={6}
              tick={(props: any) => {
                if (props.index === 0) return <g key={props.index} />;
                return <text key={props.index} x={props.x} y={props.y + 12} fill="#666666" fontSize={11} textAnchor="middle">{shortDate(props.payload.value)}</text>;
              }}
            />
            <YAxis tickFormatter={tickFmt} tick={tickStyle} axisLine={false} tickLine={false} width={52} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={((v: number) => [fmt(v), "Ticket revenue"]) as any} labelFormatter={shortDate as any} />
            <Area type="monotone" dataKey="revenue" stroke="#0a0a0a" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[10px] mt-3" style={{ color: "#888" }}>Updated {now}</p>
      </div>

      {/* Bar Revenue (only if POS data exists) */}
      {hasBarData && posChartData && (
        <div className="rounded-2xl p-6" style={cardStyle}>
          <p className="text-[#555555] text-[10px] uppercase tracking-[0.18em] mb-1">Bar revenue · Last 28 days</p>
          <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a] leading-none mb-4">{fmt(totalBarRevenue)}</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={posChartData} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#555" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#555" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} interval={6}
              tick={(props: any) => {
                if (props.index === 0) return <g key={props.index} />;
                return <text key={props.index} x={props.x} y={props.y + 12} fill="#666666" fontSize={11} textAnchor="middle">{shortDate(props.payload.value)}</text>;
              }}
            />
              <YAxis tickFormatter={tickFmt} tick={tickStyle} axisLine={false} tickLine={false} width={52} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={((v: number) => [fmt(v), "Bar revenue"]) as any} labelFormatter={shortDate as any} />
              <Area type="monotone" dataKey="barRevenue" stroke="#555" strokeWidth={2} fill="url(#barGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tickets Sold */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <p className="text-[#555555] text-[10px] uppercase tracking-[0.18em] mb-1">Tickets sold · Last 28 days</p>
        <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a] leading-none mb-4">{totalTickets}</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="tixGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#555" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#555" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" axisLine={false} tickLine={false} interval={6}
              tick={(props: any) => {
                if (props.index === 0) return <g key={props.index} />;
                return <text key={props.index} x={props.x} y={props.y + 12} fill="#666666" fontSize={11} textAnchor="middle">{shortDate(props.payload.value)}</text>;
              }}
            />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={((v: number) => [v, "Tickets"]) as any} labelFormatter={shortDate as any} />
            <Area type="monotone" dataKey="tickets" stroke="#555" strokeWidth={2} fill="url(#tixGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
