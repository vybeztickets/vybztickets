"use client";

import { useState } from "react";

type TicketType = { id: string; name: string; price: number };
type PromoCode = {
  id: string;
  code: string;
  promoter_name: string | null;
  discount_percent: number;
  ticket_type_id: string | null;
  is_active: boolean;
  max_uses: number | null;
  times_used: number;
  is_guestlist: boolean;
  created_at: string;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

const PAGE_SIZES = [10, 25, 50];

export default function CodigosManager({
  eventId, initialCodes, ticketTypes,
}: {
  eventId: string;
  initialCodes: PromoCode[];
  ticketTypes: TicketType[];
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Form
  const [fCode, setFCode] = useState("");
  const [fName, setFName] = useState("");
  const [fDiscount, setFDiscount] = useState("");
  const [fTicketType, setFTicketType] = useState("");
  const [fMaxUses, setFMaxUses] = useState("");

  function resetForm() {
    setFCode(""); setFName(""); setFDiscount(""); setFTicketType(""); setFMaxUses(""); setError("");
  }

  function openEdit(c: PromoCode) {
    setEditId(c.id);
    setFCode(c.code);
    setFName(c.promoter_name ?? "");
    setFDiscount(String(c.discount_percent));
    setFTicketType(c.ticket_type_id ?? "");
    setFMaxUses(c.max_uses ? String(c.max_uses) : "");
    setError("");
  }

  async function handleCreate() {
    if (!fCode || !fDiscount) { setError("Código y descuento son requeridos"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/organizador/codigos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          code: fCode,
          promoter_name: fName || "",
          discount_percent: parseFloat(fDiscount),
          ticket_type_id: fTicketType || null,
          max_uses: fMaxUses ? parseInt(fMaxUses) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setCodes((prev) => [data, ...prev]);
      setShowCreate(false); resetForm();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally { setSaving(false); }
  }

  async function handleUpdate() {
    if (!editId) return;
    setSaving(true); setError("");
    try {
      const discountNum = parseFloat(fDiscount) || 0;
      const res = await fetch(`/api/organizador/codigos/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoter_name: fName || "",
          discount_percent: discountNum,
          ticket_type_id: fTicketType || null,
          max_uses: fMaxUses ? parseInt(fMaxUses) : null,
          is_guestlist: discountNum === 100,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Error"); }
      setCodes((prev) => prev.map((c) => c.id === editId ? {
        ...c,
        promoter_name: fName || "",
        discount_percent: discountNum,
        ticket_type_id: fTicketType || null,
        max_uses: fMaxUses ? parseInt(fMaxUses) : null,
        is_guestlist: discountNum === 100,
      } : c));
      setEditId(null); resetForm();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally { setSaving(false); }
  }

  async function toggleActive(c: PromoCode) {
    setCodes((prev) => prev.map((x) => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
    await fetch(`/api/organizador/codigos/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
  }

  async function handleDelete(c: PromoCode) {
    if (!confirm(`¿Eliminar el código "${c.code}"?`)) return;
    await fetch(`/api/organizador/codigos/${c.id}`, { method: "DELETE" });
    setCodes((prev) => prev.filter((x) => x.id !== c.id));
  }

  function copyLink(c: PromoCode) {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${base}/eventos/${eventId}?code=${c.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(c.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const totalPages = Math.max(1, Math.ceil(codes.length / pageSize));
  const pageCodes = codes.slice((page - 1) * pageSize, page * pageSize);

  const inputStyle = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" };
  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";

  const formFields = (
    <>
      <div>
        <label className="block text-[#0a0a0a]/40 text-xs mb-1">Código *</label>
        <input
          type="text"
          placeholder="Ej: VYBZ20"
          value={fCode}
          onChange={(e) => setFCode(e.target.value.toUpperCase())}
          className={inputClass}
          style={inputStyle}
          disabled={!!editId}
        />
        <p className="text-[#0a0a0a]/20 text-[10px] mt-1">El comprador lo ingresa al momento de comprar</p>
      </div>
      <div>
        <label className="block text-[#0a0a0a]/40 text-xs mb-1">Nombre / Alias</label>
        <input type="text" placeholder="Ej: Embajador Nicola" value={fName} onChange={(e) => setFName(e.target.value)} className={inputClass} style={inputStyle} />
      </div>
      <div>
        <label className="block text-[#0a0a0a]/40 text-xs mb-1">Entrada aplicable</label>
        <select value={fTicketType} onChange={(e) => setFTicketType(e.target.value)} className={inputClass} style={{ ...inputStyle, colorScheme: "light" }}>
          <option value="">Todas las entradas</option>
          {ticketTypes.map((tt) => (
            <option key={tt.id} value={tt.id}>{tt.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[#0a0a0a]/40 text-xs mb-1">Descuento % *</label>
          <input type="number" min="0" max="100" placeholder="Ej: 20" value={fDiscount} onChange={(e) => setFDiscount(e.target.value)} className={inputClass} style={inputStyle} />
          {fDiscount === "100" && (
            <p className="text-purple-400 text-[10px] mt-1">100% = guestlist (no descuenta stock)</p>
          )}
        </div>
        <div>
          <label className="block text-[#0a0a0a]/40 text-xs mb-1">Límite de usos</label>
          <input type="number" min="1" placeholder="Sin límite" value={fMaxUses} onChange={(e) => setFMaxUses(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-[#0a0a0a]/40 text-xs">{codes.length} código{codes.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "#0a0a0a", color: "#fff" }}
        >
          <span>+</span> Código
        </button>
      </div>

      {codes.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ border: "1px dashed rgba(0,0,0,0.08)" }}>
          <p className="text-[#0a0a0a]/20 text-sm mb-1">Sin códigos de descuento</p>
          <p className="text-[#0a0a0a]/10 text-xs">Crea códigos para embajadores o descuentos especiales</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            {/* Table header */}
            <div
              className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
              style={{ gridTemplateColumns: "36px 1fr 80px 1fr 130px 60px 80px 70px", background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
            >
              <div />
              <div>Código</div>
              <div className="text-center">Estado</div>
              <div>Entrada</div>
              <div>Creado el</div>
              <div className="text-center">Usos</div>
              <div className="text-center">Activo</div>
              <div />
            </div>

            {pageCodes.map((c, i) => {
              const ttName = ticketTypes.find((t) => t.id === c.ticket_type_id)?.name;
              return (
                <div
                  key={c.id}
                  className="grid items-center px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                  style={{ gridTemplateColumns: "36px 1fr 80px 1fr 130px 60px 80px 70px", borderBottom: i < pageCodes.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
                >
                  {/* Share */}
                  <button onClick={() => copyLink(c)} title="Copiar link" className="text-[#0a0a0a]/20 hover:text-[#0a0a0a] transition-colors">
                    {copied === c.id ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    )}
                  </button>

                  {/* Code + name */}
                  <div>
                    <p className="text-[#0a0a0a] text-sm font-mono font-semibold">{c.code}</p>
                    {c.promoter_name && <p className="text-[#0a0a0a]/30 text-[10px]">{c.promoter_name}</p>}
                    {c.is_guestlist && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "#0a0a0a" }}>Guestlist</span>}
                  </div>

                  {/* Status dot */}
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: c.is_active ? "#10b981" : "rgba(0,0,0,0.15)" }} />
                    <span className="text-xs" style={{ color: c.is_active ? "#10b981" : "rgba(0,0,0,0.3)" }}>
                      {c.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Ticket type */}
                  <div>
                    <span className="text-[#0a0a0a]/50 text-xs">{ttName ?? "Todas"}</span>
                    {!c.is_guestlist && <span className="text-[#0a0a0a]/30 text-xs ml-2">–{c.discount_percent}%</span>}
                  </div>

                  {/* Date */}
                  <div className="text-[#0a0a0a]/35 text-xs">{formatDate(c.created_at)}</div>

                  {/* Uses */}
                  <div className="text-center">
                    <span className="text-[#0a0a0a] text-sm font-medium">{c.times_used}</span>
                    {c.max_uses && <span className="text-[#0a0a0a]/25 text-[10px]">/{c.max_uses}</span>}
                  </div>

                  {/* Active toggle */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(c)}
                      className="relative w-9 h-5 rounded-full transition-colors"
                      style={{ background: c.is_active ? "#0a0a0a" : "rgba(0,0,0,0.08)" }}
                    >
                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: c.is_active ? "17px" : "2px" }} />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-[#0a0a0a]/20 hover:text-[#0a0a0a]/60 transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 text-red-500/30 hover:text-red-500 transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
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
              <span className="text-[#0a0a0a]/25 text-xs">Mostrando {Math.min((page - 1) * pageSize + 1, codes.length)}–{Math.min(page * pageSize, codes.length)} de {codes.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-[#0a0a0a]/30 disabled:opacity-20 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: page === p ? "rgba(0,0,0,0.08)" : "transparent", color: page === p ? "#0a0a0a" : "rgba(0,0,0,0.3)" }}
                >
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

      {/* CREATE MODAL */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCreate(false); resetForm(); } }}
        >
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#0a0a0a] font-bold text-lg">Nuevo código</h3>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {formFields}
              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60 mt-1"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                {saving ? "Creando..." : "Crear código"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SLIDE PANEL */}
      {editId && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => { setEditId(null); resetForm(); }} />
          <div className="fixed right-0 top-0 h-full z-50 flex flex-col" style={{ width: 400, background: "#fff", borderLeft: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <h3 className="text-[#0a0a0a] font-bold text-base">Editar código</h3>
              <button onClick={() => { setEditId(null); resetForm(); }} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
              {formFields}
            </div>
            <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                {saving ? "Guardando..." : "Actualizar código"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
