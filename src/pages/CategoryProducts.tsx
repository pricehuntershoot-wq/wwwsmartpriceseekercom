import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Headphones, Smartphone, Tv, Tablet, Watch, Speaker, Gamepad2,
  CircleDot, Monitor, Cable, Loader2, ExternalLink, Tag, Copy, Check,
  AlertCircle, ShoppingBag, Bot, Database, Sparkles, Target, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EshopProduct {
  name: string;
  price: number;
  originalPrice?: number | null;
  eshop: string;
  productUrl?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  promoCode?: string | null;
  condition?: string;
  fromCache?: boolean;
}

// Group products by name and show prices from each shop side-by-side
interface GroupedProduct {
  name: string;
  imageUrl: string | null;
  category: string | null;
  shops: {
    eshop: string;
    price: number;
    originalPrice?: number | null;
    productUrl?: string | null;
    promoCode?: string | null;
    condition?: string;
  }[];
}

const ESHOP_META: Record<string, { name: string; logo: string; color: string }> = {
  alza: { name: "Alza.cz", logo: "https://cdn.alza.cz/Foto/favicon/android-chrome-192x192.png", color: "bg-green-600" },
  czc: { name: "CZC.cz", logo: "https://www.czc.cz/favicon.ico", color: "bg-yellow-600" },
  datart: { name: "Datart.cz", logo: "https://www.datart.cz/favicon.ico", color: "bg-red-600" },
  smarty: { name: "Smarty.cz", logo: "https://www.smarty.cz/favicon.ico", color: "bg-blue-600" },
  mironet: { name: "Mironet.cz", logo: "https://www.mironet.cz/favicon.ico", color: "bg-orange-600" },
  mp: { name: "MP.cz", logo: "https://www.mp.cz/favicon.ico", color: "bg-violet-600" },
  refurbed: { name: "Refurbed.cz", logo: "https://www.refurbed.cz/favicon.ico", color: "bg-teal-600" },
};

const CATEGORY_CONFIG: Record<string, { title: string; icon: typeof Headphones; searchTerm: string }> = {
  Headphones: { title: "Sluchátka", icon: Headphones, searchTerm: "sluchátka" },
  mobile_phones: { title: "Mobilní telefony", icon: Smartphone, searchTerm: "mobily" },
  tv: { title: "Televize", icon: Tv, searchTerm: "televize" },
  tablets: { title: "Tablety", icon: Tablet, searchTerm: "tablety" },
  smart_watches: { title: "Chytré hodinky", icon: Watch, searchTerm: "chytré hodinky" },
  speakers: { title: "Reproduktory", icon: Speaker, searchTerm: "reproduktory" },
  gaming_consoles: { title: "Herní konzole", icon: Gamepad2, searchTerm: "herní konzole" },
  smart_rings: { title: "Chytré prsteny", icon: CircleDot, searchTerm: "chytré prsteny" },
  pc: { title: "Počítače", icon: Monitor, searchTerm: "počítač PC" },
  accessories: { title: "Příslušenství", icon: Cable, searchTerm: "příslušenství elektronika" },
};

const formatPrice = (price: number) => price.toLocaleString("cs-CZ") + " Kč";

