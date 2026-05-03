"use client";

import { useState } from "react";
import ImageUploadField from "@/app/components/ImageUploadField";

type TeamMember = { id: string; member_email: string; role: string; created_at: string };
type CustomLink = { name: string; url: string };

const TABS = ["Status", "Profile", "Brand image", "Security", "Business details", "Taxes", "Notifications"];

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

const ORG_TYPE_OPTIONS: { value: OrgType; label: string; description: string }[] = [
  { value: "discoteca", label: "Discoteca / Venue", description: "Tienes un espacio físico con eventos recurrentes" },
  { value: "organizador", label: "Organizador", description: "Produces eventos en distintos lugares" },
  { value: "festival", label: "Festival", description: "Eventos multi-artista o multi-jornada" },
];

function StatusTab({ role, organizerType: initialType }: { role: string; organizerType?: string }) {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState<OrgType | null>((initialType as OrgType) ?? null);
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeSaved, setTypeSaved] = useState(false);

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
        <p className="text-[#0a0a0a]/35 text-sm mb-4">Personaliza tu dashboard según cómo usas Vybz.</p>

        <div className="flex flex-col gap-2 mb-4">
          {ORG_TYPE_OPTIONS.map((opt) => {
            const isSelected = selectedType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedType(opt.value)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                style={{
                  background: isSelected ? "#0a0a0a" : "rgba(0,0,0,0.02)",
                  border: isSelected ? "1px solid #0a0a0a" : "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                  style={{ borderColor: isSelected ? "#fff" : "rgba(0,0,0,0.2)" }}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: isSelected ? "#fff" : "#0a0a0a" }}>
                    {opt.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: isSelected ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)" }}>
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

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
      </div>

      <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />

      <div>
        <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Account status</h2>
        <p className="text-[#0a0a0a]/35 text-sm">Your account status is managed by the Vybz team.</p>
      </div>

      <div className="p-5 rounded-2xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
        {isActive && (
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
            <div>
              <p className="text-[#0a0a0a] font-medium text-sm">Active account</p>
              <p className="text-[#0a0a0a]/35 text-xs mt-0.5">You can sell tickets and receive payments.</p>
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

export default function ConfigTabs({ profile, userId, userEmail, initialTeam, organizerType }: { profile: Profile | null; userId: string; userEmail: string; initialTeam: TeamMember[]; organizerType?: string }) {
  const [tab, setTab] = useState("Status");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [accountActive, setAccountActive] = useState(true);

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

  // Equipo
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("checkin");
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamError, setTeamError] = useState("");

  // Notificaciones
  const [notifyEmail, setNotifyEmail] = useState(userEmail);
  const [notifyCourtesy, setNotifyCourtesy] = useState(true);
  const [notifyPayments, setNotifyPayments] = useState(true);
  const [notifyRefunds, setNotifyRefunds] = useState(true);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setTeamSaving(true);
    setTeamError("");
    const res = await fetch("/api/organizador/equipo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setTeamError(data.error ?? "Error adding member");
    } else {
      setTeam((t) => [...t, data as TeamMember]);
      setNewMemberEmail("");
      setAddingMember(false);
    }
    setTeamSaving(false);
  }

  async function handleRemoveMember(id: string) {
    await fetch(`/api/organizador/equipo?id=${id}`, { method: "DELETE" });
    setTeam((t) => t.filter((m) => m.id !== id));
  }

  async function handleChangeRole(id: string, role: string) {
    setTeam((t) => t.map((m) => m.id === id ? { ...m, role } : m));
    await fetch("/api/organizador/equipo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
  }

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
            style={tab === t ? { color: "#0a0a0a", borderBottom: "2px solid #0a0a0a" } : { color: "rgba(0,0,0,0.3)" }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Status */}
      {tab === "Status" && (
        <StatusTab role={profile?.role ?? "organizer"} organizerType={organizerType} />
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
      {tab === "Security" && (
        <div className="max-w-2xl flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[#0a0a0a] font-semibold text-lg">Team</h2>
              <p className="text-[#0a0a0a]/35 text-xs mt-0.5">Add members with Check-in role for your event QR scanner.</p>
            </div>
            <button
              onClick={() => { setAddingMember((v) => !v); setTeamError(""); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: addingMember ? "rgba(0,0,0,0.06)" : "#0a0a0a", color: addingMember ? "#0a0a0a" : "#fff" }}
            >
              {addingMember ? "Cancel" : "+ Add"}
            </button>
          </div>

          {/* Tabla */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            {/* Header row */}
            <div
              className="grid text-[10px] font-semibold uppercase tracking-wider px-5 py-3"
              style={{
                gridTemplateColumns: "minmax(0,1fr) 110px 44px",
                background: "rgba(0,0,0,0.03)",
                color: "rgba(0,0,0,0.3)",
                borderBottom: "1px solid rgba(0,0,0,0.07)",
              }}
            >
              <div>Member</div><div>Role</div><div />
            </div>

            {/* Owner */}
            <div
              className="grid items-center px-5 py-4"
              style={{ gridTemplateColumns: "minmax(0,1fr) 110px 44px", borderBottom: team.length > 0 || addingMember ? "1px solid rgba(0,0,0,0.05)" : "none" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "#0a0a0a", color: "#fff" }}>
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[#0a0a0a] text-sm font-medium truncate">{userEmail}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>You</span>
                </div>
              </div>
              <span className="text-[#0a0a0a]/50 text-xs">Owner</span>
              <div />
            </div>

            {/* Team members */}
            {team.map((m, i) => (
              <div
                key={m.id}
                className="grid items-center px-5 py-4"
                style={{ gridTemplateColumns: "minmax(0,1fr) 110px 44px", borderBottom: i < team.length - 1 || addingMember ? "1px solid rgba(0,0,0,0.05)" : "none" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.4)" }}>
                    {m.member_email.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-[#0a0a0a]/70 text-sm truncate">{m.member_email}</p>
                </div>
                <select
                  value={m.role}
                  onChange={(e) => handleChangeRole(m.id, e.target.value)}
                  className="text-xs text-[#0a0a0a]/60 focus:outline-none rounded-lg px-2 py-1 transition-colors hover:bg-black/5"
                  style={{ background: "transparent", border: "1px solid transparent" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "transparent"}
                >
                  <option value="checkin">Check-in</option>
                  <option value="stats">Statistics</option>
                  <option value="pos">POS</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-[#0a0a0a]/20 hover:text-red-400 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Inline add form */}
            {addingMember && (
              <form onSubmit={handleAddMember} className="flex items-center gap-3 px-5 py-4" style={{ background: "rgba(0,0,0,0.015)" }}>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm text-[#0a0a0a]/70 focus:outline-none"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}
                >
                  <option value="checkin">Check-in</option>
                  <option value="stats">Statistics</option>
                  <option value="pos">POS</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={teamSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                  style={{ background: "#0a0a0a", color: "#fff" }}
                >
                  {teamSaving ? "..." : "Add"}
                </button>
              </form>
            )}
          </div>

          {teamError && <p className="text-red-400 text-xs">{teamError}</p>}
        </div>
      )}

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
