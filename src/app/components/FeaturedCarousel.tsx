"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

type Slide = { eventId: string; eventName: string; bannerUrl: string };

export default function FeaturedCarousel({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const lockedRef = useRef(false);
  const currentRef = useRef(0);

  function goTo(next: number) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setVisible(false);
    setTimeout(() => {
      currentRef.current = next;
      setCurrent(next);
      setVisible(true);
      lockedRef.current = false;
    }, 340);
  }

  function next() { goTo((currentRef.current + 1) % slides.length); }
  function prev() { goTo((currentRef.current - 1 + slides.length) % slides.length); }

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      goTo((currentRef.current + 1) % slides.length);
    }, 4000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#000" }}>
      {/* Full-bleed blurred backdrop */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <Image
          src={slide.bannerUrl}
          alt=""
          fill
          className="object-cover"
          style={{ filter: "blur(32px) brightness(0.28)", transform: "scale(1.12)" }}
        />
      </div>

      <Link
        href={`/eventos/${slide.eventId}`}
        className="relative block w-full"
        style={{
          aspectRatio: "3072 / 1280",
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms ease-in-out",
        }}
      >
        <Image
          src={slide.bannerUrl}
          alt={slide.eventName}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </Link>

      {slides.length > 1 && (
        <>
          {/* Left arrow */}
          <button
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-90"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          {/* Right arrow */}
          <button
            onClick={next}
            aria-label="Siguiente"
            className="absolute right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-90"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? "22px" : "7px",
                  height: "7px",
                  background: i === current ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
