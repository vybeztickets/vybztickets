"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AcceptForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [info, setInfo] = useState<{ email: string; role: string; organizerName: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ROLE_LABELS: Record<string, string> = {
    bar_manager: "Bar Manager",
    inventory_staff: "Inventory Staff",
    procurement: "Procurement",
  };

  useEffect(() => {
    if (!token) { setNotFound(true); return; }
    fetch(`/api/team/accept?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setNotFound(true); return; }
        setInfo({ email: d.member.email, role: d.member.role, organizerName: d.organizerName });
        setName(d.member.name ?? "");
      })
      .catch(() => setNotFound(true));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError(""); setLoading(true);
    const res = await fetch("/api/team/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
    localStorage.setItem("vybz_team_session", JSON.stringify({ token: data.token, member: data.member }));
    router.replace("/team/inventory");
  }

  if (notFound) {
    return (
      <div className="text-center">
        <h1 className="text-white font-semibold text-xl mb-2">Invitation not found</h1>
        <p style={{ color: "#888" }}>This link may have expired or already been used.</p>
      </div>
    );
  }

  if (!info) {
    return <p style={{ color: "#888" }}>Loading invitation…</p>;
  }

  return (
    <div className="w-full max-w-sm">
      <p className="font-[family-name:var(--font-bebas)] text-white tracking-widest text-2xl mb-1">VYBZ</p>
      <h1 className="text-white font-semibold text-2xl mb-1">Accept invitation</h1>
      <p className="mb-1" style={{ color: "#888" }}>
        <span className="text-white font-medium">{info.organizerName}</span> invited you as{" "}
        <span className="text-white font-medium">{ROLE_LABELS[info.role] ?? info.role}</span>
      </p>
      <p className="text-sm mb-8" style={{ color: "#666" }}>{info.email}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>Your name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full name"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>Create password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            required
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
        {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full text-sm font-semibold mt-1 transition-opacity disabled:opacity-40"
          style={{ background: "#fff", color: "#0a0a0a" }}
        >
          {loading ? "Activating…" : "Activate account"}
        </button>
      </form>
    </div>
  );
}

export default function TeamAcceptPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0a" }}>
      <Suspense fallback={<p style={{ color: "#888" }}>Loading…</p>}>
        <AcceptForm />
      </Suspense>
    </div>
  );
}
