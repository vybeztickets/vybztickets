import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import MeshBackground from "@/app/components/MeshBackground";

export const metadata = { title: "Terms of Use — Vybz Tickets" };

const SECTIONS = [
  {
    title: "1. Use of the platform",
    body: "Vybz Tickets is a ticket sales and resale platform for events in Costa Rica and Latin America. By using our services you agree to these terms in full. Using the platform for illegal activities, fraud, or resale practices that harm buyers is strictly prohibited.",
  },
  {
    title: "2. Ticket purchases",
    body: "Purchases are processed through ONVO Pay. When you confirm a purchase, the payment is charged immediately. Tickets are valid only for the event, date, and time stated. Vybz Tickets is not responsible for events cancelled by the organizer; refund management in such cases is the organizer's responsibility.",
  },
  {
    title: "3. Platform fee",
    body: "Vybz Tickets charges a 15% fee on the ticket price, paid by the buyer at the time of purchase. This fee covers payment processing, digital ticket issuance, and customer support.",
  },
  {
    title: "4. Organizers",
    body: "Organizers who use the platform to sell tickets agree to the conditions of their contracted plan. Vybz Tickets reserves the right to suspend accounts that violate these terms or engage in fraudulent practices.",
  },
  {
    title: "5. Modifications",
    body: "Vybz Tickets may modify these terms at any time. Changes will be notified at least 7 days in advance. Continued use of the platform implies acceptance of the updated terms.",
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
              Terms of Use
            </h1>
            <p className="text-[#0a0a0a]/40 text-sm">Last updated: April 2025</p>
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
              Questions about these terms? Contact us at{" "}
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
