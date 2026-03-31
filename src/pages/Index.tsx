import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { ShopLogosSection } from "@/components/ShopLogosSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { LiveDemoSection } from "@/components/LiveDemoSection";
import { TrustSection } from "@/components/TrustSection";
import { CtaSection } from "@/components/CtaSection";
import { PremiumUpsellBanner } from "@/components/PremiumUpsellBanner";
import { PremiumPlusUpsell } from "@/components/PremiumPlusUpsell";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ShopLogosSection />
      <HowItWorksSection />
      <PremiumUpsellBanner />
      <LiveDemoSection />
      <PremiumPlusUpsell variant="full" />
      <TrustSection />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;