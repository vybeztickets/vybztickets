"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "@/app/components/ImageUploadField";

const CATEGORIES = ["Festival", "Música", "Tecnología", "Entretenimiento", "Gastronomía", "Deportes", "Arte", "Otro"];

type TicketTypeInput = {
  name: string;
  description: string;
  price: string;
  total_available: string;
};

const emptyTicket = (): TicketTypeInput => ({
  name: "",
  description: "",
  price: "",
  total_available: "",
});

export default function NewEventForm({ organizerId }: { organizerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [salesEndDate, setSalesEndDate] = useState("");
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([emptyTicket()]);

  function updateTicket(i: number, field: keyof TicketTypeInput, value: string) {
    setTicketTypes((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }

  function addTicketType() {
    setTicketTypes((prev) => [...prev, emptyTicket()]);
  }

  function removeTicketType(i: number) {
    setTicketTypes((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/organizador/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizerId,
        name,
        description,
        date,
        time,
        venue,
        city,
        category,
        image_url: imageUrl || null,
        sales_end_date: salesEndDate || null,
        ticketTypes: ticketTypes.map((t) => ({
          name: t.name,
          description: t.description || null,
          price: parseInt(t.price),
          total_available: parseInt(t.total_available),
        })),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear el evento");
      setLoading(false);
      return;
    }

    router.push("/organizador");
    router.refresh();
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";
  const inputStyle = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" };
  const labelClass = "block text-[#0a0a0a]/50 text-xs uppercase tracking-wider mb-2";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Basic info */}
      <section
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        <h2 className="text-[#0a0a0a] font-semibold">Información del evento</h2>

        <div>
          <label className={labelClass}>Nombre del evento *</label>
          <input type="text" className={inputClass} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Ultra Costa Rica 2025" />
        </div>

        <div>
          <label className={labelClass}>Descripción</label>
          <textarea
            className={inputClass}
            style={{ ...inputStyle, resize: "none" }}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el evento..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Fecha *</label>
            <input type="date" className={inputClass} style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Hora *</label>
            <input type="time" className={inputClass} style={inputStyle} value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Venue *</label>
            <input type="text" className={inputClass} style={inputStyle} value={venue} onChange={(e) => setVenue(e.target.value)} required placeholder="Ej: La Sabana" />
          </div>
          <div>
            <label className={labelClass}>Ciudad *</label>
            <input type="text" className={inputClass} style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Ej: San José" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Categoría *</label>
          <select
            className={inputClass}
            style={inputStyle}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <ImageUploadField
          value={imageUrl}
          onChange={setImageUrl}
          label="Flyer del evento (opcional)"
          hint="JPG, PNG o WebP · 1080×1080 recomendado · máx 10MB"
        />

        <div>
          <label className={labelClass}>Fin de ventas (opcional)</label>
          <input type="date" className={inputClass} style={inputStyle} value={salesEndDate} onChange={(e) => setSalesEndDate(e.target.value)} />
        </div>
      </section>

      {/* Ticket types */}
      <section
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[#0a0a0a] font-semibold">Tipos de ticket</h2>
          <button
            type="button"
            onClick={addTicketType}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(0,0,0,0.08)", color: "#0a0a0a" }}
          >
            + Agregar
          </button>
        </div>

        {ticketTypes.map((t, i) => (
          <div
            key={i}
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[#0a0a0a]/40 text-xs font-semibold uppercase tracking-wider">Ticket {i + 1}</p>
              {ticketTypes.length > 1 && (
                <button type="button" onClick={() => removeTicketType(i)} className="text-red-400/50 text-xs hover:text-red-400 transition-colors">
                  Eliminar
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nombre *</label>
                <input type="text" className={inputClass} style={inputStyle} value={t.name} onChange={(e) => updateTicket(i, "name", e.target.value)} required placeholder="Ej: General" />
              </div>
              <div>
                <label className={labelClass}>Precio (₡) *</label>
                <input type="number" className={inputClass} style={inputStyle} value={t.price} onChange={(e) => updateTicket(i, "price", e.target.value)} required min="0" placeholder="15000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Cantidad disponible *</label>
                <input type="number" className={inputClass} style={inputStyle} value={t.total_available} onChange={(e) => updateTicket(i, "total_available", e.target.value)} required min="1" placeholder="100" />
              </div>
              <div>
                <label className={labelClass}>Descripción</label>
                <input type="text" className={inputClass} style={inputStyle} value={t.description} onChange={(e) => updateTicket(i, "description", e.target.value)} placeholder="Opcional" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl font-semibold disabled:opacity-50"
        style={{ background: "#0a0a0a", color: "#fff" }}
      >
        {loading ? "Creando evento..." : "Crear evento"}
      </button>
    </form>
  );
}
