"use client";

export default function TicketLookup() {
  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(0,0,0,0.06)" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>
      <h2 className="font-semibold text-lg mb-3" style={{ color: "#0a0a0a" }}>Check your email</h2>
      <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: "rgba(0,0,0,0.5)" }}>
        Your ticket with QR code was sent to the email you provided at checkout.
      </p>
      <p className="text-xs mt-4" style={{ color: "rgba(0,0,0,0.35)" }}>
        Can't find it? Check your spam folder or{" "}
        <a href="/eventos" className="underline hover:opacity-70 transition-opacity" style={{ color: "rgba(0,0,0,0.55)" }}>
          go to the event page to resend it
        </a>.
      </p>
    </div>
  );
}
