"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import ImageUploadField from "@/app/components/ImageUploadField";

type Campaign = {
  id: string;
  subject: string;
  body_text: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  audience: string;
  status: string;
  sent_count: number;
  created_at: string;
  sent_at: string;
};

type Contact = {
  id: string;
  email: string;
  full_name: string | null;
  source: string;
  subscribed: boolean;
  created_at: string;
};

type Props = {
  events: { id: string; name: string }[];
  organizerName: string;
  role: string;
};

export default function MarketingClient({ events, organizerName, role }: Props) {
  const isBlocked = role === "suspended" || role === "pending_activation";
  const [tab, setTab] = useState<"correos" | "contactos">("correos");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingCamp, setLoadingCamp] = useState(true);
  const [loadingCont, setLoadingCont] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Campaign form
  const [fSubject, setFSubject] = useState("");
  const [fImageUrl, setFImageUrl] = useState("");
  const [fBody, setFBody] = useState("");
  const [fCtaText, setFCtaText] = useState("");
  const [fCtaUrl, setFCtaUrl] = useState("");
  const [audienceType, setAudienceType] = useState<"all" | "events">("all");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Import
  const [importRows, setImportRows] = useState<{ email: string; full_name: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/organizador/marketing/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns(Array.isArray(d) ? d : []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoadingCamp(false));
    fetch("/api/organizador/marketing/contacts")
      .then((r) => r.json())
      .then((d) => setContacts(Array.isArray(d) ? d : []))
      .catch(() => setContacts([]))
      .finally(() => setLoadingCont(false));
  }, []);

  // Growth chart: cumulative subscribers last 30 days
  const growthData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      const dateStr = d.toISOString().split("T")[0];
      const total = contacts.filter((c) => c.created_at.split("T")[0] <= dateStr).length;
      const label = d.toLocaleDateString("es-CR", { day: "numeric", month: "short" });
      return { date: label, total };
    });
  }, [contacts]);

  useEffect(() => {
    if (!showCreate) return;
    const audience = audienceType === "all" ? "all" : `events:${selectedEventIds.join(",")}`;
    if (audienceType === "events" && selectedEventIds.length === 0) { setRecipientCount(0); return; }
    setLoadingCount(true);
    fetch("/api/organizador/marketing/audience-count", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audience }),
    })
      .then((r) => r.json())
      .then((d) => { setRecipientCount(d.count ?? 0); setLoadingCount(false); })
      .catch(() => setLoadingCount(false));
  }, [showCreate, audienceType, selectedEventIds]);

  function resetForm() {
    setFSubject(""); setFImageUrl(""); setFBody(""); setFCtaText(""); setFCtaUrl("");
    setAudienceType("all"); setSelectedEventIds([]); setSendError(""); setSendSuccess("");
    setRecipientCount(null);
  }

  function toggleEventId(id: string) {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSend() {
    if (!fSubject.trim()) { setSendError("El asunto es requerido."); return; }
    if (audienceType === "events" && selectedEventIds.length === 0) {
      setSendError("Seleccioná al menos un evento."); return;
    }
    setSending(true); setSendError("");
    const audience = audienceType === "all" ? "all" : `events:${selectedEventIds.join(",")}`;
    const res = await fetch("/api/organizador/marketing/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: fSubject, body_text: fBody || null, image_url: fImageUrl || null,
        cta_text: fCtaText || null, cta_url: fCtaUrl || null, audience,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) { setSendError(data.error ?? "Error al enviar"); return; }
    setSendSuccess(`¡Campaña enviada a ${data.sent} destinatarios!`);
    setTimeout(() => {
      setShowCreate(false); resetForm();
      fetch("/api/organizador/marketing/campaigns").then((r) => r.json()).then((d) => setCampaigns(Array.isArray(d) ? d : []));
    }, 2000);
  }

  function parseCSV(text: string) {
    const lines = text.trim().split("\n").map((l) => l.replace(/\r/g, ""));
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const emailIdx = headers.findIndex((h) => h.includes("email") || h.includes("correo"));
    const nameIdx = headers.findIndex((h) =>
      h.includes("nombre") || h.includes("name") || h.includes("full_name")
    );
    if (emailIdx === -1) return [];
    return lines.slice(1)
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
        return { email: cols[emailIdx] ?? "", full_name: nameIdx >= 0 ? cols[nameIdx] ?? "" : "" };
      })
      .filter((r) => r.email.includes("@"));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportRows(parseCSV(ev.target?.result as string));
      setImportError("");
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (importRows.length === 0) { setImportError("No se detectaron contactos válidos."); return; }
    setImporting(true); setImportError("");
    const res = await fetch("/api/organizador/marketing/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts: importRows }),
    });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) { setImportError(data.error ?? "Error"); return; }
    setShowImport(false); setImportRows([]);
    if (fileRef.current) fileRef.current.value = "";
    fetch("/api/organizador/marketing/contacts").then((r) => r.json()).then((d) => setContacts(Array.isArray(d) ? d : []));
  }

  async function deleteContact(id: string) {
    await fetch("/api/organizador/marketing/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  function exportCSV() {
    const header = "email,nombre,fuente,estado,fecha\n";
    const rows = contacts
      .map((c) =>
        `${c.email},${c.full_name || ""},${c.source},${c.subscribed ? "activo" : "desuscrito"},${c.created_at.split("T")[0]}`
      )
      .join("\n");
    const blob = new Blob(["﻿" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contactos-vybz-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const subscribedCount = contacts.filter((c) => c.subscribed).length;

  const audienceLabel = (aud: string) => {
    if (aud === "all") return "Todos los contactos";
    if (aud.startsWith("events:")) {
      const ids = aud.replace("events:", "").split(",");
      if (ids.length === 1) {
        const ev = events.find((e) => e.id === ids[0]);
        return ev ? `Asistentes · ${ev.name}` : "1 evento";
      }
      return `Asistentes · ${ids.length} eventos`;
    }
    return aud;
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";
  const inputStyle = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" };

  return (
    <div className="p-8">
      {isBlocked && (
        <div className="flex items-center justify-between px-5 py-3 rounded-xl mb-6" style={{ background: "rgba(180,83,9,0.1)", border: "1px solid rgba(180,83,9,0.2)" }}>
          <div className="flex items-center gap-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p className="text-sm font-semibold" style={{ color: "#92400e" }}>
              Cuenta inactiva — el envío de emails está bloqueado
            </p>
          </div>
          <a href="/organizador/configuracion" className="text-xs font-bold underline" style={{ color: "#b45309" }}>
            Activar cuenta →
          </a>
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Marketing</h1>
        <div className="flex gap-2">
          {tab === "contactos" && (
            <button
              onClick={exportCSV}
              disabled={contacts.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
              style={{ background: "rgba(0,0,0,0.07)", color: "#0a0a0a" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar CSV
            </button>
          )}
          {tab === "contactos" && (
            <button
              onClick={() => { setShowImport(true); setImportRows([]); setImportError(""); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(0,0,0,0.07)", color: "#0a0a0a" }}
            >
              Importar CSV
            </button>
          )}
          {tab === "correos" && (
            <button
              onClick={() => { resetForm(); setShowCreate(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "#0a0a0a", color: "#fff" }}
            >
              + Nuevo mensaje
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        {(["correos", "contactos"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-3 text-sm font-medium transition-colors"
            style={tab === t ? { color: "#0a0a0a", borderBottom: "2px solid #0a0a0a", marginBottom: -1 } : { color: "rgba(0,0,0,0.3)" }}
          >
            {t === "correos" ? "Correos" : `Contactos${!loadingCont ? ` (${subscribedCount})` : ""}`}
          </button>
        ))}
      </div>

      {/* ── CORREOS TAB ── */}
      {tab === "correos" && (
        <>
          {loadingCamp ? (
            <div className="py-16 text-center text-[#0a0a0a]/20 text-sm">Cargando…</div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-2xl py-20 text-center" style={{ border: "1px dashed rgba(0,0,0,0.08)" }}>
              <p className="text-[#0a0a0a]/20 text-sm mb-3">Sin campañas todavía</p>
              <button onClick={() => { resetForm(); setShowCreate(true); }} className="text-xs font-semibold px-4 py-2 rounded-xl" style={{ background: "#0a0a0a", color: "#fff" }}>
                Crear primer mensaje
              </button>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
                style={{ gridTemplateColumns: "1fr 220px 160px 100px", background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <div>Asunto</div><div>Enviado a</div><div>Fecha</div><div className="text-right">Destinatarios</div>
              </div>
              {campaigns.map((c, i) => (
                <div key={c.id} className="grid items-center px-5 py-4"
                  style={{ gridTemplateColumns: "1fr 220px 160px 100px", borderBottom: i < campaigns.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                  <div>
                    <p className="text-[#0a0a0a] text-sm font-medium">{c.subject}</p>
                    {c.body_text && <p className="text-[#0a0a0a]/30 text-xs truncate max-w-xs mt-0.5">{c.body_text.slice(0, 80)}</p>}
                  </div>
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)" }}>
                      {audienceLabel(c.audience)}
                    </span>
                  </div>
                  <div className="text-[#0a0a0a]/40 text-xs">
                    {new Date(c.sent_at ?? c.created_at).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div className="text-right text-[#0a0a0a] text-sm font-medium">{c.sent_count.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── CONTACTOS TAB ── */}
      {tab === "contactos" && (
        <>
          {/* Stats */}
          <div className="flex gap-4 mb-6">
            {[
              { label: "Suscritos", value: subscribedCount },
              { label: "Desuscritos", value: contacts.filter((c) => !c.subscribed).length },
              { label: "Total", value: contacts.length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl px-5 py-4 flex-1" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-[#0a0a0a]/40 text-xs mb-1">{s.label}</p>
                <p className="text-[#0a0a0a] text-2xl font-bold">{loadingCont ? "—" : s.value}</p>
              </div>
            ))}
          </div>

          {/* Growth chart */}
          {contacts.length > 0 && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-4">Crecimiento de suscriptores (30 días)</p>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={growthData} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(0,0,0,0.25)" }} tickLine={false} axisLine={false} interval={4} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: unknown) => [v as string, "Total suscritos"]}
                  />
                  <Area type="monotone" dataKey="total" stroke="#0a0a0a" strokeWidth={1.5} fill="url(#growthGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Contacts table */}
          {loadingCont ? (
            <div className="py-16 text-center text-[#0a0a0a]/20 text-sm">Cargando…</div>
          ) : contacts.length === 0 ? (
            <div className="rounded-2xl py-20 text-center" style={{ border: "1px dashed rgba(0,0,0,0.08)" }}>
              <p className="text-[#0a0a0a]/20 text-sm mb-3">Sin contactos todavía</p>
              <button onClick={() => setShowImport(true)} className="text-xs font-semibold px-4 py-2 rounded-xl" style={{ background: "#0a0a0a", color: "#fff" }}>
                Importar CSV
              </button>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
                style={{ gridTemplateColumns: "1fr 160px 100px 80px 40px", background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <div>Email</div><div>Nombre</div><div>Fuente</div><div>Estado</div><div />
              </div>
              {contacts.map((c, i) => (
                <div key={c.id} className="grid items-center px-5 py-3"
                  style={{ gridTemplateColumns: "1fr 160px 100px 80px 40px", borderBottom: i < contacts.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                  <p className="text-[#0a0a0a] text-sm truncate">{c.email}</p>
                  <p className="text-[#0a0a0a]/50 text-sm truncate">{c.full_name || "—"}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full w-fit" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" }}>
                    {c.source === "purchase" ? "Compra" : "Importado"}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: c.subscribed ? "#5a8a6a" : "rgba(0,0,0,0.25)" }}>
                    {c.subscribed ? "Activo" : "Baja"}
                  </span>
                  <button onClick={() => deleteContact(c.id)} className="text-[#0a0a0a]/15 hover:text-red-400 transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── CREATE CAMPAIGN MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCreate(false); resetForm(); } }}>
          <div className="w-full max-w-lg rounded-2xl flex flex-col" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", maxHeight: "92vh" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div>
                <h3 className="text-[#0a0a0a] font-bold text-lg">Crear mensaje de Marketing</h3>
                <p className="text-[#0a0a0a]/30 text-xs mt-0.5">Personaliza y envía tus mensajes de marketing en minutos.</p>
              </div>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {isBlocked && (
              <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(180,83,9,0.1)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <p className="font-bold text-[#0a0a0a] mb-1">No puedes crear mensajes aún</p>
                  <p className="text-sm text-[#0a0a0a]/40">Por favor, completa los pasos requeridos para activar tu cuenta.</p>
                </div>
                <a
                  href="/organizador/configuracion"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                  style={{ background: "rgba(180,83,9,0.1)", color: "#b45309", border: "1px solid rgba(180,83,9,0.2)" }}
                >
                  Activar cuenta →
                </a>
              </div>
            )}
            {!isBlocked && (<><div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1.5 uppercase tracking-wider">Asunto *</label>
                <input type="text" className={inputClass} style={inputStyle} placeholder="Ej: ¡Lineup oficial de HALLOWFEST!" value={fSubject} onChange={(e) => setFSubject(e.target.value)} />
              </div>

              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1.5 uppercase tracking-wider">Imagen del flyer</label>
                <ImageUploadField value={fImageUrl} onChange={setFImageUrl} label="" hint="JPG, PNG o WebP · máx 10MB" aspectRatio="1:1" />
              </div>

              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1.5 uppercase tracking-wider">Mensaje</label>
                <textarea rows={4} className={inputClass} style={{ ...inputStyle, resize: "none" }}
                  placeholder="Hola familia, queríamos contarles que..." value={fBody} onChange={(e) => setFBody(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0a0a0a]/40 text-xs mb-1.5 uppercase tracking-wider">Texto del botón</label>
                  <input type="text" className={inputClass} style={inputStyle} placeholder="Comprar entradas" value={fCtaText} onChange={(e) => setFCtaText(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[#0a0a0a]/40 text-xs mb-1.5 uppercase tracking-wider">URL del botón</label>
                  <input type="url" className={inputClass} style={inputStyle} placeholder="https://..." value={fCtaUrl} onChange={(e) => setFCtaUrl(e.target.value)} />
                </div>
              </div>

              {/* Audience */}
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-2 uppercase tracking-wider">Enviar a</label>
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-black/[0.02] transition-colors" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <input type="radio" name="aud" checked={audienceType === "all"} onChange={() => setAudienceType("all")} className="accent-black" />
                    <span className="text-sm text-[#0a0a0a]">Toda la base de datos <span className="text-[#0a0a0a]/30">({subscribedCount} suscritos)</span></span>
                  </label>
                  {events.length > 0 && (
                    <div>
                      <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-black/[0.02] transition-colors" style={{ borderBottom: audienceType === "events" && events.length > 0 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                        <input type="radio" name="aud" checked={audienceType === "events"} onChange={() => setAudienceType("events")} className="accent-black" />
                        <span className="text-sm text-[#0a0a0a]">Asistentes de eventos específicos</span>
                      </label>
                      {audienceType === "events" && (
                        <div className="px-4 pb-3 flex flex-col gap-2 pt-1" style={{ background: "rgba(0,0,0,0.02)" }}>
                          {events.map((ev) => (
                            <label key={ev.id} className="flex items-center gap-3 cursor-pointer py-1">
                              <input type="checkbox" checked={selectedEventIds.includes(ev.id)} onChange={() => toggleEventId(ev.id)} className="accent-black" />
                              <span className="text-sm text-[#0a0a0a]">{ev.name}</span>
                            </label>
                          ))}
                          {selectedEventIds.length > 1 && (
                            <p className="text-[10px] text-[#0a0a0a]/30 mt-1">Los emails duplicados entre eventos se envían una sola vez.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {sendError && <p className="text-red-500 text-xs">{sendError}</p>}
              {sendSuccess && <p className="text-emerald-600 text-xs font-semibold">{sendSuccess}</p>}
            </div>

            <div className="px-6 py-4 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#0a0a0a]/40">Destinatarios estimados</span>
                <span className="text-sm font-bold text-[#0a0a0a]">
                  {loadingCount ? "…" : recipientCount !== null ? recipientCount.toLocaleString() : "—"}
                </span>
              </div>
              <button onClick={handleSend} disabled={sending} className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity" style={{ background: "#0a0a0a", color: "#fff" }}>
                {sending ? "Enviando…" : "Enviar campaña"}
              </button>
            </div>
            </>)}
          </div>
        </div>
      )}

      {/* ── IMPORT CSV MODAL ── */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowImport(false); setImportRows([]); } }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <h3 className="text-[#0a0a0a] font-bold text-lg">Importar contactos</h3>
              <button onClick={() => { setShowImport(false); setImportRows([]); }} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {/* CSV format instructions */}
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="text-xs font-semibold text-[#0a0a0a]/60 uppercase tracking-wider">Formato del archivo CSV</p>
                <p className="text-xs text-[#0a0a0a]/40 leading-relaxed">
                  El archivo debe tener exactamente estas dos columnas. Los contactos repetidos se actualizan sin duplicar.
                </p>
                {/* Visual table example */}
                <div className="rounded-lg overflow-hidden text-xs" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                  <div className="grid grid-cols-2" style={{ background: "#0a0a0a", color: "#fff" }}>
                    <div className="px-3 py-1.5 font-semibold border-r border-white/10">A</div>
                    <div className="px-3 py-1.5 font-semibold">B</div>
                  </div>
                  {[
                    { a: "email", b: "nombre", header: true },
                    { a: "juan@email.com", b: "Juan Pérez", header: false },
                    { a: "maria@email.com", b: "María López", header: false },
                    { a: "carlos@email.com", b: "Carlos Ruiz", header: false },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-2" style={{ background: row.header ? "rgba(0,0,0,0.06)" : i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                      <div className="px-3 py-1.5 border-r truncate" style={{ borderColor: "rgba(0,0,0,0.07)", color: row.header ? "#0a0a0a" : "#555", fontWeight: row.header ? 700 : 400 }}>{row.a}</div>
                      <div className="px-3 py-1.5 truncate" style={{ color: row.header ? "#0a0a0a" : "#555", fontWeight: row.header ? 700 : 400 }}>{row.b}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* File input */}
              <label className="flex flex-col items-center justify-center rounded-xl py-8 cursor-pointer transition-colors"
                style={{ border: "2px dashed rgba(0,0,0,0.1)", background: importRows.length > 0 ? "rgba(90,138,106,0.05)" : "transparent" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" className="mb-3">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {importRows.length > 0
                  ? <p className="text-sm font-semibold" style={{ color: "#5a8a6a" }}>{importRows.length} contactos detectados</p>
                  : <p className="text-sm text-[#0a0a0a]/30">Seleccioná un archivo .csv</p>}
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
              </label>

              {/* Preview */}
              {importRows.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)", maxHeight: 160, overflowY: "auto" }}>
                  {importRows.slice(0, 5).map((r, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-xs" style={{ borderBottom: i < Math.min(importRows.length, 5) - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <span className="text-[#0a0a0a]/60 flex-1 truncate">{r.email}</span>
                      <span className="text-[#0a0a0a]/30 truncate">{r.full_name || "—"}</span>
                    </div>
                  ))}
                  {importRows.length > 5 && <div className="px-4 py-2 text-[10px] text-[#0a0a0a]/25">...y {importRows.length - 5} más</div>}
                </div>
              )}

              {importError && <p className="text-red-500 text-xs">{importError}</p>}

              <button onClick={handleImport} disabled={importing || importRows.length === 0}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: "#0a0a0a", color: "#fff" }}>
                {importing ? "Importando…" : `Importar ${importRows.length} contactos`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
