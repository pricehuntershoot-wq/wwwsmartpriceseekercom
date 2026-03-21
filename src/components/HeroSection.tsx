import { ArrowRight, Search, Sparkles, TrendingDown, Shield, Zap, Store, Tag, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { formatPrice as formatPriceFn } from "@/lib/currency";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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
            return { ...product, lowestPrice: prices?.[0]?.current_price };
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
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stats = [
    { value: "4", label: "E-shopy", icon: Store },
    { value: "AI", label: "Analýza cen", icon: Sparkles },
    { value: "100%", label: "Zdarma", icon: Tag },
  ];

  return (
    <section className="relative min-h-[100vh] overflow-hidden flex items-center">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-mesh" />
      
      {/* Decorative orbs */}
      <div className="absolute top-[15%] left-[10%] h-[400px] w-[400px] rounded-full bg-primary/[0.07] blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-[20%] right-[5%] h-[350px] w-[350px] rounded-full bg-accent/[0.05] blur-[100px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
      
      {/* Dot grid overlay */}
      <div className="absolute inset-0 dot-grid opacity-40" />
      
      {/* Bottom fade line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container relative z-10 pt-24 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-primary/[0.06] px-5 py-2 shadow-inner-glow"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium tracking-widest uppercase text-primary/90">
              {t('heroBadge')}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-6 font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.5rem]"
          >
            {t('heroTitlePart1')}{" "}
            <span className="text-gradient-primary">{t('heroTitleHighlight')}</span>
            <br />
            {t('heroTitlePart2')}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mx-auto mb-12 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl leading-relaxed"
          >
            {t('heroSubtitle')}
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mx-auto mb-16 max-w-2xl"
            ref={wrapperRef}
          >
            <div className="relative glass-card rounded-2xl p-2 transition-all duration-300 focus-within:shadow-glow focus-within:border-primary/20">
              <div className="flex items-center gap-3">
                <Search className="ml-4 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t('heroSearchPlaceholder')}
                  className="flex-1 bg-transparent px-2 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <Button size="lg" className="rounded-xl px-6" onClick={handleSearch}>
                  Shoot
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Autocomplete */}
              {isOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-elevated">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/50">
                      {suggestions.map((product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(product.id)}
                            className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-secondary/50"
                          >
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
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

            {/* Quick search hints */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground/60">Trending:</span>
              {["iPhone 16", "Galaxy S24", "AirPods Pro"].map((hint) => (
                <button
                  key={hint}
                  onClick={() => { setSearchQuery(hint); navigate(`/search?q=${encodeURIComponent(hint)}`); }}
                  className="rounded-full border border-border/50 bg-secondary/30 px-3 py-1 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                >
                  {hint}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-12"
          >
            {stats.map(({ value, label, icon: Icon }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] border border-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold font-heading text-foreground">{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};