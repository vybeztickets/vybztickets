"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TicketType = { id: string; price: number; total_available: number; sold_count: number; is_active: boolean };
type Event = {
  id: string; name: string; date: string; status: string;
  venue: string; city: string; ticket_types: TicketType[]; is_visible?: boolean;
};

function formatPrice(n: number) {
  if (n >= 1000000) return "₡" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "₡" + (n / 1000).toFixed(0) + "K";
  return "₡" + n.toLocaleString("es-CR");
}
function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "upcoming", label: "Próximos" },
  { key: "past", label: "Pasados" },
  { key: "hidden", label: "Ocultos" },
];

const STATUS_LABEL: Record<string, string> = {
  published: "Publicado", draft: "Borrador", cancelled: "Cancelado", completed: "Concluido",
};
const STATUS_DOT: Record<string, string> = {
  published: "#10b981", draft: "#f59e0b", cancelled: "#ef4444", completed: "#9ca3af",
};

export default function EventsTable({ events }: { events: Event[] }) {
  const router = useRouter();
  const [activeFilters, setActiveFilters] = useState<string[]>(["all"]);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(events.map((e) => [e.id, e.is_visible !== false]))
  );

  function toggleFilter(key: string) {
    if (key === "all") { setActiveFilters(["all"]); return; }
    setActiveFilters((prev) => {
      const without = prev.filter((f) => f !== "all");
      if (without.includes(key)) {
        const next = without.filter((f) => f !== key);
        return next.length === 0 ? ["all"] : next;
      }
      return [...without, key];
    });
  }

  async function toggleVisibility(id: string, e: React.MouseEvent) {
    e.preventDefault();
    const next = !visibility[id];
    setVisibility((v) => ({ ...v, [id]: next }));
    await fetch(`/api/organizador/eventos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: next }),
    });
  }

  async function deleteEvent(id: string, name: string, e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/organizador/eventos/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      const body = await res.json();
      alert(`No se pudo eliminar: ${body.error}`);
    }
    router.refresh();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = events.filter((e) => {
    const eventDate = new Date(e.date + "T00:00:00");
    const isVis = visibility[e.id] !== false;
    if (!activeFilters.includes("all")) {
      const match = activeFilters.some((f) => {
        if (f === "upcoming") return eventDate >= today;
        if (f === "past") return eventDate < today;
        if (f === "hidden") return !isVis;
        return true;
      });
      if (!match) return false;
    }
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Filter + search bar */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => {
            const on = activeFilters.includes(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggleFilter(f.key)}
                className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                style={
                  on
                    ? { background: "#0a0a0a", color: "#fff" }
                    : { background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.45)", border: "1px solid rgba(0,0,0,0.08)" }
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "rgba(0,0,0,0.25)" }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 rounded-xl text-xs focus:outline-none"
            style={{
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.08)",
              color: "#0a0a0a",
              width: "200px",
            }}
          />
        </div>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#0a0a0a]/10 mb-3">
            {search ? "SIN RESULTADOS" : "SIN EVENTOS"}
          </p>
          {!search && (
            <Link
              href="/organizador/eventos/nuevo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
            >
              + Crear evento
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((event) => {
            const sold = event.ticket_types.reduce((s, t) => s + t.sold_count, 0);
            const total = event.ticket_types.reduce((s, t) => s + t.total_available, 0);
            const revenue = event.ticket_types.reduce((s, t) => s + t.sold_count * t.price, 0);
            const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
            const dot = STATUS_DOT[event.status] ?? "#9ca3af";
            const isVis = visibility[event.id] !== false;
            const isDeleting = deleting === event.id;

            return (
              <Link key={event.id} href={`/organizador/eventos/${event.id}`} className="block group">
                <div
                  className="rounded-2xl p-5 h-full flex flex-col transition-all"
                  style={{
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: dot }}>
                        {STATUS_LABEL[event.status] ?? event.status}
                      </span>
                    </div>
                    <p className="text-[#0a0a0a]/30 text-[10px]">{formatDate(event.date)}</p>
                  </div>

                  {/* Event name */}
                  <h3 className="font-[family-name:var(--font-bebas)] text-2xl text-[#0a0a0a] leading-tight mb-1 group-hover:opacity-60 transition-opacity">
                    {event.name}
                  </h3>
                  <p className="text-[#0a0a0a]/30 text-xs mb-5">
                    {event.venue} · {event.city}
                  </p>

                  {/* Revenue */}
                  <div className="flex items-end justify-between mb-1 mt-auto">
                    <div>
                      <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider mb-0.5">Ingresos</p>
                      <p className="text-[#0a0a0a] font-bold text-xl leading-none">{formatPrice(revenue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-wider mb-0.5">Entradas</p>
                      <p className="text-[#0a0a0a] font-bold text-xl leading-none">{sold}<span className="text-[#0a0a0a]/20 text-sm font-normal">/{total}</span></p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="h-1 rounded-full overflow-hidden mt-3 mb-4"
                    style={{ background: "rgba(0,0,0,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: "#0a0a0a" }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <button
                      onClick={(e) => toggleVisibility(event.id, e)}
                      title={isVis ? "Visible — click para ocultar" : "Oculto — click para publicar"}
                      className="flex items-center gap-1.5 text-[10px] font-semibold transition-colors px-2.5 py-1.5 rounded-lg"
                      style={{
                        color: isVis ? "#059669" : "#dc2626",
                        background: isVis ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                      }}
                    >
                      {isVis ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                      {isVis ? "Visible" : "Oculto"}
                    </button>

                    <div className="flex-1" />

                    <button
                      onClick={(e) => deleteEvent(event.id, event.name, e)}
                      disabled={isDeleting}
                      className="flex items-center gap-1 text-[10px] font-semibold transition-colors px-2.5 py-1.5 rounded-lg disabled:opacity-40"
                      style={{ color: "rgba(0,0,0,0.25)" }}
                    >
                      {isDeleting ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" /><path d="M14 11v6" />
                        </svg>
                      )}
                      Eliminar
                    </button>

                    <span className="text-[#0a0a0a]/25 text-sm">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
