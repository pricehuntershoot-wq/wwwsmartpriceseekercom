import { Filter, SlidersHorizontal } from "lucide-react";
import { PriceComparisonCard } from "./PriceComparisonCard";
import { Button } from "./ui/button";
import { useLanguage } from "@/hooks/useLanguage";

// Same products available from both Alza.cz and Datart.cz with different conditions
const mockProducts = [
  // iPhone from Alza - new
  {
    name: "Apple iPhone 15 Pro Max 256GB Natural Titanium",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
    originalPrice: 34990,
    discountedPrice: 34990,
    shop: "Alza.cz",
    shopLogo: "https://cdn.alza.cz/Foto/favicon/android-chrome-192x192.png",
    discountType: "new" as const,
    savings: 0,
  },
  // iPhone from Datart - returned
  {
    name: "Apple iPhone 15 Pro Max 256GB Natural Titanium",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
    originalPrice: 34990,
    discountedPrice: 29990,
    shop: "Datart.cz",
    shopLogo: "https://www.datart.cz/favicon.ico",
    discountType: "returned" as const,
    savings: 14,
  },
  // Samsung from Alza - open box
  {
    name: "Samsung Galaxy S24 Ultra 512GB Titanium Black",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
    originalPrice: 36990,
    discountedPrice: 31990,
    shop: "Alza.cz",
    shopLogo: "https://cdn.alza.cz/Foto/favicon/android-chrome-192x192.png",
    discountType: "openBox" as const,
    savings: 14,
  },
  // Samsung from Datart - cart discount
  {
    name: "Samsung Galaxy S24 Ultra 512GB Titanium Black",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
    originalPrice: 36990,
    discountedPrice: 32990,
    shop: "Datart.cz",
    shopLogo: "https://www.datart.cz/favicon.ico",
    discountType: "cart" as const,
    savings: 11,
  },
  // Sony headphones from Alza - refurbished
  {
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
    originalPrice: 9990,
    discountedPrice: 6990,
    shop: "Alza.cz",
    shopLogo: "https://cdn.alza.cz/Foto/favicon/android-chrome-192x192.png",
    discountType: "refurbished" as const,
    savings: 30,
  },
  // Sony headphones from Datart - used
  {
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
    originalPrice: 9990,
    discountedPrice: 5990,
    shop: "Datart.cz",
    shopLogo: "https://www.datart.cz/favicon.ico",
    discountType: "used" as const,
    savings: 40,
  },
];

export const ComparisonSection = () => {
  const { t } = useLanguage();

  return (
    <section id="compare" className="py-24">
      <div className="container">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="mb-2 text-3xl font-bold md:text-4xl">
              {t('latestDeals')} <span className="text-gradient-accent">{t('hiddenDeals')}</span>
            </h2>
            <p className="text-muted-foreground">
              {t('dealsSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              {t('filter')}
            </Button>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4" />
              {t('sortBySavings')}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockProducts.map((product, index) => (
            <div
              key={`${product.name}-${product.shop}-${product.discountType}`}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PriceComparisonCard product={product} />
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="hero" size="lg">
            {t('viewAllDeals')}
          </Button>
        </div>
      </div>
    </section>
  );
};
