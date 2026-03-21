import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { LiveDemoSection } from "@/components/LiveDemoSection";
import { TrustSection } from "@/components/TrustSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <HowItWorksSection />
      <LiveDemoSection />
      <TrustSection />
      <Footer />
    </div>
  );
};

export default Index;