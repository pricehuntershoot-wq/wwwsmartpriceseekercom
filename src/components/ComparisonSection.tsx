import { Filter, SlidersHorizontal } from "lucide-react";
import { PriceComparisonCard } from "./PriceComparisonCard";
import { Button } from "./ui/button";

const mockProducts = [
  {
    name: "Apple iPhone 15 Pro Max 256GB Natural Titanium",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
    originalPrice: 1449.00,
    discountedPrice: 1189.00,
    shop: "Alza.cz",
    shopLogo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=40&h=40&fit=crop",
    discountType: "cart" as const,
    savings: 18,
  },
  {
    name: "Samsung Galaxy S24 Ultra 512GB Titanium Black",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
    originalPrice: 1399.00,
    discountedPrice: 1099.00,
    shop: "CZC.cz",
    shopLogo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=40&h=40&fit=crop",
    discountType: "returned" as const,
    savings: 21,
  },
  {
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
    originalPrice: 399.00,
    discountedPrice: 289.00,
    shop: "Datart.cz",
    shopLogo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40&h=40&fit=crop",
    discountType: "flash" as const,
    savings: 28,
  },
  {
    name: "Apple MacBook Air M3 15\" 256GB Midnight",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
    originalPrice: 1599.00,
    discountedPrice: 1349.00,
    shop: "Mall.cz",
    shopLogo: "https://images.unsplash.com/photo-1572021335469-31706a17ber8?w=40&h=40&fit=crop",
    discountType: "hidden" as const,
    savings: 16,
  },
  {
    name: "LG OLED65C3 65\" 4K Smart TV",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
    originalPrice: 1999.00,
    discountedPrice: 1549.00,
    shop: "Electroworld",
    shopLogo: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=40&h=40&fit=crop",
    discountType: "cart" as const,
    savings: 23,
  },
  {
    name: "Dyson V15 Detect Absolute Vacuum Cleaner",
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=400&fit=crop",
    originalPrice: 749.00,
    discountedPrice: 599.00,
    shop: "Okay.cz",
    shopLogo: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=40&h=40&fit=crop",
    discountType: "returned" as const,
    savings: 20,
  },
];

export const ComparisonSection = () => {
  return (
    <section id="compare" className="py-24">
      <div className="container">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="mb-2 text-3xl font-bold md:text-4xl">
              Latest <span className="text-gradient-accent">Hidden Deals</span>
            </h2>
            <p className="text-muted-foreground">
              Discounts discovered by our AI agents in the last 24 hours
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4" />
              Sort by Savings
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockProducts.map((product, index) => (
            <div
              key={product.name}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PriceComparisonCard product={product} />
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="hero" size="lg">
            View All Deals
          </Button>
        </div>
      </div>
    </section>
  );
};
