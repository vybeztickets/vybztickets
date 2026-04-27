import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MarqueeStrip from "./components/MarqueeStrip";
import StatsSection from "./components/StatsSection";
import FeaturedEvents from "./components/FeaturedEvents";
import PlatformSection from "./components/PlatformSection";
import PricingSection from "./components/PricingSection";
import UpcomingEvents from "./components/UpcomingEvents";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div style={{ background: "#fff" }}>
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
