"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type DayData = { date: string; revenue: number; tickets: number };

function shortDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short" });
}

function formatPrice(n: number) {
  if (n >= 1000000) return "₡" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "₡" + (n / 1000).toFixed(0) + "K";
  return "₡" + n;
}

const tickStyle = { fill: "rgba(0,0,0,0.3)", fontSize: 11 };
const tooltipStyle = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.1)",
  borderRadius: 10,
  color: "#0a0a0a",
  fontSize: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

export default function DashboardCharts({ chartData }: { chartData: DayData[] }) {
  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalTickets = chartData.reduce((s, d) => s + d.tickets, 0);

  const [now, setNow] = useState("");
  useEffect(() => {
    setNow(new Date().toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Revenue chart */}
      <div className="card-light rounded-2xl p-6">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-[#0a0a0a] font-semibold text-base">Volumen bruto</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#059669" }}>
            {totalRevenue > 0 ? "↑ activo" : "sin datos"}
          </span>
        </div>
        <p className="text-[#0a0a0a] font-bold text-3xl mb-0.5">{formatPrice(totalRevenue)}</p>
        <p className="text-[#0a0a0a]/30 text-xs mb-5">Últimos 28 días</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.12}/>
                <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={shortDate} tick={tickStyle} axisLine={false} tickLine={false} interval={6} />
            <YAxis tickFormatter={formatPrice} tick={tickStyle} axisLine={false} tickLine={false} width={48} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [formatPrice(v), "Ingresos"]}
              labelFormatter={shortDate}
            />
            <Area type="monotone" dataKey="revenue" stroke="#0a0a0a" strokeWidth={2} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[#0a0a0a]/20 text-xs mt-2">Actualizado {now}</p>
      </div>

      {/* Tickets chart */}
      <div className="card-light rounded-2xl p-6">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-[#0a0a0a] font-semibold text-base">Entradas vendidas</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#059669" }}>
            {totalTickets > 0 ? "↑ activo" : "sin datos"}
          </span>
        </div>
        <p className="text-[#0a0a0a] font-bold text-3xl mb-0.5">{totalTickets}</p>
        <p className="text-[#0a0a0a]/30 text-xs mb-5">Últimos 28 días</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ticketsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.08}/>
                <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={shortDate} tick={tickStyle} axisLine={false} tickLine={false} interval={6} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, "Entradas"]}
              labelFormatter={shortDate}
            />
            <Area type="monotone" dataKey="tickets" stroke="#555" strokeWidth={2} strokeDasharray="0" fill="url(#ticketsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[#0a0a0a]/20 text-xs mt-2">Actualizado {now}</p>
      </div>
    </div>
  );
}
