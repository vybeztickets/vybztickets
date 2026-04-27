"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    label: "GENERAL",
    items: [
      {
        label: "Overview",
        href: "/admin",
        badge: "none",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
      },
      {
        label: "Usuarios",
        href: "/admin/usuarios",
        badge: "none",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
      {
        label: "Admins",
        href: "/admin/admins",
        badge: "none",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      },
    ],
  },
  {
    label: "ORGANIZADORES B2B",
    items: [
      {
        label: "Organizadores",
        href: "/admin/organizadores",
        badge: "pending",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
      },
      {
        label: "Eventos",
        href: "/admin/eventos",
        badge: "none",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      },
      {
        label: "Finanzas B2B",
        href: "/admin/finanzas",
        badge: "none",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
      },
      {
        label: "Banners",
        href: "/admin/banners",
        badge: "banners",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
      },
    ],
  },
  {
    label: "REVENTA C2C",
    items: [
      {
        label: "Finanzas C2C",
        href: "/admin/c2c/finanzas",
        badge: "none",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 2.1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
      },
      {
        label: "KYC — Verificaciones",
        href: "/admin/c2c/kyc",
        badge: "kyc",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      },
      {
        label: "Revendedores",
        href: "/admin/c2c/revendedores",
        badge: "none",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 2.1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
      },
      {
        label: "Listings activos",
        href: "/admin/c2c/listings",
        badge: "none",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>,
      },
    ],
  },
];

export default function AdminSidebar({ userName, userEmail, pendingCount, pendingKyc, pendingBanners }: { userName: string; userEmail: string; pendingCount?: number; pendingKyc?: number; pendingBanners?: number }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="fixed top-0 left-0 h-full flex flex-col z-40 w-60"
      style={{ background: "#0a0a0a", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" className="font-[family-name:var(--font-bebas)] text-2xl tracking-widest text-white hover:opacity-50 transition-opacity">
          VYBZ
        </Link>
        <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-white/20 mt-0.5">Admin Console</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto">
        {NAV.map((section) => (
          <div key={section.label}>
            <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-white/20 px-3 mb-2">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const badgeCount =
                  item.badge === "pending" ? (pendingCount ?? 0) :
                  item.badge === "kyc" ? (pendingKyc ?? 0) :
                  item.badge === "banners" ? (pendingBanners ?? 0) : 0;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: active ? "rgba(255,255,255,0.1)" : "transparent",
                      color: active ? "#ffffff" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center shrink-0">
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 flex items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold bg-white/10 text-white">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{userName}</p>
          <p className="text-white/25 text-[10px] truncate">{userEmail}</p>
        </div>
        <span className="text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md text-black bg-white/80">ADMIN</span>
      </div>
    </aside>
  );
}
