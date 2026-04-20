"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "react-qr-code";

type EventData = Record<string, unknown>;
type TicketTypeData = Record<string, unknown>;

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CR", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function fmtPrice(n: number) {
  return "₡" + n.toLocaleString("es-CR");
}

function InfoRow({ label, value, accent, text }: { label: string; value: string; accent: string; text: string }) {
  return (
    <div>
      <p className="text-[8px] font-black tracking-[0.18em] uppercase mb-0.5" style={{ color: accent }}>{label}</p>
      <p className="text-[11px] font-semibold leading-tight" style={{ color: text }}>{value || "—"}</p>
    </div>
  );
}

const FAKE_UUID = "00000000-MUESTRA-0000-0000-000000000000";
const FAKE_REF = "#00000000";

export default function SampleTicketCard({
  event,
  ticketType,
  organizerName,
  backHref,
}: {
  event: EventData;
  ticketType: TicketTypeData;
  organizerName: string;
  backHref?: string;
}) {
  const bg = (event.ticket_bg_color as string) || "#0a0a0a";
  const accent = (event.ticket_accent_color as string) || "#db2777";
  const border = (event.ticket_border_color as string) || "#7c3aed";
  const textColor = (event.ticket_text_color as string) || "#ffffff";

  const isTable = ticketType.category === "table" || ticketType.category === "seat";
  const typeLabel = isTable ? "MESA VIP" : "GENERAL";

  const startTime = event.time ? fmt12(event.time as string) : null;
  const endTime = event.end_time ? fmt12(event.end_time as string) : null;
  const timeStr = startTime ? (endTime ? `${startTime} — ${endTime}` : startTime) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 px-4" style={{ background: "#050505" }}>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <div className="px-3 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
          BOLETO DE MUESTRA — NO VÁLIDO PARA INGRESO
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: `linear-gradient(135deg,${border},${accent})` }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
          </svg>
          Descargar / Imprimir
        </button>
        {backHref ? (
          <Link href={backHref} className="text-white/30 text-sm hover:text-white/60 transition-colors">
            ← Volver
          </Link>
        ) : (
          <button onClick={() => window.history.back()} className="text-white/30 text-sm hover:text-white/60 transition-colors">
            ← Volver
          </button>
        )}
      </div>

      {/* ── THE TICKET ── */}
      <div
        id="ticket"
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
        {/* Background watermark */}
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

        {/* MUESTRA diagonal band */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none select-none flex items-center justify-center"
          style={{ zIndex: 10 }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-35deg)",
              fontSize: 44,
              fontWeight: 900,
              color: "#ef4444",
              opacity: 0.18,
              whiteSpace: "nowrap",
              letterSpacing: 8,
            }}
          >
            MUESTRA
          </div>
        </div>

        {/* ── TOP HEADER BAND ── */}
        <div className="flex items-center justify-between px-5 py-3" style={{ background: `linear-gradient(90deg,${border}22,${accent}22)`, borderBottom: `1px solid ${border}33` }}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `linear-gradient(135deg,${border},${accent})` }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v2c1.1 0 2 .9 2 2s-.9 2-2 2v2c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-2c-1.1 0-2-.9-2-2s.9-2 2-2V6c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: accent }}>VYBZ TICKETS</span>
          </div>
          <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}>
            {typeLabel}
          </span>
        </div>

        {/* ── EVENT NAME ── */}
        <div className="px-6 pt-5 pb-4">
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: `${textColor}55` }}>{event.city as string} · {event.venue as string}</p>
          <h1 className="text-2xl font-black tracking-tight leading-none uppercase" style={{ color: textColor }}>{event.name as string}</h1>
          {timeStr && (
            <p className="text-xs font-semibold mt-1.5" style={{ color: `${textColor}88` }}>
              {event.date ? fmtDate(event.date as string) : ""}  ·  {timeStr}
            </p>
          )}
        </div>

        {/* ── QR CODE ── */}
        <div className="flex flex-col items-center px-6 pb-5">
          <div className="p-4 rounded-2xl bg-white w-fit relative" style={{ boxShadow: `0 0 0 6px ${border}22` }}>
            <QRCode value={FAKE_UUID} size={220} level="H" />
            {/* MUESTRA overlay on QR */}
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: "rgba(239,68,68,0.1)" }}>
              <span className="text-red-600 font-black text-sm tracking-widest opacity-70 rotate-[-35deg]">MUESTRA</span>
            </div>
          </div>
          <p className="text-[10px] font-mono font-bold mt-3 tracking-[0.25em]" style={{ color: `${textColor}44` }}>{FAKE_REF}</p>
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
              <InfoRow label="Evento" value={event.name as string} accent={accent} text={textColor} />
              <InfoRow label="Organizador" value={organizerName} accent={accent} text={textColor} />
              <InfoRow label="Lugar" value={`${event.venue as string}, ${event.city as string}`} accent={accent} text={textColor} />
              <InfoRow label="Fecha" value={event.date ? fmtDate(event.date as string) : "—"} accent={accent} text={textColor} />
              {timeStr && <InfoRow label="Hora" value={timeStr} accent={accent} text={textColor} />}
            </div>

            {/* Right */}
            <div className="flex flex-col gap-3 flex-1">
              <InfoRow label="Nombre" value="Juan Pérez" accent={accent} text={textColor} />
              <InfoRow label="Tipo de entrada" value={ticketType.name as string} accent={accent} text={textColor} />
              <InfoRow label="Ref. pedido" value={FAKE_REF} accent={accent} text={textColor} />
              <InfoRow label="Precio" value={fmtPrice(ticketType.price as number)} accent={accent} text={textColor} />
            </div>

            {/* Flyer */}
            {!!event.image_url && (
              <div className="shrink-0 w-[68px]">
                <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "3/4", border: `1px solid ${border}44` }}>
                  <Image src={event.image_url as string} alt="Flyer" width={68} height={90} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* UUID */}
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${border}22` }}>
            <p className="text-[8px] font-bold tracking-widest uppercase mb-0.5" style={{ color: `${textColor}33` }}>UUID</p>
            <p className="text-[8px] font-mono break-all" style={{ color: `${textColor}30` }}>{FAKE_UUID}</p>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${border}22` }}>
            <p className="text-center text-[8px] leading-relaxed" style={{ color: `${textColor}30` }}>
              BOLETO DE MUESTRA — No válido para ingreso al evento.
              <br />Prohibida la reventa no autorizada.
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
