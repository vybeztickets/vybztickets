"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isReventa = pathname.startsWith("/reventa");
  const isEventos = pathname.startsWith("/eventos");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={
        scrolled
          ? { background: "rgba(255,255,255,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }
          : { background: "transparent" }
      }
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="font-[family-name:var(--font-bebas)] text-[28px] tracking-widest text-[#0a0a0a] hover:opacity-60 transition-opacity">
          VYBZ
        </Link>

        {/* Nav links — absolutely centered */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {[
            { label: "Eventos", href: "/eventos" },
            { label: "Reventa", href: "/reventa" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-[#0a0a0a]/50 hover:text-[#0a0a0a] transition-colors text-sm font-medium tracking-wide"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {isReventa ? (
            <Link
              href="/auth/login?redirectTo=/revendedor/nueva-venta"
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold bg-[#0a0a0a] text-white px-5 py-2.5 rounded-full hover:bg-[#222] transition-colors"
            >
              Vender entrada
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 10L10 2M10 2H4M10 2V8" />
              </svg>
            </Link>
          ) : isEventos ? (
            <Link
              href="/auth/login?redirectTo=/organizador/eventos/nuevo"
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold bg-[#0a0a0a] text-white px-5 py-2.5 rounded-full hover:bg-[#222] transition-colors"
            >
              Crear evento
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 10L10 2M10 2H4M10 2V8" />
              </svg>
            </Link>
          ) : (
            <>
              <Link
                href="/organizadores"
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-[#0a0a0a]/60 hover:text-[#0a0a0a] px-4 py-2.5 rounded-full transition-colors"
                style={{ border: "1px solid rgba(0,0,0,0.15)" }}
              >
                Crear evento
              </Link>
              <Link
                href="/eventos"
                className="hidden md:flex items-center gap-1.5 text-sm font-semibold bg-[#0a0a0a] text-white px-5 py-2.5 rounded-full hover:bg-[#222] transition-colors"
              >
                Ver eventos
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 10L10 2M10 2H4M10 2V8" />
                </svg>
              </Link>
            </>
          )}
          <button
            className="md:hidden text-[#0a0a0a]/50 hover:text-[#0a0a0a] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {menuOpen ? (
                <>
                  <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="1.5" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.5" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden py-5 px-6 flex flex-col gap-4 border-t"
          style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", borderColor: "rgba(0,0,0,0.06)" }}
        >
          {[
            { label: "Eventos", href: "/eventos" },
            { label: "Reventa", href: "/reventa" },
            { label: "Crear evento", href: "/organizadores" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-[#0a0a0a]/60 hover:text-[#0a0a0a] transition-colors text-sm font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/eventos"
            className="bg-[#0a0a0a] text-white text-sm font-semibold px-5 py-3 rounded-full text-center mt-1"
            onClick={() => setMenuOpen(false)}
          >
            Ver eventos →
          </Link>
        </div>
      )}
    </nav>
  );
}
