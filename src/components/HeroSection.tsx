import { ArrowRight, Search, Sparkles, TrendingDown, Shield, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const trustSignals = [
    { icon: TrendingDown, text: t('heroStat1') },
    { icon: Shield, text: t('heroStat2') },
    { icon: Zap, text: t('heroStat3') },
  ];

  return (
    <section className="relative min-h-[90vh] overflow-hidden pt-28 pb-20 flex items-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[150px]" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium tracking-wide uppercase text-primary">
              {t('heroBadge')}
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {t('heroTitlePart1')}{" "}
            <span className="text-gradient-primary">{t('heroTitleHighlight')}</span>
            <br />
            {t('heroTitlePart2')}
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t('heroSubtitle')}
          </p>

          {/* Search Bar */}
          <div className="mx-auto mb-12 max-w-xl" ref={wrapperRef}>
            <div className="relative rounded-xl border border-border bg-card/80 backdrop-blur-sm p-1.5 shadow-card transition-shadow focus-within:shadow-glow focus-within:border-primary/30">
              <div className="flex items-center gap-2">
                <Search className="ml-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t('heroSearchPlaceholder')}
                  className="flex-1 bg-transparent px-2 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <Button size="default" onClick={handleSearch}>
                  Shoot
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Autocomplete */}
              {isOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {suggestions.map((product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(product.id)}
                            className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-secondary/50"
                          >
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                  <Search className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                            </div>
                            {product.lowestPrice && (
                              <span className="flex-shrink-0 text-sm font-semibold text-primary">
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

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {trustSignals.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-primary/60" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
