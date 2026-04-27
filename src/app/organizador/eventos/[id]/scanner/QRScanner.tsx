"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";

type ScanResult = {
  status: "valid" | "already_used" | "invalid";
  message: string;
  ticket?: { buyerName: string | null; buyerEmail: string; ticketType: string };
};

type StaffRow = { id: string; email: string; created_at: string };

function CameraScanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const cooldownRef = useRef(false);
  const lastCodeRef = useRef("");

  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
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
          setRecentScans(prev => [{ ...data, time: new Date().toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" }) }, ...prev.slice(0, 4)]);
          setTimeout(() => {
            setResult(null);
            lastCodeRef.current = "";
            cooldownRef.current = false;
          }, 2800);
        });
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [eventId]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
    })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setScanning(true);
          rafRef.current = requestAnimationFrame(processFrame);
        }
      })
      .catch(() => setCameraError("No se pudo acceder a la cámara. Verificá los permisos del navegador."));

    return () => {
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [processFrame]);

  const resultColors = {
    valid: { bg: "rgba(16,185,129,0.97)", icon: "✓" },
    already_used: { bg: "rgba(245,158,11,0.97)", icon: "!" },
    invalid: { bg: "rgba(239,68,68,0.97)", icon: "✕" },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Camera viewport */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: "#000", aspectRatio: "4/3" }}
      >
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {/* Corner brackets */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-48 h-48">
            {[
              "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
              "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
              "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
              "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
            ].map((cls, i) => (
              <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: "rgba(255,255,255,0.7)" }} />
            ))}
            {/* Animated scan line */}
            {scanning && !result && (
              <div
                className="absolute left-2 right-2 h-px"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  boxShadow: "0 0 6px rgba(255,255,255,0.4)",
                  animation: "scan-line 2s ease-in-out infinite",
                }}
              />
            )}
          </div>
        </div>

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center" style={{ background: "rgba(0,0,0,0.8)" }}>
            <div>
              <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <p className="text-white/60 text-sm">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Result overlay */}
        {result && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: resultColors[result.status].bg }}
          >
            <span className="text-white font-bold" style={{ fontSize: 64, lineHeight: 1 }}>
              {resultColors[result.status].icon}
            </span>
            <p className="text-white font-bold text-xl text-center px-6">{result.message}</p>
            {result.ticket && (
              <div className="text-center">
                <p className="text-white/80 font-semibold">{result.ticket.ticketType}</p>
                {result.ticket.buyerName && <p className="text-white/60 text-sm">{result.ticket.buyerName}</p>}
              </div>
            )}
          </div>
        )}

        {/* Scanning indicator */}
        {scanning && !result && !cameraError && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <span
              className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              Escaneando...
            </span>
          </div>
        )}
      </div>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-4 py-2.5" style={{ background: "#f7f7f7", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[#0a0a0a]/40 text-[9px] uppercase tracking-widest font-semibold">Últimos escaneos</p>
          </div>
          {recentScans.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: i < recentScans.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{
                    background: s.status === "valid" ? "#10b981" : s.status === "already_used" ? "#f59e0b" : "#ef4444",
                  }}
                >
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

function StaffManager({ eventId }: { eventId: string }) {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingStaff, setFetchingStaff] = useState(true);

  useEffect(() => {
    fetch(`/api/organizador/scanner-access?event_id=${eventId}`)
      .then(r => r.json())
      .then(d => { setStaff(d.staff ?? []); setFetchingStaff(false); });
  }, [eventId]);

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/organizador/scanner-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, email }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); } else { setStaff(prev => [data.staff, ...prev]); setEmail(""); }
    setLoading(false);
  }

  async function removeStaff(id: string) {
    await fetch(`/api/organizador/scanner-access/${id}`, { method: "DELETE" });
    setStaff(prev => prev.filter(s => s.id !== id));
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="px-5 py-4" style={{ background: "#f7f7f7", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-[#0a0a0a] font-semibold text-sm">Staff de escaneo</p>
        <p className="text-[#0a0a0a]/40 text-xs mt-0.5">
          Estas personas podrán escanear entradas desde{" "}
          <span className="font-mono" style={{ color: "rgba(0,0,0,0.5)" }}>
            {typeof window !== "undefined" ? window.location.origin : ""}/escanear/{eventId}
          </span>
        </p>
      </div>

      <div className="p-5">
        <form onSubmit={addStaff} className="flex gap-2 mb-5">
          <input
            type="email"
            placeholder="email@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "#0a0a0a" }}
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: "#0a0a0a" }}
          >
            {loading ? "..." : "Agregar"}
          </button>
        </form>

        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

        {fetchingStaff ? (
          <p className="text-[#0a0a0a]/30 text-sm">Cargando...</p>
        ) : staff.length === 0 ? (
          <p className="text-[#0a0a0a]/30 text-sm">Sin staff asignado aún.</p>
        ) : (
          <div className="space-y-2">
            {staff.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(0,0,0,0.07)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <p className="text-[#0a0a0a] text-sm font-medium">{s.email}</p>
                </div>
                <button
                  onClick={() => removeStaff(s.id)}
                  className="text-[#0a0a0a]/25 hover:text-red-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QRScanner({ eventId }: { eventId: string }) {
  return (
    <div className="space-y-8">
      <CameraScanner eventId={eventId} />
      <StaffManager eventId={eventId} />
    </div>
  );
}
