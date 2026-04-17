"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={
        scrolled
          ? {
              background: "rgba(8,8,8,0.75)",
              backdropFilter: "blur(24px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }
          : { background: "transparent" }
      }
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="gradient-text font-[family-name:var(--font-bebas)] text-[30px] tracking-widest hover:opacity-80 transition-opacity">
          VYBZ
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Eventos", href: "/eventos" },
            { label: "Reventa", href: "/reventa" },
            { label: "Para organizadores", href: "/organizadores" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors text-sm font-medium tracking-wide"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button className="btn-glow text-sm px-5 py-2 text-white hidden md:block">
            Get tickets
          </button>
          <button
            className="md:hidden text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
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
          className="md:hidden py-5 px-6 flex flex-col gap-4 border-t border-white/5"
          style={{ background: "rgba(8,8,8,0.95)", backdropFilter: "blur(24px)" }}
        >
          {["Eventos", "Reventa", "Para organizadores"].map((label) => (
            <Link
              key={label}
              href={`/${label.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-[rgba(255,255,255,0.5)] hover:text-white transition-colors text-sm font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <button className="btn-glow text-sm px-5 py-2.5 text-white w-full mt-1">
            Get tickets
          </button>
        </div>
      )}
    </nav>
  );
}
