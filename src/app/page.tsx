import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MarqueeStrip from "./components/MarqueeStrip";
import FeaturedEvents from "./components/FeaturedEvents";
import PlatformSection from "./components/PlatformSection";
import UpcomingEvents from "./components/UpcomingEvents";
import ResaleSection from "./components/ResaleSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="page-light">
      <Navbar />
      <Hero />
      <MarqueeStrip />
      <FeaturedEvents />
      <PlatformSection />
      <UpcomingEvents />
      <ResaleSection />
      <Footer />
    </div>
  );
}
