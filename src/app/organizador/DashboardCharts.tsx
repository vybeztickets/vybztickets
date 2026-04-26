"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type DayData = { date: string; revenue: number; tickets: number };

function shortDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short" });
}

function formatAmt(n: number) {
  if (n >= 1000000) return "₡" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "₡" + (n / 1000).toFixed(0) + "K";
  return "₡" + n;
}

const tickStyle = { fill: "rgba(0,0,0,0.25)", fontSize: 11 };
const tooltipStyle = {
  background: "#0a0a0a",
  border: "none",
  borderRadius: 10,
  color: "#fff",
  fontSize: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
};

export default function DashboardCharts({ chartData }: { chartData: DayData[] }) {
  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalTickets = chartData.reduce((s, d) => s + d.tickets, 0);
  const [tab, setTab] = useState<"revenue" | "tickets">("revenue");
  const [now, setNow] = useState("");

  useEffect(() => {
    setNow(new Date().toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const isRevenue = tab === "revenue";

  return (
    <div
      className="rounded-2xl p-6 mb-8"
      style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[#0a0a0a]/35 text-[10px] uppercase tracking-[0.18em] mb-1">
            {isRevenue ? "Volumen bruto" : "Entradas vendidas"} · Últimos 28 días
          </p>
          <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a] leading-none">
            {isRevenue ? formatAmt(totalRevenue) : totalTickets}
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
          {(["revenue", "tickets"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                tab === t
                  ? { background: "#0a0a0a", color: "#fff" }
                  : { color: "rgba(0,0,0,0.38)" }
              }
            >
              {t === "revenue" ? "Ingresos" : "Entradas"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            interval={6}
          />
          <YAxis
            tickFormatter={isRevenue ? formatAmt : undefined}
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={isRevenue ? 50 : 32}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((v: number) => [isRevenue ? formatAmt(v) : v, isRevenue ? "Ingresos" : "Entradas"]) as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            labelFormatter={shortDate as any}
          />
          <Area
            type="monotone"
            dataKey={isRevenue ? "revenue" : "tickets"}
            stroke="#0a0a0a"
            strokeWidth={2}
            fill="url(#chartGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-[#0a0a0a]/18 text-[10px] mt-3">Actualizado {now}</p>
    </div>
  );
}
