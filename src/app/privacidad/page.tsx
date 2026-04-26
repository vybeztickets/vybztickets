import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export const metadata = { title: "Política de privacidad — Vybz Tickets" };

const SECTIONS = [
  {
    title: "1. Datos que recopilamos",
    body: "Al registrarte o comprar en Vybz Tickets recopilamos: nombre completo, correo electrónico, número de teléfono, datos de pago (procesados por ONVO Pay, nunca almacenados en nuestros servidores), y datos de uso de la plataforma (eventos visitados, tickets comprados).",
  },
  {
    title: "2. Uso de la información",
    body: "Usamos tus datos para: procesar compras y emitir tickets, enviarte confirmaciones y tickets por correo, prevenir fraudes, mejorar la experiencia de uso y, con tu consentimiento, enviarte información sobre eventos relevantes.",
  },
  {
    title: "3. Compartir datos",
    body: "No vendemos tu información a terceros. Compartimos datos únicamente con: el organizador del evento (nombre, email del comprador para gestión de asistentes), y proveedores de servicios necesarios para operar la plataforma (procesador de pagos, proveedor de email).",
  },
  {
    title: "4. Cookies",
    body: "Usamos cookies esenciales para el funcionamiento de la plataforma (sesión de usuario, preferencias). No usamos cookies de rastreo publicitario. Podés desactivar cookies desde tu navegador, aunque algunas funciones podrían no funcionar correctamente.",
  },
  {
    title: "5. Tus derechos",
    body: "Tenés derecho a acceder, corregir o eliminar tus datos personales. Para ejercer estos derechos escribinos a hola@vybztickets.com. Respondemos en un plazo máximo de 30 días.",
  },
  {
    title: "6. Seguridad",
    body: "Aplicamos medidas de seguridad estándar de la industria: conexiones cifradas (HTTPS), acceso restringido a datos sensibles y revisiones periódicas de seguridad. Sin embargo, ningún sistema es 100% invulnerable.",
  },
];

export default function PrivacidadPage() {
  return (
    <div className="page-light min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-[#0a0a0a]/30 text-xs font-semibold tracking-[0.2em] uppercase mb-4">Legal</p>
            <h1
              className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-none tracking-wide mb-4"
              style={{ fontSize: "clamp(48px,7vw,80px)" }}
            >
              Política de privacidad
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
              Preguntas sobre privacidad:{" "}
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
