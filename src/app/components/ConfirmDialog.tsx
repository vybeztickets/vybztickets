"use client";

export default function ConfirmDialog({
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
      >
        <p className="text-[#0a0a0a] text-sm font-medium leading-relaxed mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