const getConditionLabel = (condition?: string) => {
  switch (condition) {
    case "open_box": return { label: "Rozbaleno", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    case "used": return { label: "Použité", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" };
    case "refurbished": return { label: "Repasované", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
    default: return null;
  }
};

function groupProducts(products: EshopProduct[]): GroupedProduct[] {
  const groups: Record<string, GroupedProduct> = {};

  for (const p of products) {
    // Normalize name for grouping (remove extra spaces, lowercase)
    const key = p.name.toLowerCase().replace(/\s+/g, " ").trim();

    if (!groups[key]) {
      groups[key] = {
        name: p.name,
        imageUrl: p.imageUrl || null,
        category: p.category || null,
        shops: [],
      };
    }

    // Use first available image
    if (!groups[key].imageUrl && p.imageUrl) {
      groups[key].imageUrl = p.imageUrl;
    }

    groups[key].shops.push({
      eshop: p.eshop,
      price: p.price,
      originalPrice: p.originalPrice,
      productUrl: p.productUrl,
      promoCode: p.promoCode,
      condition: p.condition,
    });
  }

  // Sort groups by lowest price
  return Object.values(groups).sort((a, b) => {
    const minA = Math.min(...a.shops.map(s => s.price));
    const minB = Math.min(...b.shops.map(s => s.price));
    return minA - minB;
  });
}

const CategoryProducts = () => {
  const { slug } = useParams<{ slug: string }>();
  const config = CATEGORY_CONFIG[slug || ""] || CATEGORY_CONFIG["Headphones"];
  const Icon = config.icon;

  const [products, setProducts] = useState<EshopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [searchProgress, setSearchProgress] = useState(0);
  const [showWittyMessage, setShowWittyMessage] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wittyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCategory = async () => {
    setIsLoading(true);
    setProducts([]);
    setErrors([]);
    setSearchProgress(0);
    setShowWittyMessage(false);
    setFromCache(false);

    progressTimerRef.current = setInterval(() => {
      setSearchProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 10));
    }, 500);

    wittyTimerRef.current = setTimeout(() => setShowWittyMessage(true), 5000);

    try {
      const { data, error } = await supabase.functions.invoke("search-eshops", {
        body: { query: config.searchTerm },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Vyhledávání selhalo");

      setSearchProgress(100);
      setProducts(data.products || []);
      setErrors(data.errors || []);
      setFromCache(data.fromCache || false);

      if (data.products?.length > 0) {
        toast.success(
          data.fromCache
            ? `Nalezeno ${data.products.length} nabídek z databáze`
            : `Nalezeno ${data.products.length} nabídek ze 6 e-shopů`
        );
      }
    } catch (err) {
      console.error("Category search error:", err);
      toast.error(err instanceof Error ? err.message : "Vyhledávání selhalo");
    } finally {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (wittyTimerRef.current) clearTimeout(wittyTimerRef.current);
      setTimeout(() => {
        setIsLoading(false);
        setSearchProgress(0);
        setShowWittyMessage(false);
      }, 300);
    }
  };

  useEffect(() => {
    searchCategory();
  }, [slug]);

  const grouped = useMemo(() => groupProducts(products), [products]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kód ${code} zkopírován!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalPromos = products.filter(p => p.promoCode).length;
  const totalHiddenDeals = products.filter(p => p.condition && p.condition !== "new").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
              {config.title}
            </h1>
          </div>
          <p className="text-muted-foreground">
            AI agenti prohledávají <span className="font-semibold text-foreground">Alza.cz</span>,{" "}
            <span className="font-semibold text-foreground">CZC.cz</span>,{" "}
            <span className="font-semibold text-foreground">Datart.cz</span>,{" "}
            <span className="font-semibold text-foreground">Smarty.cz</span>,{" "}
            <span className="font-semibold text-foreground">Mironet.cz</span> a{" "}
            <span className="font-semibold text-foreground">MP.cz</span> — hledáme{" "}
            <span className="font-bold text-primary">skryté slevy</span>, promo kódy a rozbalené produkty
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div>
                  <p className="font-semibold">Prohledáváme skryté slevy...</p>
                  <p className="text-sm text-muted-foreground">
                    Stahujeme a analyzujeme stránky ze 6 e-shopů pomocí AI
                  </p>
                </div>
              </div>
              <Progress value={searchProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">{Math.round(searchProgress)}%</p>

              {showWittyMessage && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in">
                  <Bot className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm text-primary font-medium">
                    Naši AI agenti právě analyzují ceny v košíku a hledají promo kódy... 🤖🔍
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && !isLoading && (
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-600">Některé e-shopy neodpověděly</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              {errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          </div>
        )}

        {/* Results */}
        {!isLoading && grouped.length > 0 && (
          <div className="space-y-6">
            {/* Stats banner */}
            <div className="flex flex-wrap gap-3">
              {fromCache && (
                <div className="flex items-center gap-2 rounded-lg bg-accent/30 border border-border px-3 py-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Z databáze (24h cache)</span>
                  <Button variant="ghost" size="sm" onClick={searchCategory} className="h-6 px-2 gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Znovu
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {grouped.length} produktů · {products.length} nabídek
                </span>
              </div>

              {totalPromos > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-2">
                  <Tag className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">
                    {totalPromos} promo kódů nalezeno
                  </span>
                </div>
              )}

              {totalHiddenDeals > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                  <Target className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">
                    {totalHiddenDeals} skrytých slev (rozbaleno, repas...)
                  </span>
                </div>
              )}
            </div>

            {/* Product grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.map((product, i) => {
                const lowestPrice = Math.min(...product.shops.map(s => s.price));
                const hasPromo = product.shops.some(s => s.promoCode);
                const hasHiddenDeal = product.shops.some(s => s.condition && s.condition !== "new");

                return (
                  <div
                    key={i}
                    className="group overflow-hidden rounded-2xl border border-border bg-gradient-card transition-all duration-300 hover:border-primary/50 hover:shadow-glow animate-fade-in"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-secondary/50 p-6">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {hasPromo && (
                          <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px]">
                            <Tag className="h-3 w-3 mr-1" />
                            Promo kód
                          </Badge>
                        )}
                        {hasHiddenDeal && (
                          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                            🔍 Skrytá sleva
                          </Badge>
                        )}
                      </div>

                      {/* Analyze link */}
                      {product.shops[0]?.productUrl && (
                        <Link
                          to={`/analyzer?url=${encodeURIComponent(product.shops[0].productUrl)}`}
                          className="absolute top-2 right-2"
                        >
                          <Badge className="bg-primary/90 text-primary-foreground text-[10px] cursor-pointer hover:bg-primary">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Deep Analyze
                          </Badge>
                        </Link>
                      )}
                    </div>

                    {/* Name */}
                    <div className="px-5 pt-4 pb-2">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                        {product.name}
                      </h3>
                    </div>

                    {/* Shop prices */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 px-5 pb-3">
                      {["alza", "czc", "datart", "smarty", "mironet", "mp"].map((eshopKey) => {
                        const shopOffer = product.shops.find(s => s.eshop === eshopKey);
                        const meta = ESHOP_META[eshopKey];
                        const isLowest = shopOffer && shopOffer.price === lowestPrice;

                        return (
                          <div
                            key={eshopKey}
                            className={`relative flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all duration-200 ${
                              shopOffer
                                ? isLowest
                                  ? "bg-[hsl(54,100%,50%)]/15 ring-2 ring-[hsl(54,100%,50%)] shadow-[0_0_20px_-4px_hsl(54,100%,50%/0.4)]"
                                  : "bg-secondary/50 hover:bg-secondary/80"
                                : "bg-secondary/20 opacity-40"
                            }`}
                          >
                            {isLowest && (
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-[hsl(54,100%,50%)] px-1.5 py-0.5 text-[9px] font-bold text-black whitespace-nowrap shadow-md">
                                <Target className="h-2.5 w-2.5" />
                                Úlovek
                              </div>
                            )}

                            <div className="mt-1 flex flex-col items-center gap-0.5">
                              <img src={meta.logo} alt={meta.name} className="h-5 w-5 rounded" />
                              <span className="text-[10px] text-muted-foreground">{meta.name}</span>
                            </div>

                            {shopOffer ? (
                              <>
                                <span className={`text-sm font-bold ${isLowest ? "text-[hsl(54,100%,50%)]" : "text-foreground"}`}>
                                  {formatPrice(shopOffer.price)}
                                </span>
                                {shopOffer.originalPrice && shopOffer.originalPrice > shopOffer.price && (
                                  <span className="text-[10px] text-muted-foreground line-through">
                                    {formatPrice(shopOffer.originalPrice)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Promo codes & conditions */}
                    {(hasPromo || hasHiddenDeal) && (
                      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                        {product.shops.map((s, j) => {
                          const condInfo = getConditionLabel(s.condition);
                          return (
                            <div key={j} className="contents">
                              {s.promoCode && (
                                <button
                                  onClick={() => copyCode(s.promoCode!)}
                                  className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-400 hover:bg-purple-500/20 transition-colors"
                                >
                                  <Tag className="h-3 w-3" />
                                  {s.promoCode}
                                  {copiedCode === s.promoCode ? (
                                    <Check className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                              {condInfo && (
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${condInfo.color}`}>
                                  {condInfo.label} · {ESHOP_META[s.eshop]?.name}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="px-5 pb-4 flex gap-2">
                      {product.shops.find(s => s.price === lowestPrice)?.productUrl && (
                        <Button size="sm" className="flex-1 gap-1" asChild>
                          <a
                            href={product.shops.find(s => s.price === lowestPrice)!.productUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Koupit za {formatPrice(lowestPrice)}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && grouped.length === 0 && products.length === 0 && !errors.length && (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Vyhledávání se spouští...</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryProducts;
