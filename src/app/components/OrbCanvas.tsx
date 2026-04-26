"use client";

import { useEffect, useRef } from "react";

export default function OrbCanvas({ className = "", light = false }: { className?: string; light?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);

    function resize() {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function onMouseMove(e: MouseEvent) {
      const r = canvas.getBoundingClientRect();
      mouse.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      };
    }
    window.addEventListener("mousemove", onMouseMove);

    let t = 0;

    function frame() {
      t += 0.011;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const orbR = Math.min(W, H) * 0.25;
      const orbBaseY = H * 0.50;
      const bob = Math.sin(t * 0.85) * orbR * 0.042;
      const orbCY = orbBaseY - orbR * 0.12 + bob;
      const floorCY = orbBaseY + orbR * 0.32;

      // Mouse influence (how close is mouse to orb center)
      const mx = mouse.current.x * W;
      const my = mouse.current.y * H;
      const distToOrb = Math.hypot(mx - cx, my - orbCY);
      const influence = Math.max(0, 1 - distToOrb / (W * 0.5));

      // ── Wave rings ──
      const MAX_R = Math.min(W, H) * 0.72;
      const mOffX = (mouse.current.x - 0.5) * orbR * 0.18;

      for (let i = 0; i < 10; i++) {
        const phase = i / 10;
        const rawPct = ((t * 0.16 + phase) % 1);
        const rScale = 0.15 + rawPct * 0.85;
        const rx = MAX_R * rScale;
        const ry = rx * 0.29;
        if (rx < orbR * 0.55) continue;

        const opacity = Math.pow(1 - rawPct, 2) * 0.45;
        if (opacity < 0.008) continue;

        const amp = 0.022 + influence * 0.055 * (1 - rawPct);
        const freq = 5;

        ctx.beginPath();
        const N = 160;
        for (let j = 0; j <= N; j++) {
          const theta = (j / N) * Math.PI * 2;
          const w = 1 + amp * Math.sin(freq * theta + t * 2.8 + i * 0.75);
          const x = cx + mOffX * (1 - rawPct) + rx * Math.cos(theta) * w;
          const y = floorCY + ry * Math.sin(theta) * w;
          j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = light ? `rgba(20,20,20,${opacity * 0.6})` : `rgba(190,190,190,${opacity})`;
        ctx.lineWidth = 0.8 / dpr;
        ctx.stroke();
      }

      // ── Floor shadow ──
      const sh = ctx.createRadialGradient(cx, floorCY, 0, cx, floorCY, orbR * 1.15);
      sh.addColorStop(0, "rgba(0,0,0,0.35)");
      sh.addColorStop(0.5, "rgba(0,0,0,0.15)");
      sh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.ellipse(cx, floorCY, orbR * 1.15, orbR * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = sh;
      ctx.fill();

      // ── Light direction follows mouse ──
      const tiltX = (mouse.current.x - 0.5) * 0.38;
      const tiltY = (mouse.current.y - 0.5) * 0.28;
      const lx = cx + orbR * (-0.3 - tiltX);
      const ly = orbCY + orbR * (-0.32 + tiltY);

      // ── Base sphere ──
      const baseG = ctx.createRadialGradient(lx, ly, 0, cx, orbCY, orbR);
      baseG.addColorStop(0, "#dfdfdf");
      baseG.addColorStop(0.22, "#c2c2c2");
      baseG.addColorStop(0.5, "#969696");
      baseG.addColorStop(0.78, "#6b6b6b");
      baseG.addColorStop(1, "#464646");
      ctx.beginPath();
      ctx.arc(cx, orbCY, orbR, 0, Math.PI * 2);
      ctx.fillStyle = baseG;
      ctx.fill();

      // ── Primary specular ──
      const s1 = ctx.createRadialGradient(lx, ly, 0, lx, ly, orbR * 0.58);
      s1.addColorStop(0, "rgba(255,255,255,0.95)");
      s1.addColorStop(0.18, "rgba(255,255,255,0.55)");
      s1.addColorStop(0.45, "rgba(255,255,255,0.14)");
      s1.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(cx, orbCY, orbR, 0, Math.PI * 2);
      ctx.fillStyle = s1;
      ctx.fill();

      // ── Secondary specular (fill light bottom-right) ──
      const s2x = cx + orbR * (0.28 + tiltX * 0.5);
      const s2y = orbCY + orbR * (0.22 + tiltY * 0.5);
      const s2 = ctx.createRadialGradient(s2x, s2y, 0, s2x, s2y, orbR * 0.38);
      s2.addColorStop(0, "rgba(255,255,255,0.18)");
      s2.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(cx, orbCY, orbR, 0, Math.PI * 2);
      ctx.fillStyle = s2;
      ctx.fill();

      // ── Rim light ──
      const rim = ctx.createRadialGradient(cx, orbCY, orbR * 0.8, cx, orbCY, orbR);
      rim.addColorStop(0, "rgba(255,255,255,0)");
      rim.addColorStop(0.85, "rgba(255,255,255,0)");
      rim.addColorStop(0.93, "rgba(255,255,255,0.12)");
      rim.addColorStop(1, "rgba(255,255,255,0.04)");
      ctx.beginPath();
      ctx.arc(cx, orbCY, orbR, 0, Math.PI * 2);
      ctx.fillStyle = rim;
      ctx.fill();

      // ── Atmospheric glow ──
      const glow = ctx.createRadialGradient(cx, orbCY, orbR * 0.88, cx, orbCY, orbR * 1.55);
      glow.addColorStop(0, "rgba(210,210,210,0.07)");
      glow.addColorStop(0.5, "rgba(180,180,180,0.03)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(cx, orbCY, orbR * 1.55, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      raf.current = requestAnimationFrame(frame);
    }

    frame();
    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
