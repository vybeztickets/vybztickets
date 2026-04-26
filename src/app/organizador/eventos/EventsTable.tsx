"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TicketType = { id: string; price: number; total_available: number; sold_count: number; is_active: boolean };
type Event = {
  id: string; name: string; date: string; status: string;
  venue: string; city: string; ticket_types: TicketType[]; is_visible?: boolean;
};

function formatPrice(n: number) { return "₡" + n.toLocaleString("es-CR"); }
function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "upcoming", label: "Próximos" },
  { key: "hidden", label: "Oculto" },
  { key: "past", label: "Pasados" },
];

const STATUS_LABELS: Record<string, string> = { published: "Publicado", draft: "Borrador", cancelled: "Cancelado", completed: "Concluido" };
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  published: { bg: "rgba(16,185,129,0.1)", text: "#059669" },
  draft: { bg: "rgba(245,158,11,0.1)", text: "#d97706" },
  cancelled: { bg: "rgba(239,68,68,0.1)", text: "#dc2626" },
  completed: { bg: "rgba(107,114,128,0.1)", text: "#6b7280" },
};

export default function EventsTable({ events }: { events: Event[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(events.map((e) => [e.id, e.is_visible !== false]))
  );

  async function toggleVisibility(id: string) {
    const next = !visibility[id];
    setVisibility((v) => ({ ...v, [id]: next }));
    await fetch(`/api/organizador/eventos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: next }),
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = events.filter((e) => {
    const eventDate = new Date(e.date + "T00:00:00");
    const isVisible = visibility[e.id] !== false;
    if (filter === "upcoming" && eventDate < today) return false;
    if (filter === "past" && eventDate >= today) return false;
    if (filter === "hidden" && isVisible) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleSelect(id: string) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function deleteSelected() {
    if (!confirm(`¿Eliminar ${selected.length} evento(s) seleccionado(s)? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    const errors: string[] = [];
    for (const id of selected) {
      const res = await fetch(`/api/organizador/eventos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        const name = events.find((e) => e.id === id)?.name ?? id;
        errors.push(`${name}: ${body.error}`);
      }
    }
    setDeleting(false);
    setSelected([]);
    if (errors.length > 0) {
      alert("Algunos eventos no se pudieron eliminar:\n\n" + errors.join("\n"));
    }
    router.refresh();
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-2 text-xs font-medium transition-colors"
              style={{
                background: filter === f.key ? "#0a0a0a" : "transparent",
                color: filter === f.key ? "#fff" : "rgba(0,0,0,0.4)",
                borderRight: "1px solid rgba(0,0,0,0.07)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a0a0a]/25" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 rounded-xl text-xs text-[#0a0a0a] placeholder-[#0a0a0a]/25 focus:outline-none"
            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", width: "200px" }}
          />
        </div>
        {selected.length > 0 && (
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40"
            style={{ border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {deleting ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            )}
            Eliminar ({selected.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card-light rounded-2xl overflow-hidden">
        {/* Header */}
        <div
          className="grid text-[10px] font-bold uppercase tracking-wider px-5 py-3"
          style={{
            gridTemplateColumns: "32px 1fr 160px 200px 120px 44px",
            background: "rgba(0,0,0,0.03)",
            color: "rgba(0,0,0,0.3)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div /><div>Nombre</div><div>Ventas</div><div>Entradas</div><div>Estado</div><div />
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[#0a0a0a]/20 text-sm">
            Sin eventos{filter !== "all" ? " en este filtro" : ""}
          </div>
        ) : (
          filtered.map((event, i) => {
            const sold = event.ticket_types.reduce((s, t) => s + t.sold_count, 0);
            const revenue = event.ticket_types.reduce((s, t) => s + t.sold_count * t.price, 0);
            const sc = STATUS_COLORS[event.status] ?? STATUS_COLORS.draft;
            const isSelected = selected.includes(event.id);
            const isVisible = visibility[event.id] !== false;

            return (
              <div
                key={event.id}
                className="grid items-center px-5 py-4 transition-colors hover:bg-black/[0.02]"
                style={{
                  gridTemplateColumns: "32px 1fr 160px 200px 120px 44px",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  background: isSelected ? "rgba(0,0,0,0.025)" : "transparent",
                }}
              >
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(event.id)} className="accent-black" />

                <div style={{ borderLeft: "2.5px solid rgba(0,0,0,0.15)", paddingLeft: "10px" }}>
                  <Link href={`/organizador/eventos/${event.id}`} className="text-[#0a0a0a] text-sm font-medium hover:text-[#0a0a0a]/50 transition-colors">
                    {event.name}
                  </Link>
                  <p className="text-[#0a0a0a]/30 text-xs">{formatDate(event.date)}</p>
                </div>

                <div className="text-[#0a0a0a] text-sm font-medium">{formatPrice(revenue)}</div>

                <div>
                  <span className="text-[#0a0a0a]/40 text-xs">Vendidas: <span className="text-[#0a0a0a] font-medium">{sold}</span></span>
                  <br />
                  <span className="text-[#0a0a0a]/40 text-xs">Gratis: <span className="text-[#0a0a0a]">0</span></span>
                </div>

                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
                    {STATUS_LABELS[event.status] ?? event.status}
                  </span>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    onClick={() => toggleVisibility(event.id)}
                    title={isVisible ? "Visible — click para ocultar" : "Oculto — click para publicar"}
                    className="transition-colors"
                    style={{ color: isVisible ? "#059669" : "#dc2626" }}
                  >
                    {isVisible ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
