import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import MeshBackground from "@/app/components/MeshBackground";

export const metadata = { title: "Términos de uso — Vybz Tickets" };

const SECTIONS = [
  {
    title: "1. Uso de la plataforma",
    body: "Vybz Tickets es una plataforma de venta y reventa de entradas para eventos en Costa Rica y Latinoamérica. Al usar nuestros servicios aceptás estos términos en su totalidad. Está prohibido el uso de la plataforma para actividades ilegales, fraude o reventa en condiciones que perjudiquen a compradores.",
  },
  {
    title: "2. Compra de tickets",
    body: "Las compras son procesadas a través de ONVO Pay. Al confirmar una compra, el pago se debita de inmediato. Los tickets son válidos únicamente para el evento, fecha y hora indicados. Vybz Tickets no se responsabiliza por eventos cancelados por el organizador; la gestión de reembolsos en ese caso corresponde al organizador.",
  },
  {
    title: "3. Fee de plataforma",
    body: "Vybz Tickets cobra un fee del 15% sobre el precio del ticket, pagado por el comprador en el momento de la compra. Este fee cubre el procesamiento del pago, la emisión del ticket digital y el soporte al cliente.",
  },
  {
    title: "4. Organizadores",
    body: "Los organizadores que usen la plataforma para vender entradas aceptan las condiciones del plan contratado. Vybz Tickets se reserva el derecho de suspender cuentas que violen los términos o realicen prácticas fraudulentas.",
  },
  {
    title: "5. Modificaciones",
    body: "Vybz Tickets puede modificar estos términos en cualquier momento. Los cambios se notificarán con al menos 7 días de anticipación. El uso continuado de la plataforma implica aceptación de los nuevos términos.",
  },
];

export default function TerminosPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ color: "#0a0a0a" }}>
      <MeshBackground />
      <Navbar />
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-[#0a0a0a]/30 text-xs font-semibold tracking-[0.2em] uppercase mb-4">Legal</p>
            <h1
              className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide mb-4"
              style={{ fontSize: "clamp(48px,7vw,80px)" }}
            >
              Términos de uso
            </h1>
            <p className="text-[#0a0a0a]/40 text-sm">Última actualización: abril 2025</p>
          </div>

          <div className="space-y-10">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="text-[#0a0a0a] font-semibold text-base mb-3">{s.title}</h2>
                <p className="text-[#0a0a0a]/55 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-10" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[#0a0a0a]/30 text-xs">
              Preguntas sobre estos términos: contactanos en{" "}
              <a href="mailto:hola@vybztickets.com" className="text-[#0a0a0a]/60 hover:text-[#0a0a0a] transition-colors underline">
                hola@vybztickets.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
