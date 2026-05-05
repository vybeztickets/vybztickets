"use client";

import { useState } from "react";

type TicketRow = {
  id: string;
  buyer_name: string | null;
  buyer_email: string;
  buyer_phone: string | null;
  purchase_price: number;
  status: string;
  created_at: string;
  qr_code: string;
  ticket_types: { id: string; name: string; price: number } | null;
};

function formatPrice(n: number) {
  return n === 0 ? "Free" : "₡" + n.toLocaleString("en-US");
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const PAGE_SIZES = [10, 25, 50];

export default function AsistentesManager({ tickets }: { tickets: TicketRow[] }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  // Edit form
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");

  function openEdit(t: TicketRow) {
    setEditId(t.id);
    setFName(t.buyer_name ?? "");
    setFEmail(t.buyer_email);
    setFPhone(t.buyer_phone ?? "");
  }

  async function handleUpdate() {
    if (!editId) return;
    setEditSaving(true);
    await fetch(`/api/organizador/ticket-types/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyer_name: fName, buyer_email: fEmail, buyer_phone: fPhone }),
    });
    setEditSaving(false);
    setEditId(null);
  }

  const filtered = tickets.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.buyer_name ?? "").toLowerCase().includes(q) ||
      t.buyer_email.toLowerCase().includes(q) ||
      (t.ticket_types?.name ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageTickets = filtered.slice((page - 1) * pageSize, page * pageSize);

  const inputStyle = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" };
  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[#0a0a0a]/40 text-xs">{tickets.length} attendee{tickets.length !== 1 ? "s" : ""}</p>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 pr-4 py-2 rounded-xl text-xs text-[#0a0a0a] placeholder-black/25 focus:outline-none"
            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)", width: 220 }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ border: "1px dashed rgba(0,0,0,0.08)" }}>
          <p className="text-[#0a0a0a]/20 text-sm">No attendees{search ? " for this search" : ""}</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div
              className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
              style={{ gridTemplateColumns: "1fr 200px 120px 80px 36px", background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
            >
              <div>Attendee</div>
              <div>Contact</div>
              <div>Ticket</div>
              <div className="text-right">Price</div>
              <div />
            </div>

            {pageTickets.map((t, i) => (
              <div
                key={t.id}
                className="grid items-center px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                style={{
                  gridTemplateColumns: "1fr 200px 120px 80px 36px",
                  borderBottom: i < pageTickets.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                  opacity: t.status === "transferred" ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-2.5">
                  {/* QR badge */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background:
                        t.status === "used"
                          ? "rgba(16,185,129,0.15)"
                          : t.status === "transferred"
                          ? "rgba(217,119,6,0.12)"
                          : "rgba(0,0,0,0.04)",
                    }}
                    title={
                      t.status === "used"
                        ? "Checked in"
                        : t.status === "transferred"
                        ? "Transferred"
                        : "Not checked in"
                    }
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={
                        t.status === "used"
                          ? "#10b981"
                          : t.status === "transferred"
                          ? "#d97706"
                          : "rgba(0,0,0,0.15)"
                      }
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
                      <rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                      <path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[#0a0a0a] text-sm font-medium">{t.buyer_name ?? "—"}</p>
                      {t.status === "transferred" && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(217,119,6,0.12)", color: "#d97706" }}
                        >
                          Transferred
                        </span>
                      )}
                    </div>
                    <p className="text-[#0a0a0a]/25 text-[10px]">{formatDate(t.created_at)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[#0a0a0a]/60 text-xs truncate max-w-[180px]">{t.buyer_email}</p>
                  {t.buyer_phone && <p className="text-[#0a0a0a]/25 text-[10px]">{t.buyer_phone}</p>}
                </div>

                <div>
                  <p className="text-[#0a0a0a]/60 text-xs">{t.ticket_types?.name ?? "—"}</p>
                </div>

                <div className="text-right">
                  <p className="text-[#0a0a0a] text-sm font-medium">{formatPrice(t.purchase_price)}</p>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => openEdit(t)} className="text-[#0a0a0a]/20 hover:text-[#0a0a0a]/60 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-[#0a0a0a]/25 text-xs">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="text-xs rounded-lg px-2 py-1 text-[#0a0a0a] focus:outline-none"
                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)", colorScheme: "light" }}
              >
                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-[#0a0a0a]/25 text-xs">Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
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

      {/* EDIT SLIDE PANEL */}
      {editId && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setEditId(null)} />
          <div className="fixed right-0 top-0 h-full z-50 flex flex-col" style={{ width: 400, background: "#fff", borderLeft: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <h3 className="text-[#0a0a0a] font-bold text-base">Edit attendee</h3>
              <button onClick={() => setEditId(null)} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1">Name</label>
                <input type="text" value={fName} onChange={(e) => setFName(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1">Email address</label>
                <input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1">Phone</label>
                <input type="tel" value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="Optional" className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div className="px-6 py-4 flex gap-2" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <button onClick={() => setEditId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)" }}>
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
