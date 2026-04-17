"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-[#2a2a2a]"
          : ""
      }`}
      style={
        scrolled
          ? { background: "rgba(10,10,10,0.8)", backdropFilter: "blur(20px)" }
          : { background: "transparent" }
      }
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-bebas)] text-[28px] text-white tracking-widest hover:opacity-80 transition-opacity"
        >
          VYBZ
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Eventos", "Reventa", "Para organizadores"].map((label) => (
            <Link
              key={label}
              href={`/${label.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-[#888] hover:text-white transition-colors text-sm font-medium tracking-wide"
            >
              {label}
            </Link>
          ))}
        </div>

        <button className="border border-white/30 text-white text-sm font-medium px-5 py-2 hover:bg-white/10 transition-all duration-200 tracking-wide">
          Get tickets
        </button>

        <button
          className="md:hidden text-[#888] hover:text-white transition-colors ml-4"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
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

      {menuOpen && (
        <div
          className="md:hidden border-t border-[#2a2a2a] py-4 px-6 flex flex-col gap-4"
          style={{ background: "rgba(10,10,10,0.95)", backdropFilter: "blur(20px)" }}
        >
          {["Eventos", "Reventa", "Para organizadores"].map((label) => (
            <Link
              key={label}
              href={`/${label.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-[#888] hover:text-white transition-colors text-sm font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
