"use client";

import { useState } from "react";

function fmt(n: number) { return "₡" + n.toLocaleString("es-CR"); }
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });
}

export default function FinanzasTabs({
  available, totalRevenue, platformFee, transactions,
}: {
  available: number;
  totalRevenue: number;
  platformFee: number;
  transactions: { date: string; amount: number }[];
}) {
  const [tab, setTab] = useState("balances");

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        {[{ key: "balances", label: "Balances" }, { key: "transacciones", label: "Transacciones" }, { key: "cuentas", label: "Cuentas Bancarias" }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-3 text-sm font-medium transition-colors"
            style={tab === t.key ? { color: "#0a0a0a", borderBottom: "2px solid #0a0a0a" } : { color: "rgba(0,0,0,0.3)" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "balances" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 flex flex-col gap-4">
            {/* Balance summary */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 className="text-[#0a0a0a] font-semibold mb-1">Balances (CRC)</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "#0a0a0a" }}>Todos</span>
                </div>
              </div>
              {[
                { label: "Disponible para retirar", value: available, color: "#10b981" },
                { label: "En camino a su banco", value: 0, color: "rgba(0,0,0,0.4)" },
                { label: "Disponible para pagar pronto", value: 0, color: "rgba(0,0,0,0.4)" },
                { label: "Total", value: available, bold: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center px-6 py-4"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <span className="text-[#0a0a0a]/50 text-sm">{row.label}</span>
                  <span
                    className="text-sm"
                    style={{ color: row.color ?? "#fff", fontWeight: row.bold ? 700 : 500 }}
                  >
                    {fmt(row.value)}
                  </span>
                </div>
              ))}
            </div>

            {/* Completadas recientemente */}
            {transactions.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <h3 className="text-[#0a0a0a] font-semibold">Completadas recientemente</h3>
                </div>
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.date}
                    className="flex justify-between items-center px-6 py-3"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                  >
                    <span className="text-[#0a0a0a]/50 text-sm">Ventas del {fmtDate(tx.date)}</span>
                    <span className="text-[#0a0a0a] font-medium text-sm">{fmt(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <h4 className="text-[#0a0a0a] font-semibold mb-2 text-sm">Balance</h4>
              <p className="text-[#0a0a0a]/40 text-xs leading-relaxed">
                Aquí puedes ver un resumen completo del balance de tu cuenta, detallando los importes disponibles para retiro, los fondos que van a tu banco, y los que estarán próximamente.
              </p>
            </div>
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}
            >
              <h4 className="text-[#0a0a0a] font-semibold mb-2 text-sm">Comisión de plataforma</h4>
              <p className="text-[#0a0a0a]/40 text-xs leading-relaxed">
                Vybz cobra un 5% sobre el volumen total de ventas. Comisión acumulada: <strong className="text-[#0a0a0a]">{fmt(platformFee)}</strong>
              </p>
            </div>
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}
            >
              <h4 className="text-[#0a0a0a] font-semibold mb-2 text-sm">Próximos pagos</h4>
              <p className="text-[#0a0a0a]/40 text-xs">
                Este monto es estimado porque las transacciones aun se están acumulando.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "transacciones" && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <h3 className="text-[#0a0a0a] font-semibold">Todas las transacciones</h3>
            <span className="text-[#0a0a0a]/30 text-xs">{transactions.length} días con ventas</span>
          </div>
          {transactions.length === 0 ? (
            <div className="py-16 text-center text-[#0a0a0a]/20 text-sm">Sin transacciones aún</div>
          ) : (
            transactions.map((tx, i) => (
              <div
                key={tx.date}
                className="flex justify-between items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                style={{ borderBottom: i < transactions.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
              >
                <div>
                  <p className="text-[#0a0a0a] text-sm font-medium">{fmtDate(tx.date)}</p>
                  <p className="text-[#0a0a0a]/30 text-xs">Ventas del día</p>
                </div>
                <span className="text-green-400 font-semibold">{fmt(tx.amount)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "cuentas" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[#0a0a0a] font-semibold">Cuentas Bancarias</h3>
              <p className="text-[#0a0a0a]/30 text-xs mt-1">Establezca cuentas de destino para recibir liquidaciones de eventos.</p>
            </div>
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#0a0a0a] font-bold"
              style={{ background: "rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              +
            </button>
          </div>
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.07)", borderStyle: "dashed" }}
          >
            <p className="text-[#0a0a0a]/25 text-sm">No hay cuentas bancarias configuradas</p>
            <p className="text-[#0a0a0a]/15 text-xs mt-1">Agrega una cuenta para recibir tus pagos (próximamente con SINPE)</p>
          </div>
        </div>
      )}
    </div>
  );
}
