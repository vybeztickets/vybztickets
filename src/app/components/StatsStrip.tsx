const MARQUEE_ITEMS = [
  "2,400+ EVENTOS",
  "50,000+ FANS",
  "340+ VENUES",
  "500+ ORGANIZADORES",
  "ESCROW PROTEGIDO",
  "COSTA RICA · PANAMÁ · COLOMBIA · MÉXICO",
  "TICKETS VERIFICADOS",
  "PAGO SEGURO",
];

export default function StatsStrip() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div
      className="overflow-hidden py-3.5"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.015)",
      }}
    >
      <div className="marquee-track">
        {items.map((item, i) => (
          <div key={i} className="flex items-center shrink-0">
            <span className="text-[10px] font-semibold tracking-[0.2em] text-white/20 whitespace-nowrap px-6">
              {item}
            </span>
            <span className="text-white/10 text-xs">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
