"use client";

import { useState, useEffect, useRef } from "react";

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
};

export default function MarketingClient({ events, organizerName }: Props) {
  const [tab, setTab] = useState<"correos" | "contactos">("correos");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingCamp, setLoadingCamp] = useState(true);
  const [loadingCont, setLoadingCont] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Campaign form
  const [fSubject, setFSubject] = useState("");
  const [fImage, setFImage] = useState("");
  const [fBody, setFBody] = useState("");
  const [fCtaText, setFCtaText] = useState("");
  const [fCtaUrl, setFCtaUrl] = useState("");
  const [fAudience, setFAudience] = useState("all");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  // Import
  const [importRows, setImportRows] = useState<{ email: string; full_name: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/organizador/marketing/campaigns")
      .then((r) => r.json())
      .then((d) => { setCampaigns(Array.isArray(d) ? d : []); setLoadingCamp(false); });
    fetch("/api/organizador/marketing/contacts")
      .then((r) => r.json())
      .then((d) => { setContacts(Array.isArray(d) ? d : []); setLoadingCont(false); });
  }, []);

  function resetForm() {
    setFSubject(""); setFImage(""); setFBody(""); setFCtaText(""); setFCtaUrl("");
    setFAudience("all"); setSendError(""); setSendSuccess("");
  }

  async function handleSend() {
    if (!fSubject.trim()) { setSendError("El asunto es requerido."); return; }
    setSending(true); setSendError("");
    const res = await fetch("/api/organizador/marketing/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: fSubject, body_text: fBody || null, image_url: fImage || null,
        cta_text: fCtaText || null, cta_url: fCtaUrl || null, audience: fAudience,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) { setSendError(data.error ?? "Error al enviar"); return; }
    setSendSuccess(`Campaña enviada a ${data.sent} destinatarios.`);
    setTimeout(() => {
      setShowCreate(false); resetForm();
      fetch("/api/organizador/marketing/campaigns").then((r) => r.json()).then((d) => setCampaigns(Array.isArray(d) ? d : []));
    }, 1800);
  }

  function parseCSV(text: string) {
    const lines = text.trim().split("\n").map((l) => l.replace(/\r/g, ""));
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const emailIdx = headers.findIndex((h) => h.includes("email") || h.includes("correo"));
    const nameIdx = headers.findIndex((h) => h.includes("nombre") || h.includes("name") || h.includes("full_name"));
    if (emailIdx === -1) return [];
    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
      return { email: cols[emailIdx] ?? "", full_name: nameIdx >= 0 ? cols[nameIdx] ?? "" : "" };
    }).filter((r) => r.email.includes("@"));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportRows(parseCSV(text));
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

  async function deleteContacts(ids: string[]) {
    await fetch("/api/organizador/marketing/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
  }

  const subscribedCount = contacts.filter((c) => c.subscribed).length;

  const audienceLabel = (aud: string) => {
    if (aud === "all") return "Todos los contactos";
    const ev = events.find((e) => `event:${e.id}` === aud);
    return ev ? `Asistentes · ${ev.name}` : aud;
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";
  const inputStyle = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Marketing</h1>
        <div className="flex gap-2">
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
            className="px-4 py-3 text-sm font-medium transition-colors capitalize"
            style={tab === t ? { color: "#0a0a0a", borderBottom: "2px solid #0a0a0a", marginBottom: -1 } : { color: "rgba(0,0,0,0.3)" }}
          >
            {t === "correos" ? "Correos" : `Contactos ${!loadingCont ? `(${subscribedCount})` : ""}`}
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
              <button
                onClick={() => { resetForm(); setShowCreate(true); }}
                className="text-xs font-semibold px-4 py-2 rounded-xl"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                Crear primer mensaje
              </button>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div
                className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
                style={{ gridTemplateColumns: "1fr 200px 160px 100px", background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
              >
                <div>Asunto</div>
                <div>Enviado a</div>
                <div>Fecha</div>
                <div className="text-right">Destinatarios</div>
              </div>
              {campaigns.map((c, i) => (
                <div
                  key={c.id}
                  className="grid items-center px-5 py-4"
                  style={{ gridTemplateColumns: "1fr 200px 160px 100px", borderBottom: i < campaigns.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
                >
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
          <div className="flex gap-4 mb-6">
            {[
              { label: "Suscritos", value: subscribedCount },
              { label: "Desuscritos", value: contacts.filter((c) => !c.subscribed).length },
              { label: "Total", value: contacts.length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl px-5 py-4 flex-1" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-[#0a0a0a]/40 text-xs mb-1">{s.label}</p>
                <p className="text-[#0a0a0a] text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          {loadingCont ? (
            <div className="py-16 text-center text-[#0a0a0a]/20 text-sm">Cargando…</div>
          ) : contacts.length === 0 ? (
            <div className="rounded-2xl py-20 text-center" style={{ border: "1px dashed rgba(0,0,0,0.08)" }}>
              <p className="text-[#0a0a0a]/20 text-sm mb-3">Sin contactos todavía</p>
              <button
                onClick={() => setShowImport(true)}
                className="text-xs font-semibold px-4 py-2 rounded-xl"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                Importar CSV
              </button>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div
                className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
                style={{ gridTemplateColumns: "1fr 160px 100px 80px 40px", background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
              >
                <div>Email</div><div>Nombre</div><div>Fuente</div><div>Estado</div><div />
              </div>
              {contacts.map((c, i) => (
                <div
                  key={c.id}
                  className="grid items-center px-5 py-3"
                  style={{ gridTemplateColumns: "1fr 160px 100px 80px 40px", borderBottom: i < contacts.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
                >
                  <p className="text-[#0a0a0a] text-sm">{c.email}</p>
                  <p className="text-[#0a0a0a]/50 text-sm truncate">{c.full_name || "—"}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full w-fit" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.4)" }}>
                    {c.source === "purchase" ? "Compra" : c.source === "import" ? "Importado" : c.source}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: c.subscribed ? "#5a8a6a" : "rgba(0,0,0,0.25)" }}>
                    {c.subscribed ? "Activo" : "Desuscrito"}
                  </span>
                  <button onClick={() => deleteContacts([c.id])} className="text-[#0a0a0a]/15 hover:text-red-400 transition-colors">
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCreate(false); resetForm(); } }}
        >
          <div className="w-full max-w-lg rounded-2xl flex flex-col" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div>
                <h3 className="text-[#0a0a0a] font-bold text-lg">Nuevo mensaje</h3>
                <p className="text-[#0a0a0a]/30 text-xs mt-0.5">Se enviará como <strong>{organizerName}</strong></p>
              </div>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1.5 uppercase tracking-wider">Asunto *</label>
                <input type="text" className={inputClass} style={inputStyle} placeholder="Ej: ¡Línea de artistas oficial!" value={fSubject} onChange={(e) => setFSubject(e.target.value)} />
              </div>

              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1.5 uppercase tracking-wider">Imagen del flyer (URL)</label>
                <input type="url" className={inputClass} style={inputStyle} placeholder="https://..." value={fImage} onChange={(e) => setFImage(e.target.value)} />
              </div>

              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1.5 uppercase tracking-wider">Mensaje</label>
                <textarea
                  rows={5}
                  className={inputClass}
                  style={{ ...inputStyle, resize: "none" }}
                  placeholder="Hola familia, queríamos contarles que..."
                  value={fBody}
                  onChange={(e) => setFBody(e.target.value)}
                />
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

              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-2 uppercase tracking-wider">Enviar a</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="audience" value="all" checked={fAudience === "all"} onChange={() => setFAudience("all")} className="accent-black" />
                    <span className="text-sm text-[#0a0a0a]">Todos los contactos <span className="text-[#0a0a0a]/30">({subscribedCount} suscritos)</span></span>
                  </label>
                  {events.map((ev) => (
                    <label key={ev.id} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="audience" value={`event:${ev.id}`} checked={fAudience === `event:${ev.id}`} onChange={() => setFAudience(`event:${ev.id}`)} className="accent-black" />
                      <span className="text-sm text-[#0a0a0a]">Asistentes de <strong>{ev.name}</strong></span>
                    </label>
                  ))}
                </div>
              </div>

              {sendError && <p className="text-red-500 text-xs">{sendError}</p>}
              {sendSuccess && <p className="text-emerald-600 text-xs font-semibold">{sendSuccess}</p>}
            </div>

            <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                {sending ? "Enviando…" : "Enviar campaña"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMPORT CSV MODAL ── */}
      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowImport(false); setImportRows([]); } }}
        >
          <div className="w-full max-w-md rounded-2xl" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <h3 className="text-[#0a0a0a] font-bold text-lg">Importar contactos</h3>
              <button onClick={() => { setShowImport(false); setImportRows([]); }} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="rounded-xl p-4 text-xs text-[#0a0a0a]/40 leading-relaxed" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                El archivo CSV debe tener columnas <strong>email</strong> y <strong>nombre</strong> (o <strong>full_name</strong>). La primera fila son los encabezados. Los contactos existentes se actualizan sin duplicar.
              </div>

              <div>
                <label
                  className="flex flex-col items-center justify-center rounded-xl py-8 cursor-pointer transition-colors"
                  style={{ border: "2px dashed rgba(0,0,0,0.1)", background: importRows.length > 0 ? "rgba(90,138,106,0.05)" : "transparent" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" className="mb-3">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {importRows.length > 0 ? (
                    <p className="text-sm font-semibold" style={{ color: "#5a8a6a" }}>{importRows.length} contactos detectados</p>
                  ) : (
                    <p className="text-sm text-[#0a0a0a]/30">Seleccioná un archivo .csv</p>
                  )}
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
                </label>
              </div>

              {importRows.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)", maxHeight: 180, overflowY: "auto" }}>
                  {importRows.slice(0, 5).map((r, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-xs" style={{ borderBottom: i < Math.min(importRows.length, 5) - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <span className="text-[#0a0a0a]/60 flex-1 truncate">{r.email}</span>
                      <span className="text-[#0a0a0a]/30 truncate">{r.full_name || "—"}</span>
                    </div>
                  ))}
                  {importRows.length > 5 && (
                    <div className="px-4 py-2 text-[10px] text-[#0a0a0a]/25">...y {importRows.length - 5} más</div>
                  )}
                </div>
              )}

              {importError && <p className="text-red-500 text-xs">{importError}</p>}

              <button
                onClick={handleImport}
                disabled={importing || importRows.length === 0}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                {importing ? "Importando…" : `Importar ${importRows.length} contactos`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
