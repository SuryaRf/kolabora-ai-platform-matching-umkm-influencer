import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SharedFeatures from "@/components/SharedFeatures";
import UMKMSection from "@/components/UMKMSection";
import InfluencerSection from "@/components/InfluencerSection";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <SharedFeatures />
        <UMKMSection />
        <InfluencerSection />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
