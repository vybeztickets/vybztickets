import Navbar from "./components/Navbar";
import AdBanner from "./components/AdBanner";
import Hero from "./components/Hero";
import UpcomingEvents from "./components/UpcomingEvents";
import FeaturedEvents from "./components/FeaturedEvents";
import ResaleSection from "./components/ResaleSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="pt-16">
        <AdBanner />
        <Hero />
        <UpcomingEvents />
        <FeaturedEvents />
        <ResaleSection />
        <Footer />
      </div>
    </>
  );
}
