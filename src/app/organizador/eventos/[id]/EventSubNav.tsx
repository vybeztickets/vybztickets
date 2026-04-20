"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Estadísticas", path: "estadisticas" },
  { label: "Editar", path: "editar" },
  { label: "Entradas", path: "entradas" },
  { label: "Códigos", path: "codigos" },
  { label: "Pedidos", path: "pedidos" },
  { label: "Asistentes", path: "asistentes" },
  { label: "Embajadores", path: "embajadores" },
  { label: "Ingreso", path: "ingreso" },
];

export default function EventSubNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/organizador/eventos/${eventId}`;

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto scrollbar-none px-8"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}
    >
      {NAV_ITEMS.map((item) => {
        const href = `${base}/${item.path}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={item.path}
            href={href}
            className="px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0"
            style={
              active
                ? { color: "#0a0a0a", borderBottom: "2px solid #0a0a0a" }
                : { color: "rgba(0,0,0,0.35)", borderBottom: "2px solid transparent" }
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
