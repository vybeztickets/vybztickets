"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

function RippleOrb() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Rings */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${200 + i * 120}px`,
            height: `${200 + i * 120}px`,
            border: "1px solid rgba(0,0,0,0.07)",
            animation: `ring-fade ${4 + i * 0.4}s ease-in-out ${i * 0.55}s infinite`,
          }}
        />
      ))}
      {/* 3D Sphere */}
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 36% 34%, #ffffff 0%, #e8e8e8 28%, #d0d0d0 52%, #b8b8b8 72%, #a8a8a8 100%)",
          boxShadow:
            "inset -24px -24px 70px rgba(0,0,0,0.16), inset 12px 12px 36px rgba(255,255,255,0.85), 0 30px 90px rgba(0,0,0,0.14), 0 8px 32px rgba(0,0,0,0.08)",
          animation: "orb-breathe 7s ease-in-out infinite",
          flexShrink: 0,
          position: "relative",
          zIndex: 1,
        }}
      />
    </div>
  );
}

function HeroInner() {
  const headRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      <RippleOrb />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl">
        {/* Heading */}
        <h1
          ref={headRef}
          className="font-[family-name:var(--font-bebas)] leading-[0.92] tracking-wide text-[#0a0a0a] mb-6"
          style={{
            fontSize: "clamp(72px, 10vw, 130px)",
            opacity: 0,
            transform: "translateY(24px)",
            transition: "opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          TU PRÓXIMO
          <br />
          <span style={{ color: "rgba(0,0,0,0.18)" }}>EVENTO</span>
          <br />
          EMPIEZA AQUÍ
        </h1>

        <p
          className="text-[#0a0a0a]/45 text-base md:text-lg leading-relaxed mb-10 max-w-md"
          style={{
            opacity: 0,
            transform: "translateY(16px)",
            animation: "none",
            animationDelay: "0.3s",
          }}
          ref={(el) => {
            if (!el) return;
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
              el.style.transition = "opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s";
            }, 80);
          }}
        >
          La plataforma premium de tickets en Costa Rica. Compra, vende y descubre los mejores eventos con pagos seguros.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-wrap items-center gap-3 justify-center"
          ref={(el) => {
            if (!el) return;
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
              el.style.transition = "opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.45s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.45s";
            }, 80);
          }}
          style={{ opacity: 0, transform: "translateY(12px)" }}
        >
          <Link
            href="/eventos"
            className="flex items-center gap-2 bg-[#0a0a0a] text-white text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-[#222] transition-all hover:gap-3"
          >
            Explorar eventos
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M2 10L10 2M10 2H4M10 2V8" />
            </svg>
          </Link>
          <Link
            href="/auth/login?redirectTo=/organizador/eventos/nuevo"
            className="flex items-center gap-2 text-[#0a0a0a]/70 text-sm font-semibold px-7 py-3.5 rounded-full hover:text-[#0a0a0a] transition-colors"
            style={{ border: "1.5px solid rgba(0,0,0,0.14)" }}
          >
            Crear evento
          </Link>
          <Link
            href="/reventa"
            className="flex items-center gap-2 text-[#0a0a0a]/70 text-sm font-semibold px-7 py-3.5 rounded-full hover:text-[#0a0a0a] transition-colors"
            style={{ border: "1.5px solid rgba(0,0,0,0.14)" }}
          >
            Reventa segura
          </Link>
        </div>

        {/* Stats */}
        <div
          className="flex items-center gap-8 mt-14"
          ref={(el) => {
            if (!el) return;
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transition = "opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.65s";
            }, 80);
          }}
          style={{ opacity: 0 }}
        >
          {["Venta online", "Punto de venta", "Reventa segura"].map((label, i) => (
            <div key={label} className="flex items-center gap-8">
              {i > 0 && <div className="w-px h-7" style={{ background: "rgba(0,0,0,0.1)" }} />}
              <p className="text-[#0a0a0a]/40 text-[11px] uppercase tracking-[0.18em] font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ opacity: 0.3 }}>
        <div
          className="w-px h-8"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)",
            animation: "fade-pulse 2s ease-in-out infinite",
          }}
        />
      </div>
    </section>
  );
}

export default HeroInner;
