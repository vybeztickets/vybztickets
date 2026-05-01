"use client";

import { useState } from "react";

export default function FollowButton({
  slug,
  initialFollowing,
  isLoggedIn,
}: {
  slug: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [showNotify, setShowNotify] = useState(false);

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
    const res = await fetch(`/api/o/${slug}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notify }),
    });
    if (res.ok) {
      const data = await res.json();
      setFollowing(data.following);
    }
    setLoading(false);
  }

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

      {showNotify && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <div>
              <p className="font-semibold text-[#0a0a0a] text-base">Recibir alertas de nuevos eventos</p>
              <p className="text-[#0a0a0a]/45 text-sm mt-1 leading-relaxed">
                Te enviaremos un email cuando este organizador publique nuevos eventos.
              </p>
            </div>
            <button
              onClick={() => doFollow(true)}
              className="w-full py-3 rounded-xl text-sm font-semibold"
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
      )}
    </>
  );
}
