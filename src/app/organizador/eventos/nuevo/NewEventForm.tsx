"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "@/app/components/ImageUploadField";

const CATEGORIES = ["Festival", "Music", "Technology", "Entertainment", "Gastronomy", "Sports", "Art", "Other"];

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

export default function NewEventForm({ organizerId, defaultCurrency = "CRC" }: { organizerId: string; defaultCurrency?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [tillLate, setTillLate] = useState(false);
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [salesEndDate, setSalesEndDate] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
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
        end_time: endTime || null,
        till_late: tillLate,
        venue,
        city,
        category,
        image_url: imageUrl || null,
        sales_end_date: salesEndDate || null,
        currency,
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
      setError(data.error ?? "Error creating event");
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
        <h2 className="text-[#0a0a0a] font-semibold">Event information</h2>

        <div>
          <label className={labelClass}>Event name *</label>
          <input type="text" className={inputClass} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required placeholder="E.g.: Ultra Costa Rica 2025" />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={inputClass}
            style={{ ...inputStyle, resize: "none" }}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the event..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date *</label>
            <input type="date" className={inputClass} style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Start time *</label>
            <input type="time" className={inputClass} style={inputStyle} value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>End time (optional)</label>
              <input
                type="time"
                className={inputClass}
                style={{ ...inputStyle, opacity: tillLate ? 0.35 : 1 }}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={tillLate}
              />
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none" style={{ marginTop: "2px" }}>
            <button
              type="button"
              onClick={() => setTillLate(!tillLate)}
              className="relative w-8 h-4.5 rounded-full transition-colors shrink-0"
              style={{ background: tillLate ? "#0a0a0a" : "rgba(0,0,0,0.12)", width: "36px", height: "20px" }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: tillLate ? "16px" : "2px" }}
              />
            </button>
            <span className="text-[#0a0a0a]/50 text-xs">Show &ldquo;Till late&rdquo; instead of end time</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Venue *</label>
            <input type="text" className={inputClass} style={inputStyle} value={venue} onChange={(e) => setVenue(e.target.value)} required placeholder="E.g.: La Sabana" />
          </div>
          <div>
            <label className={labelClass}>City *</label>
            <input type="text" className={inputClass} style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} required placeholder="E.g.: San José" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Category *</label>
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
          label="Event flyer (optional)"
          hint="JPG, PNG or WebP · 1080×1080 recommended · max 10MB"
        />

        <div>
          <label className={labelClass}>Sales end date (optional)</label>
          <input type="date" className={inputClass} style={inputStyle} value={salesEndDate} onChange={(e) => setSalesEndDate(e.target.value)} />
        </div>
      </section>

      {/* Ticket types */}
      <section
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        {currency !== defaultCurrency && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl mb-1" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" className="shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-[11px] leading-relaxed" style={{ color: "#92400e" }}>
              This event is in <strong>{currency}</strong>, different from your primary currency ({defaultCurrency}). Make sure you have a bank account in {currency} configured under Finances → Bank Accounts.
            </p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h2 className="text-[#0a0a0a] font-semibold">Ticket types</h2>
          <div className="flex items-center gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none"
              style={{ background: "rgba(0,0,0,0.06)", color: "#0a0a0a", border: "none" }}
            >
              <option value="CRC">₡ Colón (CRC)</option>
              <option value="USD">$ Dólar (USD)</option>
            </select>
            <button
              type="button"
              onClick={addTicketType}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(0,0,0,0.08)", color: "#0a0a0a" }}
            >
              + Add
            </button>
          </div>
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
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Name *</label>
                <input type="text" className={inputClass} style={inputStyle} value={t.name} onChange={(e) => updateTicket(i, "name", e.target.value)} required placeholder="E.g.: General" />
              </div>
              <div>
                <label className={labelClass}>Price ({currency === "USD" ? "$" : "₡"}) *</label>
                <input type="number" className={inputClass} style={inputStyle} value={t.price} onChange={(e) => updateTicket(i, "price", e.target.value)} required min="0" placeholder={currency === "USD" ? "25" : "15000"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Available quantity *</label>
                <input type="number" className={inputClass} style={inputStyle} value={t.total_available} onChange={(e) => updateTicket(i, "total_available", e.target.value)} required min="1" placeholder="100" />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <input type="text" className={inputClass} style={inputStyle} value={t.description} onChange={(e) => updateTicket(i, "description", e.target.value)} placeholder="Optional" />
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
        {loading ? "Creating event..." : "Create event"}
      </button>
    </form>
  );
}
