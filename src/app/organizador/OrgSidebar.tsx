"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const MAIN_NAV = [
  { label: "Dashboard", href: "/organizador" },
  { label: "Events", href: "/organizador/eventos" },
  { label: "Marketing", href: "/organizador/marketing" },
  { label: "Finances", href: "/organizador/finanzas" },
  { label: "Settings", href: "/organizador/configuracion" },
];

export default function OrgSidebar({
  userName,
  userEmail,
  avatarUrl,
}: {
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();

  function isMain(href: string) {
    if (href === "/organizador") return pathname === "/organizador";
    return pathname.startsWith(href);
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center px-6 gap-5"
      style={{ height: "56px", background: "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="font-[family-name:var(--font-bebas)] text-xl tracking-widest text-white shrink-0 hover:opacity-50 transition-opacity"
      >
        VYBZ
      </Link>

      <div className="w-px h-4 shrink-0" style={{ background: "rgba(255,255,255,0.12)" }} />

      {/* Main nav */}
      <nav className="flex items-center gap-0.5">
        {MAIN_NAV.map((item) => {
          const active = isMain(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                color: active ? "#fff" : "rgba(255,255,255,0.38)",
                background: active ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Right */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/organizador/eventos/nuevo"
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
          style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Event
        </Link>

        {userEmail === "nicozecchinato1@gmail.com" && (
          <Link
            href="/admin"
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
            style={{ background: "rgba(99,102,241,0.18)", color: "#818cf8" }}
          >
            Admin
          </Link>
        )}

        <Link
          href="/auth/login"
          className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: "rgba(255,255,255,0.12)" }}
          title="Switch account"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={28} height={28} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
