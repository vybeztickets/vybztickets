import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import MeshBackground from "@/app/components/MeshBackground";

export const metadata = { title: "Privacy Policy — Vybz Tickets" };

const SECTIONS = [
  {
    title: "1. Data we collect",
    body: "When you register or make a purchase on Vybz Tickets we collect: full name, email address, phone number, payment details (processed by ONVO Pay, never stored on our servers), and platform usage data (events visited, tickets purchased).",
  },
  {
    title: "2. How we use your information",
    body: "We use your data to: process purchases and issue tickets, send you order confirmations and tickets by email, prevent fraud, improve the platform experience, and — with your consent — send you information about relevant events.",
  },
  {
    title: "3. Data sharing",
    body: "We do not sell your information to third parties. We only share data with: the event organizer (buyer name and email for attendee management), and service providers required to operate the platform (payment processor, email provider).",
  },
  {
    title: "4. Cookies",
    body: "We use essential cookies for platform functionality (user session, preferences). We do not use advertising tracking cookies. You can disable cookies in your browser, although some features may not work correctly.",
  },
  {
    title: "5. Your rights",
    body: "You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at hola@vybztickets.com. We respond within a maximum of 30 days.",
  },
  {
    title: "6. Security",
    body: "We apply industry-standard security measures: encrypted connections (HTTPS), restricted access to sensitive data, and periodic security reviews. However, no system is 100% invulnerable.",
  },
];

export default function PrivacidadPage() {
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
              Privacy Policy
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
              Privacy questions:{" "}
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
