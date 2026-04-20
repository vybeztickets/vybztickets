"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "@/app/components/ImageUploadField";
import QRCode from "react-qr-code";

type Event = Record<string, unknown>;
type TicketType = { id: string; name: string; price: number; category: string | null };

const TABS = [
  { key: "info", label: "Información general" },
  { key: "location", label: "Ubicación" },
  { key: "design", label: "Diseño de página" },
  { key: "form", label: "Formulario de pedido" },
  { key: "ticket", label: "Diseño de entradas" },
];

const CATEGORIES = ["Concierto", "Open Format", "Electrónica", "Reggaeton", "Festival", "Otros"];

const inputStyle = {
  background: "rgba(0,0,0,0.04)",
  border: "1px solid rgba(0,0,0,0.08)",
};
const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";

function str(v: unknown) { return v != null ? String(v) : ""; }
function bool(v: unknown) { return v === true || v === "true"; }

export default function EditEventTabs({ event, ticketTypes }: { event: Event; ticketTypes: TicketType[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("info");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Info fields
  const [name, setName] = useState(str(event.name));
  const [category, setCategory] = useState(str(event.category));
  const [description, setDescription] = useState(str(event.description));
  const [date, setDate] = useState(str(event.date));
  const [time, setTime] = useState(str(event.time));
  const [endTime, setEndTime] = useState(str(event.end_time));
  const [instagramUrl, setInstagramUrl] = useState(str(event.instagram_url));
  const [facebookPixel, setFacebookPixel] = useState(str(event.facebook_pixel));
  const [googleAnalytics, setGoogleAnalytics] = useState(str(event.google_analytics));
  const [googleTagManager, setGoogleTagManager] = useState(str(event.google_tag_manager));
  const [status, setStatus] = useState(str(event.status));

  // Location fields
  const [venue, setVenue] = useState(str(event.venue));
  const [city, setCity] = useState(str(event.city));
  const [country, setCountry] = useState(str(event.country));
  const [locationLat, setLocationLat] = useState(str(event.location_lat));
  const [locationLng, setLocationLng] = useState(str(event.location_lng));
  const [locationSecret, setLocationSecret] = useState(bool(event.location_secret));

  // Design fields
  const [imageUrl, setImageUrl] = useState(str(event.image_url));
  const [bannerUrl, setBannerUrl] = useState(str(event.banner_url));
  const [venueMapUrl, setVenueMapUrl] = useState(str(event.venue_map_url));

  // Form fields
  const [prePurchaseMessage, setPrePurchaseMessage] = useState(str(event.pre_purchase_message));
  const [postPurchaseMessage, setPostPurchaseMessage] = useState(str(event.post_purchase_message));
  const [termsConditions, setTermsConditions] = useState(str(event.terms_conditions));
  const [collectId, setCollectId] = useState(bool(event.collect_id));

  // Ticket design
  const [borderColor, setBorderColor] = useState(str(event.ticket_border_color) || "#7c3aed");
  const [textColor, setTextColor] = useState(str(event.ticket_text_color) || "#ffffff");
  const [bgColor, setBgColor] = useState(str(event.ticket_bg_color) || "#0a0a0a");
  const [accentColor, setAccentColor] = useState(str(event.ticket_accent_color) || "#db2777");
  const [selectedTicketType, setSelectedTicketType] = useState(ticketTypes[0]?.id ?? "");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {};
      if (tab === "info") Object.assign(body, { name, category, description, date, time, end_time: endTime, instagram_url: instagramUrl, facebook_pixel: facebookPixel, google_analytics: googleAnalytics, google_tag_manager: googleTagManager, status });
      if (tab === "location") Object.assign(body, { venue, city, country, location_lat: locationLat ? parseFloat(locationLat) : null, location_lng: locationLng ? parseFloat(locationLng) : null, location_secret: locationSecret });
      if (tab === "design") Object.assign(body, { image_url: imageUrl, banner_url: bannerUrl, venue_map_url: venueMapUrl });
      if (tab === "form") Object.assign(body, { pre_purchase_message: prePurchaseMessage, post_purchase_message: postPurchaseMessage, terms_conditions: termsConditions, collect_id: collectId });
      if (tab === "ticket") Object.assign(body, { ticket_border_color: borderColor, ticket_text_color: textColor, ticket_bg_color: bgColor, ticket_accent_color: accentColor });

      const res = await fetch(`/api/organizador/eventos/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  const mapSrc = locationLat && locationLng
    ? `https://maps.google.com/maps?q=${locationLat},${locationLng}&z=16&output=embed`
    : venue ? `https://maps.google.com/maps?q=${encodeURIComponent(venue + " " + city + " " + country)}&z=16&output=embed` : null;

  return (
    <div className="max-w-2xl p-8">
      {/* Tab bar */}
      <div className="flex gap-1 mb-8 overflow-x-auto scrollbar-none" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors shrink-0"
            style={tab === t.key ? { color: "#0a0a0a", borderBottom: "2px solid #0a0a0a" } : { color: "rgba(0,0,0,0.35)", borderBottom: "2px solid transparent" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === "info" && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Nombre del evento</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} style={{ ...inputStyle, color: "#0a0a0a" }}>
              {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: "#fff" }}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Descripción</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass + " resize-none"} style={inputStyle} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Hora inicio</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Hora fin</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
          </div>
          <div>
            <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Instagram (URL del perfil o post)</label>
            <input type="url" placeholder="https://instagram.com/..." value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass} style={{ ...inputStyle, color: "#0a0a0a" }}>
              <option value="draft" style={{ background: "#fff" }}>Borrador</option>
              <option value="published" style={{ background: "#fff" }}>Publicado</option>
              <option value="cancelled" style={{ background: "#fff" }}>Cancelado</option>
              <option value="completed" style={{ background: "#fff" }}>Concluido</option>
            </select>
          </div>
          <details className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <summary className="px-4 py-3 text-[#0a0a0a]/35 text-xs cursor-pointer">Integraciones de tracking (opcional)</summary>
            <div className="px-4 pb-4 flex flex-col gap-3 pt-2">
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1.5">Facebook Pixel ID</label>
                <input type="text" placeholder="123456789012345" value={facebookPixel} onChange={(e) => setFacebookPixel(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1.5">Google Analytics ID</label>
                <input type="text" placeholder="G-XXXXXXXXXX" value={googleAnalytics} onChange={(e) => setGoogleAnalytics(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-[#0a0a0a]/40 text-xs mb-1.5">Google Tag Manager ID</label>
                <input type="text" placeholder="GTM-XXXXXXX" value={googleTagManager} onChange={(e) => setGoogleTagManager(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Location tab */}
      {tab === "location" && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Nombre del venue</label>
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Ciudad</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">País</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Latitud</label>
              <input type="number" step="any" placeholder="9.9281" value={locationLat} onChange={(e) => setLocationLat(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Longitud</label>
              <input type="number" step="any" placeholder="-84.0907" value={locationLng} onChange={(e) => setLocationLng(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
          </div>

          {mapSrc && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <iframe src={mapSrc} width="100%" height="280" style={{ border: 0 }} allowFullScreen loading="lazy" />
            </div>
          )}

          <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div>
              <p className="text-[#0a0a0a] text-sm font-medium">Ubicación secreta</p>
              <p className="text-[#0a0a0a]/35 text-xs mt-0.5">Solo se revela la dirección al comprar</p>
            </div>
            <button type="button" onClick={() => setLocationSecret(!locationSecret)} className="relative w-9 h-5 rounded-full transition-colors shrink-0" style={{ background: locationSecret ? "#0a0a0a" : "rgba(0,0,0,0.08)" }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: locationSecret ? "16px" : "2px" }} />
            </button>
          </label>
        </div>
      )}

      {/* Design tab */}
      {tab === "design" && (
        <div className="flex flex-col gap-5">
          <ImageUploadField
            value={imageUrl}
            onChange={setImageUrl}
            label="Flyer del evento"
            hint="1080×1080 recomendado · JPG, PNG o WebP · máx 10MB"
          />
          <ImageUploadField
            value={venueMapUrl}
            onChange={setVenueMapUrl}
            label="Mapa de mesas VIP (layout del venue)"
            hint="JPG o PNG · muestra posición de mesas en el portal"
            aspectRatio="16:9"
          />
          <div>
            <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">
              Banner homepage
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.5)" }}>$1/día</span>
            </label>
            <ImageUploadField
              value={bannerUrl}
              onChange={setBannerUrl}
              label=""
              hint="Aparece en el carousel principal · 1200×400 recomendado"
              aspectRatio="16:9"
            />
            <p className="text-[#0a0a0a]/30 text-[10px] mt-1.5">Los banners pagados se muestran en el carousel principal del portal.</p>
          </div>
        </div>
      )}

      {/* Form tab */}
      {tab === "form" && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Mensaje antes de la compra</label>
            <textarea rows={3} placeholder="Ej: Por favor llevar cédula al evento..." value={prePurchaseMessage} onChange={(e) => setPrePurchaseMessage(e.target.value)} className={inputClass + " resize-none"} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Mensaje después de la compra</label>
            <textarea rows={3} placeholder="Ej: ¡Gracias! Te esperamos el sábado a las 10pm..." value={postPurchaseMessage} onChange={(e) => setPostPurchaseMessage(e.target.value)} className={inputClass + " resize-none"} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Términos y condiciones</label>
            <textarea rows={5} placeholder="Ingresa los términos y condiciones del evento..." value={termsConditions} onChange={(e) => setTermsConditions(e.target.value)} className={inputClass + " resize-none"} style={inputStyle} />
          </div>
          <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div>
              <p className="text-[#0a0a0a] text-sm font-medium">Recopilar cédula</p>
              <p className="text-[#0a0a0a]/35 text-xs mt-0.5">Solicitar número de cédula al comprador</p>
            </div>
            <button type="button" onClick={() => setCollectId(!collectId)} className="relative w-9 h-5 rounded-full transition-colors shrink-0" style={{ background: collectId ? "#0a0a0a" : "rgba(0,0,0,0.08)" }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: collectId ? "16px" : "2px" }} />
            </button>
          </label>
        </div>
      )}

      {/* Ticket design tab */}
      {tab === "ticket" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Color de borde</label>
              <div className="flex items-center gap-2">
                <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" style={{ background: "none" }} />
                <input type="text" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className={inputClass} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
            <div>
              <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Color de texto</label>
              <div className="flex items-center gap-2">
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} className={inputClass} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
            <div>
              <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Color de fondo</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className={inputClass} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
            <div>
              <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Color de acento</label>
              <div className="flex items-center gap-2">
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className={inputClass} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
          </div>

          {/* Ticket type selector + sample download */}
          {ticketTypes.length > 0 && (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">Tipo de entrada</label>
                <select
                  value={selectedTicketType}
                  onChange={(e) => setSelectedTicketType(e.target.value)}
                  className={inputClass}
                  style={{ ...inputStyle, color: "#0a0a0a" }}
                >
                  {ticketTypes.map((tt) => (
                    <option key={tt.id} value={tt.id} style={{ background: "#fff" }}>
                      {tt.name} {tt.price > 0 ? `· ₡${tt.price.toLocaleString()}` : "· Gratis"}
                    </option>
                  ))}
                </select>
              </div>
              {selectedTicketType && (
                <a
                  href={`/ticket/sample/${event.id}/${selectedTicketType}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0"
                  style={{ background: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,0,0,0.15)" }}
                >
                  Descargar ejemplo
                </a>
              )}
            </div>
          )}

          {/* Full live ticket preview */}
          <div>
            <p className="text-[#0a0a0a]/40 text-xs mb-4">Vista previa del ticket</p>
            {(() => {
              const selTT = ticketTypes.find((t) => t.id === selectedTicketType) ?? ticketTypes[0];
              const isTable = selTT?.category === "table" || selTT?.category === "seat";
              const typeLabel = isTable ? "MESA VIP" : "GENERAL";
              const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("es-CR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
              const fmt12 = (t: string) => { const [h, m] = t.split(":").map(Number); const ampm = h >= 12 ? "PM" : "AM"; return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`; };
              const startTime = time ? fmt12(time) : null;
              const endStr = endTime ? fmt12(endTime) : null;
              const timeStr = startTime ? (endStr ? `${startTime} — ${endStr}` : startTime) : null;

              return (
                <div className="w-full max-w-[420px] mx-auto relative overflow-hidden"
                  style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: 20, boxShadow: `0 0 40px ${borderColor}33, 0 12px 40px rgba(0,0,0,0.15)` }}
                >
                  {/* Bg watermark */}
                  <div aria-hidden className="absolute inset-0 pointer-events-none select-none flex items-center justify-center"
                    style={{ fontSize: 96, fontWeight: 900, color: accentColor, opacity: 0.035, lineHeight: 1, transform: "rotate(-35deg)", whiteSpace: "nowrap", letterSpacing: -3 }}>
                    {typeLabel}
                  </div>

                  {/* Header band */}
                  <div className="flex items-center justify-between px-5 py-3" style={{ background: `linear-gradient(90deg,${borderColor}22,${accentColor}22)`, borderBottom: `1px solid ${borderColor}33` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `linear-gradient(135deg,${borderColor},${accentColor})` }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M20 4H4c-1.1 0-2 .9-2 2v2c1.1 0 2 .9 2 2s-.9 2-2 2v2c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-2c-1.1 0-2-.9-2-2s.9-2 2-2V6c0-1.1-.9-2-2-2z"/></svg>
                      </div>
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: accentColor }}>VYBZ TICKETS</span>
                    </div>
                    <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44` }}>{typeLabel}</span>
                  </div>

                  {/* Event name */}
                  <div className="px-6 pt-5 pb-4">
                    <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: `${textColor}55` }}>{city || "Ciudad"} · {venue || "Venue"}</p>
                    <h1 className="text-2xl font-black tracking-tight leading-none uppercase" style={{ color: textColor }}>{name || "NOMBRE DEL EVENTO"}</h1>
                    {timeStr && <p className="text-xs font-semibold mt-1.5" style={{ color: `${textColor}88` }}>{date ? fmtDate(date) : ""}  ·  {timeStr}</p>}
                  </div>

                  {/* QR */}
                  <div className="flex flex-col items-center px-6 pb-5">
                    <div className="p-4 rounded-2xl bg-white w-fit relative" style={{ boxShadow: `0 0 0 6px ${borderColor}22` }}>
                      <QRCode value="00000000-MUESTRA-0000-0000-000000000000" size={180} level="H" />
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: "rgba(239,68,68,0.08)" }}>
                        <span className="text-red-600 font-black text-xs tracking-widest opacity-60" style={{ transform: "rotate(-35deg)" }}>MUESTRA</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-mono font-bold mt-3 tracking-[0.25em]" style={{ color: `${textColor}44` }}>#00000000</p>
                  </div>

                  {/* Perforation */}
                  <div className="flex items-center" style={{ margin: "0 -2px" }}>
                    <div className="w-6 h-6 rounded-full shrink-0" style={{ background: "#050505", border: `2px solid ${borderColor}`, marginLeft: -1 }} />
                    <div className="flex-1 border-t-2 border-dashed mx-1" style={{ borderColor: `${borderColor}55` }} />
                    <div className="w-6 h-6 rounded-full shrink-0" style={{ background: "#050505", border: `2px solid ${borderColor}`, marginRight: -1 }} />
                  </div>

                  {/* Info grid */}
                  <div className="px-6 pt-4 pb-5">
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-3 flex-1">
                        {[
                          { l: "Evento", v: name || "—" },
                          { l: "Organizador", v: "Tu nombre" },
                          { l: "Lugar", v: `${venue || "Venue"}, ${city || "Ciudad"}` },
                          { l: "Fecha", v: date ? fmtDate(date) : "—" },
                          ...(timeStr ? [{ l: "Hora", v: timeStr }] : []),
                        ].map(({ l, v }) => (
                          <div key={l}>
                            <p className="text-[8px] font-black tracking-[0.18em] uppercase mb-0.5" style={{ color: accentColor }}>{l}</p>
                            <p className="text-[11px] font-semibold leading-tight" style={{ color: textColor }}>{v}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-3 flex-1">
                        {[
                          { l: "Nombre", v: "Juan Pérez" },
                          { l: "Tipo de entrada", v: selTT?.name || "Entrada General" },
                          { l: "Ref. pedido", v: "#00000000" },
                          { l: "Precio", v: selTT ? "₡" + selTT.price.toLocaleString("es-CR") : "₡0" },
                        ].map(({ l, v }) => (
                          <div key={l}>
                            <p className="text-[8px] font-black tracking-[0.18em] uppercase mb-0.5" style={{ color: accentColor }}>{l}</p>
                            <p className="text-[11px] font-semibold leading-tight" style={{ color: textColor }}>{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${borderColor}22` }}>
                      <p className="text-[8px] font-bold tracking-widest uppercase mb-0.5" style={{ color: `${textColor}33` }}>UUID</p>
                      <p className="text-[8px] font-mono break-all" style={{ color: `${textColor}30` }}>00000000-MUESTRA-0000-0000-000000000000</p>
                    </div>
                    <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${borderColor}22` }}>
                      <p className="text-center text-[8px] leading-relaxed" style={{ color: `${textColor}30` }}>
                        BOLETO DE MUESTRA — No válido para ingreso al evento.<br />
                        Prohibida la reventa no autorizada.<br />
                        <span style={{ color: accentColor + "60" }}>Powered by Vybz Tickets</span>
                      </p>
                    </div>
                  </div>

                  {/* Bottom bar */}
                  <div className="h-1" style={{ background: `linear-gradient(90deg,${accentColor},${borderColor})` }} />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="mt-8 flex items-center gap-3">
        {error && <p className="text-red-500 text-xs flex-1">{error}</p>}
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-all"
          style={{ background: saved ? "rgba(16,185,129,0.1)" : "#0a0a0a", color: saved ? "#059669" : "#fff", border: saved ? "1px solid rgba(16,185,129,0.3)" : "none" }}
        >
          {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
