"use client";

import { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";

const MARKERS = [
  { location: [38.95, -77.45] as [number, number], size: 0.06 },
  { location: [37.62, -122.38] as [number, number], size: 0.06 },
  { location: [49.01, 2.55] as [number, number], size: 0.06 },
  { location: [35.55, 139.78] as [number, number], size: 0.05 },
  { location: [-33.95, 151.18] as [number, number], size: 0.05 },
  { location: [-23.43, -46.47] as [number, number], size: 0.06 },
  { location: [1.36, 103.99] as [number, number], size: 0.05 },
  { location: [19.09, 72.87] as [number, number], size: 0.05 },
  { location: [9.9, -84.1] as [number, number], size: 0.08 },
  { location: [25.77, -80.19] as [number, number], size: 0.06 },
];

interface HeroGlobeProps {
  className?: string;
  speed?: number;
}

export function HeroGlobe({ className = "", speed = 0.003 }: HeroGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number } | null>(null);
  const phiOffset = useRef(0);
  const dragPhi = useRef(0);
  const isPaused = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPaused.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current) {
      phiOffset.current += dragPhi.current;
      dragPhi.current = 0;
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPaused.current = false;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (pointerInteracting.current) {
        dragPhi.current = (e.clientX - pointerInteracting.current.x) / 200;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    let raf: number;
    let phi = 1.4;

    function init() {
      if (!canvas || globe) return;
      const width = canvas.offsetWidth;
      if (width === 0) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.25,
        dark: 0,
        diffuse: 1.4,
        mapSamples: 20000,
        mapBrightness: 9,
        baseColor: [1, 1, 1],
        markerColor: [0.05, 0.05, 0.05],
        glowColor: [0.88, 0.88, 0.88],
        markers: MARKERS,
      });

      function animate() {
        if (!isPaused.current) phi += speed;
        globe!.update({
          phi: phi + phiOffset.current + dragPhi.current,
          theta: 0.25,
        });
        raf = requestAnimationFrame(animate);
      }
      animate();

      setTimeout(() => { if (canvas) canvas.style.opacity = "1"; });
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver(() => {
        if (canvas.offsetWidth > 0) { ro.disconnect(); init(); }
      });
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    return () => {
      cancelAnimationFrame(raf);
      globe?.destroy();
    };
  }, [speed]);

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.4s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
    </div>
  );
}
