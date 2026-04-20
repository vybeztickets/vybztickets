"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Ticket = {
  id: string;
  purchase_price: number;
  buyer_name: string | null;
  events: { id: string; name: string; date: string; venue: string; city: string } | null;
};

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function NuevaVentaForm({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = tickets.find((t) => t.id === selectedId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !price) return;

    const parsed = parseInt(price.replace(/\D/g, ""), 10);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Ingresá un precio válido.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/revendedor/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id: selectedId, resale_price: parsed }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Error al publicar. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    router.push("/revendedor");
  }

  if (tickets.length === 0) {
    return (
      <div
        className="rounded-2xl p-12 text-center"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        <p className="text-[#0a0a0a]/40 text-sm mb-2">No tenés entradas disponibles para vender.</p>
        <p className="text-[#0a0a0a]/25 text-xs">
          Solo podés vender entradas que compraste y que no estén ya publicadas.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Ticket selector */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        <p className="text-[#0a0a0a] text-sm font-semibold mb-4">Seleccioná la entrada</p>
        <div className="flex flex-col gap-3">
          {tickets.map((t) => {
            const ev = t.events;
            const active = selectedId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className="w-full text-left rounded-xl p-4 transition-all"
                style={{
                  background: active ? "#0a0a0a" : "rgba(0,0,0,0.02)",
                  border: active ? "1.5px solid #0a0a0a" : "1.5px solid rgba(0,0,0,0.08)",
                }}
              >
                <p
                  className="font-semibold text-sm"
                  style={{ color: active ? "#fff" : "#0a0a0a" }}
                >
                  {ev?.name ?? "Evento desconocido"}
                </p>
                {ev && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: active ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.35)" }}
                  >
                    {formatDate(ev.date)} · {ev.venue}, {ev.city}
                  </p>
                )}
                <p
                  className="text-xs mt-1.5 font-medium"
                  style={{ color: active ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.4)" }}
                >
                  Precio original: ₡{t.purchase_price.toLocaleString("es-CR")}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price */}
      {selectedId && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
        >
          <label className="block text-[#0a0a0a] text-sm font-semibold mb-1">
            Precio de reventa (₡)
          </label>
          {selected && (
            <p className="text-[#0a0a0a]/35 text-xs mb-3">
              Precio original: ₡{selected.purchase_price.toLocaleString("es-CR")}
            </p>
          )}
          <input
            type="number"
            min="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ej: 15000"
            required
            className="w-full rounded-xl px-4 py-3 text-[#0a0a0a] text-sm outline-none transition-all"
            style={{
              background: "rgba(0,0,0,0.03)",
              border: "1.5px solid rgba(0,0,0,0.1)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0a0a0a")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
          />
          <p className="text-[#0a0a0a]/25 text-[10px] mt-2">
            El comprador ve este precio. El dinero queda en escrow hasta confirmar el ingreso.
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm px-1">{error}</p>
      )}

      <button
        type="submit"
        disabled={!selectedId || !price || loading}
        className="w-full py-3.5 rounded-full text-sm font-semibold transition-all"
        style={{
          background: !selectedId || !price || loading ? "rgba(0,0,0,0.08)" : "#0a0a0a",
          color: !selectedId || !price || loading ? "rgba(0,0,0,0.3)" : "#fff",
          cursor: !selectedId || !price || loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Publicando…" : "Publicar en reventa"}
      </button>
    </form>
  );
}
