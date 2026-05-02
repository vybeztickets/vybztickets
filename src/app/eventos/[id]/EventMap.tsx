"use client";

export default function EventMap({
  lat,
  lng,
  venue,
  city,
  country,
  mapsUrl,
}: {
  lat: number | null;
  lng: number | null;
  venue: string;
  city: string;
  country: string;
  mapsUrl: string;
}) {
  const embedQuery =
    lat && lng
      ? `${lat},${lng}`
      : encodeURIComponent(`${venue}, ${city}, ${country}`);

  const embedUrl = `https://maps.google.com/maps?q=${embedQuery}&z=15&output=embed`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden mt-4"
      style={{ border: "1px solid rgba(0,0,0,0.08)" }}
    >
      <div className="relative w-full" style={{ height: 200 }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="200"
          style={{
            border: 0,
            display: "block",
            filter: "grayscale(1) invert(0.92) brightness(0.85) contrast(1.1)",
            pointerEvents: "none",
          }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {/* Click overlay with label */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5"
          style={{ background: "rgba(10,10,10,0.82)", backdropFilter: "blur(6px)" }}
        >
          <div>
            <p className="text-white text-xs font-semibold">{venue}</p>
            <p className="text-white/40 text-[11px]">{city}, {country}</p>
          </div>
          <div className="flex items-center gap-1.5 text-white/50 text-[11px]">
            Open in Maps
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </div>
        </div>
      </div>
    </a>
  );
}
