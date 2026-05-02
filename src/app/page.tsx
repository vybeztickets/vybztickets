import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MarqueeStrip from "./components/MarqueeStrip";
import ScrollShowcase from "./components/ScrollShowcase";
import PlatformSection from "./components/PlatformSection";
import UpcomingEvents from "./components/UpcomingEvents";
import Footer from "./components/Footer";
import MeshBackground from "./components/MeshBackground";

export default function Home() {
  return (
    <div style={{ color: "#0a0a0a" }}>
      <MeshBackground />
      <Navbar />
      <Hero />
      <MarqueeStrip />
      <ScrollShowcase />
      <PlatformSection />
      <UpcomingEvents />
      <Footer />
    </div>
  );
}
