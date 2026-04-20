"use client";

export default function ReportActions() {
  return (
    <div className="no-print" style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "flex-end" }}>
      <button
        onClick={() => window.print()}
        style={{ background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
      >
        Imprimir / Guardar PDF
      </button>
      <button
        onClick={() => window.close()}
        style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
      >
        Cerrar
      </button>
    </div>
  );
}
