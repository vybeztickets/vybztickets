"use client";

import { useState } from "react";

export default function ResendTicket({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "used" | "notfound">("idle");

  async function handleResend() {
    if (typeof window !== "undefined" && localStorage.getItem(`resent_${eventId}`)) {
      setStatus("used"); return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/tickets/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, email }),
      });
      const data = await res.json();
      if (!data.found) { setStatus("notfound"); return; }
      localStorage.setItem(`resent_${eventId}`, "1");
      setStatus("sent");
    } catch {
      setStatus("notfound");
    }
  }

  if (!open) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setOpen(true)}
          className="text-xs transition-colors"
          style={{ color: "rgba(0,0,0,0.25)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(0,0,0,0.45)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,0,0,0.25)")}
        >
          Already purchased? Resend my ticket
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {status === "sent" ? (
        <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
          Ticket resent to <span style={{ color: "#0a0a0a", fontWeight: 600 }}>{email}</span>
        </p>
      ) : status === "used" ? (
        <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>
          You've already used your resend for this event.
        </p>
      ) : status === "notfound" ? (
        <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>
          We couldn't find an active ticket with that email.
        </p>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleResend()}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
            style={{
              background: "rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.1)",
              color: "#0a0a0a",
            }}
          />
          <button
            onClick={handleResend}
            disabled={!email || status === "sending"}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
            style={{ background: "#0a0a0a", color: "#fff" }}
          >
            {status === "sending" ? "..." : "Send"}
          </button>
        </div>
      )}
    </div>
  );
}
