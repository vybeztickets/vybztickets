"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TicketRow = {
  id: string;
  event_id: string;
  buyer_name: string | null;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_notes: string | null;
  purchase_price: number;
  status: string;
  promo_code: string | null;
  created_at: string;
  qr_code: string;
  ticket_type_id: string;
  ticket_types: { id: string; name: string; price: number } | null;
};

type FilterKey = "all" | "active" | "used" | "cancelled" | "refunded";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatPrice(n: number) {
  return n === 0 ? "Gratis" : "₡" + n.toLocaleString("es-CR");
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function shortRef(id: string) {
  return "#" + id.slice(0, 8).toUpperCase();
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activo", used: "Ingresado", cancelled: "Cancelado", refunded: "Reembolsado",
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
  used: { bg: "rgba(0,0,0,0.06)", text: "#0a0a0a" },
  cancelled: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
  refunded: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
};

const PAGE_SIZES = [10, 25, 50];

export default function PedidosManager({ tickets }: { tickets: TicketRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [notifyToggle, setNotifyToggle] = useState(true);
  const [refundToggle, setRefundToggle] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Action states
  const [resendState, setResendState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function openDetail(id: string) {
    const t = tickets.find((x) => x.id === id);
    if (t) {
      setEditName(t.buyer_name ?? "");
      setEditEmail(t.buyer_email);
      setEditPhone(t.buyer_phone ?? "");
    }
    setEditMode(false);
    setEditError(null);
    setResendState("idle");
    setDetailId(id);
  }

  async function handleResend() {
    if (!detail) return;
    setResendState("loading");
    try {
      const res = await fetch("/api/tickets/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: detail.event_id, email: detail.buyer_email }),
      });
      const json = await res.json();
      setResendState(json.found ? "done" : "error");
    } catch {
      setResendState("error");
    }
  }

  async function handleEditSave() {
    if (!detail) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer_name: editName, buyer_email: editEmail, buyer_phone: editPhone }),
      });
      const json = await res.json();
      if (!res.ok) { setEditError(json.error ?? "Error"); setEditLoading(false); return; }
      setEditMode(false);
      router.refresh();
    } catch {
      setEditError("Error de red");
    } finally {
      setEditLoading(false);
    }
  }

  const filtered = tickets.filter((t) => {
    if (filter === "active") return t.status === "active";
    if (filter === "used") return t.status === "used";
    if (filter === "cancelled") return t.status === "cancelled";
    if (filter === "refunded") return t.status === "refunded";
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageTickets = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleSelect(id: string) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  function toggleAll() {
    const pageIds = pageTickets.map((t) => t.id);
    const allSelected = pageIds.every((id) => selected.includes(id));
    if (allSelected) setSelected((s) => s.filter((id) => !pageIds.includes(id)));
    else setSelected((s) => [...new Set([...s, ...pageIds])]);
  }

  const detail = tickets.find((t) => t.id === detailId);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          {([
            { key: "all", label: "Todos" },
            { key: "active", label: "Activos" },
            { key: "used", label: "Ingresados" },
            { key: "cancelled", label: "Cancelados" },
            { key: "refunded", label: "Reembolsados" },
          ] as { key: FilterKey; label: string }[]).map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              className="px-4 py-2 text-xs font-medium transition-colors"
              style={{
                background: filter === f.key ? "rgba(0,0,0,0.08)" : "transparent",
                color: filter === f.key ? "#0a0a0a" : "rgba(0,0,0,0.35)",
                borderRight: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            Cancelar {selected.length} seleccionados
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ border: "1px dashed rgba(0,0,0,0.08)" }}>
          <p className="text-[#0a0a0a]/20 text-sm">Sin pedidos en este filtro</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            {/* Header */}
            <div
              className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3 items-center"
              style={{ gridTemplateColumns: "32px 120px 1fr 1fr 120px", background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
            >
              <input type="checkbox" className="accent-purple-500" onChange={toggleAll} checked={pageTickets.every((t) => selected.includes(t.id)) && pageTickets.length > 0} />
              <div>Referencia</div>
              <div>Nombre</div>
              <div>Contacto</div>
              <div className="text-right">Importe</div>
            </div>

            {pageTickets.map((t, i) => {
              const emailValid = isValidEmail(t.buyer_email);
              const sc = STATUS_COLORS[t.status] ?? STATUS_COLORS.active;
              return (
                <div
                  key={t.id}
                  className="grid items-center px-5 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.02]"
                  style={{ gridTemplateColumns: "32px 120px 1fr 1fr 120px", borderBottom: i < pageTickets.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", background: selected.includes(t.id) ? "rgba(0,0,0,0.03)" : "transparent" }}
                  onClick={() => openDetail(t.id)}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="accent-purple-500" checked={selected.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                  </div>

                  <div>
                    <p className="text-[#0a0a0a] text-xs font-mono font-semibold">{shortRef(t.id)}</p>
                    <p className="text-[#0a0a0a]/25 text-[10px]">{new Date(t.created_at).toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit" })}</p>
                  </div>

                  <div>
                    <p className="text-[#0a0a0a] text-sm font-medium">{t.buyer_name ?? "—"}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5" style={{ background: sc.bg, color: sc.text }}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={emailValid ? "#10b981" : "#ef4444"} strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <span className="text-xs" style={{ color: emailValid ? "rgba(0,0,0,0.5)" : "#ef4444" }}>{t.buyer_email}</span>
                    </div>
                    {t.buyer_phone && <p className="text-[#0a0a0a]/30 text-[10px] mt-0.5">{t.buyer_phone}</p>}
                  </div>

                  <div className="text-right">
                    <p className="text-[#0a0a0a] text-sm font-semibold">{formatPrice(t.purchase_price)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-[#0a0a0a]/25 text-xs">Filas por página:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="text-xs rounded-lg px-2 py-1 text-[#0a0a0a] focus:outline-none"
                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)", colorScheme: "light" }}
              >
                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-[#0a0a0a]/25 text-xs">Mostrando {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} de {filtered.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-[#0a0a0a]/30 disabled:opacity-20 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className="w-7 h-7 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: page === p ? "rgba(0,0,0,0.15)" : "transparent", color: page === p ? "#0a0a0a" : "rgba(0,0,0,0.3)" }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg text-[#0a0a0a]/30 disabled:opacity-20 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── DETAIL SLIDE PANEL ── */}
      {detail && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setDetailId(null)} />
          <div className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-y-auto" style={{ width: 460, background: "#fff", borderLeft: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between px-6 py-5 sticky top-0" style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)", zIndex: 1 }}>
              <h3 className="text-[#0a0a0a] font-bold text-base">Detalles del Pedido</h3>
              <button onClick={() => setDetailId(null)} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">
              {/* Status + importe */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: (STATUS_COLORS[detail.status] ?? STATUS_COLORS.active).bg, color: (STATUS_COLORS[detail.status] ?? STATUS_COLORS.active).text }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: (STATUS_COLORS[detail.status] ?? STATUS_COLORS.active).text }} />
                  {STATUS_LABELS[detail.status] ?? detail.status}
                </span>
                <span className="text-[#0a0a0a] font-bold text-xl">{formatPrice(detail.purchase_price)}</span>
              </div>

              {/* Info grid */}
              <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                {[
                  { label: "Nombre", value: detail.buyer_name ?? "—" },
                  { label: "Referencia", value: shortRef(detail.id) },
                  { label: "ID Transacción", value: detail.id.slice(0, 16).toUpperCase() },
                  { label: "Fecha", value: formatDate(detail.created_at) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[#0a0a0a]/35 text-xs">{row.label}</span>
                    <span className="text-[#0a0a0a] text-xs font-medium">{row.value}</span>
                  </div>
                ))}
                {/* Email with validity */}
                <div className="flex items-center justify-between">
                  <span className="text-[#0a0a0a]/35 text-xs">Correo electrónico</span>
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isValidEmail(detail.buyer_email) ? "#10b981" : "#ef4444"} strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span className="text-[#0a0a0a] text-xs">{detail.buyer_email}</span>
                  </div>
                </div>
                {detail.promo_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#0a0a0a]/35 text-xs">Código usado</span>
                    <span className="text-purple-400 text-xs font-mono">{detail.promo_code}</span>
                  </div>
                )}
                {detail.buyer_notes && (
                  <div>
                    <span className="text-[#0a0a0a]/35 text-xs">Notas</span>
                    <p className="text-[#0a0a0a]/70 text-xs mt-1">{detail.buyer_notes}</p>
                  </div>
                )}
              </div>

              {/* Artículos del Pedido */}
              <div>
                <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-3">Artículos del Pedido</p>
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="grid text-[10px] uppercase tracking-wider px-4 py-2 font-semibold text-[#0a0a0a]/25"
                    style={{ gridTemplateColumns: "1fr 80px 80px 80px", background: "rgba(0,0,0,0.02)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <div>Entrada</div>
                    <div className="text-right">Precio</div>
                    <div className="text-right">Cargo</div>
                    <div className="text-right">Total</div>
                  </div>
                  <div className="grid items-center px-4 py-3" style={{ gridTemplateColumns: "1fr 80px 80px 80px" }}>
                    <span className="text-[#0a0a0a] text-xs">{detail.ticket_types?.name ?? "—"}</span>
                    <span className="text-[#0a0a0a]/60 text-xs text-right">{formatPrice(detail.ticket_types?.price ?? 0)}</span>
                    <span className="text-[#0a0a0a]/40 text-xs text-right">₡0</span>
                    <span className="text-[#0a0a0a] text-xs font-semibold text-right">{formatPrice(detail.purchase_price)}</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => window.open(`/ticket/${detail.qr_code}`, "_blank")}
                  className="py-2.5 rounded-xl text-xs font-semibold transition-colors hover:opacity-80"
                  style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  Ver QR
                </button>
                <button
                  onClick={handleResend}
                  disabled={resendState === "loading" || resendState === "done"}
                  className="py-2.5 rounded-xl text-xs font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
                  style={{
                    background: resendState === "done" ? "rgba(16,185,129,0.12)" : "rgba(0,0,0,0.04)",
                    color: resendState === "done" ? "#10b981" : resendState === "error" ? "#ef4444" : "rgba(0,0,0,0.5)",
                    border: `1px solid ${resendState === "done" ? "rgba(16,185,129,0.2)" : "rgba(0,0,0,0.07)"}`,
                  }}
                >
                  {resendState === "loading" ? "..." : resendState === "done" ? "Enviado ✓" : resendState === "error" ? "Error" : "Reenviar"}
                </button>
                <button
                  onClick={() => { setEditMode((v) => !v); setEditError(null); }}
                  className="py-2.5 rounded-xl text-xs font-semibold transition-colors hover:opacity-80"
                  style={{
                    background: editMode ? "#0a0a0a" : "rgba(0,0,0,0.04)",
                    color: editMode ? "#fff" : "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  {editMode ? "Cancelar" : "Editar"}
                </button>
              </div>

              {/* Edit form */}
              {editMode && (
                <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <p className="text-[#0a0a0a]/40 text-[10px] uppercase tracking-wider mb-1">Editar datos del comprador</p>
                  {[
                    { label: "Nombre", value: editName, onChange: setEditName, type: "text" },
                    { label: "Correo", value: editEmail, onChange: setEditEmail, type: "email" },
                    { label: "Teléfono", value: editPhone, onChange: setEditPhone, type: "tel" },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="text-[#0a0a0a]/40 text-[10px] uppercase tracking-wider">{f.label}</label>
                      <input
                        type={f.type}
                        value={f.value}
                        onChange={(e) => f.onChange(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl text-sm text-[#0a0a0a] focus:outline-none"
                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                      />
                    </div>
                  ))}
                  {editError && <p className="text-xs text-red-500">{editError}</p>}
                  <button
                    onClick={handleEditSave}
                    disabled={editLoading}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold transition-colors hover:opacity-90 disabled:opacity-50 mt-1"
                    style={{ background: "#0a0a0a", color: "#fff" }}
                  >
                    {editLoading ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── CANCEL MODAL ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <h3 className="text-[#0a0a0a] font-bold text-base mb-2">Cancelar Asistentes</h3>
            <p className="text-[#0a0a0a]/40 text-sm mb-5">Vas a cancelar {selected.length} entrada{selected.length !== 1 ? "s" : ""}.</p>

            <div className="flex flex-col gap-3 mb-6">
              <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <span className="text-[#0a0a0a]/60 text-sm">Notificar al asistente</span>
                <button type="button" onClick={() => setNotifyToggle(!notifyToggle)} className="relative w-9 h-5 rounded-full transition-colors shrink-0" style={{ background: notifyToggle ? "#0a0a0a" : "rgba(0,0,0,0.08)" }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: notifyToggle ? "17px" : "2px" }} />
                </button>
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <span className="text-[#0a0a0a]/60 text-sm">Reembolsar orden</span>
                <button type="button" onClick={() => setRefundToggle(!refundToggle)} className="relative w-9 h-5 rounded-full transition-colors shrink-0" style={{ background: refundToggle ? "#0a0a0a" : "rgba(0,0,0,0.08)" }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: refundToggle ? "17px" : "2px" }} />
                </button>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)" }}
              >
                Cerrar
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                Validar datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
