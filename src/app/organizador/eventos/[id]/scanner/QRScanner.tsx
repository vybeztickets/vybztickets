"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";

type ScanResult = {
  status: "valid" | "already_used" | "invalid";
  message: string;
  ticket?: { buyerName: string | null; buyerEmail: string; ticketType: string };
};

type ScanSession = {
  id: string;
  code: string;
  type: string;
  label: string | null;
  expires_at: string | null;
  is_active: boolean;
  last_active_at: string | null;
  created_at: string;
};

function formatCode(code: string) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

function connectionStatus(last_active_at: string | null): "connected" | "idle" | "offline" {
  if (!last_active_at) return "offline";
  const diff = Date.now() - new Date(last_active_at).getTime();
  if (diff < 90_000) return "connected";
  if (diff < 300_000) return "idle";
  return "offline";
}

const STATUS_COLORS = {
  connected: "#10b981",
  idle: "#f59e0b",
  offline: "rgba(0,0,0,0.2)",
};
const STATUS_LABELS = {
  connected: "Connected",
  idle: "Idle",
  offline: "Not connected",
};

// ── Camera scanner (organizer preview) ──────────────────────────────────────

function CameraScanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const cooldownRef = useRef(false);
  const lastCodeRef = useRef("");
  const streamRef = useRef<MediaStream | null>(null);

  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [active, setActive] = useState(true);
  const [recentScans, setRecentScans] = useState<Array<ScanResult & { time: string }>>([]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

    if (code && !cooldownRef.current && code.data !== lastCodeRef.current) {
      lastCodeRef.current = code.data;
      cooldownRef.current = true;
      fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: code.data, eventId }),
      })
        .then(r => r.json())
        .then((data: ScanResult) => {
          setResult(data);
          setRecentScans(prev => [
            { ...data, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) },
            ...prev.slice(0, 4),
          ]);
          setTimeout(() => {
            setResult(null);
            lastCodeRef.current = "";
            cooldownRef.current = false;
          }, 2800);
        });
    }
    rafRef.current = requestAnimationFrame(processFrame);
  }, [eventId]);

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
    setActive(false);
    setResult(null);
  }

  function startCamera() {
    setActive(true);
    setCameraError(null);
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
    })
      .then(s => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setScanning(true);
          rafRef.current = requestAnimationFrame(processFrame);
        }
      })
      .catch(() => setCameraError("Could not access the camera. Check your browser permissions."));
  }

  useEffect(() => {
    startCamera();
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processFrame]);

  const resultColors = {
    valid: { bg: "rgba(16,185,129,0.97)", icon: "✓" },
    already_used: { bg: "rgba(245,158,11,0.97)", icon: "!" },
    invalid: { bg: "rgba(239,68,68,0.97)", icon: "✕" },
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: "#000", aspectRatio: "4/3", opacity: active ? 1 : 0.4 }}
      >
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-48 h-48">
            {["top-0 left-0 border-t-2 border-l-2 rounded-tl-lg","top-0 right-0 border-t-2 border-r-2 rounded-tr-lg","bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg","bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg"].map((cls, i) => (
              <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: "rgba(255,255,255,0.7)" }} />
            ))}
            {scanning && !result && (
              <div className="absolute left-2 right-2 h-px" style={{ background: "rgba(255,255,255,0.6)", boxShadow: "0 0 6px rgba(255,255,255,0.4)", animation: "scan-line 2s ease-in-out infinite" }} />
            )}
          </div>
        </div>
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center" style={{ background: "rgba(0,0,0,0.8)" }}>
            <p className="text-white/60 text-sm">{cameraError}</p>
          </div>
        )}
        {result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: resultColors[result.status].bg }}>
            <span className="text-white font-bold" style={{ fontSize: 64, lineHeight: 1 }}>{resultColors[result.status].icon}</span>
            <p className="text-white font-bold text-xl text-center px-6">{result.message}</p>
            {result.ticket && (
              <div className="text-center">
                <p className="text-white/80 font-semibold">{result.ticket.ticketType}</p>
                {result.ticket.buyerName && <p className="text-white/60 text-sm">{result.ticket.buyerName}</p>}
              </div>
            )}
          </div>
        )}
        {scanning && !result && !cameraError && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white" style={{ background: "rgba(0,0,0,0.5)" }}>Scanning...</span>
          </div>
        )}
      </div>
      <button
        onClick={active ? stopCamera : startCamera}
        className="w-full py-3 rounded-2xl text-sm font-semibold transition-colors"
        style={active ? { background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" } : { background: "#0a0a0a", color: "#fff" }}
      >
        {active ? "⏹ Stop camera" : "▶ Start scanner"}
      </button>
      {recentScans.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-4 py-2.5" style={{ background: "#f7f7f7", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[#0a0a0a]/40 text-[9px] uppercase tracking-widest font-semibold">Recent scans</p>
          </div>
          {recentScans.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < recentScans.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: s.status === "valid" ? "#10b981" : s.status === "already_used" ? "#f59e0b" : "#ef4444" }}>
                  {s.status === "valid" ? "✓" : "!"}
                </span>
                <div>
                  <p className="text-[#0a0a0a] text-xs font-semibold">{s.message}</p>
                  {s.ticket && <p className="text-[#0a0a0a]/35 text-[10px]">{s.ticket.ticketType}</p>}
                </div>
              </div>
              <p className="text-[#0a0a0a]/25 text-[10px]">{s.time}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Scan code manager ────────────────────────────────────────────────────────

function ScanCodeManager({ eventId }: { eventId: string }) {
  const [codes, setCodes] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [ticker, setTicker] = useState(0);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  function fetchCodes() {
    fetch(`/api/organizador/scan-codes?event_id=${eventId}`)
      .then(r => r.json())
      .then(d => { setCodes(d.codes ?? []); setLoading(false); });
  }

  useEffect(() => { fetchCodes(); }, [eventId]);

  // Refresh statuses every 30s
  useEffect(() => {
    const id = setInterval(() => {
      setTicker(t => t + 1);
      fetchCodes();
    }, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function addScanner() {
    setCreating(true);
    const count = codes.filter(c => c.is_active).length + 1;
    const res = await fetch("/api/organizador/scan-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, label: `Scanner ${count}`, type: "scanner" }),
    });
    const data = await res.json();
    if (res.ok) setCodes(prev => [data.session, ...prev]);
    setCreating(false);
  }

  async function regenerate(id: string) {
    setRegenerating(id);
    const res = await fetch(`/api/organizador/scan-codes/${id}`, { method: "PATCH" });
    const data = await res.json();
    if (res.ok) setCodes(prev => prev.map(c => c.id === id ? data.session : c));
    setRegenerating(null);
  }

  async function revoke(id: string) {
    await fetch(`/api/organizador/scan-codes/${id}`, { method: "DELETE" });
    setCodes(prev => prev.filter(c => c.id !== id));
  }

  function copyUrl() {
    navigator.clipboard.writeText(`${origin}/scan`);
    setCopied("url");
    setTimeout(() => setCopied(null), 2000);
  }

  const activeCodes = codes.filter(c => c.is_active);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      {/* Header */}
      <div
        className="px-5 py-4 flex items-start justify-between gap-4"
        style={{ background: "#f7f7f7", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[#0a0a0a] font-semibold text-sm">Scanner access</p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-[#0a0a0a]/40 text-xs font-mono truncate">{origin}/scan</p>
            <button
              onClick={copyUrl}
              className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors"
              style={{
                background: copied === "url" ? "rgba(16,185,129,0.12)" : "rgba(0,0,0,0.06)",
                color: copied === "url" ? "#10b981" : "rgba(0,0,0,0.4)",
              }}
            >
              {copied === "url" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <button
          onClick={addScanner}
          disabled={creating}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-opacity"
          style={{ background: "#0a0a0a" }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/>
          </svg>
          {creating ? "Adding..." : "Add scanner"}
        </button>
      </div>

      {/* Code list */}
      <div className="p-4 space-y-3">
        {loading ? (
          <p className="text-[#0a0a0a]/30 text-sm text-center py-4">Loading...</p>
        ) : activeCodes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#0a0a0a]/25 text-sm">No scanners yet</p>
            <p className="text-[#0a0a0a]/20 text-xs mt-1">Click "Add scanner" to generate an access code</p>
          </div>
        ) : (
          activeCodes.map(c => {
            const status = connectionStatus(c.last_active_at);
            const isRegen = regenerating === c.id;
            return (
              <div
                key={c.id}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
              >
                {/* Status dot */}
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: STATUS_COLORS[status],
                    boxShadow: status === "connected" ? `0 0 6px ${STATUS_COLORS.connected}` : "none",
                  }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[#0a0a0a] text-sm font-semibold">
                      {c.label ?? "Scanner"}
                    </p>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.4)" }}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <p
                    className="font-[family-name:var(--font-bebas)] tracking-widest mt-0.5"
                    style={{ fontSize: 20, color: isRegen ? "rgba(0,0,0,0.2)" : "#0a0a0a", letterSpacing: "0.25em" }}
                  >
                    {formatCode(c.code)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => regenerate(c.id)}
                    disabled={isRegen}
                    title="Generate new code"
                    className="p-2 rounded-lg transition-colors disabled:opacity-30"
                    style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isRegen ? "animate-spin" : ""}>
                      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => revoke(c.id)}
                    title="Revoke access"
                    className="p-2 rounded-lg transition-colors"
                    style={{ background: "rgba(239,68,68,0.06)", color: "#ef4444" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      {activeCodes.length > 0 && (
        <div className="px-5 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <p className="text-[#0a0a0a]/25 text-[10px]">
            Green dot = scanner connected in the last 90 seconds. Refreshes every 30s.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────

export default function QRScanner({ eventId }: { eventId: string }) {
  return <ScanCodeManager eventId={eventId} />;
}
