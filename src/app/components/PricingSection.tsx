"use client";

import Link from "next/link";

const INCLUDES = [
  "Eventos ilimitados",
  "Tipos de entrada ilimitados",
  "Dashboard en tiempo real",
  "Scanner QR sin app",
  "Emails masivos a asistentes",
  "Códigos de embajadores",
  "Reventa C2C segura",
  "POS para el día del evento",
  "Página de evento incluida",
  "Soporte prioritario",
  "Pago en CRC y USD",
  "Sin contrato de permanencia",
];

export default function PricingSection() {
  return (
    <section style={{ background: "#fff" }} className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left — headline */}
          <div className="lg:sticky lg:top-28">
            <p
              className="inline-flex items-center gap-2 mb-6 text-[9px] font-bold tracking-[0.22em] uppercase"
              style={{ color: "rgba(0,0,0,0.25)" }}
            >
              <span className="w-4 h-px" style={{ background: "rgba(0,0,0,0.2)" }} />
              PRECIOS
            </p>
            <h2
              className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-[0.88] tracking-wide mb-6"
              style={{ fontSize: "clamp(52px,7vw,100px)" }}
            >
              Sin mensualidad.<br />
              <span style={{ color: "rgba(0,0,0,0.18)" }}>Solo un</span><br />
              <span style={{ color: "rgba(0,0,0,0.18)" }}>service fee.</span>
            </h2>
            <p className="text-[#0a0a0a]/45 text-base leading-relaxed mb-8 max-w-md">
              Sin cuota fija. Sin letra chica. Pagás solo cuando vendés — el service fee lo cubre el comprador sobre el precio del ticket. Vos te quedás con exactamente lo que pusiste.
            </p>

            {/* How it works card */}
            <div
              className="rounded-2xl p-6 mb-8"
              style={{ background: "#f7f7f7", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <p className="text-[#0a0a0a]/40 text-[9px] uppercase tracking-widest mb-5">Cómo funciona</p>
              <div className="space-y-4">
                {[
                  { step: "01", text: "Vos definís el precio de tu ticket." },
                  { step: "02", text: "El comprador paga ese precio más el service fee de la plataforma." },
                  { step: "03", text: "Vos recibís el 100% del precio que pusiste." },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-4">
                    <span
                      className="font-[family-name:var(--font-bebas)] text-lg leading-none shrink-0 mt-0.5"
                      style={{ color: "rgba(0,0,0,0.15)" }}
                    >
                      {step}
                    </span>
                    <p className="text-[#0a0a0a]/60 text-sm leading-snug">{text}</p>
                  </div>
                ))}
              </div>
              <div
                className="mt-6 pt-5 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
              >
                <p className="text-[#0a0a0a]/40 text-xs leading-snug max-w-[200px]">
                  ¿Querés saber el porcentaje exacto del service fee?
                </p>
                <Link
                  href="mailto:hola@vybztickets.com"
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                  style={{ background: "#0a0a0a", color: "#fff" }}
                >
                  Hablar con ventas
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M2 10L10 2M10 2H4M10 2V8"/>
                  </svg>
                </Link>
              </div>
            </div>

            <Link
              href="/auth/login?redirectTo=/organizador/eventos/nuevo"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-bold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
            >
              Empezar sin costo
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M2 10L10 2M10 2H4M10 2V8"/>
              </svg>
            </Link>
          </div>

          {/* Right — what's included */}
          <div>
            <p className="text-[#0a0a0a]/40 text-sm font-semibold mb-5">Todo incluido desde el día uno</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              {INCLUDES.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                  style={{ background: "#f7f7f7", border: "1px solid rgba(0,0,0,0.05)" }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "#0a0a0a" }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <span className="text-[#0a0a0a] text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
