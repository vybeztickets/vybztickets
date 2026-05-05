"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatPrice } from "@/lib/currency";

type DayData = { date: string; revenue: number; tickets: number };

function shortDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

const tickStyle = { fill: "rgba(0,0,0,0.25)", fontSize: 11 };
const tooltipStyle = {
  background: "#0a0a0a", border: "none", borderRadius: 10,
  color: "#fff", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
};
const cardStyle = { border: "1px solid rgba(0,0,0,0.07)", background: "#fff" };

export default function DashboardCharts({ chartData, currency = "CRC" }: { chartData: DayData[]; currency?: string }) {
  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalTickets = chartData.reduce((s, d) => s + d.tickets, 0);
  const [now, setNow] = useState("");
  useEffect(() => {
    setNow(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const fmt = (n: number) => formatPrice(n, currency);

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Revenue */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <p className="text-[#0a0a0a]/35 text-[10px] uppercase tracking-[0.18em] mb-1">Gross volume · Last 28 days</p>
        <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a] leading-none mb-4">{fmt(totalRevenue)}</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={shortDate} tick={tickStyle} axisLine={false} tickLine={false} interval={6} />
            <YAxis tickFormatter={fmt} tick={tickStyle} axisLine={false} tickLine={false} width={70} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={((v: number) => [fmt(v), "Revenue"]) as any} labelFormatter={shortDate as any} />
            <Area type="monotone" dataKey="revenue" stroke="#0a0a0a" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[#0a0a0a]/18 text-[10px] mt-3">Updated {now}</p>
      </div>

      {/* Tickets */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <p className="text-[#0a0a0a]/35 text-[10px] uppercase tracking-[0.18em] mb-1">Tickets sold · Last 28 days</p>
        <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a] leading-none mb-4">{totalTickets}</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tixGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#555" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#555" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={shortDate} tick={tickStyle} axisLine={false} tickLine={false} interval={6} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={((v: number) => [v, "Tickets"]) as any} labelFormatter={shortDate as any} />
            <Area type="monotone" dataKey="tickets" stroke="#555" strokeWidth={2} fill="url(#tixGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
