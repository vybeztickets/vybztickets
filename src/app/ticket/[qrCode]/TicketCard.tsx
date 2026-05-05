"use client";

import QRCode from "react-qr-code";
import { useRef } from "react";

type TicketData = Record<string, unknown>;

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function fmtPrice(n: number) {
  return "₡" + n.toLocaleString("en-US");
}

function InfoRow({ label, value, accent, text }: { label: string; value: string; accent: string; text: string }) {
  return (
    <div>
      <p className="text-[8px] font-black tracking-[0.18em] uppercase mb-0.5" style={{ color: accent }}>{label}</p>
      <p className="text-[11px] font-semibold leading-tight" style={{ color: text }}>{value || "—"}</p>
    </div>
  );
}

export default function TicketCard({ ticket, organizerName }: { ticket: TicketData; organizerName: string }) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const event = ticket.events as Record<string, unknown>;
  const ticketType = ticket.ticket_types as Record<string, unknown>;

  const bg = (event?.ticket_bg_color as string) || "#0a0a0a";
  const accent = (event?.ticket_accent_color as string) || "#db2777";
  const border = (event?.ticket_border_color as string) || "#7c3aed";
  const textColor = (event?.ticket_text_color as string) || "#ffffff";

  const qrCode = ticket.qr_code as string;
  const shortRef = "#" + qrCode.slice(0, 8).toUpperCase();
  const isTable = ticketType?.category === "table" || ticketType?.category === "seat";
  const typeLabel = isTable ? "VIP TABLE" : "GENERAL";

  const startTime = event?.time ? fmt12(event.time as string) : null;
  const endTime = event?.end_time ? fmt12(event.end_time as string) : null;
  const timeStr = startTime ? (endTime ? `${startTime} — ${endTime}` : startTime) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 px-4" style={{ background: "#050505" }}>

      {/* Actions — hidden on print */}
      <div className="flex items-center gap-3 mb-8 print:hidden">
        <button
          onClick={async () => {
            const el = ticketRef.current;
            if (!el) return;
            const h2c = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");
            // scale so the output is 1125px wide (Apple @3x retina)
            const targetW = 1125;
            const naturalW = el.offsetWidth || 420;
            const scale = targetW / naturalW;
            const canvas = await h2c(el, { scale, useCORS: true, allowTaint: true, backgroundColor: bg });
            const imgData = canvas.toDataURL("image/jpeg", 0.96);
            // 1pt = 1/72 inch; use 264 DPI → 1pt = 264/72 px
            const dpi = 264;
            const ptW = (canvas.width / dpi) * 72;
            const ptH = (canvas.height / dpi) * 72;
            const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [ptW, ptH] });
            pdf.addImage(imgData, "JPEG", 0, 0, ptW, ptH);
            pdf.save(`ticket-${shortRef.replace("#", "")}.pdf`);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: `linear-gradient(135deg,${border},${accent})` }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </button>
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = "/")}
          className="text-white/30 text-sm hover:text-white/60 transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* ── THE TICKET ── */}
      <div
        id="ticket"
        ref={ticketRef}
        className="w-full relative"
        style={{
          maxWidth: 420,
          background: bg,
          border: `2px solid ${border}`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: `0 0 60px ${border}44, 0 20px 60px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Watermark */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none select-none flex items-center justify-center"
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: accent,
            opacity: 0.035,
            lineHeight: 1,
            transform: "rotate(-35deg)",
            whiteSpace: "nowrap",
            letterSpacing: -3,
          }}
        >
          {typeLabel}
        </div>

        {/* ── TOP HEADER BAND ── */}
        <div className="flex items-center px-5 py-3" style={{ position: "relative", background: `linear-gradient(90deg,${border}22,${accent}22)`, borderBottom: `1px solid ${border}33` }}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `linear-gradient(135deg,${border},${accent})` }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v2c1.1 0 2 .9 2 2s-.9 2-2 2v2c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-2c-1.1 0-2-.9-2-2s.9-2 2-2V6c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: accent }}>VYBZ TICKETS</span>
          </div>
          <svg width="84" height="24" style={{ position: "absolute", right: 16, top: 8 }}>
            <rect x="0.5" y="0.5" width="83" height="23" rx="11"
              fill={`${accent}22`} stroke={`${accent}55`} strokeWidth="1" />
            <text x="42" y="16" textAnchor="middle" dominantBaseline="middle"
              fill={accent} fontSize="8" fontWeight="800"
              fontFamily="Arial, Helvetica, sans-serif" letterSpacing="0.5">
              {typeLabel}
            </text>
          </svg>
        </div>

        {/* ── EVENT NAME ── */}
        <div className="px-6 pt-5 pb-4">
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: `${textColor}55` }}>{event?.city as string} · {event?.venue as string}</p>
          <h1 className="text-2xl font-black tracking-tight leading-none uppercase" style={{ color: textColor }}>{event?.name as string}</h1>
          {timeStr && (
            <p className="text-xs font-semibold mt-1.5" style={{ color: `${textColor}88` }}>
              {event?.date ? fmtDate(event.date as string) : ""}  ·  {timeStr}
            </p>
          )}
        </div>

        {/* ── QR CODE ── */}
        <div className="flex flex-col items-center px-6 pb-5">
          <div className="p-4 rounded-2xl bg-white w-fit" style={{ boxShadow: `0 0 0 6px ${border}22` }}>
            <QRCode value={qrCode} size={220} level="H" />
          </div>
          <p className="text-[10px] font-mono font-bold mt-3 tracking-[0.25em]" style={{ color: `${textColor}44` }}>{shortRef}</p>
        </div>

        {/* ── PERFORATION ── */}
        <div className="flex items-center" style={{ margin: "0 -2px" }}>
          <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: "#050505", border: `2px solid ${border}`, marginLeft: -1 }} />
          <div className="flex-1 border-t-2 border-dashed mx-1" style={{ borderColor: `${border}55` }} />
          <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: "#050505", border: `2px solid ${border}`, marginRight: -1 }} />
        </div>

        {/* ── INFO GRID ── */}
        <div className="px-6 pt-4 pb-5">
          <div className="flex gap-4">
            {/* Left */}
            <div className="flex flex-col gap-3 flex-1">
              <InfoRow label="Event" value={event?.name as string} accent={accent} text={textColor} />
              <InfoRow label="Organizer" value={organizerName} accent={accent} text={textColor} />
              <InfoRow label="Venue" value={`${event?.venue as string}, ${event?.city as string}`} accent={accent} text={textColor} />
              <InfoRow label="Date" value={event?.date ? fmtDate(event.date as string) : "—"} accent={accent} text={textColor} />
              {timeStr && <InfoRow label="Time" value={timeStr} accent={accent} text={textColor} />}
            </div>

            {/* Right */}
            <div className="flex flex-col gap-3 flex-1">
              <InfoRow label="Name" value={(ticket.buyer_name as string) || "—"} accent={accent} text={textColor} />
              <InfoRow label="Ticket type" value={ticketType?.name as string} accent={accent} text={textColor} />
              <InfoRow label="Order ref." value={shortRef} accent={accent} text={textColor} />
              <InfoRow label="Price paid" value={fmtPrice(ticket.purchase_price as number)} accent={accent} text={textColor} />
            </div>

            {/* Flyer thumbnail */}
            {!!event?.image_url && (
              <div style={{ flexShrink: 0, width: 80 }}>
                <div style={{ width: 80, height: 120, borderRadius: 6, overflow: "hidden", border: `1px solid ${border}44` }}>
                  <div style={{
                    width: "100%", height: "100%",
                    backgroundImage: `url(${event.image_url as string})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundColor: `${border}18`,
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${border}22` }}>
            <p className="text-center text-[8px] leading-relaxed" style={{ color: `${textColor}30` }}>
              Unauthorized resale is prohibited. This ticket becomes void once used to enter the venue.
              <br /><span style={{ color: accent + "60" }}>Powered by Vybz Tickets</span>
            </p>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg,${accent},${border})` }} />
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #ticket, #ticket * { visibility: visible; }
          #ticket { position: fixed; top: 0; left: 50%; transform: translateX(-50%); border-radius: 0 !important; box-shadow: none !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 0; size: 420px 760px; }
        }
      `}</style>
    </div>
  );
}
