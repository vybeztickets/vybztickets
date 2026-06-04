"use client";

import { useState } from "react";

export default function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 p-3 rounded-xl mb-3"
        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <p className="text-[#0a0a0a]/40 text-xs flex-1 truncate">{url}</p>
        <button
          onClick={copy}
          className="shrink-0 text-[#0a0a0a]/30 hover:text-[#0a0a0a] transition-colors"
          title="Copy URL"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          )}
        </button>
      </div>
      <button
        onClick={copy}
        className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
        style={{ background: copied ? "rgba(16,185,129,0.15)" : "rgba(0,0,0,0.06)", color: copied ? "#10b981" : "rgba(0,0,0,0.5)", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(0,0,0,0.15)"}` }}
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
