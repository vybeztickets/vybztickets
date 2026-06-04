"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Banner = {
  id: string;
  status: string;
  banner_url: string;
  banner_status: string;
  start_date: string;
  end_date: string;
  days: number;
  total_cost: number;
  created_at: string;
  event_id: string;
  organizer_id: string;
  eventName?: string;
  organizerName?: string;
  organizerEmail?: string;
};

type Tab = "pending_review" | "activos" | "approved" | "rejected";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function daysDiff(from: string, to: string) {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending_review: { bg: "rgba(245,158,11,0.12)", color: "#b45309", label: "Pending review" },
  approved: { bg: "rgba(16,185,129,0.12)", color: "#059669", label: "History" },
  rejected: { bg: "rgba(239,68,68,0.1)", color: "#dc2626", label: "Rejected" },
};

export default function AdminBannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending_review");
  const [acting, setActing] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetch("/api/admin/banners")
      .then(r => r.json())
      .then(d => { setBanners(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleAction(id: string, action: "approve" | "reject" | "deactivate") {
    setActing(id);
    await fetch(`/api/admin/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const newStatus = action === "approve" ? "approved" : "rejected";
    setBanners(prev => prev.map(b => b.id === id ? { ...b, banner_status: newStatus } : b));
    setActing(null);
    router.refresh();
  }

  const pendingCount = banners.filter(b => b.banner_status === "pending_review").length;

  const activosBanners = banners.filter(b =>
    b.banner_status === "approved" &&
    b.status === "active" &&
    b.start_date <= today &&
    b.end_date >= today
  );

  const filtered: Banner[] = tab === "pending_review"
    ? banners.filter(b => b.banner_status === "pending_review")
    : tab === "activos"
    ? activosBanners
    : tab === "approved"
    ? banners.filter(b => b.banner_status === "approved" && !(b.status === "active" && b.start_date <= today && b.end_date >= today))
    : banners.filter(b => b.banner_status === "rejected");

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "pending_review", label: "Pending review", count: pendingCount },
    { key: "activos", label: "Active now", count: activosBanners.length },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/30 mb-1">✦ CAROUSEL</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
          Homepage banners
        </h1>
        <p className="text-[#0a0a0a]/40 text-sm mt-1">Review and approve banners before they appear in the carousel.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            style={tab === t.key
              ? { background: "#0a0a0a", color: "#fff" }
              : { background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)" }}>
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#0a0a0a]/20 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ border: "1px dashed rgba(0,0,0,0.08)" }}>
          <p className="text-[#0a0a0a]/20 text-sm">No banners in this category</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(b => {
            const daysActive = daysDiff(b.start_date, today);
            const daysRemaining = daysDiff(today, b.end_date);
            const isLive = tab === "activos";

            return (
              <div key={b.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
                {/* Banner image */}
                <div className="relative w-full" style={{ aspectRatio: "3/1", background: "#f4f4f5" }}>
                  <Image src={b.banner_url} alt="Banner" fill className="object-cover" />
                  {isLive && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                      style={{ background: "rgba(16,185,129,0.9)", color: "#fff" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0a0a0a] font-semibold text-sm truncate">{b.eventName ?? b.event_id}</p>
                    <p className="text-[#0a0a0a]/40 text-xs mt-0.5">
                      {b.organizerName ?? "—"} · {b.organizerEmail ?? ""}
                    </p>
                    <p className="text-[#0a0a0a]/30 text-xs mt-1">
                      {fmtDate(b.start_date)} → {fmtDate(b.end_date)} · {b.days} days · ${b.total_cost.toFixed(2)} USD
                    </p>

                    {isLive && (
                      <div className="flex gap-4 mt-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}>
                          {daysActive <= 0 ? "Started today" : `Active for ${daysActive} day${daysActive !== 1 ? "s" : ""}`}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.45)" }}>
                          {daysRemaining <= 0 ? "Ends today" : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {b.banner_status === "pending_review" && (
                      <>
                        <button onClick={() => handleAction(b.id, "reject")} disabled={acting === b.id}
                          className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                          style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
                          Reject
                        </button>
                        <button onClick={() => handleAction(b.id, "approve")} disabled={acting === b.id}
                          className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                          style={{ background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)" }}>
                          {acting === b.id ? "…" : "Approve"}
                        </button>
                      </>
                    )}
                    {isLive && (
                      <button onClick={() => handleAction(b.id, "deactivate")} disabled={acting === b.id}
                        className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                        style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
                        {acting === b.id ? "…" : "Deactivate"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
