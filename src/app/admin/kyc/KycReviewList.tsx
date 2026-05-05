"use client";

import { useState } from "react";
import Image from "next/image";

type KycRecord = {
  id: string;
  status: string;
  full_name_on_id: string;
  cedula_number: string;
  payment_method: string | null;
  sinpe_phone: string | null;
  bank_name: string | null;
  bank_account_iban: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  user_id: string;
  cedula_front_signed: string | null;
  cedula_back_signed: string | null;
  selfie_signed: string | null;
};

function DocImage({ url, label }: { url: string | null; label: string }) {
  const [open, setOpen] = useState(false);
  if (!url) return (
    <div className="rounded-xl flex items-center justify-center h-32 text-xs text-[#0a0a0a]/25"
      style={{ background: "rgba(0,0,0,0.04)", border: "1px dashed rgba(0,0,0,0.1)" }}>
      No image
    </div>
  );
  return (
    <>
      <div>
        <p className="text-[10px] font-semibold text-[#0a0a0a]/40 uppercase tracking-wider mb-1.5">{label}</p>
        <button onClick={() => setOpen(true)} className="w-full rounded-xl overflow-hidden relative h-32 block">
          <Image src={url} alt={label} fill className="object-cover hover:scale-105 transition-transform" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setOpen(false)}>
          <div className="relative max-w-2xl max-h-[90vh] w-full mx-4">
            <img src={url} alt={label} className="w-full h-auto rounded-2xl" />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-lg"
            >×</button>
          </div>
        </div>
      )}
    </>
  );
}

function RecordCard({ record, reviewerId, onDone }: { record: KycRecord; reviewerId: string; onDone: (id: string) => void }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function handleApprove() {
    setLoading("approve");
    await fetch("/api/admin/kyc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: record.id, status: "approved", reviewed_by: reviewerId }),
    });
    setLoading(null);
    onDone(record.id);
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return;
    setLoading("reject");
    await fetch("/api/admin/kyc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: record.id, status: "rejected", rejection_reason: rejectionReason, reviewed_by: reviewerId }),
    });
    setLoading(null);
    onDone(record.id);
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div>
          <p className="text-[#0a0a0a] font-semibold text-sm">{record.full_name_on_id}</p>
          <p className="text-[#0a0a0a]/35 text-xs mt-0.5">
            ID: {record.cedula_number} · Submitted: {new Date(record.submitted_at).toLocaleDateString("en-US")}
          </p>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
          style={{
            background: record.status === "pending" ? "rgba(0,0,0,0.06)" : "rgba(200,0,0,0.08)",
            color: record.status === "pending" ? "rgba(0,0,0,0.5)" : "#991b1b",
          }}
        >
          {record.status === "pending" ? "Pending" : "Rejected"}
        </span>
      </div>

      {/* Documents */}
      <div className="px-6 py-5 grid grid-cols-3 gap-4">
        <DocImage url={record.cedula_front_signed} label="ID Front" />
        <DocImage url={record.cedula_back_signed} label="ID Back" />
        <DocImage url={record.selfie_signed} label="Selfie with ID" />
      </div>

      {/* Payment info */}
      <div className="px-6 pb-4">
        <div className="rounded-xl p-3 flex gap-6" style={{ background: "rgba(0,0,0,0.03)" }}>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#0a0a0a]/30 mb-0.5">Payment method</p>
            <p className="text-[#0a0a0a] text-xs font-semibold">
              {record.payment_method === "sinpe_movil" ? "SINPE Mobile" : "Bank Transfer"}
            </p>
          </div>
          {record.sinpe_phone && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#0a0a0a]/30 mb-0.5">SINPE Phone</p>
              <p className="text-[#0a0a0a] text-xs font-semibold">{record.sinpe_phone}</p>
            </div>
          )}
          {record.bank_name && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#0a0a0a]/30 mb-0.5">Banco / IBAN</p>
              <p className="text-[#0a0a0a] text-xs font-semibold">{record.bank_name}</p>
              <p className="text-[#0a0a0a]/40 text-[10px] font-mono">{record.bank_account_iban}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-5 flex flex-col gap-3">
        {!showReject ? (
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={!!loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
              style={{ background: "#166534", color: "#fff" }}
            >
              {loading === "approve" ? "Approving…" : "✓ Approve"}
            </button>
            <button
              onClick={() => setShowReject(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "rgba(200,0,0,0.08)", color: "#991b1b" }}
            >
              ✕ Reject
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Rejection reason (will be sent to the user)..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-sm text-[#0a0a0a] outline-none resize-none"
              style={{ background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.1)" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowReject(false)}
                className="flex-1 py-2 rounded-xl text-xs font-medium"
                style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || !!loading}
                className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                style={{ background: "#991b1b", color: "#fff" }}
              >
                {loading === "reject" ? "Rejecting…" : "Confirm rejection"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KycReviewList({ records, reviewerId }: { records: KycRecord[]; reviewerId: string }) {
  const [list, setList] = useState(records);
  const remove = (id: string) => setList((prev) => prev.filter((r) => r.id !== id));

  if (list.length === 0) {
    return (
      <div className="rounded-2xl p-16 text-center" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-[#0a0a0a]/30 text-sm">Todas las verificaciones fueron revisadas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {list.map((r) => (
        <RecordCard key={r.id} record={r} reviewerId={reviewerId} onDone={remove} />
      ))}
    </div>
  );
}
