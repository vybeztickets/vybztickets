"use client";

import { useState } from "react";

type Link = { name: string; url: string };

export default function LinksModal({ links, organizerName }: { links: Link[]; organizerName: string }) {
  const [open, setOpen] = useState(false);

  if (!links || links.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:opacity-70"
        style={{ background: "rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.1)" }}
        title="Ver links"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <h3 className="font-bold text-[#0a0a0a] text-lg">Links</h3>
              <button onClick={() => setOpen(false)} className="text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 flex flex-col gap-4">
              {links.map((link, i) => (
                <div key={i}>
                  <p className="text-[#0a0a0a] font-semibold text-sm mb-0.5">{link.name}</p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm hover:underline break-all"
                  >
                    {link.url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
