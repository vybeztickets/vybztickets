import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MarqueeStrip from "./components/MarqueeStrip";
import StatsSection from "./components/StatsSection";
import FeaturedEvents from "./components/FeaturedEvents";
import PlatformSection from "./components/PlatformSection";
import PricingSection from "./components/PricingSection";
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
      <StatsSection />
      <FeaturedEvents />
      <PlatformSection />
      <PricingSection />
      <UpcomingEvents />
      <Footer />
    </div>
  );
}
