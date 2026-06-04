"use client";

import { useState, useEffect } from "react";
import ImageUploadField from "@/app/components/ImageUploadField";

type CustomLink = { name: string; url: string };

const TABS = ["Status", "Profile", "Brand image", "Security", "Business details", "Taxes", "Notifications", "Team"];

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar_url: string | null;
  cover_url?: string | null;
  instagram_url?: string | null;
  custom_links?: CustomLink[] | null;
  currency?: string | null;
  country?: string | null;
  description?: string | null;
  whatsapp?: string | null;
  is_public?: boolean | null;
};

const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";
const inputStyle = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" };
const labelClass = "block text-[#0a0a0a]/50 text-xs uppercase tracking-wider mb-2";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors shrink-0"
      style={{ background: checked ? "#0a0a0a" : "rgba(0,0,0,0.08)" }}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: checked ? "24px" : "4px" }}
      />
    </button>
  );
}

type OrgType = "discoteca" | "organizador" | "festival";
type FeatureItem = { text: string; exclusive: boolean };

const ORG_TYPE_OPTIONS: { value: OrgType; label: string; description: string; features: FeatureItem[] }[] = [
  {
    value: "discoteca",
    label: "Nightclub / Venue",
    description: "You have a physical space with recurring events",
    features: [
      { text: "Tickets & access control", exclusive: false },
      { text: "Bar POS & cashier app", exclusive: false },
      { text: "Permanent VIP table map", exclusive: true },
      { text: "Bar inventory with alerts", exclusive: true },
    ],
  },
  {
    value: "organizador",
    label: "Organizer",
    description: "You produce events across different venues",
    features: [
      { text: "Tickets & access control", exclusive: false },
      { text: "Bar POS & cashier app", exclusive: false },
      { text: "VIP tables per event", exclusive: false },
      { text: "Promo codes & traffic tracking", exclusive: false },
    ],
  },
  {
    value: "festival",
    label: "Festival",
    description: "Multi-artist or multi-day events",
    features: [
      { text: "Multi-day / multi-stage events", exclusive: true },
      { text: "Per-day tickets or full access", exclusive: true },
      { text: "Bar POS & cashier app", exclusive: false },
      { text: "Bar inventory with alerts", exclusive: true },
    ],
  },
];

