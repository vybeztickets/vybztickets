"use client";

import { useEffect, useState } from "react";

const ADS = [
  "🔥 ULTRA MUSIC FESTIVAL CR — 15 DE MARZO · SAN JOSÉ · ENTRADAS DISPONIBLES",
  "⚡ PITBULL LIVE EN COSTA RICA — JULIO 2025 · ESTADIO NACIONAL · COMPRA YA",
  "🎵 FESTIVAL INTERNACIONAL DE JAZZ — AGOSTO · TEATRO NACIONAL · EARLY BIRD",
  "🎪 FESTIVAL DE VERANO GUANACASTE — MAYO · PLAYA FLAMINGO · ÚLTIMAS ENTRADAS",
];

export default function AdBanner() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ADS.length);
        setVisible(true);
      }, 350);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#111] border-b border-[#2a2a2a] h-9 flex items-center justify-center overflow-hidden">
      <span
        className="text-[10px] font-medium tracking-[0.18em] text-[#666] uppercase transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {ADS[index]}
      </span>
    </div>
  );
}
