"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrganizerType = "discoteca" | "organizador" | "festival";
type FeatureItem = { text: string; exclusive: boolean };

const OPTIONS: {
  value: OrganizerType;
  label: string;
  subtitle: string;
  description: string;
  features: FeatureItem[];
  icon: React.ReactNode;
}[] = [
  {
    value: "discoteca",
    label: "Nightclub",
    subtitle: "Venue / Club",
    description: "You have a physical space and run recurring events: themed nights, shows, parties.",
    features: [
      { text: "Tickets & access control", exclusive: false },
      { text: "Bar POS & cashier app", exclusive: false },
      { text: "Permanent VIP table map", exclusive: true },
      { text: "Bar inventory with alerts", exclusive: true },
    ],
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 28V14L16 4L28 14V28" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 28V20H20V28" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="16" cy="13" r="2.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: "organizador",
    label: "Organizer",
    subtitle: "Event organizer",
    description: "You produce one-off events across different spaces: concerts, shows, conferences, private parties.",
    features: [
      { text: "Tickets & access control", exclusive: false },
      { text: "Bar POS & cashier app", exclusive: false },
      { text: "VIP tables per event", exclusive: false },
      { text: "Promo codes & traffic tracking", exclusive: false },
    ],
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="5" y="5" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M9 10H15M9 14H15M9 18H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="22" cy="22" r="5" stroke="currentColor" strokeWidth="2" />
        <path d="M22 19V22L24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "festival",
    label: "Festival",
    subtitle: "Multi-day / Multi-artist",
    description: "You run festivals with multiple artists, stages, or days. High capacity and complex operations.",
    features: [
      { text: "Multi-day / multi-stage events", exclusive: true },
      { text: "Per-day tickets or full access", exclusive: true },
      { text: "Bar POS & cashier app", exclusive: false },
      { text: "Bar inventory with alerts", exclusive: true },
    ],
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 26H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 26V10L16 6L24 10V26" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 10H24" stroke="currentColor" strokeWidth="2" />
        <path d="M13 26V19H19V26" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M4 16H8M24 16H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<OrganizerType | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch("/api/organizador/set-organizer-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizer_type: selected }),
    });
    if (res.ok) {
      router.replace("/organizador");
    } else {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "#ffffff" }}
    >
      <div className="w-full max-w-3xl">
        <p className="font-[family-name:var(--font-bebas)] text-lg tracking-widest mb-2 text-center" style={{ color: "#888" }}>
          VYBZ
        </p>
        <h1
          className="font-[family-name:var(--font-bebas)] text-5xl md:text-6xl text-[#0a0a0a] text-center mb-3"
          style={{ letterSpacing: "0.01em" }}
        >
          How will you use Vybz?
        </h1>
        <p className="text-center text-sm mb-12" style={{ color: "#666" }}>
          This personalizes your dashboard. You can change it later from settings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className="text-left rounded-2xl p-6 transition-all"
                style={{
                  background: isSelected ? "#0a0a0a" : "#ffffff",
                  border: isSelected ? "1px solid #0a0a0a" : "1px solid #d8d8d8",
                }}
              >
                <p
                  className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide mb-0.5"
                  style={{ color: isSelected ? "#ffffff" : "#0a0a0a" }}
                >
                  {opt.label}
                </p>
                <p
                  className="text-xs font-medium mb-4"
                  style={{ color: isSelected ? "#aaaaaa" : "#666666" }}
                >
                  {opt.subtitle}
                </p>
                <p
                  className="text-sm leading-relaxed mb-5"
                  style={{ color: isSelected ? "#cccccc" : "#444444" }}
                >
                  {opt.description}
                </p>
                <div
                  className="pt-4"
                  style={{ borderTop: `1px solid ${isSelected ? "rgba(255,255,255,0.12)" : "#e8e8e8"}` }}
                >
                  <div className="flex flex-col gap-2">
                    {opt.features.map((f) => (
                      <div key={f.text} className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                          <circle cx="7" cy="7" r="6.5" stroke={isSelected ? "#ffffff" : "#0a0a0a"} />
                          <path d="M4 7L6 9.5L10 5" stroke={isSelected ? "#ffffff" : "#0a0a0a"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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

        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selected || saving}
            className="px-10 py-3.5 rounded-full text-sm font-semibold transition-all disabled:opacity-30"
            style={{ background: "#0a0a0a", color: "#ffffff" }}
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
