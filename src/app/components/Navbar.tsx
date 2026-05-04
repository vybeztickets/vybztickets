"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StarButton } from "./ui/star-button";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        setIsLoggedIn(!!data.user);
        setAuthChecked(true);
      });
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
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {authChecked && (
            <>
              {isLoggedIn ? (
                <Link
                  href="/transfer"
                  className="hidden md:inline-flex items-center px-5 py-2.5 text-sm font-medium text-[#0a0a0a] border border-[#0a0a0a]/20 rounded-full hover:border-[#0a0a0a]/60 transition-colors"
                >
                  My account
                </Link>
              ) : (
                <Link
                  href="/auth/login?redirectTo=/transfer"
                  className="hidden md:inline-flex items-center px-5 py-2.5 text-sm font-medium text-[#0a0a0a] border border-[#0a0a0a]/20 rounded-full hover:border-[#0a0a0a]/60 transition-colors"
                >
                  Login
                </Link>
              )}
            </>
          )}

          <StarButton
            href="/organizador"
            dark
            className="hidden md:inline-flex py-2.5 px-5 text-sm"
          >
            Create event
          </StarButton>

          {/* Mobile menu button */}
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
                  <line x1="3" y1="11" x2="19" y2="11" strokeWidth="1.5" />
                  <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.5" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden py-5 px-6 flex flex-col gap-4 border-t"
          style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", borderColor: "rgba(0,0,0,0.06)" }}
        >
          {[
            { label: isLoggedIn ? "My account" : "Login", href: isLoggedIn ? "/transfer" : "/auth/login?redirectTo=/transfer" },
            { label: "Create event", href: "/organizador" },
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
        </div>
      )}
    </nav>
  );
}
