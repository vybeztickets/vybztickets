"use client";

import Link from "next/link";
import DashboardMockup from "./DashboardMockup";

function TicketMockup() {
  return (
    <div className="relative">
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* event image placeholder */}
        <div
          className="w-full"
          style={{
            height: 180,
            background: "linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
            </svg>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ height: 60, background: "linear-gradient(transparent,#0a0a0a)" }}
          />
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider text-white"
            style={{ background: "rgba(16,185,129,0.9)" }}
          >
            ACTIVO
          </div>
        </div>

        <div className="p-5">
          <p className="text-white/25 text-[9px] uppercase tracking-widest mb-1">Saturday 12 Jul · 8:00pm</p>
          <p className="text-white font-semibold text-sm mb-4">Centro Cultural de Costa Rica</p>

          <div className="space-y-2.5 mb-5">
            {[
              { type: "General", price: "₡15.000", sold: 340, total: 500 },
              { type: "VIP", price: "₡35.000", sold: 78, total: 100 },
              { type: "Table x6", price: "₡180.000", sold: 12, total: 20 },
            ].map((t) => (
              <div
                key={t.type}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p className="text-white text-xs font-semibold">{t.type}</p>
                  <p className="text-white/30 text-[9px]">{t.sold}/{t.total} sold</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-xs font-semibold">{t.price}</p>
                  <div
                    className="mt-1 rounded-full overflow-hidden"
                    style={{ width: 60, height: 3, background: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(t.sold / t.total) * 100}%`, background: "rgba(255,255,255,0.5)" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p className="text-white/25 text-[9px] uppercase tracking-wider">Revenue</p>
              <p className="font-[family-name:var(--font-bebas)] text-white text-2xl leading-none">₡8.38M</p>
            </div>
            <div
              className="px-4 py-2 rounded-full text-xs font-semibold text-white/60"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              View orders →
            </div>
          </div>
        </div>
      </div>

      {/* floating QR card */}
      <div
        className="absolute -bottom-4 -right-4 px-4 py-3 rounded-2xl shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: "white" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2">
              <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/>
              <path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/>
            </svg>
          </div>
          <div>
            <p className="text-white text-[11px] font-semibold">QR sent</p>
            <p className="text-white/30 text-[9px]">instantly by email</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScannerMockup() {
  return (
    <div className="relative flex justify-center">
      {/* phone frame */}
      <div
        className="relative rounded-[2.2rem] overflow-hidden shadow-2xl"
        style={{
          width: 260,
          background: "#0f0f0f",
          border: "8px solid #1a1a1a",
          outline: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* notch */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-16 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
        </div>

        {/* scanner UI */}
        <div className="px-4 pb-6">
          <p className="text-white/30 text-[8px] uppercase tracking-widest text-center mb-3">
            MY EVENT · MAIN ENTRANCE
          </p>

          {/* viewfinder */}
          <div
            className="relative rounded-2xl overflow-hidden mb-4 flex items-center justify-center"
            style={{ height: 200, background: "#000" }}
          >
            {/* corner brackets */}
            {[
              "top-3 left-3 border-t-2 border-l-2 rounded-tl-lg",
              "top-3 right-3 border-t-2 border-r-2 rounded-tr-lg",
              "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg",
              "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg",
            ].map((cls, i) => (
              <div
                key={i}
                className={`absolute w-6 h-6 ${cls}`}
                style={{ borderColor: "rgba(255,255,255,0.6)" }}
              />
            ))}
            {/* scan line */}
            <div
              className="absolute left-6 right-6 h-px"
              style={{
                top: "40%",
                background: "rgba(16,185,129,0.8)",
                boxShadow: "0 0 8px rgba(16,185,129,0.6)",
              }}
            />
            {/* mock QR pattern */}
            <div className="grid grid-cols-5 gap-1 opacity-20">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-sm"
                  style={{ background: [0,2,4,10,12,14,20,22,24,6,18,7,11,13,17].includes(i) ? "white" : "transparent" }}
                />
              ))}
            </div>
          </div>

          {/* result card */}
          <div
            className="rounded-xl p-3 flex items-center gap-3 mb-3"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="text-white text-[11px] font-semibold">Valid ticket</p>
              <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>VIP · Access confirmed</p>
            </div>
            <p className="text-[8px] ml-auto" style={{ color: "rgba(255,255,255,0.2)" }}>8:22pm</p>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { n: "418", label: "Checked in" },
              { n: "82", label: "Remaining" },
              { n: "2", label: "Doors" },
            ].map(({ n, label }) => (
              <div
                key={label}
                className="rounded-lg py-2 text-center"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <p className="font-[family-name:var(--font-bebas)] text-white text-lg leading-none">{n}</p>
                <p className="text-white/25 text-[7px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* side floating badge */}
      <div
        className="absolute -left-2 top-1/3 px-3.5 py-2.5 rounded-xl shadow-xl"
        style={{
          background: "rgba(10,10,10,0.9)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
        }}
      >
        <p className="text-white/25 text-[7px] uppercase tracking-wider mb-1">Avg. time</p>
        <p className="font-[family-name:var(--font-bebas)] text-white text-2xl leading-none">0.4s</p>
        <p className="text-white/25 text-[8px]">per scan</p>
      </div>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </span>
      <span className="text-white/50 text-sm leading-snug">{text}</span>
    </li>
  );
}

function CheckItemDark({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(0,0,0,0.07)" }}
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </span>
      <span className="text-[#0a0a0a]/55 text-sm leading-snug">{text}</span>
    </li>
  );
}

export default function PlatformSection() {
  return (
    <>
      {/* ── Section 1: Dashboard / Analytics ── */}
      <section style={{ background: "#0a0a0a" }} className="py-28 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div>
              <p
                className="inline-flex items-center gap-2 mb-6 text-[9px] font-bold tracking-[0.22em] uppercase"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                <span className="w-4 h-px" style={{ background: "rgba(255,255,255,0.2)" }} />
                REAL-TIME ANALYTICS
              </p>
              <h2
                className="font-[family-name:var(--font-bebas)] text-white leading-[0.9] tracking-wide mb-6"
                style={{ fontSize: "clamp(44px,5.5vw,76px)" }}
              >
                You know exactly<br />
                <span style={{ color: "rgba(255,255,255,0.2)" }}>how much you're</span><br />
                <span style={{ color: "rgba(255,255,255,0.2)" }}>earning.</span>
              </h2>
              <p className="text-white/40 text-base leading-relaxed mb-8 max-w-md">
                Real-time dashboard with revenue, tickets sold and trends. No waiting for end-of-month reports or exporting CSVs.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "Revenue by event and ticket type",
                  "Sales chart by day, week or month",
                  "Top buyers and ambassadors",
                  "Real-time occupancy rate",
                ].map((t) => <CheckItem key={t} text={t} />)}
              </ul>
              <Link
                href="/auth/login?redirectTo=/organizador"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[#0a0a0a] hover:bg-white/90 transition-colors"
              >
                View my dashboard
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M2 10L10 2M10 2H4M10 2V8"/>
                </svg>
              </Link>
            </div>

            {/* Mockup */}
            <div className="lg:pl-8">
              <DashboardMockup dark />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Venta online ── */}
      <section style={{ background: "#f7f7f7" }} className="py-28 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Mockup first on desktop */}
            <div className="lg:pr-8 order-2 lg:order-1">
              <TicketMockup />
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <p
                className="inline-flex items-center gap-2 mb-6 text-[9px] font-bold tracking-[0.22em] uppercase"
                style={{ color: "rgba(0,0,0,0.25)" }}
              >
                <span className="w-4 h-px" style={{ background: "rgba(0,0,0,0.2)" }} />
                ONLINE SALES
              </p>
              <h2
                className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-[0.9] tracking-wide mb-6"
                style={{ fontSize: "clamp(44px,5.5vw,76px)" }}
              >
                Zero to sales<br />
                <span style={{ color: "rgba(0,0,0,0.18)" }}>in 5 minutes.</span>
              </h2>
              <p className="text-[#0a0a0a]/45 text-base leading-relaxed mb-8 max-w-md">
                Create your event, set up ticket types with prices, capacity and sale dates, and start collecting payments. The QR reaches the buyer's email in seconds.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "General, VIP, tables and numbered seats",
                  "Unique non-transferable QR per buyer",
                  "Event page with map and automatic gallery",
                  "Discount codes with ambassador tracking",
                  "Sell via link or embed on your own site",
                ].map((t) => <CheckItemDark key={t} text={t} />)}
              </ul>
              <Link
                href="/auth/login?redirectTo=/organizador/eventos/nuevo"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#222] transition-colors"
              >
                Create event for free
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M2 10L10 2M10 2H4M10 2V8"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: POS / Event day ── */}
      <section style={{ background: "#111" }} className="py-28 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div>
              <p
                className="inline-flex items-center gap-2 mb-6 text-[9px] font-bold tracking-[0.22em] uppercase"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                <span className="w-4 h-px" style={{ background: "rgba(255,255,255,0.2)" }} />
                EVENT DAY
              </p>
              <h2
                className="font-[family-name:var(--font-bebas)] text-white leading-[0.9] tracking-wide mb-6"
                style={{ fontSize: "clamp(44px,5.5vw,76px)" }}
              >
                The door,<br />
                <span style={{ color: "rgba(255,255,255,0.2)" }}>without chaos.</span>
              </h2>
              <p className="text-white/40 text-base leading-relaxed mb-8 max-w-md">
                Scan QRs in real time from any phone, no apps to install. Control capacity by door, sell tickets at the box office and monitor entry live.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "QR scanner directly from the browser",
                  "Multiple simultaneous scanners with operator log",
                  "Door payments in cash or card",
                  "Real-time capacity by ticket type",
                  "Automatic cash close",
                ].map((t) => <CheckItem key={t} text={t} />)}
              </ul>
              <div
                className="inline-flex items-center gap-6 px-6 py-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {[
                  { n: "0s", label: "Setup" },
                  { n: "∞", label: "Scanners" },
                  { n: "0.4s", label: "Per QR" },
                ].map(({ n, label }) => (
                  <div key={label} className="text-center">
                    <p className="font-[family-name:var(--font-bebas)] text-white text-2xl leading-none">{n}</p>
                    <p className="text-white/25 text-[9px] uppercase tracking-wider mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <ScannerMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Marketing — full-width dark feature grid ── */}
      <section style={{ background: "#0a0a0a" }} className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mb-16">
            <p
              className="inline-flex items-center gap-2 mb-6 text-[9px] font-bold tracking-[0.22em] uppercase"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              <span className="w-4 h-px" style={{ background: "rgba(255,255,255,0.2)" }} />
              DATA & MARKETING
            </p>
            <h2
              className="font-[family-name:var(--font-bebas)] text-white leading-[0.9] tracking-wide mb-5"
              style={{ fontSize: "clamp(44px,5.5vw,76px)" }}
            >
              Your attendees<br />
              are your data.<br />
              <span style={{ color: "rgba(255,255,255,0.2)" }}>Use them.</span>
            </h2>
            <p className="text-white/40 text-base leading-relaxed">
              Every purchase generates a verified contact. Segment, send campaigns and measure the result of each marketing action.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {[
              {
                title: "Attendee database",
                desc: "Full list: name, email, phone, ticket type and purchase date. Exportable as CSV.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                ),
              },
              {
                title: "Mass emails",
                desc: "Send communications to all your buyers or segment by ticket type directly from the dashboard.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                ),
              },
              {
                title: "Ambassador codes",
                desc: "Each ambassador has their unique code with sales report and automatically assigned commission.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
              },
              {
                title: "Real-time statistics",
                desc: "Sales charts by day, ticket type and discount code. Always up to date.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                ),
              },
              {
                title: "Facebook Pixel & GA",
                desc: "Connect your pixel for retargeting and measure the full purchase funnel on Facebook, Instagram and Google.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>
                  </svg>
                ),
              },
              {
                title: "Feature on homepage",
                desc: "Put your event in the homepage carousel for $1 a day. The cost is deducted from your next payout.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ),
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 text-white/40"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  {f.icon}
                </div>
                <p className="text-white font-semibold text-sm mb-2">{f.title}</p>
                <p className="text-white/30 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA bar */}
          <div
            className="rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div>
              <p className="text-white font-semibold text-lg mb-1">Ready to fill your next event?</p>
              <p className="text-white/30 text-sm">Create your free account — no card, no subscription.</p>
            </div>
            <Link
              href="/auth/login?redirectTo=/organizador/eventos/nuevo"
              className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[#0a0a0a] hover:bg-white/90 transition-colors"
            >
              Start for free
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M2 10L10 2M10 2H4M10 2V8"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
