"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

function setPageBlur(on: boolean) {
  const el = document.getElementById("org-page-content");
  if (!el) return;
  el.style.transition = "filter 0.2s ease";
  el.style.filter = on ? "blur(8px)" : "";
}

export default function FollowButton({
  slug,
  organizerId,
  initialFollowing,
  isLoggedIn,
}: {
  slug: string;
  organizerId: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setPageBlur(showNotify); return () => setPageBlur(false); }, [showNotify]);

  async function handleClick() {
    if (!isLoggedIn) {
      window.location.href = `/auth/login?redirectTo=/o/${slug}`;
      return;
    }
    if (!following) {
      setShowNotify(true);
      return;
    }
    await doFollow(true);
  }

  async function doFollow(notify: boolean) {
    setShowNotify(false);
    setLoading(true);
    const res = await fetch(`/api/o/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizerId, notify }),
    });
    if (res.ok) {
      const data = await res.json();
      setFollowing(data.following);
    }
    setLoading(false);
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
      onClick={(e) => { if (e.target === e.currentTarget) setShowNotify(false); }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-7 flex flex-col gap-5"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
      >
        <div>
          <p className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-[#0a0a0a] leading-none mb-2">
            Seguir este organizador
          </p>
          <p className="text-[#0a0a0a]/45 text-sm leading-relaxed">
            ¿Querés recibir un email cuando este organizador publique nuevos eventos?
          </p>
        </div>
        <button
          onClick={() => doFollow(true)}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background: "#0a0a0a", color: "#fff" }}
        >
          Seguir y recibir alertas
        </button>
        <button
          onClick={() => doFollow(false)}
          className="w-full py-2 text-xs text-[#0a0a0a]/35 hover:text-[#0a0a0a]/60 transition-colors"
        >
          Seguir sin notificaciones
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-40"
        style={
          following
            ? { background: "rgba(0,0,0,0.08)", color: "#0a0a0a", border: "1px solid rgba(0,0,0,0.12)" }
            : { background: "#0a0a0a", color: "#fff" }
        }
      >
        {loading ? "…" : following ? "Siguiendo" : "Seguir"}
      </button>
      {mounted && createPortal(showNotify ? modal : null, document.body)}
    </>
  );
}
