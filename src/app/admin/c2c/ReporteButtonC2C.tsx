"use client";
import { useState } from "react";

export default function ReporteButton() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [open, setOpen] = useState(false);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  function generate() {
    window.open(`/admin/reportes?year=${year}&month=${month}&mode=c2c`, "_blank");
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: "#0a0a0a", color: "#fff" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        Generate PDF Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setOpen(false)}>
          <div className="rounded-2xl p-6 w-72" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-[#0a0a0a] font-bold text-base mb-4">Generate Monthly Report</h3>

            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/35 block mb-1">Month</label>
                <select
                  value={month}
                  onChange={e => setMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-sm text-[#0a0a0a] focus:outline-none"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/35 block mb-1">Year</label>
                <select
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-sm text-[#0a0a0a] focus:outline-none"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.4)" }}>
                Cancel
              </button>
              <button onClick={generate} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#0a0a0a", color: "#fff" }}>
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
