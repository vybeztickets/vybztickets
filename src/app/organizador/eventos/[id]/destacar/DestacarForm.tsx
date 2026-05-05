"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ImageUploadField from "@/app/components/ImageUploadField";

const PRICE_PER_DAY = 1; // USD

type FeaturedRecord = {
  id: string;
  start_date: string;
  end_date: string;
  days: number;
  total_cost: number;
  status: string;
  created_at: string;
  banner_url?: string | null;
  banner_status?: string | null;
};

type HistoryRecord = {
  start_date: string;
  end_date: string;
  days: number;
  total_cost: number;
  status: string;
  created_at: string;
};

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function daysBetween(a: string, b: string) {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
}

export default function DestacarForm({
  eventId, eventName, eventDate, eventImageUrl,
  today, activeFeatured, totalSpent, history,
}: {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventImageUrl: string | null;
  today: string;
  activeFeatured: FeaturedRecord | null;
  totalSpent: number;
  history: HistoryRecord[];
}) {
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(eventDate >= today ? eventDate : today);
  const [bannerUrl, setBannerUrl] = useState("");
  const [replacingBanner, setReplacingBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState<FeaturedRecord | null>(activeFeatured);
  const [step, setStep] = useState<"config" | "confirm" | "success">("config");

  const days = startDate && endDate && endDate >= startDate ? daysBetween(startDate, endDate) : 0;
  const totalCost = days * PRICE_PER_DAY;

  const isActive = active && active.end_date >= today;

  useEffect(() => {
    if (endDate < startDate) setEndDate(startDate);
  }, [startDate, endDate]);

  async function handleSaveBanner() {
    if (!active || !bannerUrl) return;
    setSavingBanner(true);
    setError("");
    const res = await fetch(`/api/organizador/featured-events/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banner_url: bannerUrl }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error saving"); setSavingBanner(false); return; }
    setActive(data);
    setReplacingBanner(false);
    setBannerUrl("");
    setSavingBanner(false);
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/organizador/featured-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, start_date: startDate, end_date: endDate, banner_url: bannerUrl || null }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error activating"); setLoading(false); return; }
    setActive(data);
    setStep("success");
    setLoading(false);
  }

  async function handleCancel() {
    if (!active) return;
    setCancelling(true);
    await fetch(`/api/organizador/featured-events/${active.id}`, { method: "DELETE" });
    setActive(null);
    setStep("config");
    setCancelling(false);
  }

  // ── SUCCESS STATE ──
  if (step === "success" && active) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="text-[#0a0a0a] font-semibold text-sm">Featured event activated</p>
              <p className="text-[#0a0a0a]/40 text-xs">{fmtDate(active.start_date)} → {fmtDate(active.end_date)}</p>
            </div>
          </div>
          <p className="text-[#0a0a0a]/50 text-sm">
            Your event will appear in the homepage carousel. The cost of <strong>${active.total_cost.toFixed(2)} USD</strong> will be deducted from your next payout.
          </p>
          <button onClick={() => setStep("config")} className="text-[#0a0a0a]/40 text-xs hover:text-[#0a0a0a] transition-colors text-left">
            ← Modify period
          </button>
        </div>
      </div>
    );
  }

  // ── CONFIRM STATE ──
  if (step === "confirm") {
    return (
      <div className="flex flex-col gap-6">
        {/* Event preview */}
        <div className="rounded-2xl overflow-hidden flex gap-4 p-4" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}>
          {eventImageUrl && (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
              <Image src={eventImageUrl} alt={eventName} fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[#0a0a0a] font-semibold text-sm truncate">{eventName}</p>
            <p className="text-[#0a0a0a]/35 text-xs">{fmtDate(eventDate)}</p>
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[#0a0a0a] font-semibold text-sm">Order summary</p>
          </div>
          {[
            { label: "Period", value: `${fmtDate(startDate)} → ${fmtDate(endDate)}` },
            { label: "Duration", value: `${days} day${days !== 1 ? "s" : ""}` },
            { label: "Rate", value: `$${PRICE_PER_DAY.toFixed(2)} USD / day` },
          ].map((row) => (
            <div key={row.label} className="flex justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <span className="text-[#0a0a0a]/45 text-sm">{row.label}</span>
              <span className="text-[#0a0a0a] text-sm font-medium">{row.value}</span>
            </div>
          ))}
          <div className="flex justify-between px-5 py-4">
            <span className="text-[#0a0a0a] font-semibold text-sm">Total</span>
            <span className="text-[#0a0a0a] font-bold text-base">${totalCost.toFixed(2)} USD</span>
          </div>
        </div>

        <div className="rounded-xl px-4 py-3 flex gap-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[#0a0a0a]/55 text-xs leading-relaxed">
            Cost is automatically deducted from your next payout. No upfront payment required.
          </p>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex gap-3">
          <button onClick={() => setStep("config")}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,0,0,0.08)" }}>
            Back
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
            style={{ background: "#0a0a0a", color: "#fff" }}>
            {loading ? "Activating..." : `Confirm — $${totalCost.toFixed(2)} USD`}
          </button>
        </div>
      </div>
    );
  }

  // ── CONFIG STATE ──
  return (
    <div className="flex flex-col gap-6">
      {/* Active featuring — mini invoice */}
      {isActive && active && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.25)" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ background: "rgba(245,158,11,0.07)", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <p className="text-[#0a0a0a] font-semibold text-sm">Live on homepage</p>
            </div>
            <button onClick={handleCancel} disabled={cancelling}
              className="text-xs text-[#0a0a0a]/30 hover:text-red-400 transition-colors disabled:opacity-40">
              {cancelling ? "..." : "Cancel"}
            </button>
          </div>
          {[
            { label: "Period", value: `${fmtDate(active.start_date)} → ${fmtDate(active.end_date)}` },
            { label: "Duration", value: `${active.days} day${active.days !== 1 ? "s" : ""}` },
            { label: "Rate", value: "$1.00 USD / day" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <span className="text-[#0a0a0a]/40 text-xs">{row.label}</span>
              <span className="text-[#0a0a0a] text-xs font-medium">{row.value}</span>
            </div>
          ))}
          <div className="flex justify-between px-5 py-3.5" style={{ background: "rgba(0,0,0,0.02)" }}>
            <span className="text-[#0a0a0a] text-xs font-semibold">Total</span>
            <span className="text-[#0a0a0a] text-sm font-bold">${active.total_cost.toFixed(2)} USD</span>
          </div>
          <div className="px-5 py-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <p className="text-[#0a0a0a]/25 text-[10px]">Deducted from your next payout</p>
          </div>
        </div>
      )}

      {/* Pricing info */}
      <div className="rounded-2xl p-5 flex gap-5 items-center" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="text-center shrink-0">
          <p className="font-[family-name:var(--font-bebas)] text-5xl text-[#0a0a0a] leading-none">$1</p>
          <p className="text-[#0a0a0a]/30 text-[10px] uppercase tracking-widest mt-1">per day</p>
        </div>
        <div style={{ width: "1px", height: "48px", background: "rgba(0,0,0,0.08)" }} />
        <div>
          <p className="text-[#0a0a0a] font-semibold text-sm mb-1">Homepage carousel</p>
          <p className="text-[#0a0a0a]/40 text-xs leading-relaxed">
            Your event is shown in the featured section of the homepage. Cost charged at payout.
          </p>
        </div>
      </div>

      {/* Banner upload */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm">Flyer / Banner</p>
          <p className="text-[#0a0a0a]/35 text-xs mt-0.5">Horizontal image shown in the carousel. Recommended: 3072×1280px.</p>
        </div>
        <div className="p-5">
          {/* Show locked existing banner when active and has banner */}
          {active?.banner_url && !replacingBanner ? (
            <div className="flex flex-col gap-3">
              <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "3/1" }}>
                <Image src={active.banner_url} alt="Banner actual" fill className="object-cover" />
                <span
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={
                    active.banner_status === "approved"
                      ? { background: "rgba(16,185,129,0.9)", color: "#fff" }
                      : active.banner_status === "rejected"
                      ? { background: "rgba(239,68,68,0.9)", color: "#fff" }
                      : { background: "rgba(245,158,11,0.9)", color: "#fff" }
                  }
                >
                  {active.banner_status === "approved" ? "Approved" : active.banner_status === "rejected" ? "Rejected" : "Under review"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplacingBanner(true)}
                className="text-xs font-medium px-3 py-2 rounded-lg self-start transition-colors"
                style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                Replace banner
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {replacingBanner && (
                <div className="rounded-xl px-4 py-3 flex gap-2 items-start" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" className="shrink-0 mt-0.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>The new banner will need review and approval before appearing in the carousel.</p>
                </div>
              )}
              <ImageUploadField value={bannerUrl} onChange={setBannerUrl} label="" hint="JPG, PNG or WebP · max 10MB · 3072×1280 recommended" aspectRatio="16:9" />
              {replacingBanner && (
                <div className="flex items-center gap-3">
                  {bannerUrl && (
                    <button
                      type="button"
                      onClick={handleSaveBanner}
                      disabled={savingBanner}
                      className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                      style={{ background: "#0a0a0a", color: "#fff" }}
                    >
                      {savingBanner ? "Saving…" : "Submit for review"}
                    </button>
                  )}
                  <button type="button" onClick={() => { setReplacingBanner(false); setBannerUrl(""); }}
                    className="text-xs text-[#0a0a0a]/30 hover:text-[#0a0a0a] transition-colors">
                    ← Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Date range picker */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[#0a0a0a] font-semibold text-sm">Select the period</p>
          <p className="text-[#0a0a0a]/35 text-xs mt-0.5">Defaults to the event date</p>
        </div>
        <div className="grid grid-cols-2 gap-0">
          <div className="px-5 py-4" style={{ borderRight: "1px solid rgba(0,0,0,0.06)" }}>
            <label className="block text-[#0a0a0a]/35 text-[10px] uppercase tracking-wider mb-2">From</label>
            <input
              type="date"
              value={startDate}
              min={today}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm text-[#0a0a0a] focus:outline-none bg-transparent"
            />
          </div>
          <div className="px-5 py-4">
            <label className="block text-[#0a0a0a]/35 text-[10px] uppercase tracking-wider mb-2">To</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm text-[#0a0a0a] focus:outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Live cost calculator */}
      {days > 0 && (
        <div className="rounded-2xl flex items-center justify-between px-6 py-5" style={{ background: "#0a0a0a" }}>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Total cost</p>
            <p className="text-white font-[family-name:var(--font-bebas)] text-4xl leading-none">
              ${totalCost.toFixed(2)} <span className="text-white/40 text-xl">USD</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/30 text-xs">{days} day{days !== 1 ? "s" : ""} × $1</p>
            <p className="text-white/20 text-xs mt-1">Deducted from payout</p>
          </div>
        </div>
      )}

      {/* History */}
      {history.filter((h) => h.status !== "active").length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[#0a0a0a]/40 text-xs uppercase tracking-wider">History</p>
          </div>
          {history.filter((h) => h.status !== "active").map((h, i) => (
            <div key={i} className="flex justify-between items-center px-5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <div>
                <p className="text-[#0a0a0a]/60 text-xs">{fmtDate(h.start_date)} → {fmtDate(h.end_date)}</p>
                <p className="text-[#0a0a0a]/30 text-[10px]">{h.days} days</p>
              </div>
              <div className="text-right">
                <p className="text-[#0a0a0a]/50 text-xs font-medium">${h.total_cost.toFixed(2)} USD</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                  style={{ background: h.status === "cancelled" ? "rgba(0,0,0,0.05)" : "rgba(16,185,129,0.1)", color: h.status === "cancelled" ? "rgba(0,0,0,0.3)" : "#10b981" }}>
                  {h.status === "cancelled" ? "Cancelled" : "Completed"}
                </span>
              </div>
            </div>
          ))}
          {totalSpent > 0 && (
            <div className="flex justify-between px-5 py-3" style={{ background: "rgba(0,0,0,0.02)" }}>
              <p className="text-[#0a0a0a]/40 text-xs">Total spent on featuring</p>
              <p className="text-[#0a0a0a] text-xs font-semibold">${totalSpent.toFixed(2)} USD</p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setStep("confirm")}
        disabled={days <= 0}
        className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
        style={{ background: "#0a0a0a", color: "#fff" }}
      >
        {days > 0 ? `Continue → ${days} day${days !== 1 ? "s" : ""} · $${totalCost.toFixed(2)} USD` : "Select the dates"}
      </button>
    </div>
  );
}
