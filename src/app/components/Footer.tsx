import Link from "next/link";

const LINKS = {
  Eventos: ["Conciertos", "Festivales", "Teatro", "Deportes", "Conferencias", "Otros"],
  Reventa: ["Comprar tickets", "Vender tickets", "Cómo funciona", "Escrow", "Garantías"],
  Organizadores: ["Crear evento", "Panel de control", "Integraciones", "Precios", "Soporte"],
  Empresa: ["Sobre nosotros", "Blog", "Prensa", "Careers", "Contacto"],
};

export default function Footer() {
  return (
    <footer className="bg-[#0d0d0d] border-t border-[#2a2a2a] mt-0">
      {/* Top CTA strip */}
      <div className="border-b border-[#2a2a2a] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-[family-name:var(--font-bebas)] text-4xl md:text-5xl text-white tracking-wide mb-1">
              ¿Organizas un evento?
            </h3>
            <p className="text-[#555] text-sm">
              Vende entradas con la plataforma más confiable de Costa Rica.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/organizadores"
              className="bg-white text-[#0a0a0a] font-semibold text-sm px-6 py-3 hover:bg-white/90 transition-colors"
            >
              Comenzar gratis
            </Link>
            <Link
              href="/contacto"
              className="border border-[#2a2a2a] text-[#888] text-sm px-6 py-3 hover:border-[#3a3a3a] hover:text-white transition-all"
            >
              Hablar con ventas
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="font-[family-name:var(--font-bebas)] text-5xl text-white tracking-widest hover:opacity-80 transition-opacity block mb-3"
            >
              VYBZ
            </Link>
            <p className="text-[#555] text-xs leading-relaxed mb-4">
              Costa Rica's premier ticket platform. Buy, sell and discover events across Latin America.
            </p>
            <div className="flex gap-3">
              {["ig", "tw", "fb", "yt"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-8 h-8 border border-[#2a2a2a] flex items-center justify-center text-[#555] hover:border-[#3a3a3a] hover:text-[#888] transition-all text-[10px] uppercase font-bold"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([col, items]) => (
            <div key={col}>
              <p className="text-white text-xs font-semibold tracking-[0.15em] uppercase mb-4">
                {col}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-[#555] text-sm hover:text-[#888] transition-colors"
                    >
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
      <div className="border-t border-[#1a1a1a] px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[#444] text-xs">
            © {new Date().getFullYear()} Vybz Tickets. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            {["Términos", "Privacidad", "Cookies"].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-[#444] text-xs hover:text-[#666] transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
