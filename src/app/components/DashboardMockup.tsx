"use client";

import { useEffect, useRef, useState } from "react";

const BARS = [
  { h: 32, month: "Oct" },
  { h: 48, month: "Nov" },
  { h: 38, month: "Dic" },
  { h: 62, month: "Ene" },
  { h: 50, month: "Feb" },
  { h: 74, month: "Mar" },
  { h: 88, month: "Abr", active: true },
];

const EVENTS_DATA = [
  { name: "Red Fest", rev: "₡1.34M", tickets: 1240, trend: "+18%" },
  { name: "Neon Nights CR", rev: "₡890K", tickets: 820, trend: "+12%" },
  { name: "Jazz & Chill", rev: "₡560K", tickets: 480, trend: "+7%" },
];

const KPIS = [
  { label: "Ingresos totales", val: "₡4.6M", up: "+18% vs anterior" },
  { label: "Tickets vendidos", val: "4,820", up: "+12% vs anterior" },
  { label: "Ticket promedio", val: "₡28.5K", up: "+6% vs anterior" },
];

export default function DashboardMockup({ dark = true }: { dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);
  const bg = dark ? "#161616" : "#f5f5f5";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textPrimary = dark ? "#fff" : "#0a0a0a";
  const textMuted = dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const cardBg = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const cardBorder = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const barColor = dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)";
  const barActive = dark ? "rgba(255,255,255,0.8)" : "#0a0a0a";

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setAnimated(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid ${border}` }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(239,68,68,0.6)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(245,158,11,0.6)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(16,185,129,0.6)" }} />
        </div>
        <p style={{ color: textMuted, fontSize: 10 }} className="font-mono">vybztickets.com/organizador</p>
        <div className="w-12" />
      </div>

      <div className="p-5 space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-2.5">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-xl p-3.5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <p style={{ color: textMuted, fontSize: 9 }} className="uppercase tracking-wider mb-2">{k.label}</p>
              <p
                className="font-[family-name:var(--font-bebas)] leading-none mb-1"
                style={{ color: textPrimary, fontSize: 22 }}
              >
                {k.val}
              </p>
              <p style={{ color: "#10b981", fontSize: 9 }} className="font-semibold">{k.up}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <div className="flex items-center justify-between mb-4">
            <p style={{ color: textPrimary, fontSize: 11 }} className="font-semibold">Ingresos por mes</p>
            <div className="flex gap-1">
              {["3M", "6M", "1A"].map((label, i) => (
                <button
                  key={label}
                  className="px-2 py-0.5 rounded text-[9px] font-semibold"
                  style={{
                    background: i === 1 ? (dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)") : "transparent",
                    color: i === 1 ? textPrimary : textMuted,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2" style={{ height: 72 }}>
            {BARS.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: animated ? `${b.h}%` : "4%",
                    transition: `height 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 70}ms`,
                    background: b.active ? barActive : barColor,
                  }}
                />
                <p style={{ color: textMuted, fontSize: 7 }}>{b.month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top events */}
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
          <div className="px-4 py-2.5 flex justify-between" style={{ background: cardBg, borderBottom: `1px solid ${cardBorder}` }}>
            <p style={{ color: textMuted, fontSize: 9 }} className="uppercase tracking-wider">Top eventos</p>
            <p style={{ color: textMuted, fontSize: 9 }}>Este período</p>
          </div>
          {EVENTS_DATA.map((ev, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: i < EVENTS_DATA.length - 1 ? `1px solid ${cardBorder}` : "none" }}
            >
              <div>
                <p style={{ color: textPrimary, fontSize: 11 }} className="font-semibold">{ev.name}</p>
                <p style={{ color: textMuted, fontSize: 9 }}>{ev.tickets} tickets</p>
              </div>
              <div className="text-right">
                <p style={{ color: textPrimary, fontSize: 11 }} className="font-semibold">{ev.rev}</p>
                <p style={{ color: "#10b981", fontSize: 9 }} className="font-semibold">{ev.trend}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
