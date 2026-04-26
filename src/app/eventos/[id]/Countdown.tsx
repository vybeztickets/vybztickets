"use client";

import { useEffect, useState } from "react";

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function Countdown({ date, time }: { date: string; time: string | null }) {
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(`${date}T${time ?? "00:00:00"}`).getTime();

    function tick() {
      const now = Date.now();
      setDiff(Math.max(0, target - now));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [date, time]);

  if (diff === null) return null;

  if (diff === 0) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <p className="text-sm font-semibold text-green-600">Evento en curso</p>
      </div>
    );
  }

  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000)  / 60000);
  const secs = Math.floor((diff % 60000)    / 1000);

  const units = days > 0
    ? [{ v: days, l: "días" }, { v: hrs, l: "hrs" }, { v: mins, l: "min" }, { v: secs, l: "seg" }]
    : [{ v: hrs, l: "hrs" }, { v: mins, l: "min" }, { v: secs, l: "seg" }];

  return (
    <div className="flex items-center gap-2 mb-5">
      {units.map(({ v, l }, i) => (
        <div key={l} className="flex items-center gap-2">
          {i > 0 && <span className="text-[#0a0a0a]/20 text-sm font-light">·</span>}
          <div className="flex flex-col items-center">
            <span
              className="font-[family-name:var(--font-bebas)] text-2xl leading-none tracking-wide text-[#0a0a0a]"
            >
              {pad(v)}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#0a0a0a]/30 font-bold mt-0.5">{l}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
