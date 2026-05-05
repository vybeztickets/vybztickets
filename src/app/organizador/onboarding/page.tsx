"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrganizerType = "discoteca" | "organizador" | "festival";

const OPTIONS: {
  value: OrganizerType;
  label: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "discoteca",
    label: "Discoteca",
    subtitle: "Venue / Nightclub",
    description: "Tienes un espacio físico y organizas eventos recurrentes: noches temáticas, shows, fiestas.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M16 4V7M16 25V28M4 16H7M25 16H28M7.05 7.05L9.17 9.17M22.83 22.83L24.95 24.95M24.95 7.05L22.83 9.17M9.17 22.83L7.05 24.95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: "organizador",
    label: "Organizador",
    subtitle: "Event organizer",
    description: "Produces eventos puntuales en distintos espacios: conciertos, obras, conferencias, fiestas privadas.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M4 14H28" stroke="currentColor" strokeWidth="2" />
        <path d="M11 4V10M21 4V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 20H15M10 24H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "festival",
    label: "Festival",
    subtitle: "Multi-day / Multi-artist",
    description: "Organizas festivales con múltiples artistas, escenarios, o jornadas. Alta capacidad y operación compleja.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 26L10 14L16 20L22 10L28 26H4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M13 8C13 6.34 14.34 5 16 5C17.66 5 19 6.34 19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
        <p className="font-[family-name:var(--font-bebas)] text-lg tracking-widest text-[#0a0a0a]/30 mb-2 text-center">
          VYBZ
        </p>
        <h1
          className="font-[family-name:var(--font-bebas)] text-5xl md:text-6xl text-[#0a0a0a] text-center mb-3"
          style={{ letterSpacing: "0.01em" }}
        >
          ¿Cómo vas a usar Vybz?
        </h1>
        <p className="text-center text-[#0a0a0a]/40 text-sm mb-12">
          Esto personaliza tu dashboard. Puedes cambiarlo después desde configuración.
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
                  border: isSelected ? "1px solid #0a0a0a" : "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <div
                  className="mb-5 w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: isSelected ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)",
                    color: isSelected ? "#ffffff" : "#0a0a0a",
                  }}
                >
                  {opt.icon}
                </div>
                <p
                  className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide mb-0.5"
                  style={{ color: isSelected ? "#ffffff" : "#0a0a0a" }}
                >
                  {opt.label}
                </p>
                <p
                  className="text-xs font-medium mb-3"
                  style={{ color: isSelected ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)" }}
                >
                  {opt.subtitle}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: isSelected ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.5)" }}
                >
                  {opt.description}
                </p>
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
            {saving ? "Guardando…" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
