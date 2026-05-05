"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { PaymentCardVisual } from "@/app/components/ui/credit-card-form";

type TicketType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  total_available: number;
  sold_count: number;
  is_active: boolean;
  is_hidden?: boolean | null;
  category?: string;
  capacity?: number | null;
  zone_name?: string | null;
  zone_color?: string | null;
};

const CURRENCY_SYMBOL: Record<string, string> = {
  CRC: "₡", USD: "$",
};

function formatPrice(n: number, currency = "CRC") {
  if (n === 0) return "Free";
  const sym = CURRENCY_SYMBOL[currency] ?? currency;
  const locale = "en-US";
  const decimals = currency === "CRC" ? 0 : 2;
  return sym + n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const inputStyle = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" };
const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none focus:border-black/30";

export default function CheckoutPanel({
  ticketTypes,
  eventId,
  eventName,
  venueMapUrl,
  platformFeePercent = 15,
  currency = "CRC",
  postPurchaseMessage = null,
  termsConditions = null,
  buyerEmail: initialEmail = "",
}: {
  ticketTypes: TicketType[];
  eventId: string;
  eventName: string;
  venueMapUrl: string | null;
  platformFeePercent?: number;
  currency?: string;
  postPurchaseMessage?: string | null;
  termsConditions?: string | null;
  buyerEmail?: string;
}) {
  const activeTypes = ticketTypes.filter((t) => t.is_active && !t.is_hidden && t.total_available - t.sold_count > 0);
  const generalTypes = activeTypes.filter((t) => !t.category || t.category === "general");
  const tableTypes = activeTypes.filter((t) => t.category === "table" || t.category === "seat");

  const [selectedId, setSelectedId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [paxCount, setPaxCount] = useState(1);

  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("+506");
  const [notes, setNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [promoApplied, setPromoApplied] = useState<{ discount: number; ticketTypeId: string | null } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [sameEmail, setSameEmail] = useState(true);
  const [perTicket, setPerTicket] = useState<{ name: string; email: string }[]>([]);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [step, setStep] = useState<"select" | "details" | "payment" | "processing" | "done">("select");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const [purchasedQRs, setPurchasedQRs] = useState<string[]>([]);
  const onvoInitialized = useRef(false);

  const selected = activeTypes.find((t) => t.id === selectedId);
  const isTable = selected?.category === "table" || selected?.category === "seat";
  const maxQty = selected ? Math.min(selected.total_available - selected.sold_count, 10) : 1;
  const maxPax = selected?.capacity ?? 20;

  const promoValid = promoApplied && (promoApplied.ticketTypeId === null || promoApplied.ticketTypeId === selectedId);
  const discountPct = promoValid ? promoApplied!.discount : 0;
  const basePrice = selected ? selected.price * (isTable ? 1 : qty) : 0;
  const discountAmount = Math.round(basePrice * discountPct / 100);
  const subtotal = basePrice - discountAmount;
  const serviceFee = Math.round(subtotal * platformFeePercent / 100);
  const total = subtotal + serviceFee;

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoError("");
    try {
      const res = await fetch("/api/tickets/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, eventId }),
      });
      const data = await res.json();
      if (!data.valid) { setPromoError(data.error ?? "Código no válido"); setPromoApplied(null); return; }
      setPromoApplied({ discount: data.discount_percent, ticketTypeId: data.ticket_type_id ?? null });
      setPromoError("");
    } finally { setPromoLoading(false); }
  }

  function selectTicket(id: string) {
    setSelectedId(id);
    const t = activeTypes.find((x) => x.id === id);
    if (t?.category === "table" || t?.category === "seat") {
      setPaxCount(t?.capacity ?? 1);
      setPerTicket([]);
      setSameEmail(true);
    } else {
      setQty(1);
    }
    setStep("details");
  }

  function updatePerTicket(i: number, field: "name" | "email", value: string) {
    setPerTicket((prev) => { const next = [...prev]; next[i] = { ...next[i], [field]: value }; return next; });
  }

  function getPerTicketArray() {
    return Array.from({ length: qty }, (_, i) => ({
      name: perTicket[i]?.name || name,
      email: perTicket[i]?.email || email,
    }));
  }

  const completePurchase = useCallback(async (intentId?: string) => {
    setStep("processing");
    try {
      const res = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId, ticketTypeId: selectedId, quantity: isTable ? 1 : qty,
          buyerEmail: email, buyerName: name || null, buyerPhone: phone ? `${phoneCode} ${phone}` : null,
          buyerNotes: notes || null, paxCount: isTable ? paxCount : qty,
          promoCode: (promoApplied && promoValid) ? promoCode : null,
          discountPercent: promoValid ? discountPct : 0,
          marketingOptIn,
          perTicketData: (!isTable && qty >= 2 && !sameEmail)
            ? getPerTicketArray()
            : (isTable && paxCount >= 2 && !sameEmail)
              ? Array.from({ length: paxCount }, (_, i) => ({ name: perTicket[i]?.name || name, email: perTicket[i]?.email || email }))
              : null,
          paymentIntentId: intentId ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al procesar la compra");
      setPurchasedQRs(data.qrCodes ?? []);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setStep("details");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, selectedId, isTable, qty, email, name, phone, notes, paxCount, promoApplied, promoValid, promoCode, discountPct, marketingOptIn, sameEmail]);

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !email) return;
    if (email !== emailConfirm) { setError("Los emails no coinciden"); return; }
    if (!sameEmail && qty >= 2) {
      for (let i = 0; i < qty; i++) {
        if (!perTicket[i]?.email) { setError(`Falta el email de la Entrada ${i + 1}`); return; }
      }
    }
    if (isTable && !sameEmail && paxCount >= 2) {
      for (let i = 0; i < paxCount; i++) {
        if (!perTicket[i]?.email) { setError(`Falta el email de la Persona ${i + 1}`); return; }
      }
    }
    setError("");

    // Tickets gratis — saltar pago
    if (total === 0) { await completePurchase(); return; }

    // Tickets de pago — crear payment intent
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/tickets/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency,
          description: `${isTable ? 1 : qty} × ${selected.name} — ${eventName}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al iniciar el pago");
      setPaymentIntentId(data.paymentIntentId);
      setStep("payment");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setPaymentLoading(false);
    }
  }

  // Cargar ONVO widget cuando llega al paso de pago
  useEffect(() => {
    if (step !== "payment" || !paymentIntentId) return;
    if (onvoInitialized.current) return;
    onvoInitialized.current = true;

    const widgetEl = document.getElementById("onvo-widget");
    if (widgetEl) widgetEl.innerHTML = "";

    function initOnvo() {
      const w = window as unknown as { onvo?: { pay: (o: unknown) => { render: (s: string) => void } } };
      if (!w.onvo) return;
      w.onvo.pay({
        publicKey: process.env.NEXT_PUBLIC_ONVO_PUBLIC_KEY,
        paymentIntentId,
        paymentType: "one_time",
        onSuccess: () => completePurchase(paymentIntentId),
        onError: () => { setError("El pago no se pudo completar. Intentá de nuevo."); setStep("details"); },
      }).render("#onvo-widget");
    }

    const existing = document.getElementById("onvo-sdk");
    if (existing && (window as unknown as { onvo?: unknown }).onvo) {
      initOnvo();
    } else if (!existing) {
      const script = document.createElement("script");
      script.id = "onvo-sdk";
      script.src = "https://sdk.onvopay.com/sdk.js";
      script.async = true;
      script.onload = initOnvo;
      document.head.appendChild(script);
    }

    return () => { onvoInitialized.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paymentIntentId]);

  if (activeTypes.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[#0a0a0a]/30">Tickets sold out</p>
      </div>
    );
  }

  // ── DONE ──
  if (step === "done") {
    return (
      <div>
        {/* Header */}
        <div
          className="rounded-2xl p-6 mb-5 text-center"
          style={{ background: "#0a0a0a" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(16,185,129,0.15)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-white font-bold text-xl mb-1">
            {isTable ? "Reservation confirmed!" : "Purchase successful!"}
          </p>
          <p className="text-white/40 text-sm">
            {isTable
              ? `${selected?.name} · ${paxCount} person${paxCount !== 1 ? "s" : ""}`
              : `${qty} ticket${qty > 1 ? "s" : ""} · ${eventName}`}
          </p>
        </div>

        {/* Email confirmation note */}
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-5"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
        >
          <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.55)" }}>
            Your tickets were sent to{" "}
            <span className="font-semibold text-[#0a0a0a]">{email}</span>
            {" "}— check your inbox (and spam).
          </p>
        </div>

        {/* QR tickets */}
        {purchasedQRs.length > 0 && (
          <div className="flex flex-col gap-3 mb-5">
            {purchasedQRs.map((qr, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 flex flex-col items-center"
                style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}
              >
                <p className="text-[#0a0a0a]/40 text-[10px] uppercase tracking-wider mb-3">
                  {purchasedQRs.length > 1 ? `Ticket ${i + 1} of ${purchasedQRs.length}` : "Your ticket"}
                </p>
                <div className="p-4 rounded-2xl bg-white border border-black/08">
                  <QRCode value={qr} size={150} />
                </div>
                <p className="text-[#0a0a0a]/20 text-[9px] font-mono mt-2 tracking-widest">
                  {qr.slice(0, 8).toUpperCase()}
                </p>
                <a
                  href={`/ticket/${qr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: "#0a0a0a", color: "#fff" }}
                >
                  View full ticket →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Post-purchase message */}
        {postPurchaseMessage && (
          <div
            className="rounded-xl p-5 mb-4"
            style={{ background: "#f7f7f7", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="text-[#0a0a0a]/35 text-[9px] uppercase tracking-widest font-semibold mb-2">
              Message from organizer
            </p>
            <p className="text-[#0a0a0a]/65 text-sm leading-relaxed whitespace-pre-line">
              {postPurchaseMessage}
            </p>
          </div>
        )}

        {/* Terms */}
        {termsConditions && (
          <div className="mb-5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 16 }}>
            <p className="text-[#0a0a0a]/30 text-[9px] uppercase tracking-widest font-semibold mb-2">
              Event terms and conditions
            </p>
            <p className="text-[#0a0a0a]/35 text-xs leading-relaxed whitespace-pre-line">
              {termsConditions}
            </p>
          </div>
        )}

        <button
          onClick={() => { setStep("select"); setSelectedId(""); setPurchasedQRs([]); }}
          className="text-[#0a0a0a]/30 text-xs hover:text-[#0a0a0a]/60 transition-colors"
        >
          ← Back to event
        </button>
      </div>
    );
  }

  // ── PAYMENT ──
  if (step === "payment") {
    return (
      <div>
        <button type="button" onClick={() => setStep("details")}
          className="flex items-center gap-1.5 text-[#0a0a0a]/35 text-xs mb-5 hover:text-[#0a0a0a] transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>

        <div className="mb-4">
          <PaymentCardVisual
            holderName={name}
            eventName={eventName}
          />
          <p className="text-center text-[#0a0a0a]/20 text-[9px] mt-2">Click to see back</p>
        </div>

        <div className="p-4 rounded-xl mb-5" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="flex justify-between items-center">
            <span className="text-[#0a0a0a] text-sm font-semibold">{selected?.name} × {isTable ? 1 : qty}</span>
            <span className="text-[#0a0a0a] font-bold">{formatPrice(total, currency)}</span>
          </div>
          <p className="text-[#0a0a0a]/30 text-xs mt-1">{email}</p>
        </div>

        <div id="onvo-widget" className="min-h-[300px]" />

        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
      </div>
    );
  }

  // ── DETAILS FORM ──
  if (step === "details" || step === "processing") {
    return (
      <div>
        <button type="button" onClick={() => setStep("select")}
          className="flex items-center gap-1.5 text-[#0a0a0a]/35 text-xs mb-5 hover:text-[#0a0a0a] transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>

        {/* Summary */}
        <div className="p-4 rounded-xl mb-5" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {selected?.zone_color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selected.zone_color }} />}
              <span className="text-[#0a0a0a] text-sm font-semibold">{selected?.name}</span>
              <span className="text-[#0a0a0a]/35 text-xs">{isTable ? `${paxCount} pax` : `× ${qty}`}</span>
            </div>
            <span className="text-[#0a0a0a] font-bold">{formatPrice(total, currency)}</span>
          </div>
        </div>

        <form onSubmit={handlePurchase} className="flex flex-col gap-3">
          <input type="text" placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} style={inputStyle} />
          <input type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} style={inputStyle} />
          <input type="email" placeholder="Confirm your email *" value={emailConfirm} onChange={(e) => setEmailConfirm(e.target.value)} required className={inputClass}
            style={{ ...inputStyle, border: emailConfirm && email !== emailConfirm ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(0,0,0,0.08)" }} />
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
            <select
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
              className="px-3 py-3 text-sm text-[#0a0a0a]/70 focus:outline-none shrink-0"
              style={{ background: "rgba(0,0,0,0.04)", borderRight: "1px solid rgba(0,0,0,0.08)" }}
            >
              {[
                ["🇨🇷","+506","CR"],["🇺🇸","+1","US"],["🇲🇽","+52","MX"],["🇨🇴","+57","CO"],
                ["🇦🇷","+54","AR"],["🇧🇷","+55","BR"],["🇵🇦","+507","PA"],["🇬🇹","+502","GT"],
                ["🇸🇻","+503","SV"],["🇭🇳","+504","HN"],["🇳🇮","+505","NI"],["🇩🇴","+1809","DO"],
                ["🇵🇷","+1787","PR"],["🇵🇪","+51","PE"],["🇨🇱","+56","CL"],["🇧🇴","+591","BO"],
                ["🇪🇨","+593","EC"],["🇵🇾","+595","PY"],["🇺🇾","+598","UY"],["🇻🇪","+58","VE"],
                ["🇨🇺","+53","CU"],["🇪🇸","+34","ES"],["🇬🇧","+44","GB"],["🇫🇷","+33","FR"],
                ["🇩🇪","+49","DE"],["🇮🇹","+39","IT"],["🇵🇹","+351","PT"],["🇨🇦","+1","CA"],
                ["🇦🇺","+61","AU"],["🇨🇳","+86","CN"],["🇯🇵","+81","JP"],["🇮🇳","+91","IN"],
              ].map(([flag, code, name]) => (
                <option key={name} value={code}>{flag} {code}</option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="Phone *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="flex-1 px-4 py-3 text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none"
              style={{ background: "rgba(0,0,0,0.04)" }}
            />
          </div>

          {/* Multi-email toggle — general tickets */}
          {!isTable && qty >= 2 && (
            <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
              <span className="text-[#0a0a0a]/50 text-sm">Send all to the same email</span>
              <button type="button" onClick={() => {
                const next = !sameEmail;
                setSameEmail(next);
                if (!next) setPerTicket(Array.from({ length: qty }, (_, i) => ({ name: i === 0 ? name : "", email: i === 0 ? email : "" })));
              }}
                className="relative w-9 h-5 rounded-full shrink-0 transition-colors"
                style={{ background: sameEmail ? "#0a0a0a" : "rgba(0,0,0,0.1)" }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: sameEmail ? "17px" : "2px" }} />
              </button>
            </label>
          )}
          {!isTable && qty >= 2 && !sameEmail && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: qty }, (_, i) => (
                <div key={i} className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <p className="text-[#0a0a0a]/40 text-xs font-semibold">Ticket {i + 1}</p>
                  <input type="text" placeholder={`Name${i === 0 ? " (you)" : ""}`}
                    value={perTicket[i]?.name ?? (i === 0 ? name : "")}
                    onChange={(e) => updatePerTicket(i, "name", e.target.value)}
                    className={inputClass} style={inputStyle} />
                  <input type="email" placeholder={`Email *${i === 0 ? " (tú)" : ""}`}
                    value={perTicket[i]?.email ?? (i === 0 ? email : "")}
                    onChange={(e) => updatePerTicket(i, "email", e.target.value)}
                    required className={inputClass} style={inputStyle} />
                </div>
              ))}
            </div>
          )}

          {/* Table: pax counter + optional per-person emails */}
          {isTable && (
            <>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
                <span className="text-[#0a0a0a]/50 text-sm">How many people?</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => { setPaxCount(Math.max(1, paxCount - 1)); setPerTicket([]); }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#0a0a0a]" style={{ background: "rgba(0,0,0,0.07)" }}>−</button>
                  <span className="text-[#0a0a0a] font-semibold w-4 text-center">{paxCount}</span>
                  <button type="button" onClick={() => { setPaxCount(Math.min(maxPax, paxCount + 1)); setPerTicket([]); }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#0a0a0a]" style={{ background: "rgba(0,0,0,0.07)" }}>+</button>
                </div>
              </div>

              {paxCount >= 2 && (
                <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <span className="text-[#0a0a0a]/50 text-sm">Send to different emails</span>
                  <button type="button" onClick={() => {
                    const next = !sameEmail;
                    setSameEmail(next);
                    if (!next) setPerTicket(Array.from({ length: paxCount }, (_, i) => ({ name: i === 0 ? name : "", email: i === 0 ? email : "" })));
                    else setPerTicket([]);
                  }}
                    className="relative w-9 h-5 rounded-full shrink-0 transition-colors"
                    style={{ background: !sameEmail ? "#0a0a0a" : "rgba(0,0,0,0.1)" }}>
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: !sameEmail ? "17px" : "2px" }} />
                  </button>
                </label>
              )}

              {paxCount >= 2 && !sameEmail && (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: paxCount }, (_, i) => (
                    <div key={i} className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.07)" }}>
                      <p className="text-[#0a0a0a]/40 text-xs font-semibold">Person {i + 1}{i === 0 ? " (you)" : ""}</p>
                      <input type="text" placeholder="Name"
                        value={perTicket[i]?.name ?? (i === 0 ? name : "")}
                        onChange={(e) => updatePerTicket(i, "name", e.target.value)}
                        className={inputClass} style={inputStyle} />
                      <input type="email" placeholder="Email *"
                        value={perTicket[i]?.email ?? (i === 0 ? email : "")}
                        onChange={(e) => updatePerTicket(i, "email", e.target.value)}
                        required className={inputClass} style={inputStyle} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!isTable && (
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
              <span className="text-[#0a0a0a]/50 text-sm">Quantity</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-full flex items-center justify-center text-[#0a0a0a]" style={{ background: "rgba(0,0,0,0.07)" }}>−</button>
                <span className="text-[#0a0a0a] font-semibold w-4 text-center">{qty}</span>
                <button type="button" onClick={() => setQty(Math.min(maxQty, qty + 1))} className="w-8 h-8 rounded-full flex items-center justify-center text-[#0a0a0a]" style={{ background: "rgba(0,0,0,0.07)" }}>+</button>
              </div>
            </div>
          )}

          {isTable && (
            <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none resize-none" style={inputStyle} />
          )}

          {!showPromo ? (
            <button type="button" onClick={() => setShowPromo(true)} className="text-left text-[#0a0a0a]/30 text-xs hover:text-[#0a0a0a]/50 transition-colors py-1">
              + Have a discount code?
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <input type="text" placeholder="Discount code" value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(null); setPromoError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none uppercase" style={inputStyle} />
                <button type="button" onClick={applyPromo} disabled={promoLoading || !promoCode.trim()}
                  className="px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
                  style={{ background: promoApplied && promoValid ? "rgba(16,185,129,0.1)" : "rgba(0,0,0,0.07)", color: promoApplied && promoValid ? "#059669" : "rgba(0,0,0,0.6)" }}>
                  {promoLoading ? "..." : promoApplied && promoValid ? "✓" : "Apply"}
                </button>
                <button type="button" onClick={() => { setShowPromo(false); setPromoCode(""); setPromoApplied(null); setPromoError(""); }}
                  className="px-3 py-3 rounded-xl text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors" style={{ background: "rgba(0,0,0,0.04)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {promoError && <p className="text-red-500 text-xs pl-1">{promoError}</p>}
              {promoApplied && promoValid && <p className="text-green-600 text-xs pl-1">{promoApplied.discount === 100 ? "Guestlist applied — free ticket" : `${promoApplied.discount}% discount applied`}</p>}
              {promoApplied && !promoValid && <p className="text-yellow-600/70 text-xs pl-1">This code does not apply to the selected ticket</p>}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <button type="button" onClick={() => setMarketingOptIn(!marketingOptIn)}
              className="relative mt-0.5 w-9 h-5 rounded-full shrink-0 transition-colors"
              style={{ background: marketingOptIn ? "#0a0a0a" : "rgba(0,0,0,0.1)" }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: marketingOptIn ? "17px" : "2px" }} />
            </button>
            <span className="text-[#0a0a0a]/35 text-xs leading-relaxed">
              Recibir promociones y novedades sobre los próximos eventos.
            </span>
          </label>

          <p className="text-[#0a0a0a]/20 text-[10px]">Al comprar aceptas los términos y condiciones de Vybz Tickets.</p>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="py-3 flex flex-col gap-1.5" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[#0a0a0a]/30 text-xs">Subtotal</span>
              <span className="text-[#0a0a0a]/40 text-xs">{formatPrice(basePrice, currency)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-green-600 text-xs">Descuento ({discountPct}%)</span>
                <span className="text-green-600 text-xs">−{formatPrice(discountAmount, currency)}</span>
              </div>
            )}
            {subtotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[#0a0a0a]/30 text-xs">Fee de servicio ({platformFeePercent}%)</span>
                <span className="text-[#0a0a0a]/40 text-xs">{formatPrice(serviceFee, currency)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              <span className="text-[#0a0a0a]/40 text-sm">Total</span>
              <span className="text-[#0a0a0a] font-bold text-xl">{formatPrice(total, currency)}</span>
            </div>
          </div>

          <button type="submit" disabled={step === "processing" || paymentLoading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
            style={{ background: "#0a0a0a" }}>
            {(step === "processing" || paymentLoading) ? "Procesando..." : total === 0 ? `Confirmar gratis` : `Proceder al pago · ${formatPrice(total, currency)}`}
          </button>
        </form>
      </div>
    );
  }

  // ── SELECT ──
  return (
    <div>
      {generalTypes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full bg-[#0a0a0a]" />
            <p className="text-[#0a0a0a] font-semibold text-sm">Tickets</p>
          </div>
          <div className="flex flex-col gap-2">
            {generalTypes.map((t) => {
              const avail = t.total_available - t.sold_count;
              const low = avail > 0 && avail <= 10;
              return (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[#0a0a0a] font-semibold text-sm">{t.name}</p>
                      {low && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                          {avail} restantes
                        </span>
                      )}
                    </div>
                    {t.description && <p className="text-[#0a0a0a]/35 text-xs truncate">{t.description}</p>}
                    <p className="text-[#0a0a0a] font-bold text-base mt-1">{formatPrice(t.price, currency)}</p>
                  </div>
                  <button onClick={() => selectTicket(t.id)}
                    className="ml-4 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors bg-[#0a0a0a] hover:bg-black/80">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tableTypes.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full bg-[#0a0a0a]" />
            <p className="text-[#0a0a0a] font-semibold text-sm">Mesas VIP</p>
          </div>

          {venueMapUrl && (
            <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <Image src={venueMapUrl} alt="Mapa de mesas" width={800} height={500} className="w-full object-cover" />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {tableTypes.map((t) => {
              const avail = t.total_available - t.sold_count;
              return (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {t.zone_color && <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: t.zone_color }} />}
                    <div className="min-w-0">
                      <p className="text-[#0a0a0a] font-semibold text-sm">{t.name}</p>
                      {t.capacity && <p className="text-[#0a0a0a]/35 text-xs">Hasta {t.capacity} personas</p>}
                      {t.description && <p className="text-[#0a0a0a]/30 text-xs truncate">{t.description}</p>}
                      <p className="text-[#0a0a0a] font-bold text-base mt-1">desde {formatPrice(t.price, currency)}</p>
                      {avail <= 0 ? (
                        <p className="text-red-500/60 text-xs">Agotada</p>
                      ) : avail <= 5 ? (
                        <p className="text-amber-600/70 text-xs">{avail} disponible{avail !== 1 ? "s" : ""}</p>
                      ) : null}
                    </div>
                  </div>
                  {avail > 0 && (
                    <button onClick={() => selectTicket(t.id)}
                      className="ml-4 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#0a0a0a] hover:bg-black/80">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
