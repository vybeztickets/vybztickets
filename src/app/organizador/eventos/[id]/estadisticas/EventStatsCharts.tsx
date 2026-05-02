"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Day = { date: string; revenue: number; tickets: number };

function formatPrice(n: number) { return "₡" + n.toLocaleString("en-US"); }

function shortDate(d: string) {
  if (typeof window === "undefined") return d;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function EventStatsCharts({ data }: { data: Day[] }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-4">Sales volume (last 28 days)</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ev-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: "rgba(0,0,0,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => "₡" + (v / 1000) + "k"} tick={{ fill: "rgba(0,0,0,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: "rgba(0,0,0,0.4)" }}
              formatter={(v) => [formatPrice(Number(v)), "Revenue"]}
              labelFormatter={(l) => shortDate(l)}
            />
            <Area type="monotone" dataKey="revenue" stroke="#0a0a0a" strokeWidth={2} fill="url(#ev-rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl p-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-4">Tickets sold (last 28 days)</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ev-tix" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#555" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#555" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: "rgba(0,0,0,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(0,0,0,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: "rgba(0,0,0,0.4)" }}
              formatter={(v) => [Number(v), "Tickets"]}
              labelFormatter={(l) => shortDate(l)}
            />
            <Area type="monotone" dataKey="tickets" stroke="#555" strokeWidth={2} fill="url(#ev-tix)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
