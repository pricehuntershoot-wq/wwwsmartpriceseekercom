import { ArrowRight, Bot, Search, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { RotatingBasket } from "./RotatingBasket";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { formatPrice as formatPriceFn } from "@/lib/currency";
import { useNavigate } from "react-router-dom";

interface ProductSuggestion {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  lowestPrice?: number;
}

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const { preferredCurrency } = useCurrencyPreference();
  const formatPrice = (price: number) => formatPriceFn(price, preferredCurrency);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch product suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data: products, error } = await supabase
          .from("products")
          .select("id, name, image_url, category")
          .ilike("name", `%${searchQuery}%`)
          .limit(5);

        if (error) throw error;

        // Fetch lowest price for each product
        const productsWithPrices = await Promise.all(
          (products || []).map(async (product) => {
            const { data: prices } = await supabase
              .from("prices")
              .select("current_price")
              .eq("product_id", product.id)
              .eq("is_active", true)
              .order("current_price", { ascending: true })
              .limit(1);

            return {
              ...product,
              lowestPrice: prices?.[0]?.current_price,
            };
          })
        );

        setSuggestions(productsWithPrices);
        setIsOpen(productsWithPrices.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectProduct = (productId: string) => {
    setIsOpen(false);
    setSearchQuery("");
    navigate(`/product/${productId}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden pt-32 pb-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-accent/10 blur-[100px]" />
      
      {/* Floating elements */}
      <div className="absolute top-40 left-20 animate-float opacity-20">
        <Bot className="h-12 w-12 text-primary" />
      </div>
      <div className="absolute top-60 right-32 animate-float opacity-20" style={{ animationDelay: "2s" }}>
        <Sparkles className="h-8 w-8 text-accent" />
      </div>
      
      {/* 3D Rotating Basket */}
      <div className="absolute top-1/3 left-4 opacity-30 sm:left-8 md:left-16 lg:left-32">
        <RotatingBasket />
      </div>
      <div className="absolute bottom-1/4 right-4 opacity-25 sm:right-8 md:right-16 lg:right-32">
        <RotatingBasket />
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {t('heroBadge')}
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            {t('heroTitlePart1')}{" "}
            <span className="text-gradient-primary">{t('heroTitleHighlight')}</span>
            <br />
            {t('heroTitlePart2')}
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            {t('heroSubtitle')}
          </p>

          {/* Search Bar with Autocomplete */}
          <div className="mx-auto mb-8 max-w-2xl" ref={wrapperRef}>
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-primary opacity-50 blur transition-opacity group-hover:opacity-75" />
              <div className="relative flex items-center gap-2 rounded-xl border border-border bg-card p-2">
                <Search className="ml-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t('heroSearchPlaceholder')}
                  className="flex-1 bg-transparent px-2 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <Button variant="hero" size="lg" onClick={handleSearch}>
                  {t('heroSearchButton')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Autocomplete Dropdown */}
              {isOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {suggestions.map((product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(product.id)}
                            className="flex w-full items-center gap-4 p-3 text-left transition-colors hover:bg-secondary/50"
                          >
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                  <Search className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate font-medium text-foreground">
                                {product.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {product.category}
                              </p>
                            </div>
                            {product.lowestPrice && (
                              <span className="flex-shrink-0 font-semibold text-primary">
                                {formatPrice(product.lowestPrice)}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>{t('heroStat1')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <span>{t('heroStat2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>{t('heroStat3')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
