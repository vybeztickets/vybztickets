import Link from "next/link";

const LINKS = {
  Eventos: ["Conciertos", "Festivales", "Teatro", "Deportes", "Conferencias"],
  Reventa: ["Comprar tickets", "Vender tickets", "Cómo funciona", "Escrow"],
  Organizadores: ["Crear evento", "Panel de control", "Precios", "Soporte"],
  Empresa: ["Sobre nosotros", "Blog", "Prensa", "Contacto"],
};

export default function Footer({ variant = "default" }: { variant?: "default" | "reventa" }) {
  const cta = variant === "reventa"
    ? {
        title: "¿Tenés entradas que no vas a usar?",
        desc: "Vendelas de forma segura con escrow. El comprador paga al instante.",
        primary: { href: "/auth/login?redirectTo=/revendedor/nueva-venta", label: "Vender mis entradas →" },
        secondary: { href: "/reventa", label: "Ver mercado" },
      }
    : {
        title: "¿Organizas un evento?",
        desc: "Vende entradas con la plataforma más completa en eventos.",
        primary: { href: "/organizadores", label: "Comenzar gratis →" },
        secondary: { href: "/contacto", label: "Hablar con ventas" },
      };

  return (
    <footer style={{ background: "#0a0a0a" }}>
      {/* CTA strip */}
      <div className="py-16 px-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl text-white tracking-wide mb-1">
              {cta.title}
            </h3>
            <p className="text-white/25 text-sm">{cta.desc}</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href={cta.primary.href}
              className="bg-white text-[#0a0a0a] text-sm font-semibold px-6 py-3 rounded-full hover:bg-white/90 transition-colors inline-block"
            >
              {cta.primary.label}
            </Link>
            <Link
              href={cta.secondary.href}
              className="text-white/40 hover:text-white text-sm px-6 py-3 rounded-full transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {cta.secondary.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="font-[family-name:var(--font-bebas)] text-5xl tracking-widest text-white hover:text-white/60 transition-opacity block mb-3"
            >
              VYBZ
            </Link>
            <p className="text-white/20 text-xs leading-relaxed mb-5">
              Costa Rica&apos;s premier ticket platform. Buy, sell and discover events across Latin America.
            </p>
            <div className="flex gap-2.5">
              {["IG", "TW", "FB", "YT"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-8 h-8 flex items-center justify-center text-white/25 hover:text-white/60 transition-all text-[9px] font-bold rounded-lg"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([col, items]) => (
            <div key={col}>
              <p className="text-white/40 text-[10px] font-semibold tracking-[0.18em] uppercase mb-4">{col}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-white/20 hover:text-white/50 text-sm transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-6 py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/15 text-xs">
            © {new Date().getFullYear()} Vybz Tickets. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            {["Términos", "Privacidad", "Cookies"].map((item) => (
              <Link key={item} href="#" className="text-white/15 hover:text-white/35 text-xs transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
