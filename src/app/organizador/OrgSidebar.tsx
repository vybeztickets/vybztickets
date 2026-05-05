"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MAIN_NAV = [
  {
    label: "Dashboard",
    href: "/organizador",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Events",
    href: "/organizador/eventos",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "Marketing",
    href: "/organizador/marketing",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    label: "Finances",
    href: "/organizador/finanzas",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/organizador/configuracion",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const EVENT_NAV = [
  { label: "Stats", path: "estadisticas" },
  { label: "Edit", path: "editar" },
  { label: "Tickets", path: "entradas" },
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
}: {
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const eventId = getEventId(pathname);
  const [eventName, setEventName] = useState("");

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
    return pathname.startsWith(href);
  }

  const base = eventId ? `/organizador/eventos/${eventId}` : "";

  return (
    <aside
      className="fixed top-0 left-0 h-full z-50 flex flex-col"
      style={{ width: 220, background: "#0a0a0a", borderRight: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/platform" className="font-[family-name:var(--font-bebas)] text-white tracking-widest text-xl block">
          VYBZ
        </Link>
        <p className="text-white/30 text-[10px] uppercase tracking-widest mt-0.5">Platform</p>
      </div>

      {/* Main nav */}
      <nav className="px-3 py-4 space-y-0.5">
        {MAIN_NAV.map(item => {
          const active = isMainActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? "rgba(255,255,255,0.1)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.38)",
              }}
            >
              <span style={{ color: active ? "#fff" : "rgba(255,255,255,0.25)" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Event sub-nav */}
      {eventId && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 12px" }} />
          <div className="px-3 py-3 flex-1 overflow-y-auto">
            <Link
              href="/organizador/eventos"
              className="flex items-center gap-1.5 text-xs font-medium px-2 mb-3"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Events
            </Link>
            <div className="px-3 py-2 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-white text-xs font-semibold truncate">{eventName || "…"}</p>
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
                    className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: active ? (isFeature ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.1)") : "transparent",
                      color: active
                        ? (isFeature ? "#f59e0b" : "#fff")
                        : (isFeature ? "#f59e0b" : "rgba(255,255,255,0.38)"),
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

      {!eventId && <div className="flex-1" />}

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
            <p className="text-white/30 text-[10px] truncate">{userEmail}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
