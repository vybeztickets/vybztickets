"use client";

import { useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const params = use(searchParams);
  const redirectTo = params?.redirectTo ?? "/";
  const urlError = params?.error;

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const isOrganizerFlow = redirectTo.includes("/organizador");
  const [error, setError] = useState(urlError ?? "");
  const [success, setSuccess] = useState("");

  const supabase = createClient();
  const router = useRouter();

  async function handleGoogle() {
    setLoading(true);
    if (tab === "signup") {
      localStorage.setItem("vybz_pending_role", isOrganizerFlow ? "pending_activation" : "user");
    }
    const callbackRedirect = tab === "signup"
      ? `${window.location.origin}/auth/callback?redirectTo=/auth/choose-role&then=${encodeURIComponent(redirectTo)}`
      : `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackRedirect },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push(redirectTo);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) { setError(error.message); setLoading(false); return; }

      if (data.user) {
        const role = isOrganizerFlow ? "pending_activation" : "user";
        await fetch("/api/auth/set-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id, role }),
        });
      }

      setSuccess("Check your email to confirm your account.");
    }
    setLoading(false);
  }

  return (
    <div
      className="rounded-2xl p-8"
      style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
    >
      {/* Tabs */}
      <div
        className="flex mb-8 rounded-full p-1"
        style={{ background: "rgba(0,0,0,0.05)" }}
      >
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); setSuccess(""); }}
            className="flex-1 py-2 text-sm font-semibold rounded-full transition-all duration-200"
            style={
              tab === t
                ? { background: "#0a0a0a", color: "#fff" }
                : { color: "rgba(0,0,0,0.35)" }
            }
          >
            {t === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>


      {/* Google */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all mb-6"
        style={{
          background: "#fff",
          border: "1.5px solid rgba(0,0,0,0.1)",
          color: "rgba(0,0,0,0.7)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.07)" }} />
        <span className="text-[#0a0a0a]/25 text-xs">o</span>
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.07)" }} />
      </div>

      {/* Email form */}
      <form onSubmit={handleEmail} className="flex flex-col gap-3">
        {tab === "signup" && (
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none transition-colors"
            style={{ background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.1)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0a0a0a")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none transition-colors"
          style={{ background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.1)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#0a0a0a")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
        />
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl text-sm text-[#0a0a0a] placeholder-black/25 focus:outline-none transition-colors"
            style={{ background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.1)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0a0a0a")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
          />
          {tab === "login" && (
            <div className="text-right mt-1.5">
              <a
                href="/auth/reset-password"
                className="text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a] transition-colors"
              >
                Forgot your password?
              </a>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-xs px-1">{error}</p>}
        {success && <p className="text-emerald-600 text-xs px-1">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold mt-1 transition-colors disabled:opacity-40"
          style={{ background: "#0a0a0a", color: "#fff" }}
        >
          {loading ? "Loading…" : tab === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
