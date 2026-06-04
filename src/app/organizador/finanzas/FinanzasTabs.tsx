"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/currency";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

type FeaturedItem = {
  total_cost: number;
  currency: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
};

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
  { value: "sinpe", label: "SINPE Mobile" },
  { value: "iban", label: "IBAN Account" },
  { value: "corriente", label: "Checking Account" },
  { value: "ahorros", label: "Savings Account" },
];

const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none";
const inputStyle = { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" };

export default function FinanzasTabs({
  available, totalRevenue, platformFee, transactions, initialAccounts,
  featuredCostsUSD, featuredItems, currency = "CRC", revenueByCurrency = {},
}: {
  available: number;
  totalRevenue: number;
  platformFee: number;
  transactions: { date: string; amount: number }[];
  initialAccounts: BankAccount[];
  featuredCostsUSD: number;
  featuredItems: FeaturedItem[];
  currency?: string;
  revenueByCurrency?: Record<string, number>;
}) {
  const fmt = (n: number) => formatPrice(n, currency);
  const otherCurrencies = Object.entries(revenueByCurrency).filter(([c]) => c !== currency);
  const [tab, setTab] = useState("balances");
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountError, setAccountError] = useState("");

  const [holder, setHolder] = useState("");
  const [bank, setBank] = useState(CR_BANKS[0]);
  const [accountType, setAccountType] = useState("sinpe");
  const [accountNumber, setAccountNumber] = useState("");
  const [newAccountCurrency, setNewAccountCurrency] = useState("CRC");

  function resetForm() {
    setHolder(""); setBank(CR_BANKS[0]); setAccountType("sinpe");
    setAccountNumber(""); setNewAccountCurrency("CRC"); setAccountError("");
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setAccountError("");
    const res = await fetch("/api/organizador/cuentas-bancarias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_holder: holder, bank_name: bank, account_type: accountType, account_number: accountNumber, currency: newAccountCurrency }),
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
        {[{ key: "balances", label: "Balances" }, { key: "transacciones", label: "Transactions" }, { key: "cuentas", label: "Bank Accounts" }].map((t) => (
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
                <h3 className="text-[#0a0a0a] font-semibold mb-1">Balances ({currency})</h3>
              </div>
              {[
                { label: "Gross revenue", value: totalRevenue, color: "rgba(0,0,0,0.7)" },
                { label: "Platform fee (15%)", value: -platformFee, color: "rgba(0,0,0,0.4)" },
                { label: "Available for withdrawal", value: available, color: "#10b981", bold: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center px-6 py-4"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <span className="text-[#0a0a0a]/50 text-sm">{row.label}</span>
                  <span className="text-sm" style={{ color: row.color ?? "#0a0a0a", fontWeight: row.bold ? 700 : 500 }}>
                    {row.value < 0 ? `−${fmt(Math.abs(row.value))}` : fmt(row.value)}
                  </span>
                </div>
              ))}
            </div>

            {otherCurrencies.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(59,111,212,0.2)" }}>
                <div className="px-6 py-3 flex items-center gap-2" style={{ background: "rgba(59,111,212,0.05)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b6fd4" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-xs font-semibold" style={{ color: "#3b6fd4" }}>Events in other currencies (not included above)</p>
                </div>
                {otherCurrencies.map(([cur, rev]) => (
                  <div key={cur} className="flex justify-between items-center px-6 py-3" style={{ borderTop: "1px solid rgba(59,111,212,0.08)" }}>
                    <span className="text-[#0a0a0a]/50 text-sm">Revenue in {cur}</span>
                    <span className="text-[#0a0a0a] font-semibold text-sm">{formatPrice(rev, cur)}</span>
                  </div>
                ))}
                <div className="px-6 py-3" style={{ borderTop: "1px solid rgba(59,111,212,0.08)", background: "rgba(59,111,212,0.03)" }}>
                  <p className="text-[10px] text-[#0a0a0a]/35">These amounts are settled in their original currency. Set your primary currency in Config → Profile.</p>
                </div>
              </div>
            )}

            {featuredCostsUSD > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.04)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <h3 className="text-[#0a0a0a] font-semibold text-sm">Featuring costs (USD)</h3>
                </div>
                {featuredItems.map((f, i) => (
                  <div key={i} className="flex justify-between items-center px-6 py-3.5"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <div>
                      <p className="text-[#0a0a0a]/60 text-sm">{fmtDate(f.start_date)} → {fmtDate(f.end_date)}</p>
                      <p className="text-[#0a0a0a]/30 text-xs">{f.days} days · ${f.total_cost.toFixed(2)} USD</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-md"
                      style={{ background: f.status === "active" ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.05)", color: f.status === "active" ? "#f59e0b" : "rgba(0,0,0,0.35)" }}>
                      {f.status === "active" ? "Active" : "Completed"}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center px-6 py-4" style={{ background: "rgba(0,0,0,0.02)" }}>
                  <span className="text-[#0a0a0a]/50 text-sm">Total to deduct from payout</span>
                  <span className="text-[#0a0a0a] font-bold text-sm">${featuredCostsUSD.toFixed(2)} USD</span>
                </div>
              </div>
            )}

            {transactions.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <h3 className="text-[#0a0a0a] font-semibold">Recently completed</h3>
                </div>
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.date} className="flex justify-between items-center px-6 py-3"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <span className="text-[#0a0a0a]/50 text-sm">Sales on {fmtDate(tx.date)}</span>
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
                Summary of your account balance: available, in-transit, and upcoming funds.
              </p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
              <h4 className="text-[#0a0a0a] font-semibold mb-2 text-sm">Upcoming payouts</h4>
              <p className="text-[#0a0a0a]/40 text-xs">
                Payouts are settled according to the ONVO Pay schedule (daily, weekly, biweekly, or monthly).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSACCIONES ── */}
      {tab === "transacciones" && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <h3 className="text-[#0a0a0a] font-semibold">All transactions</h3>
            <span className="text-[#0a0a0a]/30 text-xs">{transactions.length} days with sales</span>
          </div>
          {transactions.length === 0 ? (
            <div className="py-16 text-center text-[#0a0a0a]/20 text-sm">No transactions yet</div>
          ) : (
            transactions.map((tx, i) => (
              <div key={tx.date} className="flex justify-between items-center px-6 py-4 hover:bg-black/[0.01] transition-colors"
                style={{ borderBottom: i < transactions.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                <div>
                  <p className="text-[#0a0a0a] text-sm font-medium">{fmtDate(tx.date)}</p>
                  <p className="text-[#0a0a0a]/30 text-xs">Daily sales</p>
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
              <h3 className="text-[#0a0a0a] font-semibold">Bank Accounts</h3>
              <p className="text-[#0a0a0a]/30 text-xs mt-1">Destination account to receive your event payouts.</p>
            </div>
            <button
              onClick={() => { setAdding((v) => !v); setAccountError(""); resetForm(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: adding ? "rgba(0,0,0,0.06)" : "#0a0a0a", color: adding ? "#0a0a0a" : "#fff" }}
            >
              {adding ? "Cancel" : "+ Add"}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[#0a0a0a] text-sm font-medium">{acc.account_holder}</p>
                      {acc.is_primary && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                          style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                          Primary
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                        style={{ background: acc.currency === "USD" ? "rgba(59,111,212,0.1)" : "rgba(0,0,0,0.06)", color: acc.currency === "USD" ? "#3b6fd4" : "rgba(0,0,0,0.4)" }}>
                        {acc.currency === "USD" ? "$ USD" : "₡ CRC"}
                      </span>
                      {acc.currency !== currency && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                          style={{ background: "rgba(245,158,11,0.1)", color: "#b45309" }}>
                          ≠ primary currency
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
                        Use
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
              <p className="text-[#0a0a0a] font-semibold text-sm">New account</p>

              <div>
                <label className="block text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-2">Account holder</label>
                <input type="text" required className={inputClass} style={inputStyle}
                  value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Full name or company" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-2">Bank</label>
                  <select required className={inputClass} style={inputStyle}
                    value={bank} onChange={(e) => setBank(e.target.value)}>
                    {CR_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-2">Type</label>
                  <select required className={inputClass} style={inputStyle}
                    value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                    {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-2">
                  {accountType === "sinpe" ? "Phone number" : accountType === "iban" ? "IBAN number" : "Account number"}
                </label>
                <input type="text" required className={inputClass} style={inputStyle}
                  value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={accountType === "sinpe" ? "8888-8888" : accountType === "iban" ? "CR21 0152 0200 1026 2840 66" : "0000-0000-0"} />
              </div>

              <div>
                <label className="block text-[#0a0a0a]/40 text-xs uppercase tracking-wider mb-2">Currency</label>
                <div className="flex gap-2">
                  {["CRC", "USD"].map((c) => (
                    <button key={c} type="button" onClick={() => setNewAccountCurrency(c)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ background: newAccountCurrency === c ? "#0a0a0a" : "rgba(0,0,0,0.04)", color: newAccountCurrency === c ? "#fff" : "rgba(0,0,0,0.4)", border: "1px solid rgba(0,0,0,0.08)" }}>
                      {c === "CRC" ? "₡ Colones" : "$ Dollars"}
                    </button>
                  ))}
                </div>
              </div>

              {accountError && <p className="text-red-400 text-xs">{accountError}</p>}

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: "#0a0a0a", color: "#fff" }}>
                {saving ? "Saving..." : "Add account"}
              </button>
            </form>
          )}

          {accounts.length === 0 && !adding && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(0,0,0,0.02)", border: "1px dashed rgba(0,0,0,0.1)" }}>
              <p className="text-[#0a0a0a]/25 text-sm">No bank accounts configured</p>
              <p className="text-[#0a0a0a]/15 text-xs mt-1">Add an account to receive your event payouts</p>
            </div>
          )}

          <div className="rounded-2xl p-4 flex gap-3" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" className="shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
              <strong>Your bank account currency must match your event currency.</strong> If you sell in ₡ colones, you need a CRC account. If you sell in $ dollars, you need a USD account. You can have one account per currency. Payouts are processed through ONVO Pay ($3 per deposit).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
