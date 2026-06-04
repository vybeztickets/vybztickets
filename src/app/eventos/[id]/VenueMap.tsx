"use client";

import Image from "next/image";
import { useState } from "react";

type Table = {
  id: string;
  name: string;
  price: number;
  total_available: number;
  sold_count: number;
  capacity: number | null;
  zone_color: string | null;
  map_position_x: number | null;
  map_position_y: number | null;
};

function formatPrice(n: number) { return "₡" + n.toLocaleString("en-US"); }

export default function VenueMap({ mapUrl, tables }: { mapUrl: string; tables: Table[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <Image src={mapUrl} alt="Venue map" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />

        {/* Table markers */}
        {tables.map((t) => {
          if (t.map_position_x == null || t.map_position_y == null) return null;
          const soldOut = t.total_available - t.sold_count <= 0;
          const isHovered = hoveredId === t.id;

          return (
            <div
              key={t.id}
              className="absolute"
              style={{ left: `${t.map_position_x}%`, top: `${t.map_position_y}%`, transform: "translate(-50%,-50%)" }}
            >
              <button
                onMouseEnter={() => setHoveredId(t.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all"
                style={{
                  background: soldOut ? "rgba(107,114,128,0.9)" : t.zone_color ?? "#7c3aed",
                  transform: isHovered ? "scale(1.3)" : "scale(1)",
                  boxShadow: isHovered ? `0 0 12px ${t.zone_color ?? "#7c3aed"}` : "none",
                  opacity: soldOut ? 0.6 : 1,
                }}
              >
                {t.name.charAt(0)}
              </button>

              {/* Tooltip */}
              {isHovered && (
                <div
                  className="absolute z-10 p-3 rounded-xl text-xs whitespace-nowrap"
                  style={{
                    bottom: "calc(100% + 8px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(10,10,10,0.95)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    minWidth: "140px",
                  }}
                >
                  <p className="text-white font-semibold mb-1">{t.name}</p>
                  {t.capacity && <p className="text-white/50">Hasta {t.capacity} personas</p>}
                  <p className="text-purple-400 font-bold mt-1">{formatPrice(t.price)}</p>
                  {soldOut ? (
                    <p className="text-red-400 mt-1">Agotada</p>
                  ) : (
                    <p className="text-green-400 mt-1">{t.total_available - t.sold_count} disponible{t.total_available - t.sold_count !== 1 ? "s" : ""}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 flex flex-wrap gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {tables.map((t) => (
          <div key={t.id} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.zone_color ?? "#7c3aed" }} />
            <span className="text-white/50">{t.name}</span>
            <span className="text-white/30">·</span>
            <span className="text-white/70">{formatPrice(t.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
