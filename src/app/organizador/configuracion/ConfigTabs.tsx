"use client";

import { useState } from "react";

const TABS = ["Estado", "Perfil", "Imagen de marca", "Seguridad", "Detalles de la empresa", "Impuestos", "Notificaciones", "Integraciones"];

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar_url: string | null;
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

export default function ConfigTabs({ profile, userId, userEmail }: { profile: Profile | null; userId: string; userEmail: string }) {
  const [tab, setTab] = useState("Estado");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [accountActive, setAccountActive] = useState(true);

  // Perfil state
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [orgEmail, setOrgEmail] = useState(profile?.email ?? userEmail);
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [publicProfile, setPublicProfile] = useState(true);

  // Detalles empresa
  const [accountType, setAccountType] = useState("Personal");
  const [firstName, setFirstName] = useState(profile?.full_name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(profile?.full_name?.split(" ")[1] ?? "");
  const [idNumber, setIdNumber] = useState("");

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
      body: JSON.stringify({ full_name: fullName, email: orgEmail }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
      setTaxError(e instanceof Error ? e.message : "Error al guardar");
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

      {/* Estado */}
      {tab === "Estado" && (
        <div className="max-w-2xl flex flex-col gap-4">
          <div>
            <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Estado de la cuenta</h2>
            <p className="text-[#0a0a0a]/35 text-sm">Activa o desactiva tu cuenta de organizador.</p>
          </div>

          <div className="flex items-center justify-between p-5 rounded-2xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div>
              <p className="text-[#0a0a0a] font-medium text-sm">Cuenta activa</p>
              <p className="text-[#0a0a0a]/35 text-xs mt-0.5">
                {accountActive ? "Tu cuenta está activa. Puedes vender tickets y recibir pagos." : "Cuenta desactivada. Los eventos no aceptarán nuevas compras."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold" style={{ color: accountActive ? "#10b981" : "#ef4444" }}>
                {accountActive ? "Activa" : "Inactiva"}
              </span>
              <Toggle checked={accountActive} onChange={setAccountActive} />
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <h3 className="text-[#0a0a0a]/60 text-sm font-semibold mb-3">Resumen de la cuenta</h3>
            <div className="flex flex-col gap-2 text-xs">
              {[
                { label: "Plan", value: "Vybz Organizer" },
                { label: "Comisión", value: "5% por venta" },
                { label: "Pago de comisiones", value: "Mensual" },
                { label: "Soporte", value: "soporte@vybztickets.com" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-[#0a0a0a]/30">{r.label}</span>
                  <span className="text-[#0a0a0a]/60">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Perfil */}
      {tab === "Perfil" && (
        <form onSubmit={handleSavePerfil} className="max-w-2xl flex flex-col gap-6">
          <div className="rounded-2xl p-5 flex items-start gap-4" style={sectionStyle}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.2)" }}>
              <div className="w-3 h-3 rounded-full" style={{ background: "#10b981" }} />
            </div>
            <div className="flex-1">
              <p className="text-[#0a0a0a] font-semibold text-sm">Página de organizador visible públicamente</p>
              <p className="text-[#0a0a0a]/35 text-xs mt-0.5">Los asistentes pueden ver tu perfil de organizador y próximos eventos.</p>
            </div>
            <Toggle checked={publicProfile} onChange={setPublicProfile} />
          </div>

          <div>
            <label className={labelClass}>URL del Organizador</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`https://vybztickets.com/o/${fullName.toLowerCase().replace(/\s+/g, "-") || "tu-organizacion"}`}
                className={inputClass}
                style={{ ...inputStyle, color: "rgba(0,0,0,0.4)", flex: 1 }}
              />
              <button type="button" className="px-3 py-3 rounded-xl" style={inputStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0a0a0a]/40">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Nombre del organizador *</label>
            <input type="text" className={inputClass} style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Correo electrónico *</label>
              <input type="email" className={inputClass} style={inputStyle} value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>WhatsApp</label>
              <input type="text" className={inputClass} style={inputStyle} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+506 8888-8888" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Descripción del organizador</label>
            <textarea
              rows={4}
              className={inputClass}
              style={{ ...inputStyle, resize: "none" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu organización..."
            />
          </div>

          {saved && <p className="text-green-400 text-sm">Guardado correctamente</p>}
          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl font-semibold disabled:opacity-50" style={{ background: "#0a0a0a", color: "#fff" }}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </form>
      )}

      {/* Imagen de marca */}
      {tab === "Imagen de marca" && (
        <div className="max-w-2xl flex flex-col gap-6">
          <div>
            <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Imagen de marca</h2>
            <p className="text-[#0a0a0a]/35 text-sm">Configura tus elementos de marca para definir cómo tus clientes ven los eventos.</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[{ label: "Logo", hint: "PNG, JPG · 200x200px" }, { label: "Fondo", hint: "PNG, JPG · 1200x400px" }].map((item) => (
              <div key={item.label}>
                <label className={labelClass}>{item.label}</label>
                <div
                  className="h-32 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-white/5"
                  style={{ border: "2px dashed rgba(0,0,0,0.08)" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#0a0a0a]/20 mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="text-[#0a0a0a]/20 text-xs">{item.hint}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Color de fondo del encabezado", value: "#0a0a0a" },
              { label: "Color del texto", value: "#ffffff" },
              { label: "Color de acento", value: "#0a0a0a" },
              { label: "Color del borde", value: "#1a1a1a" },
            ].map((c) => (
              <div key={c.label}>
                <label className={labelClass}>{c.label}</label>
                <div className="flex gap-2 items-center">
                  <input type="color" defaultValue={c.value} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                  <input type="text" defaultValue={c.value} className={inputClass} style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
            ))}
          </div>

          <button className="w-full py-3 rounded-xl font-semibold" style={{ background: "#0a0a0a", color: "#fff" }}>
            Guardar
          </button>
        </div>
      )}

      {/* Seguridad */}
      {tab === "Seguridad" && (
        <div className="max-w-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[#0a0a0a] font-semibold text-lg">Equipo</h2>
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#0a0a0a] font-bold"
              style={{ background: "rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.15)" }}
            >
              +
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div
              className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3"
              style={{
                gridTemplateColumns: "1fr 120px 160px 160px 80px",
                background: "rgba(0,0,0,0.03)",
                color: "rgba(0,0,0,0.3)",
                borderBottom: "1px solid rgba(0,0,0,0.07)",
              }}
            >
              <div>Miembro</div><div>Rol</div><div>Autenticación</div><div>Último acceso</div><div />
            </div>

            {/* Owner row */}
            <div
              className="grid items-center px-5 py-4"
              style={{ gridTemplateColumns: "minmax(0,1fr) 110px 130px 100px 80px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "#0a0a0a", color: "#fff" }}>
                  {(userEmail ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[#0a0a0a] text-sm font-medium truncate">{userEmail}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>Tú</span>
                </div>
              </div>
              <span className="text-[#0a0a0a]/50 text-xs">Propietario</span>
              <span className="text-[#0a0a0a]/30 text-xs">—</span>
              <span className="text-[#0a0a0a]/30 text-xs">Hoy</span>
              <div className="flex gap-2 justify-end">
                <button className="text-[#0a0a0a]/20 hover:text-[#0a0a0a]/50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <p className="text-[#0a0a0a]/20 text-xs">
            Agrega miembros con rol "Check-in" para que puedan usar el scanner QR en la entrada de tus eventos.
          </p>

          <div className="rounded-2xl p-5" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <h3 className="text-[#0a0a0a] font-semibold text-sm mb-1">Historial de seguridad</h3>
            <p className="text-[#0a0a0a]/25 text-xs">Próximamente — podrás ver todos los inicios de sesión y acciones del equipo.</p>
          </div>
        </div>
      )}

      {/* Detalles de la empresa */}
      {tab === "Detalles de la empresa" && (
        <div className="max-w-2xl flex flex-col gap-6">
          <div>
            <label className={labelClass}>Tipo de cuenta</label>
            <select
              className={inputClass}
              style={inputStyle}
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option>Personal</option>
              <option>Empresa</option>
            </select>
          </div>

          <div className="py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider">Detalles personales</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre</label>
              <input type="text" className={inputClass} style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Apellido</label>
              <input type="text" className={inputClass} style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Número de cédula</label>
              <input type="text" className={inputClass} style={inputStyle} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="1-2345-6789" />
            </div>
            <div>
              <label className={labelClass}>Correo electrónico</label>
              <input type="email" className={inputClass} style={{ ...inputStyle, color: "rgba(0,0,0,0.4)" }} value={userEmail} readOnly />
            </div>
          </div>

          <div>
            <label className={labelClass}>WhatsApp</label>
            <input type="text" className={inputClass} style={inputStyle} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+506 8888-8888" />
          </div>

          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-xl font-semibold" style={{ background: "#0a0a0a", color: "#fff" }}>
              Guardar
            </button>
            <button className="flex-1 py-3 rounded-xl font-semibold" style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Impuestos */}
      {tab === "Impuestos" && (
        <div className="max-w-2xl flex flex-col gap-6">
          <div>
            <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Impuestos</h2>
            <p className="text-[#0a0a0a]/35 text-sm">Configura si deseas cobrar impuestos en tus eventos y los datos fiscales de tu entidad.</p>
          </div>

          {/* Toggle cobrar impuestos */}
          <div className="flex items-center justify-between p-5 rounded-2xl" style={sectionStyle}>
            <div>
              <p className="text-[#0a0a0a]/80 text-sm font-medium">¿Cobrar impuestos en tus eventos?</p>
              <p className="text-[#0a0a0a]/30 text-xs mt-0.5">El impuesto se mostrará desglosado en el resumen de compra</p>
            </div>
            <Toggle checked={chargesTax} onChange={setChargesTax} />
          </div>

          {chargesTax && (
            <>
              {/* Porcentaje e nombre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombre del impuesto</label>
                  <input type="text" value={taxName} onChange={(e) => setTaxName(e.target.value)} placeholder="IVA" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass}>Porcentaje (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} className={inputClass} style={inputStyle} />
                </div>
              </div>

              {/* Separador */}
              <div className="pt-2 pb-1" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider">Datos fiscales de la entidad</p>
                <p className="text-[#0a0a0a]/20 text-xs mt-1">Requeridos para facturación electrónica y documentos legales (ACAM, HACIENDA)</p>
              </div>

              {/* Tipo de entidad */}
              <div>
                <label className={labelClass}>Tipo de entidad</label>
                <div className="flex gap-4">
                  {([
                    { key: "company", label: "Empresa / Sociedad" },
                    { key: "individual", label: "Persona física" },
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
                    <label className={labelClass}>Razón social *</label>
                    <input type="text" value={taxLegalName} onChange={(e) => setTaxLegalName(e.target.value)} placeholder="Nombre legal de la empresa" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className={labelClass}>Cédula jurídica *</label>
                    <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="3-101-XXXXXX" className={inputClass} style={inputStyle} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={labelClass}>Nombre completo *</label>
                    <input type="text" value={taxLegalName} onChange={(e) => setTaxLegalName(e.target.value)} placeholder="Nombre completo según cédula" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className={labelClass}>Número de cédula *</label>
                    <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="1-XXXX-XXXX" className={inputClass} style={inputStyle} />
                  </div>
                </>
              )}

              <div>
                <label className={labelClass}>Dirección *</label>
                <input type="text" value={taxAddress} onChange={(e) => setTaxAddress(e.target.value)} placeholder="Dirección exacta" className={inputClass} style={inputStyle} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Código postal</label>
                  <input type="text" value={taxPostcode} onChange={(e) => setTaxPostcode(e.target.value)} placeholder="10101" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass}>País *</label>
                  <input type="text" value={taxCountry} onChange={(e) => setTaxCountry(e.target.value)} className={inputClass} style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Provincia *</label>
                  <select value={taxProvince} onChange={(e) => setTaxProvince(e.target.value)} className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }}>
                    <option value="">Seleccionar</option>
                    {["San José", "Alajuela", "Cartago", "Heredia", "Guanacaste", "Puntarenas", "Limón"].map((p) => (
                      <option key={p} value={p} style={{ background: "#fff" }}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Ciudad / Cantón *</label>
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
            {taxSaving ? "Guardando..." : taxSaved ? "¡Guardado!" : "Guardar"}
          </button>
        </div>
      )}

      {/* Notificaciones */}
      {tab === "Notificaciones" && (
        <div className="max-w-2xl flex flex-col gap-6">
          <div>
            <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Correo electrónico de clientes</h2>
            <p className="text-[#0a0a0a]/35 text-sm">Gestiona a qué correos son enviadas las notificaciones.</p>
          </div>

          <div>
            <label className={labelClass}>Idioma por defecto</label>
            <select className={inputClass} style={inputStyle}>
              <option>Español</option>
              <option>English</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Emails para notificaciones de compra</label>
            <input type="email" className={inputClass} style={inputStyle} value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} />
          </div>

          <div className="flex flex-col gap-3">
            {[
              { label: "Notificar compras de cortesía", state: notifyCourtesy, set: setNotifyCourtesy },
              { label: "Notificar pagos exitosos", state: notifyPayments, set: setNotifyPayments },
              { label: "Notificar reembolsos", state: notifyRefunds, set: setNotifyRefunds },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-xl" style={sectionStyle}>
                <span className="text-[#0a0a0a]/60 text-sm">{item.label}</span>
                <Toggle checked={item.state} onChange={item.set} />
              </div>
            ))}
          </div>

          <button className="w-full py-3 rounded-xl font-semibold" style={{ background: "#0a0a0a", color: "#fff" }}>
            Guardar
          </button>
        </div>
      )}

      {/* Integraciones */}
      {tab === "Integraciones" && (
        <div className="max-w-2xl flex flex-col gap-4">
          <div>
            <h2 className="text-[#0a0a0a] font-semibold text-lg mb-1">Integraciones</h2>
            <p className="text-[#0a0a0a]/35 text-sm">Conecta herramientas externas con tu cuenta de Vybz.</p>
          </div>
          {[
            { name: "Stripe", desc: "Procesamiento de pagos con tarjeta de crédito", status: "soon" },
            { name: "SINPE Móvil", desc: "Pagos locales de Costa Rica vía SINPE", status: "soon" },
            { name: "Mailchimp", desc: "Sincroniza tu lista de compradores con Mailchimp", status: "soon" },
            { name: "Google Analytics", desc: "Seguimiento de visitas y conversiones", status: "soon" },
            { name: "WhatsApp Business", desc: "Envía confirmaciones por WhatsApp", status: "soon" },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between p-5 rounded-2xl" style={sectionStyle}>
              <div>
                <p className="text-[#0a0a0a] font-medium text-sm">{item.name}</p>
                <p className="text-[#0a0a0a]/35 text-xs mt-0.5">{item.desc}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs" style={{ background: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.3)" }}>
                Próximamente
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
