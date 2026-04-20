import Link from "next/link";
import Reveal from "./Reveal";

const PILLARS = [
  {
    tag: "VENTA ONLINE",
    title: "Vende entradas en minutos",
    desc: "Publicá tu evento, configurá tipos de entrada con precios, aforos y fechas de venta, y empezá a cobrar al instante. QR digital en segundos.",
    href: "/organizadores",
    cta: "Crear evento",
    features: ["Múltiples tipos de entrada", "QR único por comprador", "Pago online seguro", "Venta por link o embed"],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
      </svg>
    ),
  },
  {
    tag: "PUNTO DE VENTA",
    title: "POS para el día del evento",
    desc: "Scanner de QR en tiempo real desde cualquier dispositivo. Control de ingreso, cobros en puerta, inventario en vivo y cierre de caja incluidos.",
    href: "/organizadores",
    cta: "Ver POS",
    features: ["Scanner QR sin app", "Cobros en puerta", "Control de aforo en vivo", "Cierre de caja automático"],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/>
        <path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/>
      </svg>
    ),
  },
  {
    tag: "DATOS & MARKETING",
    title: "Conocé a tu audiencia",
    desc: "Accedé al listado completo de asistentes con emails, segmentá por tipo de entrada y enviá campañas masivas directo desde el dashboard.",
    href: "/organizadores",
    cta: "Ver marketing",
    features: ["Listado de asistentes exportable", "Emails masivos integrados", "Pixel de Facebook y GA", "Códigos de embajadores"],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    tag: "REVENTA C2C",
    title: "Mercado secundario seguro",
    desc: "Los compradores pueden revender sus entradas verificadas. El dinero queda en escrow hasta que ambas partes confirman. Sin fraudes.",
    href: "/reventa",
    cta: "Ver reventa",
    features: ["Escrow protegido", "QR invalidado al transferir", "Reembolso garantizado", "Comisión solo al vender"],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M17 2.1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <path d="M7 21.9l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
  },
];

const ONLINE_FEATURES = [
  { title: "Tipos de entrada", desc: "General, VIP, mesas numeradas, asientos. Con precio, aforo y fechas de venta independientes." },
  { title: "QR instantáneo", desc: "Cada comprador recibe su entrada digital al correo en segundos, lista para escanear en la puerta." },
  { title: "Códigos de descuento", desc: "Creá códigos para promotores, embajadores o listas de invitados con tracking de ventas en tiempo real." },
  { title: "Página del evento", desc: "Landing page automática con mapa, descripción, galería y botón de compra. Compartible al instante." },
  { title: "Mensaje pre y post compra", desc: "Enviá instrucciones o info adicional a tus compradores antes y después de la venta." },
  { title: "Venta por link o embed", desc: "Usá el link de tu evento o embedé el widget de compra en cualquier sitio web." },
];

const POS_FEATURES = [
  { title: "Scanner sin app", desc: "Escaneá QRs directamente desde el navegador del celular. Sin descargas, sin configuración." },
  { title: "Control de aforo", desc: "Ve en tiempo real cuántas personas ingresaron y cuántas quedan por ingresar por tipo de entrada." },
  { title: "Cobros en puerta", desc: "Vendé entradas en efectivo o tarjeta el día del evento. El sistema actualiza el inventario al instante." },
  { title: "Multi-staff", desc: "Asigná varios escáneres simultáneos. Cada acceso tiene su propio log con hora y operador." },
];

const MARKETING_FEATURES = [
  { title: "Base de datos de asistentes", desc: "Tenés acceso al listado completo: nombre, email, teléfono, tipo de entrada y fecha de compra." },
  { title: "Emails masivos", desc: "Enviá comunicaciones a todos tus compradores o segmentá por tipo de entrada directamente desde el panel." },
  { title: "Pixel de Facebook", desc: "Conectá tu píxel para hacer retargeting y medir conversiones en Facebook e Instagram." },
  { title: "Google Analytics", desc: "Integrá GA4 o GTM a tu página de evento para rastrear el funnel completo de compra." },
  { title: "Estadísticas en tiempo real", desc: "Gráficos de ventas por día, por tipo de entrada y por código de descuento. Todo en tiempo real." },
  { title: "Embajadores con tracking", desc: "Cada código tiene su reporte: cuántos usaron, cuánto generaron y a quién asignar comisión." },
];

