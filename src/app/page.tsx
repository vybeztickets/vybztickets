import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MarqueeStrip from "./components/MarqueeStrip";
import StatsSection from "./components/StatsSection";
import FeaturedEvents from "./components/FeaturedEvents";
import PlatformSection from "./components/PlatformSection";
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
<UpcomingEvents />
      <Footer />
    </div>
  );
}
