"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 500, suffix: "+", label: "Eventos publicados", desc: "y contando" },
  { value: 50, prefix: "₡", suffix: "M+", label: "En ventas procesadas", desc: "en la plataforma" },
  { value: 15, suffix: "K+", label: "Asistentes gestionados", desc: "QRs escaneados" },
  { value: 15, suffix: "%", label: "Fee de plataforma", desc: "sin letra chica" },
];

function Counter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const dur = 1600;
          const start = performance.now();
          function tick(now: number) {
            const p = Math.min((now - start) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(ease * value));
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section style={{ background: "#111" }} className="py-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "3rem" }}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              className="lg:px-10 first:pl-0 last:pr-0"
              style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
            >
              <div
                className="font-[family-name:var(--font-bebas)] text-white leading-none mb-2"
                style={{ fontSize: "clamp(50px,6.5vw,84px)" }}
              >
                <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <p className="text-white/55 text-sm font-semibold mb-0.5">{s.label}</p>
              <p className="text-white/20 text-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