export default function PlatformSection() {
  return (
    <>
      {/* ── All-in-one intro ── */}
      <section className="py-28 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40">✦ PLATAFORMA COMPLETA</span>
            </div>
            <h2
              className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-[0.9] tracking-wide mb-5"
              style={{ fontSize: "clamp(44px,6vw,80px)" }}
            >
              No es solo venta de entradas.<br />
              <span style={{ color: "rgba(0,0,0,0.18)" }}>Es el sistema completo.</span>
            </h2>
            <p className="text-[#0a0a0a]/45 text-base max-w-lg mx-auto leading-relaxed">
              Desde la venta online hasta el ingreso el día del evento. Datos de asistentes, emails masivos, POS y reventa segura, todo en un solo lugar.
            </p>
          </Reveal>

          {/* 4-pillar grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PILLARS.map((p, i) => (
              <Reveal key={p.tag} delay={i * 80} direction="up">
                <div
                  className="rounded-2xl p-6 flex flex-col h-full"
                  style={{ background: "#f7f7f7", border: "1px solid rgba(0,0,0,0.05)" }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-[#0a0a0a]"
                    style={{ background: "rgba(0,0,0,0.06)" }}
                  >
                    {p.icon}
                  </div>
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#0a0a0a]/30 mb-2">{p.tag}</p>
                  <h3 className="text-[#0a0a0a] font-semibold text-base leading-snug mb-3">{p.title}</h3>
                  <p className="text-[#0a0a0a]/40 text-sm leading-relaxed flex-1 mb-5">{p.desc}</p>
                  <ul className="space-y-1.5 mb-5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-[#0a0a0a]/50">
                        <span className="w-1 h-1 rounded-full bg-[#0a0a0a]/25 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.href}
                    className="text-xs font-semibold text-[#0a0a0a]/50 hover:text-[#0a0a0a] transition-colors flex items-center gap-1.5 mt-auto"
                  >
                    {p.cta}
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 10L10 2M10 2H4M10 2V8"/>
                    </svg>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Venta online deep-dive ── */}
      <section className="py-28 px-6" style={{ background: "#f7f7f7" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-4">✦ VENTA ONLINE</p>
              <h2
                className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-[0.92] tracking-wide mb-6"
                style={{ fontSize: "clamp(40px,5vw,68px)" }}
              >
                De cero a ventas<br />
                <span style={{ color: "rgba(0,0,0,0.18)" }}>en 5 minutos.</span>
              </h2>
              <p className="text-[#0a0a0a]/45 text-base leading-relaxed mb-8 max-w-md">
                Creá tu evento, configurá tipos de entrada con precios y aforos, y empezá a cobrar. Tus compradores reciben su QR digital al instante.
              </p>
              <Link
                href="/auth/login?redirectTo=/organizador/eventos/nuevo"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
              >
                Crear evento gratis
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 10L10 2M10 2H4M10 2V8"/>
                </svg>
              </Link>
            </Reveal>

            <Reveal delay={120}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ONLINE_FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="rounded-xl p-5"
                    style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
                  >
                    <p className="text-[#0a0a0a] font-semibold text-sm mb-1.5">{f.title}</p>
                    <p className="text-[#0a0a0a]/40 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── POS deep-dive ── */}
      <section className="py-28 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal delay={120} className="order-2 lg:order-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {POS_FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="rounded-xl p-5"
                    style={{ background: "#f7f7f7", border: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <p className="text-[#0a0a0a] font-semibold text-sm mb-1.5">{f.title}</p>
                    <p className="text-[#0a0a0a]/40 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal className="order-1 lg:order-2">
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-4">✦ PUNTO DE VENTA</p>
              <h2
                className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-[0.92] tracking-wide mb-6"
                style={{ fontSize: "clamp(40px,5vw,68px)" }}
              >
                El día del evento,<br />
                <span style={{ color: "rgba(0,0,0,0.18)" }}>todo bajo control.</span>
              </h2>
              <p className="text-[#0a0a0a]/45 text-base leading-relaxed mb-6 max-w-md">
                Escaneá QRs en tiempo real desde el navegador, controlá el aforo, vendé en puerta y cerrá caja sin fricción. Sin apps que instalar.
              </p>
              <div
                className="flex items-center gap-4 p-4 rounded-xl mb-8"
                style={{ background: "#0a0a0a" }}
              >
                {[
                  { n: "0s", label: "Setup" },
                  { n: "∞", label: "Escáneres simultáneos" },
                  { n: "100%", label: "Sin app" },
                ].map(({ n, label }) => (
                  <div key={label} className="text-center flex-1">
                    <p className="font-[family-name:var(--font-bebas)] text-white text-2xl leading-none">{n}</p>
                    <p className="text-white/30 text-[9px] uppercase tracking-wider mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/organizadores"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a0a0a]/50 hover:text-[#0a0a0a] transition-colors"
              >
                Ver todas las funciones
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 10L10 2M10 2H4M10 2V8"/>
                </svg>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Data & Marketing deep-dive ── */}
      <section className="py-28 px-6" style={{ background: "#0a0a0a" }}>
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/25 mb-4">✦ DATOS & MARKETING</p>
            <h2
              className="font-[family-name:var(--font-bebas)] text-white leading-[0.92] tracking-wide mb-5"
              style={{ fontSize: "clamp(40px,5vw,72px)" }}
            >
              Tus asistentes son tus datos.<br />
              <span style={{ color: "rgba(255,255,255,0.2)" }}>Usálos.</span>
            </h2>
            <p className="text-white/35 text-base max-w-lg mx-auto leading-relaxed">
              Cada compra genera un registro: nombre, email, teléfono y tipo de entrada. Segmentá, enviá emails masivos y medí el impacto de cada campaña.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
            {MARKETING_FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div
                  className="rounded-xl p-6"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-white font-semibold text-sm mb-2">{f.title}</p>
                  <p className="text-white/30 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div
              className="rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div>
                <p className="text-white font-semibold mb-1">¿Listo para llenar tu próximo evento?</p>
                <p className="text-white/30 text-sm">Creá tu cuenta gratis y accedé a todas las herramientas desde el día uno.</p>
              </div>
              <Link
                href="/auth/login?redirectTo=/organizador/eventos/nuevo"
                className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[#0a0a0a] hover:bg-white/90 transition-colors"
              >
                Empezar gratis
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 10L10 2M10 2H4M10 2V8"/>
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