function StatusTab({ role, organizerType: initialType, inventoryEnabled: initialInventoryEnabled }: { role: string; organizerType?: string; inventoryEnabled?: boolean }) {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState<OrgType | null>((initialType as OrgType) ?? null);
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeSaved, setTypeSaved] = useState(false);
  const [inventoryEnabled, setInventoryEnabled] = useState(initialInventoryEnabled ?? false);
  const [moduleSaving, setModuleSaving] = useState(false);

  const canHaveInventory = selectedType === "discoteca" || selectedType === "festival";

  async function handleToggleInventory(enabled: boolean) {
    setInventoryEnabled(enabled);
    setModuleSaving(true);
    await fetch("/api/organizador/set-organizer-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizer_type: selectedType, inventory_enabled: enabled }),
    });
    setModuleSaving(false);
    window.location.reload();
  }

  async function handleSaveType() {
    if (!selectedType) return;
    setTypeSaving(true);
    const res = await fetch("/api/organizador/set-organizer-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizer_type: selectedType }),
    });
    setTypeSaving(false);
    if (res.ok) {
      setTypeSaved(true);
      setTimeout(() => setTypeSaved(false), 2000);
    }
  }

  async function handleRequest() {
    setRequesting(true); setError("");
    const res = await fetch("/api/organizador/activation-request", { method: "POST" });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Error");
    else setRequested(true);
    setRequesting(false);
  }

  const isActive = role === "organizer" || role === "admin";
  const isSuspended = role === "suspended";
  const isPending = role === "pending_activation";

  return (
    <div className="max-w-2xl flex flex-col gap-6">

      {/* Organizer type — always visible, required */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[#0a0a0a] font-semibold text-lg">Organizer type</h2>
          {!initialType && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              Required
            </span>
          )}
        </div>
        <p className="text-[#0a0a0a]/60 text-sm mb-4">Customize your dashboard based on how you use Vybz.</p>

        <div className="flex flex-col gap-3 mb-4">
          {ORG_TYPE_OPTIONS.map((opt) => {
            const isSelected = selectedType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedType(opt.value)}
                className="flex gap-4 px-5 py-5 rounded-2xl text-left transition-all"
                style={{
                  background: isSelected ? "#0a0a0a" : "#fff",
                  border: isSelected ? "1px solid #0a0a0a" : "1px solid #e2e2e2",
                }}
              >
                {/* Radio */}
                <div
                  className="w-[18px] h-[18px] rounded-full border-2 shrink-0 flex items-center justify-center mt-0.5"
                  style={{ borderColor: isSelected ? "#fff" : "#aaaaaa" }}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold leading-snug" style={{ color: isSelected ? "#fff" : "#0a0a0a" }}>
                    {opt.label}
                  </p>
                  <p className="text-[13px] mt-0.5 mb-4" style={{ color: isSelected ? "#888888" : "#777777" }}>
                    {opt.description}
                  </p>

                  {/* Feature list — clean lines, no pills */}
                  <div className="flex flex-col gap-2">
                    {opt.features.map((f) => (
                      <div key={f.text} className="flex items-center gap-2.5">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                          <circle cx="7" cy="7" r="6.5"
                            stroke={isSelected ? "#ffffff" : "#0a0a0a"}
                          />
                          <path d="M4 7L6 9.5L10 5"
                            stroke={isSelected ? "#ffffff" : "#0a0a0a"}
                            strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          className="text-[13px]"
                          style={{ color: isSelected ? "#ffffff" : "#0a0a0a" }}
                        >
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleSaveType}
            disabled={!selectedType || typeSaving || selectedType === initialType}
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-30"
            style={{
              background: typeSaved ? "rgba(16,185,129,0.12)" : "#0a0a0a",
              color: typeSaved ? "#10b981" : "#fff",
              border: typeSaved ? "1px solid rgba(16,185,129,0.3)" : "none",
            }}
          >
            {typeSaving ? "Guardando…" : typeSaved ? "Guardado" : "Guardar tipo"}
          </button>
          {initialType && selectedType !== initialType && (
            <p className="text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>
              Changing your type won't delete your events or history.
            </p>
          )}
        </div>
      </div>

      {/* Modules — only for discoteca/festival */}
      {canHaveInventory && (
        <>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
          <div>
            <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Modules</h2>
            <p className="text-sm mb-4" style={{ color: "#888" }}>Enable or disable optional features for your account.</p>
            <div className="p-5 rounded-2xl flex items-center justify-between gap-4" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <p className="text-sm font-semibold text-[#0a0a0a]">Inventory management</p>
                  {moduleSaving && <span className="text-xs" style={{ color: "#888" }}>Saving…</span>}
                </div>
                <p className="text-xs" style={{ color: "#888" }}>
                  Track stock levels, manage suppliers, run physical counts, purchase orders and financial reports.
                  {!inventoryEnabled && " Only available for Discoteca and Festival accounts."}
                </p>
              </div>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => handleToggleInventory(!inventoryEnabled)}
                disabled={moduleSaving}
                className="relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50"
                style={{ background: inventoryEnabled ? "#0a0a0a" : "rgba(0,0,0,0.15)" }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                  style={{ transform: inventoryEnabled ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />

      <div>
        <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Account status</h2>
        <p className="text-[#0a0a0a]/60 text-sm">Your account status is managed by the Vybz team.</p>
      </div>

      <div className="p-5 rounded-2xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
        {isActive && (
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
            <div>
              <p className="text-[#0a0a0a] font-medium text-sm">Active account</p>
              <p className="text-[#0a0a0a]/60 text-xs mt-0.5">You can sell tickets and receive payments.</p>
            </div>
          </div>
        )}
        {isSuspended && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#ef4444" }} />
              <div>
                <p className="text-[#0a0a0a] font-medium text-sm">Suspended account</p>
                <p className="text-[#0a0a0a]/35 text-xs mt-0.5">Your account is inactive. Events don't accept new purchases.</p>
              </div>
            </div>
            {requested ? (
              <p className="text-xs font-semibold" style={{ color: "#b45309" }}>Request sent. The Vybz team will review it shortly.</p>
            ) : (
              <button
                onClick={handleRequest}
                disabled={requesting}
                className="self-start px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity disabled:opacity-40"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                {requesting ? "Sending..." : "Request activation"}
              </button>
            )}
            {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
          </div>
        )}
        {isPending && (
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ background: "#f59e0b" }} />
            <div>
              <p className="text-[#0a0a0a] font-medium text-sm">Activation request pending</p>
              <p className="text-[#0a0a0a]/35 text-xs mt-0.5">The Vybz team will review your request soon.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// ── Access code types ────────────────────────────────────────────────────────

type ScanSession = {
  id: string;
  code: string;
  type: string;
  label: string | null;
  is_active: boolean;
  last_active_at: string | null;
  created_at: string;
};

type OrgEvent = { id: string; name: string; date: string };

function formatCode(code: string) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

function connectionStatus(last_active_at: string | null): "connected" | "idle" | "offline" {
  if (!last_active_at) return "offline";
  const diff = Date.now() - new Date(last_active_at).getTime();
  if (diff < 90_000) return "connected";
  if (diff < 300_000) return "idle";
  return "offline";
}

const STATUS_DOT: Record<string, string> = {
  connected: "#10b981",
  idle: "#f59e0b",
  offline: "rgba(0,0,0,0.18)",
};
const STATUS_LABEL: Record<string, string> = {
  connected: "Connected",
  idle: "Idle",
  offline: "Not connected",
};
const TYPE_URLS: Record<string, string> = {
  scanner: "/scan",
  pos: "/pos",
  cashier: "/cashier",
};
const TYPE_NAMES: Record<string, string> = {
  scanner: "Scanner",
  pos: "POS",
  cashier: "Front Desk",
};

function nextSlotNumber(codes: ScanSession[], type: string): number {
  const prefix = TYPE_NAMES[type];
  const used = codes
    .filter(c => c.is_active && c.label?.startsWith(`${prefix} `))
    .map(c => parseInt(c.label!.slice(prefix.length + 1)) || 0);
  let n = 1;
  while (used.includes(n)) n++;
  return n;
}

// ── AccessCodeManager ────────────────────────────────────────────────────────

function AccessCodeManager({ eventId, type }: { eventId: string; type: "scanner" | "pos" | "cashier" }) {
  const [codes, setCodes] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loggingOut, setLoggingOut] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/organizador/scan-codes?event_id=${eventId}&type=${type}`)
      .then(r => r.json())
      .then(d => {
        setCodes((d.codes ?? []).filter((c: ScanSession) => c.type === type));
        setLoading(false);
      });
  }, [eventId, type]);

  async function addSlot() {
    setCreating(true);
    const n = nextSlotNumber(codes, type);
    const res = await fetch("/api/organizador/scan-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, label: `${TYPE_NAMES[type]} ${n}`, type }),
    });
    const data = await res.json();
    if (res.ok) setCodes(prev => [data.session, ...prev]);
    setCreating(false);
  }

  async function logout(id: string) {
    setLoggingOut(id);
    const res = await fetch(`/api/organizador/scan-codes/${id}`, { method: "PATCH" });
    const data = await res.json();
    if (res.ok) setCodes(prev => prev.map(c => c.id === id ? { ...data.session, last_active_at: null } : c));
    setLoggingOut(null);
  }

  async function remove(id: string) {
    // Regenerate first to kick any active device, then delete
    await fetch(`/api/organizador/scan-codes/${id}`, { method: "PATCH" });
    await fetch(`/api/organizador/scan-codes/${id}`, { method: "DELETE" });
    setCodes(prev => prev.filter(c => c.id !== id));
  }

  const activeCodes = codes.filter(c => c.is_active);
  const url = `${origin}${TYPE_URLS[type]}`;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between gap-4" style={{ background: "#f7f7f7", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex-1 min-w-0">
          <p className="text-[#0a0a0a] font-semibold text-sm">{TYPE_NAMES[type]} access</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[#0a0a0a]/35 text-xs font-mono truncate">{url}</p>
            <button
              onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
              style={{ background: copied ? "rgba(16,185,129,0.12)" : "rgba(0,0,0,0.06)", color: copied ? "#10b981" : "rgba(0,0,0,0.4)" }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <button
          onClick={addSlot}
          disabled={creating}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
          style={{ background: "#0a0a0a" }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/>
          </svg>
          {creating ? "Adding..." : `Add ${TYPE_NAMES[type].toLowerCase()}`}
        </button>
      </div>

      {/* Slots */}
      <div className="p-4 space-y-2.5">
        {loading ? (
          <p className="text-[#0a0a0a]/25 text-sm text-center py-4">Loading...</p>
        ) : activeCodes.length === 0 ? (
          <p className="text-[#0a0a0a]/25 text-sm text-center py-6">No active {TYPE_NAMES[type].toLowerCase()} slots</p>
        ) : (
          activeCodes.map(c => {
            const status = connectionStatus(c.last_active_at);
            const isLoggingOut = loggingOut === c.id;
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: STATUS_DOT[status], boxShadow: status === "connected" ? `0 0 5px ${STATUS_DOT.connected}` : "none" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[#0a0a0a] text-sm font-semibold">{c.label ?? TYPE_NAMES[type]}</p>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.4)" }}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p
                      className="font-[family-name:var(--font-bebas)]"
                      style={{ fontSize: 20, letterSpacing: "0.25em", color: isLoggingOut ? "rgba(0,0,0,0.2)" : "#0a0a0a" }}
                    >
                      {formatCode(c.code)}
                    </p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(c.code); setCopiedCode(c.id); setTimeout(() => setCopiedCode(null), 2000); }}
                      className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                      style={{ background: copiedCode === c.id ? "rgba(16,185,129,0.12)" : "rgba(0,0,0,0.06)", color: copiedCode === c.id ? "#10b981" : "rgba(0,0,0,0.4)" }}
                    >
                      {copiedCode === c.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Logout — regenerates code, kicks device out */}
                  <button
                    onClick={() => logout(c.id)}
                    disabled={isLoggingOut}
                    title="Force logout — generates new code"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
                    style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLoggingOut ? "animate-spin" : ""}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                  {/* Delete — removes slot permanently */}
                  <button
                    onClick={() => remove(c.id)}
                    title="Remove slot"
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ background: "rgba(239,68,68,0.06)", color: "#ef4444" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
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

// ── SecurityTab ───────────────────────────────────────────────────────────────

function SecurityTab() {
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetch("/api/organizador/eventos?limit=50")
      .then(r => r.json())
      .then(d => {
        const list: OrgEvent[] = (d.events ?? d ?? []).map((e: any) => ({ id: e.id, name: e.name, date: e.date }));
        setEvents(list);
        if (list.length > 0) setSelectedEventId(list[0].id);
        setLoadingEvents(false);
      })
      .catch(() => setLoadingEvents(false));
  }, []);

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div>
        <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Access management</h2>
        <p className="text-[#0a0a0a]/35 text-sm">Manage Scanner, POS and Cashier access codes per event.</p>
      </div>

      {/* Event selector */}
      {loadingEvents ? (
        <p className="text-[#0a0a0a]/25 text-sm">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-[#0a0a0a]/25 text-sm">No events found. Create an event first.</p>
      ) : (
        <>
          <div>
            <label className="block text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-2">Event</label>
            <select
              value={selectedEventId ?? ""}
              onChange={e => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] focus:outline-none"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          {selectedEventId && (
            <div className="flex flex-col gap-4">
              <AccessCodeManager key={`scanner-${selectedEventId}`} eventId={selectedEventId} type="scanner" />
              <AccessCodeManager key={`pos-${selectedEventId}`} eventId={selectedEventId} type="pos" />
              <AccessCodeManager key={`cashier-${selectedEventId}`} eventId={selectedEventId} type="cashier" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── TeamTab ───────────────────────────────────────────────────────────────────

type TeamMember = { id: string; email: string; name: string | null; role: string; status: string; last_login_at: string | null; created_at: string };

const ROLE_LABELS: Record<string, string> = { bar_manager: "Bar Manager", inventory_staff: "Inventory Staff", procurement: "Procurement" };
const ROLE_OPTIONS = [
  { value: "bar_manager", label: "Bar Manager", desc: "Full inventory access, counts, purchase orders, reports" },
  { value: "inventory_staff", label: "Inventory Staff", desc: "View stock, physical counts, mark empty bottles" },
  { value: "procurement", label: "Procurement", desc: "View stock, create and receive purchase orders" },
];

function TeamTab() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("inventory_staff");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");

  function loadMembers() {
    fetch("/api/organizador/team")
      .then(r => r.json())
      .then(d => { setMembers(d.members ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadMembers(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(""); setInviteSuccess(null); setInviting(true);
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) { setInviteError(data.error ?? "Failed to send invite"); return; }
    setInviteSuccess(data.inviteUrl);
    setInviteEmail("");
    loadMembers();
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/organizador/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadMembers();
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this team member? They will lose access immediately.")) return;
    await fetch(`/api/organizador/team/${id}`, { method: "DELETE" });
    loadMembers();
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      invited:   { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b", label: "Invited" },
      active:    { bg: "rgba(16,185,129,0.1)",  color: "#10b981", label: "Active" },
      suspended: { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", label: "Suspended" },
    };
    const s = map[status] ?? map.invited;
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <div className="max-w-2xl flex flex-col gap-8">
      {/* Invite form */}
      <div>
        <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Invite team member</h2>
        <p className="text-sm mb-5" style={{ color: "#777" }}>
          Team members get access to inventory management with limited permissions based on their role.
        </p>
        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <div>
            <label className={labelClass}>Email address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="staff@yourvenue.com"
              required
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setInviteRole(opt.value)}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: inviteRole === opt.value ? "#0a0a0a" : "rgba(0,0,0,0.02)",
                    border: inviteRole === opt.value ? "1px solid #0a0a0a" : "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="w-3.5 h-3.5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                    style={{ borderColor: inviteRole === opt.value ? "#fff" : "#aaa" }}>
                    {inviteRole === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: inviteRole === opt.value ? "#fff" : "#0a0a0a" }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: inviteRole === opt.value ? "#888" : "#777" }}>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {inviteError && <p className="text-sm" style={{ color: "#ef4444" }}>{inviteError}</p>}
          {inviteSuccess && (
            <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <p className="font-medium mb-1" style={{ color: "#10b981" }}>Invitation sent!</p>
              <p className="text-xs break-all" style={{ color: "#555" }}>Share this link if email doesn't arrive: <span className="font-mono">{inviteSuccess}</span></p>
            </div>
          )}
          <button
            type="submit"
            disabled={inviting}
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40 self-start"
            style={{ background: "#0a0a0a", color: "#fff" }}
          >
            {inviting ? "Sending…" : "Send invitation"}
          </button>
        </form>
      </div>

      <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />

      {/* Team list */}
      <div>
        <h2 className="text-[#0a0a0a] font-semibold text-lg mb-4">Your team</h2>
        {loading ? (
          <p className="text-sm" style={{ color: "#888" }}>Loading…</p>
        ) : members.length === 0 ? (
          <div className="p-6 rounded-2xl text-center" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-sm font-medium text-[#0a0a0a] mb-1">No team members yet</p>
            <p className="text-xs" style={{ color: "#888" }}>Invite your first team member above</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(0,0,0,0.06)" }}>
                  <span className="text-sm font-bold text-[#0a0a0a]">{(m.name ?? m.email).charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#0a0a0a] truncate">{m.name ?? m.email}</p>
                    {statusBadge(m.status)}
                  </div>
                  <p className="text-xs truncate" style={{ color: "#777" }}>{m.name ? m.email : ""} · {ROLE_LABELS[m.role] ?? m.role}</p>
                  {m.last_login_at && (
                    <p className="text-[10px]" style={{ color: "#aaa" }}>
                      Last login {new Date(m.last_login_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {m.status === "active" && (
                    <button onClick={() => handleStatusChange(m.id, "suspended")}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                      Suspend
                    </button>
                  )}
                  {m.status === "suspended" && (
                    <button onClick={() => handleStatusChange(m.id, "active")}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
                      Reactivate
                    </button>
                  )}
                  <button onClick={() => handleRemove(m.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: "rgba(0,0,0,0.04)", color: "#aaa" }}
                    title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ConfigTabs ───────────────────────────────────────────────────────────

export default function ConfigTabs({ profile, userId, userEmail, organizerType, inventoryEnabled }: { profile: Profile | null; userId: string; userEmail: string; organizerType?: string; inventoryEnabled?: boolean }) {
  const [tab, setTab] = useState("Status");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Perfil state
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [orgEmail, setOrgEmail] = useState(profile?.email ?? userEmail);
  const [profileCurrency, setProfileCurrency] = useState(profile?.currency ?? "CRC");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ?? "");
  const [publicProfile, setPublicProfile] = useState(profile?.is_public ?? true);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [coverUrl, setCoverUrl] = useState(profile?.cover_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url ?? "");
  const [customLinks, setCustomLinks] = useState<CustomLink[]>(
    Array.isArray(profile?.custom_links) ? profile.custom_links : []
  );

  // Detalles empresa
  const [accountType, setAccountType] = useState("Personal");
  const [firstName, setFirstName] = useState(profile?.full_name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(profile?.full_name?.split(" ")[1] ?? "");
  const [businessEmail, setBusinessEmail] = useState(userEmail);
  const [idNumber, setIdNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("+506");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState("");

  // Impuestos
  const [chargesTax, setChargesTax] = useState(false);
  const [taxPercent, setTaxPercent] = useState("13");
  const [taxName, setTaxName] = useState("IVA");
  const [entityType, setEntityType] = useState<"company" | "individual">("individual");
  const [taxLegalName, setTaxLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [taxAddress, setTaxAddress] = useState("");
  const [taxPostcode, setTaxPostcode] = useState("");
  const [taxCountry, setTaxCountry] = useState("Costa Rica");
  const [taxProvince, setTaxProvince] = useState("");
  const [taxCity, setTaxCity] = useState("");
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxSaved, setTaxSaved] = useState(false);
  const [taxError, setTaxError] = useState("");

  // Business details
  const [bizSaving, setBizSaving] = useState(false);
  const [bizSaved, setBizSaved] = useState(false);
  const [bizError, setBizError] = useState("");


  // Notificaciones
  const [notifyEmail, setNotifyEmail] = useState(userEmail);
  const [notifyCourtesy, setNotifyCourtesy] = useState(true);
  const [notifyPayments, setNotifyPayments] = useState(true);
  const [notifyRefunds, setNotifyRefunds] = useState(true);

  async function handleSavePerfil(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/organizador/perfil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName, email: orgEmail, currency: profileCurrency, country,
        description, whatsapp, is_public: publicProfile,
        avatar_url: avatarUrl || null, cover_url: coverUrl || null,
        instagram_url: instagramUrl || null,
        custom_links: customLinks.filter(l => l.name && l.url),
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addLink() { setCustomLinks(l => [...l, { name: "", url: "" }]); }
  function removeLink(i: number) { setCustomLinks(l => l.filter((_, idx) => idx !== i)); }
  function updateLink(i: number, field: "name" | "url", val: string) {
    setCustomLinks(l => l.map((link, idx) => idx === i ? { ...link, [field]: val } : link));
  }

  async function handleSaveBusiness() {
    setBizSaving(true); setBizError(""); setBizSaved(false);
    try {
      const res = await fetch("/api/organizador/business-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_type: accountType,
          first_name: firstName,
          last_name: lastName,
          email: businessEmail,
          id_number: idNumber,
          phone_code: phoneCode,
          phone_number: phoneNumber,
          company_name: companyName,
          company_id: companyId,
        }),
      });
      if (!res.ok) { const d = await res.json(); setBizError(d.error ?? "Error saving"); return; }
      setBizSaved(true);
      setTimeout(() => setBizSaved(false), 2500);
    } catch {
      setBizError("Network error");
    } finally {
      setBizSaving(false);
    }
  }

  async function handleSaveTax() {
    setTaxSaving(true); setTaxError(""); setTaxSaved(false);
    try {
      const res = await fetch("/api/organizador/impuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charges_tax: chargesTax,
          tax_name: taxName,
          tax_percent: parseFloat(taxPercent) || 13,
          tax_entity_type: entityType,
          tax_legal_name: taxLegalName || null,
          tax_id_number: taxId || null,
          tax_address: taxAddress || null,
          tax_postcode: taxPostcode || null,
          tax_country: taxCountry || null,
          tax_province: taxProvince || null,
          tax_city: taxCity || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Error"); }
      setTaxSaved(true);
      setTimeout(() => setTaxSaved(false), 2500);
    } catch (e: unknown) {
      setTaxError(e instanceof Error ? e.message : "Error saving");
    } finally { setTaxSaving(false); }
  }

  const sectionStyle = { background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.07)" };

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-8" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
            style={tab === t ? { color: "#0a0a0a", borderBottom: "2px solid #0a0a0a" } : { color: "#666666" }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Status */}
      {tab === "Status" && (
        <StatusTab role={profile?.role ?? "organizer"} organizerType={organizerType} inventoryEnabled={inventoryEnabled} />
      )}

      {/* Profile */}
      {tab === "Profile" && (
        <form onSubmit={handleSavePerfil} className="max-w-2xl flex flex-col gap-6">
          <div className="rounded-2xl p-5 flex items-start gap-4" style={sectionStyle}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.2)" }}>
              <div className="w-3 h-3 rounded-full" style={{ background: "#10b981" }} />
            </div>
            <div className="flex-1">
              <p className="text-[#0a0a0a] font-semibold text-sm">Publicly visible organizer page</p>
              <p className="text-[#0a0a0a]/35 text-xs mt-0.5">Attendees can view your organizer profile and upcoming events.</p>
            </div>
            <Toggle checked={publicProfile} onChange={setPublicProfile} />
          </div>

          <div>
            <label className={labelClass}>Organizer name *</label>
            <input type="text" className={inputClass} style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" className={inputClass} style={inputStyle} value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>WhatsApp</label>
              <input type="text" className={inputClass} style={inputStyle} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+506 8888-8888" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Country</label>
            <select className={inputClass} style={inputStyle} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">Select a country</option>
              <option value="Costa Rica">Costa Rica</option>
              <option value="Guatemala">Guatemala</option>
              <option value="Honduras">Honduras</option>
              <option value="El Salvador">El Salvador</option>
              <option value="Nicaragua">Nicaragua</option>
              <option value="Panamá">Panamá</option>
              <option value="México">México</option>
              <option value="Colombia">Colombia</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Perú">Perú</option>
              <option value="Chile">Chile</option>
              <option value="Argentina">Argentina</option>
              <option value="Uruguay">Uruguay</option>
              <option value="España">España</option>
              <option value="Estados Unidos">Estados Unidos</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Moneda principal */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.02)" }}>
              <p className="text-[#0a0a0a] font-semibold text-sm">Primary currency</p>
              <p className="text-[#0a0a0a]/40 text-xs mt-0.5 leading-relaxed">
                Defines the currency in which you sell your tickets. <strong>All your events and the financial panel will use this currency.</strong>
              </p>
            </div>
            <div className="px-5 py-4 flex gap-3">
              {(["CRC", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setProfileCurrency(c)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: profileCurrency === c ? "#0a0a0a" : "rgba(0,0,0,0.04)",
                    color: profileCurrency === c ? "#fff" : "rgba(0,0,0,0.45)",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  {c === "CRC" ? "₡ Costa Rican colón (CRC)" : "$ US dollar (USD)"}
                </button>
              ))}
            </div>
            <div className="px-5 py-3 flex gap-2 items-start" style={{ borderTop: "1px solid rgba(0,0,0,0.05)", background: "rgba(245,158,11,0.03)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" className="shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-[10px] leading-relaxed" style={{ color: "#92400e" }}>
                Your bank account must be in the same currency you choose here. If you sell in <strong>₡ colones</strong>, you need a CRC account. If you sell in <strong>$ dollars</strong>, you need a USD account. Changing this does not convert existing prices.
              </p>
            </div>
          </div>

          {saved && <p className="text-green-400 text-sm">Saved successfully</p>}
          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl font-semibold disabled:opacity-50" style={{ background: "#0a0a0a", color: "#fff" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      )}

      {/* Brand image */}
      {tab === "Brand image" && (
        <form onSubmit={handleSavePerfil} className="max-w-2xl flex flex-col gap-6">
          <div>
            <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Brand image</h2>
            <p className="text-[#0a0a0a]/35 text-sm">Configure how your public organizer profile appears.</p>
          </div>

          <div>
            <label className={labelClass}>Profile photo</label>
            <ImageUploadField value={avatarUrl} onChange={setAvatarUrl} label="" hint="JPG, PNG · recommended 400×400px" aspectRatio="1:1" />
          </div>

          <div>
            <label className={labelClass}>Cover image (banner)</label>
            <ImageUploadField value={coverUrl} onChange={setCoverUrl} label="" hint="JPG, PNG · recommended 1200×300px" aspectRatio="16:9" />
          </div>

          <div>
            <label className={labelClass}>Organizer description</label>
            <textarea
              rows={4}
              className={inputClass}
              style={{ ...inputStyle, resize: "none" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your organization..."
            />
          </div>

          <div>
            <label className={labelClass}>Instagram</label>
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="@yourorganization or https://instagram.com/..."
            />
          </div>

          <div>
            <label className={labelClass}>Additional links</label>
            <div className="flex flex-col gap-2">
              {customLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    className={inputClass}
                    style={{ ...inputStyle, flex: "0 0 140px" }}
                    placeholder="Name"
                    value={link.name}
                    onChange={(e) => updateLink(i, "name", e.target.value)}
                  />
                  <input
                    type="url"
                    className={inputClass}
                    style={inputStyle}
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                  />
                  <button type="button" onClick={() => removeLink(i)} className="text-[#0a0a0a]/25 hover:text-red-400 transition-colors shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLink}
                className="self-start text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)" }}
              >
                + Add link
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Public organizer URL</label>
            <input
              type="text"
              readOnly
              value={`https://vybztickets.com/o/${fullName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "your-organization"}`}
              className={inputClass}
              style={{ ...inputStyle, color: "rgba(0,0,0,0.35)" }}
            />
          </div>

          {saved && <p className="text-green-400 text-sm">Saved successfully</p>}
          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl font-semibold disabled:opacity-50" style={{ background: "#0a0a0a", color: "#fff" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      )}

      {/* Security */}
      {tab === "Security" && <SecurityTab />}

      {/* Team */}
      {tab === "Team" && <TeamTab />}

      {/* Business details */}
      {tab === "Business details" && (
        <div className="max-w-2xl flex flex-col gap-6">
          <div>
            <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Business details</h2>
            <p className="text-[#0a0a0a]/35 text-sm">Configure your business details here.</p>
          </div>

          <div>
            <label className={labelClass}>Account type</label>
            <select className={inputClass} style={inputStyle} value={accountType} onChange={(e) => setAccountType(e.target.value)}>
              <option value="Personal">Personal</option>
              <option value="Empresa">Company</option>
            </select>
          </div>

          {/* Representative / personal data section */}
          <div className="pt-1 pb-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider">
              {accountType === "Empresa" ? "Legal representative details" : "Personal details"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First name</label>
              <input type="text" className={inputClass} style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input type="text" className={inputClass} style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>ID number</label>
              <input type="text" className={inputClass} style={inputStyle} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="1-2345-6789" />
            </div>
            <div>
              <label className={labelClass}>Email (legal)</label>
              <input type="email" className={inputClass} style={inputStyle} value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} placeholder="email@company.com" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Phone number</label>
            <div className="flex gap-0 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <select
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                className="px-3 py-3 text-sm text-[#0a0a0a]/70 focus:outline-none shrink-0"
                style={{ background: "rgba(0,0,0,0.04)", borderRight: "1px solid rgba(0,0,0,0.08)" }}
              >
                {[
                  { flag: "🇨🇷", code: "+506", name: "CR" },
                  { flag: "🇺🇸", code: "+1",   name: "US" },
                  { flag: "🇲🇽", code: "+52",  name: "MX" },
                  { flag: "🇨🇴", code: "+57",  name: "CO" },
                  { flag: "🇦🇷", code: "+54",  name: "AR" },
                  { flag: "🇧🇷", code: "+55",  name: "BR" },
                  { flag: "🇵🇦", code: "+507", name: "PA" },
                  { flag: "🇬🇹", code: "+502", name: "GT" },
                  { flag: "🇸🇻", code: "+503", name: "SV" },
                  { flag: "🇭🇳", code: "+504", name: "HN" },
                  { flag: "🇳🇮", code: "+505", name: "NI" },
                  { flag: "🇩🇴", code: "+1809",name: "DO" },
                  { flag: "🇵🇷", code: "+1787",name: "PR" },
                  { flag: "🇵🇪", code: "+51",  name: "PE" },
                  { flag: "🇨🇱", code: "+56",  name: "CL" },
                  { flag: "🇧🇴", code: "+591", name: "BO" },
                  { flag: "🇪🇨", code: "+593", name: "EC" },
                  { flag: "🇵🇾", code: "+595", name: "PY" },
                  { flag: "🇺🇾", code: "+598", name: "UY" },
                  { flag: "🇻🇪", code: "+58",  name: "VE" },
                  { flag: "🇨🇺", code: "+53",  name: "CU" },
                  { flag: "🇪🇸", code: "+34",  name: "ES" },
                  { flag: "🇬🇧", code: "+44",  name: "GB" },
                  { flag: "🇫🇷", code: "+33",  name: "FR" },
                  { flag: "🇩🇪", code: "+49",  name: "DE" },
                  { flag: "🇮🇹", code: "+39",  name: "IT" },
                  { flag: "🇵🇹", code: "+351", name: "PT" },
                  { flag: "🇨🇦", code: "+1",   name: "CA" },
                  { flag: "🇦🇺", code: "+61",  name: "AU" },
                  { flag: "🇨🇳", code: "+86",  name: "CN" },
                  { flag: "🇯🇵", code: "+81",  name: "JP" },
                  { flag: "🇮🇳", code: "+91",  name: "IN" },
                ].map((c) => (
                  <option key={c.name + c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="8888 8888"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 px-4 py-3 text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none"
                style={{ background: "rgba(0,0,0,0.04)" }}
              />
            </div>
          </div>

          {/* Detalles de negocio (solo si Empresa) */}
          {accountType === "Empresa" && (
            <>
              <div className="pt-1 pb-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider">Business details</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Company name</label>
                  <input type="text" className={inputClass} style={inputStyle} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Company ID</label>
                  <input type="text" className={inputClass} style={inputStyle} value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {bizError && <p className="text-red-500 text-xs">{bizError}</p>}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleSaveBusiness}
              disabled={bizSaving}
              className="w-full py-3 rounded-xl font-semibold disabled:opacity-60 transition-colors"
              style={{ background: bizSaved ? "rgba(16,185,129,0.15)" : "#0a0a0a", color: bizSaved ? "#10b981" : "#fff", border: bizSaved ? "1px solid rgba(16,185,129,0.3)" : "none" }}
            >
              {bizSaving ? "Saving..." : bizSaved ? "Saved!" : "Save"}
            </button>
            <button
              onClick={() => { setFirstName(""); setLastName(""); setBusinessEmail(userEmail); setIdNumber(""); setPhoneCode("+506"); setPhoneNumber(""); setCompanyName(""); setCompanyId(""); }}
              className="w-full py-3 rounded-xl font-semibold"
              style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Taxes */}
      {tab === "Taxes" && (
        <div className="max-w-2xl flex flex-col gap-6">
          <div>
            <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Taxes</h2>
            <p className="text-[#0a0a0a]/35 text-sm">Configure whether you want to charge taxes on your events and your entity's tax details.</p>
          </div>

          {/* Toggle charge taxes */}
          <div className="flex items-center justify-between p-5 rounded-2xl" style={sectionStyle}>
            <div>
              <p className="text-[#0a0a0a]/80 text-sm font-medium">Charge taxes on your events?</p>
              <p className="text-[#0a0a0a]/30 text-xs mt-0.5">Tax will be shown broken down in the purchase summary</p>
            </div>
            <Toggle checked={chargesTax} onChange={setChargesTax} />
          </div>

          {chargesTax && (
            <>
              {/* Porcentaje e nombre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tax name</label>
                  <input type="text" value={taxName} onChange={(e) => setTaxName(e.target.value)} placeholder="VAT" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass}>Percentage (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} className={inputClass} style={inputStyle} />
                </div>
              </div>

              {/* Separador */}
              <div className="pt-2 pb-1" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider">Entity tax details</p>
                <p className="text-[#0a0a0a]/20 text-xs mt-1">Required for electronic invoicing and legal documents (ACAM, HACIENDA)</p>
              </div>

              {/* Tipo de entidad */}
              <div>
                <label className={labelClass}>Entity type</label>
                <div className="flex gap-4">
                  {([
                    { key: "company", label: "Company / Corporation" },
                    { key: "individual", label: "Individual" },
                  ] as { key: "company" | "individual"; label: string }[]).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setEntityType(key)}
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                        style={{
                          borderColor: entityType === key ? "#0a0a0a" : "rgba(0,0,0,0.15)",
                          background: entityType === key ? "rgba(0,0,0,0.08)" : "transparent",
                        }}
                      >
                        {entityType === key && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#0a0a0a" }} />}
                      </button>
                      <span className="text-[#0a0a0a]/70 text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Campos según tipo */}
              {entityType === "company" ? (
                <>
                  <div>
                    <label className={labelClass}>Legal name *</label>
                    <input type="text" value={taxLegalName} onChange={(e) => setTaxLegalName(e.target.value)} placeholder="Company legal name" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className={labelClass}>Tax ID *</label>
                    <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="3-101-XXXXXX" className={inputClass} style={inputStyle} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={labelClass}>Full name *</label>
                    <input type="text" value={taxLegalName} onChange={(e) => setTaxLegalName(e.target.value)} placeholder="Full name as on ID" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className={labelClass}>ID number *</label>
                    <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="1-XXXX-XXXX" className={inputClass} style={inputStyle} />
                  </div>
                </>
              )}

              <div>
                <label className={labelClass}>Address *</label>
                <input type="text" value={taxAddress} onChange={(e) => setTaxAddress(e.target.value)} placeholder="Exact address" className={inputClass} style={inputStyle} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Postal code</label>
                  <input type="text" value={taxPostcode} onChange={(e) => setTaxPostcode(e.target.value)} placeholder="10101" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass}>Country *</label>
                  <input type="text" value={taxCountry} onChange={(e) => setTaxCountry(e.target.value)} className={inputClass} style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Province *</label>
                  <select value={taxProvince} onChange={(e) => setTaxProvince(e.target.value)} className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }}>
                    <option value="">Select</option>
                    {["San José", "Alajuela", "Cartago", "Heredia", "Guanacaste", "Puntarenas", "Limón"].map((p) => (
                      <option key={p} value={p} style={{ background: "#fff" }}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>City / Canton *</label>
                  <input type="text" value={taxCity} onChange={(e) => setTaxCity(e.target.value)} placeholder="San José" className={inputClass} style={inputStyle} />
                </div>
              </div>
            </>
          )}

          {taxError && <p className="text-red-400 text-sm">{taxError}</p>}
          <button
            onClick={handleSaveTax}
            disabled={taxSaving}
            className="w-full py-3 rounded-xl font-semibold disabled:opacity-50 transition-all"
            style={{ background: taxSaved ? "rgba(16,185,129,0.2)" : "#0a0a0a", color: taxSaved ? "#10b981" : "#fff", border: taxSaved ? "1px solid rgba(16,185,129,0.4)" : "none" }}
          >
            {taxSaving ? "Saving..." : taxSaved ? "Saved!" : "Save"}
          </button>
        </div>
      )}

      {/* Notifications */}
      {tab === "Notifications" && (
        <div className="max-w-2xl flex flex-col gap-6">
          <div>
            <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Customer email</h2>
            <p className="text-[#0a0a0a]/35 text-sm">Manage which emails receive notifications.</p>
          </div>

          <div>
            <label className={labelClass}>Default language</label>
            <select className={inputClass} style={inputStyle}>
              <option>English</option>
              <option>Español</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Emails for purchase notifications</label>
            <input type="email" className={inputClass} style={inputStyle} value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} />
          </div>

          <div className="flex flex-col gap-3">
            {[
              { label: "Notify complimentary purchases", state: notifyCourtesy, set: setNotifyCourtesy },
              { label: "Notify successful payments", state: notifyPayments, set: setNotifyPayments },
              { label: "Notify refunds", state: notifyRefunds, set: setNotifyRefunds },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-xl" style={sectionStyle}>
                <span className="text-[#0a0a0a]/60 text-sm">{item.label}</span>
                <Toggle checked={item.state} onChange={item.set} />
              </div>
            ))}
          </div>

          <button className="w-full py-3 rounded-xl font-semibold" style={{ background: "#0a0a0a", color: "#fff" }}>
            Save
          </button>
        </div>
      )}

    </div>
  );
}
