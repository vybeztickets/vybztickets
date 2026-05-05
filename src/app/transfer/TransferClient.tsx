"use client";

import { useState } from "react";

type Ticket = {
  id: string;
  qr_code: string;
  buyer_name: string | null;
  buyer_email: string;
  purchase_price: number;
  status: string;
  created_at: string;
  transferred_from: string | null;
  transferred_to: string | null;
  transferred_at: string | null;
  resent_at: string | null;
  ticket_types: { id: string; name: string } | null;
  events: {
    id: string;
    name: string;
    date: string;
    time: string | null;
    venue: string;
    city: string;
    currency: string;
  } | null;
};

type Props = { tickets: Ticket[]; userEmail: string };

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(price: number, currency: string) {
  if (currency === "USD") {
    return `$${price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `₡${price.toLocaleString("en-US")}`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#16a34a" }}>
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: "#16a34a" }}
        />
        Active
      </span>
    );
  }
  if (status === "used") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "rgba(0,0,0,0.35)" }}>
        Used
      </span>
    );
  }
  if (status === "transferred") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#d97706" }}>
        Transferred out
      </span>
    );
  }
  return (
    <span className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>
      {status}
    </span>
  );
}

export default function TransferClient({ tickets, userEmail }: Props) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientEmailConfirm, setRecipientEmailConfirm] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [dialCode, setDialCode] = useState("+506");
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets);
  const [resentIds, setResentIds] = useState<Set<string>>(
    new Set(tickets.filter((t) => t.resent_at).map((t) => t.id))
  );
  const [resending, setResending] = useState<string | null>(null);
  const [resentError, setResentError] = useState<string | null>(null);

  const activeTickets = localTickets.filter(
    (t) => t.status === "active" && t.transferred_from === null
  );

  function openModal(ticket: Ticket) {
    setSelectedTicket(ticket);
    setRecipientName("");
    setRecipientEmail("");
    setRecipientEmailConfirm("");
    setRecipientPhone("");
    setDialCode("+506");
    setCheck1(false);
    setCheck2(false);
    setError(null);
    setSuccess(false);
  }

  function closeModal() {
    setSelectedTicket(null);
    setError(null);
    setSuccess(false);
  }

  async function handleResend(ticketId: string) {
    setResending(ticketId);
    setResentError(null);
    try {
      const res = await fetch("/api/tickets/resend-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "already_resent") {
          setResentIds((prev) => new Set(prev).add(ticketId));
        } else {
          setResentError(data.error ?? "Something went wrong");
        }
        return;
      }
      setResentIds((prev) => new Set(prev).add(ticketId));
    } catch {
      setResentError("Network error. Please try again.");
    } finally {
      setResending(null);
    }
  }

  async function handleTransfer() {
    if (!selectedTicket) return;
    setTransferring(true);
    setError(null);

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          recipientName,
          recipientEmail,
          recipientPhone: dialCode + recipientPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Mark the ticket as transferred in local state
      setLocalTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, status: "transferred", transferred_at: new Date().toISOString() }
            : t
        )
      );
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setTransferring(false);
    }
  }

  const emailsMatch = recipientEmail.trim().length > 0 && recipientEmail.trim() === recipientEmailConfirm.trim();

  const canSubmit =
    check1 &&
    check2 &&
    recipientName.trim().length > 0 &&
    emailsMatch &&
    recipientPhone.trim().length > 0 &&
    !transferring;

  const inputClass =
    "w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";
  const inputStyle = {
    background: "rgba(0,0,0,0.04)",
    border: "1px solid rgba(0,0,0,0.08)",
  };

  return (
    <>
      <main className="pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Page header */}
          <h1 className="text-3xl font-bold text-[#0a0a0a] mb-1">My Tickets</h1>
          <p className="text-sm mb-8" style={{ color: "rgba(0,0,0,0.4)" }}>
            Manage and transfer your tickets
          </p>

          {resentError && (
            <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: "rgba(220,38,38,0.07)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}>
              {resentError}
            </p>
          )}

          {localTickets.length === 0 ? (
            <div
              className="rounded-2xl py-16 text-center"
              style={{ border: "1px dashed rgba(0,0,0,0.1)" }}
            >
              <p className="text-sm mb-1" style={{ color: "rgba(0,0,0,0.3)" }}>
                No tickets found
              </p>
              <p className="text-xs" style={{ color: "rgba(0,0,0,0.2)" }}>
                Tickets purchased with{" "}
                <span style={{ color: "rgba(0,0,0,0.4)" }}>{userEmail}</span> will appear here.
              </p>
            </div>
          ) : (
            <div>
              {localTickets.map((ticket) => {
                const canTransfer =
                  ticket.status === "active" && ticket.transferred_from === null;

                return (
                  <div
                    key={ticket.id}
                    className="rounded-2xl p-5 mb-4 bg-white"
                    style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    {/* Event name */}
                    <p className="font-semibold text-lg text-[#0a0a0a] mb-0.5">
                      {ticket.events?.name ?? "—"}
                    </p>

                    {/* Date, venue */}
                    <p className="text-sm mb-3" style={{ color: "rgba(0,0,0,0.45)" }}>
                      {ticket.events?.date ? formatDate(ticket.events.date) : ""}
                      {ticket.events?.venue ? ` · ${ticket.events.venue}` : ""}
                      {ticket.events?.city ? `, ${ticket.events.city}` : ""}
                    </p>

                    {/* Ticket type & price */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm" style={{ color: "rgba(0,0,0,0.55)" }}>
                        {ticket.ticket_types?.name ?? "—"}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.4)" }}
                      >
                        {formatPrice(
                          ticket.purchase_price,
                          ticket.events?.currency ?? "CRC"
                        )}
                      </span>
                    </div>

                    {/* Status row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <StatusBadge status={ticket.status} />
                        {ticket.transferred_from !== null && (
                          <p className="text-xs mt-1" style={{ color: "#d97706" }}>
                            Received via transfer · Cannot be transferred again
                          </p>
                        )}
                        {ticket.status === "transferred" && ticket.transferred_at && (
                          <p className="text-xs mt-1" style={{ color: "rgba(0,0,0,0.3)" }}>
                            Transferred on {formatShortDate(ticket.transferred_at)}
                          </p>
                        )}
                      </div>

                      {canTransfer && (
                        <button
                          onClick={() => openModal(ticket)}
                          className="text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-75"
                          style={{ background: "#0a0a0a", color: "#fff" }}
                        >
                          Transfer ticket →
                        </button>
                      )}
                    </div>

                    {/* Actions row — only for active tickets */}
                    {ticket.status === "active" && (
                      <div className="mt-3 pt-3 flex items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                        {/* Resend */}
                        <div className="flex items-center gap-3">
                          {resentIds.has(ticket.id) ? (
                            <span className="text-xs font-medium" style={{ color: "#16a34a" }}>Resent ✓</span>
                          ) : (
                            <button
                              onClick={() => handleResend(ticket.id)}
                              disabled={resending === ticket.id}
                              className="text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
                              style={{ color: "rgba(0,0,0,0.45)" }}
                            >
                              {resending === ticket.id ? "Sending…" : "Resend to email →"}
                            </button>
                          )}
                          {!resentIds.has(ticket.id) && (
                            <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.2)" }}>once only</span>
                          )}
                        </div>

                        {/* Download */}
                        <a
                          href={`/ticket/${ticket.qr_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75"
                          style={{ background: "#0a0a0a", color: "#fff" }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                          </svg>
                          Download ticket
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Transfer Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 relative"
            style={{ background: "#fff" }}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 transition-colors"
              style={{ color: "rgba(0,0,0,0.3)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(0,0,0,0.6)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(0,0,0,0.3)")
              }
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {success ? (
              /* Success state */
              <div className="text-center py-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(22,163,74,0.1)" }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#0a0a0a] mb-2">
                  Ticket transferred successfully!
                </h2>
                <p className="text-sm mb-6" style={{ color: "rgba(0,0,0,0.5)" }}>
                  The recipient will receive an email with their new QR code.
                </p>
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "#0a0a0a", color: "#fff" }}
                >
                  Close
                </button>
              </div>
            ) : (
              /* Transfer form */
              <>
                <h2 className="text-xl font-bold text-[#0a0a0a] mb-0.5">
                  Transfer ticket
                </h2>
                <p className="text-sm mb-5" style={{ color: "rgba(0,0,0,0.45)" }}>
                  {selectedTicket.events?.name ?? ""}
                </p>

                {/* Anti-fraud notice */}
                <div
                  className="rounded-xl p-3 mb-5 text-xs leading-relaxed"
                  style={{
                    background: "rgba(217,119,6,0.08)",
                    border: "1px solid rgba(217,119,6,0.18)",
                    color: "#92400e",
                  }}
                >
                  The current QR code will be permanently invalidated. A new QR code will be
                  sent to the recipient. Transfers cannot be reversed.
                </div>

                {/* Form fields */}
                <div className="flex flex-col gap-3 mb-4">
                  <div>
                    <label
                      className="block text-xs mb-1"
                      style={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      Recipient full name *
                    </label>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs mb-1"
                      style={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      Recipient email *
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs mb-1"
                      style={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      Confirm email *
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={recipientEmailConfirm}
                      onChange={(e) => setRecipientEmailConfirm(e.target.value)}
                      className={inputClass}
                      style={{
                        ...inputStyle,
                        ...(recipientEmailConfirm.length > 0 && !emailsMatch
                          ? { border: "1px solid rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.04)" }
                          : {}),
                      }}
                    />
                    {recipientEmailConfirm.length > 0 && !emailsMatch && (
                      <p className="text-xs mt-1" style={{ color: "#dc2626" }}>Emails don't match</p>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-xs mb-1"
                      style={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      Recipient phone *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={dialCode}
                        onChange={(e) => setDialCode(e.target.value)}
                        className="shrink-0 px-3 py-3 rounded-xl text-sm text-[#0a0a0a] focus:outline-none"
                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", colorScheme: "light" }}
                      >
                        <option value="+506">🇨🇷 +506</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+52">🇲🇽 +52</option>
                        <option value="+502">🇬🇹 +502</option>
                        <option value="+503">🇸🇻 +503</option>
                        <option value="+504">🇭🇳 +504</option>
                        <option value="+505">🇳🇮 +505</option>
                        <option value="+507">🇵🇦 +507</option>
                        <option value="+57">🇨🇴 +57</option>
                        <option value="+58">🇻🇪 +58</option>
                        <option value="+593">🇪🇨 +593</option>
                        <option value="+51">🇵🇪 +51</option>
                        <option value="+56">🇨🇱 +56</option>
                        <option value="+54">🇦🇷 +54</option>
                        <option value="+55">🇧🇷 +55</option>
                        <option value="+598">🇺🇾 +598</option>
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+39">🇮🇹 +39</option>
                      </select>
                      <input
                        type="tel"
                        placeholder="8888 8888"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-col gap-3 mt-4 mb-5">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={check1}
                      onChange={(e) => setCheck1(e.target.checked)}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-xs leading-relaxed" style={{ color: "rgba(0,0,0,0.55)" }}>
                      I understand the current QR code will be permanently invalidated
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={check2}
                      onChange={(e) => setCheck2(e.target.checked)}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-xs leading-relaxed" style={{ color: "rgba(0,0,0,0.55)" }}>
                      {recipientName.trim()
                        ? `I confirm I want to transfer this ticket to ${recipientName.trim()}`
                        : "I confirm I want to transfer this ticket"}
                    </span>
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <p
                    className="text-xs mb-4 px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(220,38,38,0.07)",
                      color: "#dc2626",
                      border: "1px solid rgba(220,38,38,0.15)",
                    }}
                  >
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  onClick={handleTransfer}
                  disabled={!canSubmit}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
                  style={{ background: "#0a0a0a", color: "#fff" }}
                >
                  {transferring ? "Transferring…" : "Transfer ticket"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
