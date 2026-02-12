import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DiscountAnalyzer } from "@/components/DiscountAnalyzer";

const Analyzer = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-24 pb-20">
        <DiscountAnalyzer />
      </main>
      <Footer />
    </div>
  );
};

export default Analyzer;
