"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";

type ScanResult = {
  status: "valid" | "already_used" | "invalid";
  message: string;
  ticket?: { buyerName: string | null; buyerEmail: string; ticketType: string };
};

type RecentScan = ScanResult & { time: string };

export default function ScannerApp({ eventId, eventName }: { eventId: string; eventName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const cooldownRef = useRef(false);
  const lastCodeRef = useRef("");

  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [showRecent, setShowRecent] = useState(false);

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
          if (data.status === "valid") setCount(c => c + 1);
          setRecentScans(prev => [
            { ...data, time: new Date().toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
            ...prev.slice(0, 19),
          ]);
          setTimeout(() => {
            setResult(null);
            lastCodeRef.current = "";
            cooldownRef.current = false;
          }, 2500);
        });
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [eventId]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setReady(true);
          rafRef.current = requestAnimationFrame(processFrame);
        }
      })
      .catch(() => setCameraError("No se pudo acceder a la cámara. Verificá que el navegador tenga permisos."));
    return () => {
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [processFrame]);

  // Result bg
  const resultBg =
    result?.status === "valid" ? "#10b981" :
    result?.status === "already_used" ? "#f59e0b" :
    "#ef4444";
  const resultIcon = result?.status === "valid" ? "✓" : result?.status === "already_used" ? "!" : "✕";

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#000", touchAction: "none" }}>
      {/* Camera */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Dark vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Top bar */}
      <div
        className="relative z-10 flex items-center justify-between px-5 pt-safe-top"
        style={{ paddingTop: "env(safe-area-inset-top, 16px)", paddingBottom: 12 }}
      >
        <div>
          <p className="text-white/40 text-[9px] uppercase tracking-widest">Escaneando en</p>
          <p className="text-white font-semibold text-sm leading-tight">{eventName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-xs font-semibold">{count} ingresados</span>
          </div>
          <button
            onClick={() => setShowRecent(v => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Viewfinder */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="relative" style={{ width: 240, height: 240 }}>
          {[
            "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-2xl",
            "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-2xl",
            "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl",
            "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl",
          ].map((cls, i) => (
            <div key={i} className={`absolute w-10 h-10 ${cls}`} style={{ borderColor: "rgba(255,255,255,0.85)" }} />
          ))}
          {ready && !result && (
            <div
              className="absolute left-3 right-3 h-0.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.7)",
                boxShadow: "0 0 8px rgba(255,255,255,0.5)",
                animation: "scan-line 2s ease-in-out infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* Bottom label */}
      {!result && !cameraError && (
        <div className="relative z-10 flex justify-center pb-10" style={{ paddingBottom: "env(safe-area-inset-bottom, 40px)" }}>
          <p className="text-white/40 text-sm">Apuntá la cámara al código QR</p>
        </div>
      )}

      {/* Camera error */}
      {cameraError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-8" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="text-center">
            <svg className="mx-auto mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <p className="text-white/70 text-sm leading-relaxed">{cameraError}</p>
          </div>
        </div>
      )}

      {/* Result fullscreen overlay */}
      {result && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5"
          style={{ background: resultBg }}
        >
          <span className="text-white font-bold" style={{ fontSize: 88, lineHeight: 1 }}>{resultIcon}</span>
          <p className="text-white font-bold text-2xl text-center px-8">{result.message}</p>
          {result.ticket && (
            <div className="text-center space-y-1">
              <p className="text-white/80 font-semibold text-lg">{result.ticket.ticketType}</p>
              {result.ticket.buyerName && <p className="text-white/60">{result.ticket.buyerName}</p>}
            </div>
          )}
        </div>
      )}

      {/* Recent scans drawer */}
      {showRecent && (
        <div
          className="absolute inset-0 z-40 flex flex-col"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
        >
          <div className="flex items-center justify-between px-5 pt-12 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 12px) + 12px)" }}>
            <p className="text-white font-semibold">Historial de escaneos</p>
            <button onClick={() => setShowRecent(false)} className="text-white/40 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-10">
            {recentScans.length === 0 ? (
              <p className="text-white/30 text-sm text-center mt-10">Sin escaneos aún</p>
            ) : (
              <div className="space-y-2">
                {recentScans.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{
                        background: s.status === "valid" ? "#10b981" : s.status === "already_used" ? "#f59e0b" : "#ef4444",
                      }}
                    >
                      {s.status === "valid" ? "✓" : "!"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{s.message}</p>
                      {s.ticket && (
                        <p className="text-white/35 text-xs truncate">
                          {s.ticket.ticketType}{s.ticket.buyerName ? ` · ${s.ticket.buyerName}` : ""}
                        </p>
                      )}
                    </div>
                    <p className="text-white/20 text-xs shrink-0">{s.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
