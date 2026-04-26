"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = { label: string; path: string; highlight?: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: "Estadísticas", path: "estadisticas" },
  { label: "Editar", path: "editar" },
  { label: "Entradas", path: "entradas" },
  { label: "Códigos", path: "codigos" },
  { label: "Pedidos", path: "pedidos" },
  { label: "Asistentes", path: "asistentes" },
  { label: "Embajadores", path: "embajadores" },
  { label: "Ingreso", path: "ingreso" },
  { label: "★ Destacar", path: "destacar", highlight: true },
];

export default function EventSubNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/organizador/eventos/${eventId}`;
  const [eventName, setEventName] = useState("");

  useEffect(() => {
    fetch(`/api/organizador/eventos/${eventId}`)
      .then((r) => r.json())
      .then((d) => { if (d.name) setEventName(d.name); })
      .catch(() => {});
  }, [eventId]);

  return (
    <div style={{ background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-8 pt-4">
        <Link
          href="/organizador/eventos"
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: "rgba(0,0,0,0.35)" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Eventos
        </Link>
        <span style={{ color: "rgba(0,0,0,0.2)", fontSize: "11px" }}>/</span>
        <span className="text-[#0a0a0a] text-xs font-semibold truncate max-w-[240px]">
          {eventName || "…"}
        </span>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-none px-8 mt-1">
        {NAV_ITEMS.map((item) => {
          const href = `${base}/${item.path}`;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={item.path}
              href={href}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-all shrink-0"
              style={
                active
                  ? { color: item.highlight ? "#f59e0b" : "#0a0a0a", borderBottom: `2px solid ${item.highlight ? "#f59e0b" : "#0a0a0a"}` }
                  : { color: item.highlight ? "#f59e0b" : "rgba(0,0,0,0.35)", borderBottom: "2px solid transparent" }
              }
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
