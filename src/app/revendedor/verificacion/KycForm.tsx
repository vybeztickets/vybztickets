"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3;

function FileUploadBox({
  label,
  hint,
  file,
  onFile,
  accept,
}: {
  label: string;
  hint: string;
  file: File | null;
  onFile: (f: File) => void;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-[#0a0a0a] text-xs font-semibold mb-1.5">{label}</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full rounded-xl p-4 text-center transition-all"
        style={{
          background: file ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.02)",
          border: file ? "1.5px solid #0a0a0a" : "1.5px dashed rgba(0,0,0,0.15)",
        }}
      >
        {file ? (
          <div className="flex items-center gap-2 justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span className="text-[#0a0a0a] text-xs font-medium truncate max-w-[200px]">{file.name}</span>
          </div>
        ) : (
          <div>
            <svg className="mx-auto mb-2 text-[#0a0a0a]/25" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-[#0a0a0a]/40 text-xs">{hint}</p>
          </div>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept ?? "image/*"}
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
      />
    </div>
  );
}

export default function KycForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — identity
  const [fullName, setFullName] = useState("");
  const [cedulaNumber, setCedulaNumber] = useState("");
  const [cedulaFront, setCedulaFront] = useState<File | null>(null);
  const [cedulaBack, setCedulaBack] = useState<File | null>(null);

  // Step 2 — selfie
  const [selfie, setSelfie] = useState<File | null>(null);

  // Step 3 — payment
  const [paymentMethod, setPaymentMethod] = useState<"sinpe_movil" | "bank_transfer">("sinpe_movil");
  const [sinpePhone, setSinpePhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankIban, setBankIban] = useState("");

  function validateCedula(v: string) {
    return /^\d{9}$/.test(v.replace(/-/g, ""));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const form = new FormData();
    form.append("full_name_on_id", fullName);
    form.append("cedula_number", cedulaNumber.replace(/-/g, ""));
    form.append("payment_method", paymentMethod);
    if (paymentMethod === "sinpe_movil") form.append("sinpe_phone", sinpePhone);
    else { form.append("bank_name", bankName); form.append("bank_account_iban", bankIban); }
    if (cedulaFront) form.append("cedula_front", cedulaFront);
    if (cedulaBack) form.append("cedula_back", cedulaBack);
    if (selfie) form.append("selfie", selfie);

    const res = await fetch("/api/revendedor/kyc", { method: "POST", body: form });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Error al enviar. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  const STEPS = ["Identidad", "Selfie", "Cobros"];

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const n = (i + 1) as Step;
          const done = step > n;
          const active = step === n;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: done || active ? "#0a0a0a" : "rgba(0,0,0,0.07)",
                  color: done || active ? "#fff" : "rgba(0,0,0,0.3)",
                }}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : n}
              </div>
              <span className={`text-xs font-medium ${active ? "text-[#0a0a0a]" : "text-[#0a0a0a]/30"}`}>{s}</span>
              {i < 2 && <div className="w-6 h-px" style={{ background: "rgba(0,0,0,0.1)" }} />}
            </div>
          );
        })}
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        {/* ── Step 1: Identity ── */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[#0a0a0a] font-semibold text-sm mb-4">Datos de identidad</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0a0a0a] mb-1.5">Nombre completo (como aparece en la cédula)</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej: Juan Carlos Rodríguez Pérez"
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 outline-none transition-colors"
                    style={{ background: "rgba(0,0,0,0.03)", border: "1.5px solid rgba(0,0,0,0.1)" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0a0a0a")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a0a0a] mb-1.5">Número de cédula (9 dígitos)</label>
                  <input
                    type="text"
                    value={cedulaNumber}
                    onChange={(e) => setCedulaNumber(e.target.value)}
                    placeholder="000000000"
                    maxLength={11}
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 outline-none transition-colors"
                    style={{ background: "rgba(0,0,0,0.03)", border: "1.5px solid rgba(0,0,0,0.1)" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0a0a0a")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FileUploadBox
                label="Cédula — Frente"
                hint="Foto clara del frente de tu cédula"
                file={cedulaFront}
                onFile={setCedulaFront}
              />
              <FileUploadBox
                label="Cédula — Reverso"
                hint="Foto clara del reverso de tu cédula"
                file={cedulaBack}
                onFile={setCedulaBack}
              />
            </div>

            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: "rgba(0,0,0,0.03)" }}
            >
              <svg className="shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <p className="text-[#0a0a0a]/40 text-[10px] leading-relaxed">
                Tus documentos se almacenan encriptados en un bucket privado. Solo el equipo de Vybz puede acceder a ellos para verificación. Nunca son compartidos con terceros.
              </p>
            </div>

            <button
              type="button"
              disabled={!fullName || !validateCedula(cedulaNumber) || !cedulaFront || !cedulaBack}
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#0a0a0a", color: "#fff" }}
            >
              Continuar
            </button>
          </div>
        )}

        {/* ── Step 2: Selfie ── */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-[#0a0a0a] font-semibold text-sm">Selfie con tu cédula</p>
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}
            >
              <p className="text-[#0a0a0a] text-xs font-semibold mb-2">Cómo hacerlo:</p>
              <ul className="space-y-1.5">
                {[
                  "Sostenés tu cédula junto a tu cara en la foto",
                  "Tu cara y los datos de la cédula deben verse claramente",
                  "Usá buena iluminación, sin filtros ni edición",
                  "La foto debe ser reciente (no vale una foto de hace años)",
                ].map((i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[#0a0a0a]/45 text-[10px]">
                    <span className="w-1 h-1 rounded-full bg-[#0a0a0a]/30 shrink-0 mt-1.5" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>

            <FileUploadBox
              label="Selfie sosteniendo tu cédula"
              hint="Seleccioná o tomá una foto"
              file={selfie}
              onFile={setSelfie}
              accept="image/*"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.6)" }}
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={!selfie}
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Payment method ── */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <p className="text-[#0a0a0a] font-semibold text-sm">¿Cómo querés recibir tus pagos?</p>

            <div className="flex gap-3">
              {(["sinpe_movil", "bank_transfer"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold transition-all text-left"
                  style={{
                    background: paymentMethod === m ? "#0a0a0a" : "rgba(0,0,0,0.04)",
                    color: paymentMethod === m ? "#fff" : "rgba(0,0,0,0.5)",
                    border: paymentMethod === m ? "1.5px solid #0a0a0a" : "1.5px solid rgba(0,0,0,0.08)",
                  }}
                >
                  {m === "sinpe_movil" ? "📱 SINPE Móvil" : "🏦 Transferencia bancaria"}
                </button>
              ))}
            </div>

            {paymentMethod === "sinpe_movil" ? (
              <div>
                <label className="block text-xs font-semibold text-[#0a0a0a] mb-1.5">
                  Número de SINPE Móvil
                </label>
                <p className="text-[#0a0a0a]/35 text-[10px] mb-2">
                  Debe estar registrado a tu nombre y cédula. Los pagos llegarán directamente a este número.
                </p>
                <input
                  type="tel"
                  value={sinpePhone}
                  onChange={(e) => setSinpePhone(e.target.value)}
                  placeholder="8888-8888"
                  className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 outline-none"
                  style={{ background: "rgba(0,0,0,0.03)", border: "1.5px solid rgba(0,0,0,0.1)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0a0a0a")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0a0a0a] mb-1.5">Banco</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] outline-none"
                    style={{ background: "rgba(0,0,0,0.03)", border: "1.5px solid rgba(0,0,0,0.1)" }}
                  >
                    <option value="">Seleccioná tu banco</option>
                    {["BAC Credomatic", "Banco Nacional", "BCR", "Banco Popular", "Scotiabank", "Davivienda", "Promerica", "Coopeservidores", "Mucap"].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a0a0a] mb-1.5">IBAN (CR + 20 dígitos)</label>
                  <input
                    type="text"
                    value={bankIban}
                    onChange={(e) => setBankIban(e.target.value)}
                    placeholder="CR21015201001026284066"
                    maxLength={22}
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 outline-none font-mono"
                    style={{ background: "rgba(0,0,0,0.03)", border: "1.5px solid rgba(0,0,0,0.1)" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0a0a0a")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.6)" }}
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={
                  loading ||
                  (paymentMethod === "sinpe_movil" ? sinpePhone.length < 8 : !bankName || bankIban.length < 22)
                }
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#0a0a0a", color: "#fff" }}
              >
                {loading ? "Enviando…" : "Enviar verificación"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
