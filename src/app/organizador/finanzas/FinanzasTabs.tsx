"use client";

import { useState } from "react";

function fmt(n: number) { return "₡" + n.toLocaleString("es-CR"); }
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });
}

type BankAccount = {
  id: string;
  account_holder: string;
  bank_name: string;
  account_type: string;
  account_number: string;
  currency: string;
  is_primary: boolean;
};

const CR_BANKS = [
  "Banco Nacional (BN)", "Banco de Costa Rica (BCR)", "BAC Credomatic",
  "Scotiabank", "Banco Popular", "Davivienda", "Banco Promerica",
  "Banco Lafise", "Coopeande", "Mucap", "Otro",
];

const ACCOUNT_TYPES = [
  { value: "sinpe", label: "SINPE Móvil" },
  { value: "iban", label: "Cuenta IBAN" },
  { value: "corriente", label: "Cuenta Corriente" },
  { value: "ahorros", label: "Cuenta de Ahorros" },
];

const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";
const inputStyle = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" };

export default function FinanzasTabs({
  available, totalRevenue, platformFee, transactions, initialAccounts,
}: {
  available: number;
  totalRevenue: number;
  platformFee: number;
  transactions: { date: string; amount: number }[];
  initialAccounts: BankAccount[];
}) {
  const [tab, setTab] = useState("balances");
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountError, setAccountError] = useState("");

  const [holder, setHolder] = useState("");
  const [bank, setBank] = useState(CR_BANKS[0]);
  const [accountType, setAccountType] = useState("sinpe");
  const [accountNumber, setAccountNumber] = useState("");
  const [currency, setCurrency] = useState("CRC");

  function resetForm() {
    setHolder(""); setBank(CR_BANKS[0]); setAccountType("sinpe");
    setAccountNumber(""); setCurrency("CRC"); setAccountError("");
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setAccountError("");
    const res = await fetch("/api/organizador/cuentas-bancarias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_holder: holder, bank_name: bank, account_type: accountType, account_number: accountNumber, currency }),
    });
    const data = await res.json();
    if (!res.ok) { setAccountError(data.error ?? "Error"); }
    else { setAccounts((a) => [...a, data as BankAccount]); setAdding(false); resetForm(); }
    setSaving(false);
  }

  async function handleSetPrimary(id: string) {
    await fetch("/api/organizador/cuentas-bancarias", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_primary: true }),
    });
    setAccounts((a) => a.map((acc) => ({ ...acc, is_primary: acc.id === id })));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/organizador/cuentas-bancarias?id=${id}`, { method: "DELETE" });
    setAccounts((a) => a.filter((acc) => acc.id !== id));
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        {[{ key: "balances", label: "Balances" }, { key: "transacciones", label: "Transacciones" }, { key: "cuentas", label: "Cuentas Bancarias" }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-3 text-sm font-medium transition-colors"
            style={tab === t.key ? { color: "#0a0a0a", borderBottom: "2px solid #0a0a0a" } : { color: "rgba(0,0,0,0.3)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BALANCES ── */}
      {tab === "balances" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 flex flex-col gap-4">
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 className="text-[#0a0a0a] font-semibold mb-1">Balances (CRC)</h3>
              </div>
              {[
                { label: "Disponible para retirar", value: available, color: "#10b981" },
                { label: "En camino a su banco", value: 0, color: "rgba(0,0,0,0.4)" },
                { label: "Disponible para pagar pronto", value: 0, color: "rgba(0,0,0,0.4)" },
                { label: "Total", value: available, bold: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center px-6 py-4"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <span className="text-[#0a0a0a]/50 text-sm">{row.label}</span>
                  <span className="text-sm" style={{ color: row.color ?? "#0a0a0a", fontWeight: row.bold ? 700 : 500 }}>
                    {fmt(row.value)}
                  </span>
                </div>
              ))}
            </div>

            {transactions.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <h3 className="text-[#0a0a0a] font-semibold">Completadas recientemente</h3>
                </div>
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.date} className="flex justify-between items-center px-6 py-3"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <span className="text-[#0a0a0a]/50 text-sm">Ventas del {fmtDate(tx.date)}</span>
                    <span className="text-[#0a0a0a] font-medium text-sm">{fmt(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-5" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
              <h4 className="text-[#0a0a0a] font-semibold mb-2 text-sm">Balance</h4>
              <p className="text-[#0a0a0a]/40 text-xs leading-relaxed">
                Resumen del balance de tu cuenta: fondos disponibles, en tránsito y próximos.
              </p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
              <h4 className="text-[#0a0a0a] font-semibold mb-2 text-sm">Próximos pagos</h4>
              <p className="text-[#0a0a0a]/40 text-xs">
                Los pagos se liquidan según el calendario de ONVO Pay (diario, semanal, quincenal o mensual).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSACCIONES ── */}
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
              <div key={tx.date} className="flex justify-between items-center px-6 py-4 hover:bg-black/[0.01] transition-colors"
                style={{ borderBottom: i < transactions.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                <div>
                  <p className="text-[#0a0a0a] text-sm font-medium">{fmtDate(tx.date)}</p>
                  <p className="text-[#0a0a0a]/30 text-xs">Ventas del día</p>
                </div>
                <span className="text-green-500 font-semibold">{fmt(tx.amount)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CUENTAS BANCARIAS ── */}
      {tab === "cuentas" && (
        <div className="max-w-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[#0a0a0a] font-semibold">Cuentas Bancarias</h3>
              <p className="text-[#0a0a0a]/30 text-xs mt-1">Cuenta de destino para recibir las liquidaciones de tus eventos.</p>
            </div>
            <button
              onClick={() => { setAdding((v) => !v); setAccountError(""); resetForm(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: adding ? "rgba(0,0,0,0.06)" : "#0a0a0a", color: adding ? "#0a0a0a" : "#fff" }}
            >
              {adding ? "Cancelar" : "+ Agregar"}
            </button>
          </div>

          {/* Lista de cuentas */}
          {accounts.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              {accounts.map((acc, i) => (
                <div key={acc.id} className="flex items-center gap-4 px-5 py-4"
                  style={{ borderBottom: i < accounts.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                  {/* Icono tipo cuenta */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(0,0,0,0.05)" }}>
                    {acc.account_type === "sinpe" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2">
                        <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[#0a0a0a] text-sm font-medium">{acc.account_holder}</p>
                      {acc.is_primary && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                          style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-[#0a0a0a]/40 text-xs">{acc.bank_name} · {ACCOUNT_TYPES.find(t => t.value === acc.account_type)?.label ?? acc.account_type}</p>
                    <p className="text-[#0a0a0a]/30 text-xs font-mono">{acc.account_number}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!acc.is_primary && (
                      <button onClick={() => handleSetPrimary(acc.id)}
                        className="text-xs text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors px-2 py-1 rounded-lg"
                        style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                        Usar
                      </button>
                    )}
                    <button onClick={() => handleDelete(acc.id)}
                      className="text-[#0a0a0a]/20 hover:text-red-400 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form agregar cuenta */}
          {adding && (
            <form onSubmit={handleAddAccount} className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.01)" }}>
              <p className="text-[#0a0a0a] font-semibold text-sm">Nueva cuenta</p>

              <div>
                <label className="block text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-2">Titular de la cuenta</label>
                <input type="text" required className={inputClass} style={inputStyle}
                  value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Nombre completo o empresa" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-2">Banco</label>
                  <select required className={inputClass} style={inputStyle}
                    value={bank} onChange={(e) => setBank(e.target.value)}>
                    {CR_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-2">Tipo</label>
                  <select required className={inputClass} style={inputStyle}
                    value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                    {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-2">
                  {accountType === "sinpe" ? "Número de teléfono" : accountType === "iban" ? "Número IBAN" : "Número de cuenta"}
                </label>
                <input type="text" required className={inputClass} style={inputStyle}
                  value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={accountType === "sinpe" ? "8888-8888" : accountType === "iban" ? "CR21 0152 0200 1026 2840 66" : "0000-0000-0"} />
              </div>

              <div>
                <label className="block text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-2">Moneda</label>
                <div className="flex gap-2">
                  {["CRC", "USD"].map((c) => (
                    <button key={c} type="button" onClick={() => setCurrency(c)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ background: currency === c ? "#0a0a0a" : "rgba(0,0,0,0.04)", color: currency === c ? "#fff" : "rgba(0,0,0,0.4)", border: "1px solid rgba(0,0,0,0.08)" }}>
                      {c === "CRC" ? "₡ Colones" : "$ Dólares"}
                    </button>
                  ))}
                </div>
              </div>

              {accountError && <p className="text-red-400 text-xs">{accountError}</p>}

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: "#0a0a0a", color: "#fff" }}>
                {saving ? "Guardando..." : "Agregar cuenta"}
              </button>
            </form>
          )}

          {accounts.length === 0 && !adding && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(0,0,0,0.02)", border: "1px dashed rgba(0,0,0,0.1)" }}>
              <p className="text-[#0a0a0a]/25 text-sm">No hay cuentas bancarias configuradas</p>
              <p className="text-[#0a0a0a]/15 text-xs mt-1">Agrega una cuenta para recibir las liquidaciones de tus eventos</p>
            </div>
          )}

          <div className="rounded-2xl p-4 flex gap-3" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-[#0a0a0a]/30 text-xs leading-relaxed">
              Las liquidaciones se procesan a través de ONVO Pay con un costo de $3 por depósito. Podés elegir frecuencia diaria, semanal, quincenal o mensual.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
