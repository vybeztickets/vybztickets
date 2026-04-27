import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import TicketLookup from "./TicketLookup";
import MeshBackground from "@/app/components/MeshBackground";

export const metadata = {
  title: "Mis Tickets — Vybz Tickets",
};

export default function MisTicketsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ color: "#0a0a0a" }}>
      <MeshBackground />
      <Navbar />
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <TicketLookup />
        </div>
      </main>
      <Footer />
    </div>
  );
}
