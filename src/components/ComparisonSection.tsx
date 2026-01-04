import { useState } from "react";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { PriceComparisonCard } from "./PriceComparisonCard";
import { Button } from "./ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type DiscountType = "cart" | "returned" | "used" | "new" | "openBox" | "refurbished";

// Same products available from both Alza.cz and Datart.cz with different conditions
const mockProducts = [
  {
    name: "Apple iPhone 15 Pro Max 256GB Natural Titanium",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
    originalPrice: 34990,
    discountedPrice: 34990,
    shop: "Alza.cz",
    shopLogo: "https://cdn.alza.cz/Foto/favicon/android-chrome-192x192.png",
    discountType: "new" as DiscountType,
    savings: 0,
  },
  {
    name: "Apple iPhone 15 Pro Max 256GB Natural Titanium",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
    originalPrice: 34990,
    discountedPrice: 29990,
    shop: "Datart.cz",
    shopLogo: "https://www.datart.cz/favicon.ico",
    discountType: "returned" as DiscountType,
    savings: 14,
  },
  {
    name: "Samsung Galaxy S24 Ultra 512GB Titanium Black",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
    originalPrice: 36990,
    discountedPrice: 31990,
    shop: "Alza.cz",
    shopLogo: "https://cdn.alza.cz/Foto/favicon/android-chrome-192x192.png",
    discountType: "openBox" as DiscountType,
    savings: 14,
  },
  {
    name: "Samsung Galaxy S24 Ultra 512GB Titanium Black",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
    originalPrice: 36990,
    discountedPrice: 32990,
    shop: "Datart.cz",
    shopLogo: "https://www.datart.cz/favicon.ico",
    discountType: "cart" as DiscountType,
    savings: 11,
  },
  {
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
    originalPrice: 9990,
    discountedPrice: 6990,
    shop: "Alza.cz",
    shopLogo: "https://cdn.alza.cz/Foto/favicon/android-chrome-192x192.png",
    discountType: "refurbished" as DiscountType,
    savings: 30,
  },
  {
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
    originalPrice: 9990,
    discountedPrice: 5990,
    shop: "Datart.cz",
    shopLogo: "https://www.datart.cz/favicon.ico",
    discountType: "used" as DiscountType,
    savings: 40,
  },
];

const conditionOptions: { value: DiscountType | "all"; labelKey: "allConditions" | "newItem" | "returnedItem" | "usedItem" | "openBox" | "refurbished" | "cartDiscount" }[] = [
  { value: "all", labelKey: "allConditions" },
  { value: "new", labelKey: "newItem" },
  { value: "returned", labelKey: "returnedItem" },
  { value: "used", labelKey: "usedItem" },
  { value: "openBox", labelKey: "openBox" },
  { value: "refurbished", labelKey: "refurbished" },
  { value: "cart", labelKey: "cartDiscount" },
];

export const ComparisonSection = () => {
  const { t } = useLanguage();
  const [selectedCondition, setSelectedCondition] = useState<DiscountType | "all">("all");
  const [sortBySavings, setSortBySavings] = useState<"desc" | "asc" | null>(null);

  const filteredProducts = selectedCondition === "all"
    ? mockProducts
    : mockProducts.filter((product) => product.discountType === selectedCondition);

  const sortedProducts = sortBySavings
    ? [...filteredProducts].sort((a, b) => 
        sortBySavings === "desc" ? b.savings - a.savings : a.savings - b.savings
      )
    : filteredProducts;

  const handleSortToggle = () => {
    setSortBySavings((prev) => {
      if (prev === null) return "desc";
      if (prev === "desc") return "asc";
      return null;
    });
  };

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
            <Select value={selectedCondition} onValueChange={(value) => setSelectedCondition(value as DiscountType | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('filterByCondition')} />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant={sortBySavings ? "default" : "outline"} 
              size="sm" 
              onClick={handleSortToggle}
              className="gap-1"
            >
              <ArrowUpDown className="h-4 w-4" />
              {t('sortBySavings')}
              {sortBySavings && (sortBySavings === "desc" ? " ↓" : " ↑")}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedProducts.map((product, index) => (
            <div
              key={`${product.name}-${product.shop}-${product.discountType}`}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PriceComparisonCard product={product} />
            </div>
          ))}
        </div>

        {sortedProducts.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            {t('noProductsFound')}
          </div>
        )}

        <div className="mt-12 text-center">
          <Button variant="hero" size="lg">
            {t('viewAllDeals')}
          </Button>
        </div>
      </div>
    </section>
  );
};
