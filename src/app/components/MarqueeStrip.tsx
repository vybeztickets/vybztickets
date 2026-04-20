const ITEMS = [
  "Entradas Digitales",
  "Mesas VIP",
  "Reventa Segura",
  "Escrow Protegido",
  "Costa Rica",
  "Festivales",
  "Conciertos",
  "QR Instantáneo",
  "Pago Seguro",
  "Teatro & Arte",
];

export default function MarqueeStrip() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div
      className="w-full overflow-hidden py-4"
      style={{ background: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="marquee-left select-none">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-0 shrink-0">
            <span className="text-white/20 text-[11px] font-semibold tracking-[0.22em] uppercase whitespace-nowrap px-8">
              {item}
            </span>
            <span className="text-white/15 text-[8px]">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
