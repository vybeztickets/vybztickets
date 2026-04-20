"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    label: "Mis ventas",
    href: "/revendedor",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: "Vender entrada",
    href: "/revendedor/nueva-venta",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    ),
  },
  {
    label: "Historial",
    href: "/revendedor/historial",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    label: "Verificación",
    href: "/revendedor/verificacion",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
];

export default function RevendedorSidebar({
  userName,
  userEmail,
  avatarUrl: _avatarUrl,
}: {
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-full flex flex-col z-40 w-60"
      style={{ background: "#ffffff", borderRight: "1px solid rgba(0,0,0,0.07)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <Link
          href="/"
          className="font-[family-name:var(--font-bebas)] text-2xl tracking-widest text-[#0a0a0a] hover:opacity-50 transition-opacity"
        >
          VYBZ
        </Link>
        <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#0a0a0a]/25 mt-0.5">Revendedor</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            item.href === "/revendedor"
              ? pathname === "/revendedor"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? "#0a0a0a" : "transparent",
                color: active ? "#ffffff" : "rgba(0,0,0,0.45)",
              }}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 flex items-center gap-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold bg-[#0a0a0a] text-white">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#0a0a0a] text-xs font-medium truncate">{userName}</p>
          <p className="text-[#0a0a0a]/30 text-[10px] truncate">{userEmail}</p>
        </div>
      </div>
    </aside>
  );
}
