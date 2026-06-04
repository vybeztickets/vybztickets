"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const BASE_NAV = [
  {
    label: "Dashboard",
    href: "/organizador",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Events",
    href: "/organizador/eventos",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "POS",
    href: "/organizador/pos",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" /><path d="M12 17v4" />
      </svg>
    ),
  },
  {
    label: "Inventory",
    href: "/organizador/inventario",
    inventoryOnly: true,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    label: "Marketing",
    href: "/organizador/marketing",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    label: "Finances",
    href: "/organizador/finanzas",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/organizador/configuracion",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const POS_NAV = [
  { label: "Products", path: "productos" },
  { label: "Sales", path: "ventas" },
];

const EVENT_NAV = [
  { label: "Stats", path: "estadisticas" },
  { label: "Edit", path: "editar" },
  { label: "Tickets", path: "entradas" },
  { label: "Tables", path: "mesas" },
  { label: "Promo codes", path: "codigos" },
  { label: "Orders", path: "pedidos" },
  { label: "Attendees", path: "asistentes" },
  { label: "Traffic source", path: "embajadores" },
  { label: "Feature", path: "destacar" },
];

function getEventId(pathname: string): string | null {
  const match = pathname.match(/\/organizador\/eventos\/([^\/]+)\/.+/);
  return match ? match[1] : null;
}

export default function OrgSidebar({
  userName,
  userEmail,
  avatarUrl,
  inventoryEnabled = false,
  lowStockCount = 0,
}: {
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  inventoryEnabled?: boolean;
  lowStockCount?: number;
}) {
  const pathname = usePathname();
  const eventId = getEventId(pathname);
  const [eventName, setEventName] = useState("");
  const isPosSection = pathname.startsWith("/organizador/pos");
  const MAIN_NAV = BASE_NAV.filter(item => !("inventoryOnly" in item) || inventoryEnabled);

  useEffect(() => {
    if (!eventId) { setEventName(""); return; }
    fetch(`/api/organizador/eventos/${eventId}`)
      .then(r => r.json())
      .then(d => { if (d.name) setEventName(d.name); })
      .catch(() => {});
  }, [eventId]);

  function isMainActive(href: string) {
    if (href === "/organizador") return pathname === "/organizador";
    if (href === "/organizador/eventos" && eventId) return false;
    if (href === "/organizador/pos") return isPosSection;
    return pathname.startsWith(href);
  }

  const base = eventId ? `/organizador/eventos/${eventId}` : "";

  return (
    <aside
      className="fixed top-0 left-0 h-full z-50 flex flex-col"
      style={{ width: 280, background: "#0a0a0a", borderRight: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/platform" className="font-[family-name:var(--font-bebas)] text-white tracking-widest text-xl block">
          VYBZ
        </Link>
        <p className="text-white/70 text-[10px] uppercase tracking-widest mt-0.5">Platform</p>
      </div>

      {/* Main nav — hidden when inside an event */}
      {!eventId && (
        <nav className="px-3 py-4 space-y-0.5">
          {MAIN_NAV.map(item => {
            const active = isMainActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all"
                style={{
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "#fff" : "#cccccc",
                }}
              >
                <span style={{ color: active ? "#fff" : "#aaaaaa" }}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.href === "/organizador/inventario" && lowStockCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#ef4444", color: "#fff", minWidth: 18, textAlign: "center" }}>
                    {lowStockCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      )}

      {/* POS sub-nav */}
      {isPosSection && !eventId && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 12px" }} />
          <div className="px-3 py-3 flex-1 overflow-y-auto">
            <p className="text-white/65 text-[9px] uppercase tracking-widest px-2 mb-2">Point of Sale</p>
            <div className="space-y-0.5">
              {POS_NAV.map(item => {
                const href = `/organizador/pos/${item.path}`;
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={item.path}
                    href={href}
                    className="w-full flex items-center px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all"
                    style={{
                      background: active ? "rgba(255,255,255,0.1)" : "transparent",
                      color: active ? "#fff" : "#cccccc",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Event sub-nav */}
      {eventId && (
        <>
          <div className="px-3 pt-3 pb-1">
            <Link
              href="/organizador/eventos"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all w-full"
              style={{ color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.06)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              All events
            </Link>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 12px" }} />
          <div className="px-3 pb-3 flex-1 overflow-y-auto">
            <p className="text-white/65 text-[9px] uppercase tracking-widest px-2 mb-2">Current event</p>
            <div className="px-3 py-2.5 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-white text-[13px] font-semibold truncate">{eventName || "…"}</p>
            </div>
            <div className="space-y-0.5">
              {EVENT_NAV.map(item => {
                const href = `${base}/${item.path}`;
                const active = pathname.startsWith(href);
                const isFeature = item.path === "destacar";
                return (
                  <Link
                    key={item.path}
                    href={href}
                    className="w-full flex items-center px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all"
                    style={{
                      background: active ? (isFeature ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.1)") : "transparent",
                      color: active
                        ? (isFeature ? "#f59e0b" : "#fff")
                        : (isFeature ? "#f59e0b" : "#cccccc"),
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!eventId && !isPosSection && <div className="flex-1" />}

      {/* Bottom */}
      <div className="px-3 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
        <Link
          href="/organizador/eventos/nuevo"
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold mb-2 transition-colors"
          style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New event
        </Link>
        {userEmail === "nicozecchinato1@gmail.com" && (
          <Link
            href="/admin"
            className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold mb-2 transition-colors"
            style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
          >
            Admin
          </Link>
        )}
        <Link
          href="/auth/login?redirectTo=/organizador"
          className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors"
          title="Switch account"
        >
          <div
            className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" width={28} height={28} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{userName}</p>
            <p className="text-[10px] truncate" style={{ color: "#aaaaaa" }}>{userEmail}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
