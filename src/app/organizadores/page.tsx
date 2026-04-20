import Link from "next/link";
import Navbar from "@/app/components/Navbar";

export const metadata = { title: "Para organizadores — Vybz Tickets" };

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: "Dashboard completo",
    desc: "Estadísticas en tiempo real, control de ventas, asistentes y scanner de QR desde un solo lugar.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    title: "Tipos de entrada flexibles",
    desc: "General, mesas VIP, asientos numerados. Con control de aforo, fechas de venta y códigos de descuento.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "Pagos seguros",
    desc: "Sistema escrow integrado. El dinero llega directo a tu cuenta con verificación de cada transacción.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    title: "Scanner de acceso",
    desc: "Escanea QRs en tiempo real desde cualquier dispositivo. Sin apps extra, directo desde el navegador.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "Gestión de embajadores",
    desc: "Crea códigos para tus revendedores y embajadores con tracking de ventas y comisiones.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "Marketing integrado",
    desc: "Campañas de email, pixel de Facebook, Google Analytics. Todo conectado a tu evento.",
  },
];

const STEPS = [
  { n: "01", title: "Crea tu cuenta", desc: "Regístrate gratis en menos de 2 minutos." },
  { n: "02", title: "Crea tu evento", desc: "Sube tu flyer, configura entradas y publica." },
  { n: "03", title: "Vende y gestiona", desc: "Recibe pagos y controla el acceso el día del evento." },
];

export default function OrganizadoresPage() {
  return (
    <div className="page-light min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase text-black/40"
            style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            ✦ PARA ORGANIZADORES
          </div>
          <h1
            className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-[0.92] tracking-wide mb-6"
            style={{ fontSize: "clamp(56px,8vw,100px)" }}
          >
            Vende tus entradas.<br />
            <span style={{ color: "rgba(0,0,0,0.18)" }}>Sin complicaciones.</span>
          </h1>
          <p className="text-[#0a0a0a]/45 text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Crea tu evento, configura tus entradas y empieza a vender en minutos.
            Dashboard completo, scanner de QR y pagos seguros incluidos.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/login?redirectTo=/organizador/eventos/nuevo"
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
            >
              Crear evento gratis
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 10L10 2M10 2H4M10 2V8" />
              </svg>
            </Link>
            <Link
              href="/organizador"
              className="px-7 py-3.5 rounded-full text-sm font-medium text-[#0a0a0a]/60 hover:text-[#0a0a0a] transition-colors"
              style={{ border: "1px solid rgba(0,0,0,0.15)" }}
            >
              Ver dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6" style={{ background: "#f7f7f7" }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[9px] font-bold tracking-[0.22em] uppercase text-black/30 mb-12">Cómo funciona</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col items-start">
                <span
                  className="font-[family-name:var(--font-bebas)] text-[56px] leading-none mb-3"
                  style={{ color: "rgba(0,0,0,0.07)" }}
                >
                  {s.n}
                </span>
                <h3 className="text-[#0a0a0a] font-semibold text-base mb-2">{s.title}</h3>
                <p className="text-[#0a0a0a]/40 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-tight tracking-wide"
              style={{ fontSize: "clamp(36px,4vw,56px)" }}
            >
              Todo lo que necesitas
            </h2>
            <p className="text-[#0a0a0a]/40 text-sm mt-3 max-w-md mx-auto">
              Desde la venta hasta el ingreso el día del evento.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-light p-7 flex flex-col">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 text-[#0a0a0a]"
                  style={{ background: "rgba(0,0,0,0.05)" }}
                >
                  {f.icon}
                </div>
                <h3 className="text-[#0a0a0a] font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-[#0a0a0a]/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-24 px-6">
        <div
          className="max-w-3xl mx-auto rounded-3xl px-10 py-16 text-center"
          style={{ background: "#0a0a0a" }}
        >
          <h2
            className="font-[family-name:var(--font-bebas)] text-white leading-tight tracking-wide mb-4"
            style={{ fontSize: "clamp(40px,5vw,64px)" }}
          >
            Empieza hoy, gratis.
          </h2>
          <p className="text-white/40 text-sm mb-8 max-w-sm mx-auto">
            Sin costos de setup. Sin contratos. Crea tu evento en minutos.
          </p>
          <Link
            href="/auth/login?redirectTo=/organizador/eventos/nuevo"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold bg-white text-[#0a0a0a] hover:bg-white/90 transition-colors"
          >
            Crear mi primer evento
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 10L10 2M10 2H4M10 2V8" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
