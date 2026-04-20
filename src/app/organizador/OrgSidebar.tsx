"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const MAIN_NAV = [
  {
    label: "Dashboard", href: "/organizador",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    label: "Eventos", href: "/organizador/eventos",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    label: "Marketing", href: "/organizador/marketing",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  },
  {
    label: "Finanzas", href: "/organizador/finanzas",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  },
  {
    label: "Configuración", href: "/organizador/configuracion",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
];

const EVENT_NAV = [
  { label: "Estadísticas", path: "estadisticas", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { label: "Editar evento", path: "editar", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  { label: "Entradas", path: "entradas", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg> },
  { label: "Códigos", path: "codigos", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
  { label: "Pedidos", path: "pedidos", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { label: "Asistentes", path: "asistentes", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: "Embajadores", path: "embajadores", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { label: "Ingreso", path: "ingreso", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/></svg> },
];

export default function OrgSidebar({
  userName, userEmail, avatarUrl,
}: {
  userName: string; userEmail: string; avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const eventMatch = pathname.match(/^\/organizador\/eventos\/([^/]+)(\/|$)/);
  const eventId = eventMatch && eventMatch[1] !== "nuevo" ? eventMatch[1] : null;

  const [eventName, setEventName] = useState<string>("");
  useEffect(() => {
    if (!eventId) { setEventName(""); return; }
    fetch(`/api/organizador/eventos/${eventId}`)
      .then((r) => r.json())
      .then((d) => { if (d.name) setEventName(d.name); })
      .catch(() => {});
  }, [eventId]);

  const inEvent = Boolean(eventId);
  const base = `/organizador/eventos/${eventId}`;

  function isMain(href: string) {
    if (href === "/organizador") return pathname === "/organizador";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="fixed top-0 left-0 h-full flex flex-col z-40 transition-all duration-300"
      style={{
        width: collapsed ? "60px" : "240px",
        background: "#ffffff",
        borderRight: "1px solid rgba(0,0,0,0.07)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <Link href="/" className="font-[family-name:var(--font-bebas)] text-2xl tracking-widest text-[#0a0a0a] hover:opacity-50 transition-opacity">
          {collapsed ? "V" : "VYBZ"}
        </Link>
      </div>

      {inEvent && !collapsed ? (
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          <div className="px-3 mb-3">
            <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider mb-1">Evento</p>
            <p className="text-[#0a0a0a] text-sm font-semibold truncate leading-tight">{eventName || "Cargando..."}</p>
          </div>

          <Link
            href="/organizador/eventos"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium mb-2 transition-colors text-[#0a0a0a]/35 hover:text-[#0a0a0a]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Volver a Eventos
          </Link>

          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginBottom: 8 }} />

          {EVENT_NAV.map((item) => {
            const href = `${base}/${item.path}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={item.path}
                href={href}
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
      ) : (
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {MAIN_NAV.map((item) => {
            const active = isMain(item.href);
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
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
          {!collapsed && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-[#0a0a0a]/25 hover:text-[#0a0a0a]/50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span className="text-sm">Buscar</span>
              <span className="ml-auto text-xs opacity-50">⌘K</span>
            </div>
          )}
        </nav>
      )}

      {/* User */}
      <div className="px-3 py-4 flex items-center gap-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold bg-[#0a0a0a] text-white">
          {userName.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[#0a0a0a] text-xs font-medium truncate">{userName}</p>
            <p className="text-[#0a0a0a]/30 text-[10px] truncate">{userEmail}</p>
          </div>
        )}
        {!collapsed && (
          <Link href="/organizador/configuracion" className="text-[#0a0a0a]/20 hover:text-[#0a0a0a]/50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </Link>
        )}
      </div>

      {/* Collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-4 flex items-center gap-2 text-xs text-[#0a0a0a]/20 hover:text-[#0a0a0a]/50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: collapsed ? "rotate(180deg)" : "none" }}>
          <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
        </svg>
        {!collapsed && <span>Colapsar</span>}
      </button>
    </aside>
  );
}
