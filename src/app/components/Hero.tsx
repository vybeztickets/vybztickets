"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StarButton } from "./ui/star-button";
import { HeroGlobe } from "./ui/cobe-globe";

export default function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-4 items-center min-h-screen py-28">
        {/* ── LEFT: Copy ── */}
        <div className="flex flex-col order-2 lg:order-1">
          {/* Badge */}
          <div
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(10px)",
              transition: "opacity .7s ease .1s,transform .7s ease .1s",
            }}
            className="inline-flex items-center gap-2 self-start mb-8"
          >
            <span
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "rgba(0,0,0,0.4)" }}>
                Tiquetera de eventos
              </span>
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-[family-name:var(--font-bebas)] leading-[0.88] tracking-wide mb-6"
            style={{
              color: "#0a0a0a",
              fontSize: "clamp(62px,8vw,116px)",
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(28px)",
              transition: "opacity .95s cubic-bezier(0.22,1,0.36,1) .2s,transform .95s cubic-bezier(0.22,1,0.36,1) .2s",
            }}
          >
            Vende más.<br />
            <span style={{ color: "rgba(0,0,0,0.13)" }}>Controla</span><br />
            <span style={{ color: "rgba(0,0,0,0.13)" }}>todo.</span>
          </h1>

          {/* Sub */}
          <p
            className="text-base md:text-lg leading-relaxed mb-10 max-w-[420px]"
            style={{
              color: "rgba(0,0,0,0.42)",
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(16px)",
              transition: "opacity .8s ease .38s,transform .8s ease .38s",
            }}
          >
            La plataforma completa para organizadores en Costa Rica y Latam. Venta online, POS, emails masivos, datos en tiempo real y reventa segura — todo en uno.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap gap-3 mb-12"
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(12px)",
              transition: "opacity .8s ease .52s,transform .8s ease .52s",
            }}
          >
            <StarButton
              href="/auth/login?redirectTo=/organizador/eventos/nuevo"
              dark
            >
              Crear evento gratis
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M2 10L10 2M10 2H4M10 2V8"/>
              </svg>
            </StarButton>
            <Link
              href="/organizadores"
              className="flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full transition-colors"
              style={{ border: "1px solid rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.5)" }}
            >
              Ver demo
            </Link>
          </div>

          {/* Trust strip */}
          <div
            className="flex items-center gap-5 flex-wrap"
            style={{
              opacity: ready ? 0.6 : 0,
              transition: "opacity .8s ease .68s",
            }}
          >
            {["Sin cuota mensual", "ONVO Pay · CRC & USD"].map((text, i) => (
              <div key={text} className="flex items-center gap-5">
                {i > 0 && <div style={{ width: 1, height: 11, background: "rgba(0,0,0,0.12)" }} />}
                <div className="flex items-center gap-1.5">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-[11px] font-medium" style={{ color: "rgba(0,0,0,0.35)" }}>{text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Interactive globe ── */}
        <div
          className="flex flex-col items-center justify-center order-1 lg:order-2"
          style={{
            opacity: ready ? 1 : 0,
            transition: "opacity 1.6s ease .4s",
          }}
        >
          <div className="relative w-full max-w-[540px]">
            <HeroGlobe className="w-full" />
            <p
              className="text-center mt-5 text-[11px] font-semibold tracking-[0.22em] uppercase"
              style={{ color: "rgba(0,0,0,0.22)" }}
            >
              Eventos por todo el mundo
            </p>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
        style={{ opacity: 0.15 }}
      >
        <div
          className="w-px h-14"
          style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.6),transparent)" }}
        />
      </div>
    </section>
  );
}
