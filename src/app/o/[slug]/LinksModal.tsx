"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type Link = { name: string; url: string };

function setPageBlur(on: boolean) {
  const el = document.getElementById("org-page-content");
  if (!el) return;
  el.style.transition = "filter 0.2s ease";
  el.style.filter = on ? "blur(8px)" : "";
}

export default function LinksModal({ links, organizerName }: { links: Link[]; organizerName: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setPageBlur(open); return () => setPageBlur(false); }, [open]);

  function closeModal() { setOpen(false); }

  if (!links || links.length === 0) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-6" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-[#0a0a0a] leading-none">
            {organizerName}
          </h2>
          <button
            onClick={closeModal}
            className="w-8 h-8 flex items-center justify-center rounded-full mt-1 shrink-0 transition-opacity hover:opacity-60"
            style={{ background: "rgba(0,0,0,0.07)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Links list */}
        <div className="px-7 py-6">
          <p className="text-[#0a0a0a]/30 text-[10px] font-bold uppercase tracking-wider mb-5">Links</p>
          <div className="flex flex-col gap-4">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group"
                style={{ userSelect: "text" }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-opacity group-hover:opacity-70"
                  style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#0a0a0a] font-semibold text-sm leading-tight group-hover:opacity-70 transition-opacity">{link.name}</p>
                  <p className="text-[#3b82f6] text-xs mt-0.5 truncate group-hover:underline">{link.url}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2" className="shrink-0">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:opacity-70"
        style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.08)" }}
        title="Ver links"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </button>
      {mounted && createPortal(open ? modal : null, document.body)}
    </>
  );
}
