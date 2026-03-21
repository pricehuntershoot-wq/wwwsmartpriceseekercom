import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, ExternalLink, Tag, Copy, Check, AlertCircle, ShoppingBag,
  Sparkles, SlidersHorizontal, X, Bot, Database, Target, RefreshCw,
  ShoppingCart, Package, ChevronDown, ChevronUp, Heart
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchLimit } from "@/hooks/useSearchLimit";
import { supabase } from "@/integrations/supabase/client";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { toast } from "sonner";
import { SearchLimitModal } from "@/components/SearchLimitModal";

interface EshopProduct {
  name: string;
  normalizedName?: string;
  price: number;
  originalPrice?: number | null;
  eshop: string;
  productUrl?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  promoCode?: string | null;
  condition?: string;
}

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

interface PriceTier {
  tierType: string;
  price: number;
  originalPrice?: number | null;
  condition: string;
  promoCode?: string | null;
  promoDescription?: string | null;
  label: string;
  confidence: string;
  shopUrl?: string | null;
  shopName?: string | null;
}

interface InlineAnalysis {
  productName: string | null;
  priceTiers: PriceTier[];
  promoCodes: { code: string; discount: string; description: string }[];
  recommendations: string[];
}

const ESHOP_META: Record<string, { name: string; logo: string; color: string }> = {
  alza: { name: "Alza.cz", logo: "https://cdn.alza.cz/Foto/favicon/android-chrome-192x192.png", color: "bg-green-600" },
  datart: { name: "Datart.cz", logo: "https://www.datart.cz/favicon.ico", color: "bg-red-600" },
  smarty: { name: "Smarty.cz", logo: "https://www.smarty.cz/favicon.ico", color: "bg-blue-600" },
  mironet: { name: "Mironet.cz", logo: "https://www.mironet.cz/favicon.ico", color: "bg-orange-600" },
};

const formatPrice = (price: number | null | undefined) => price != null ? price.toLocaleString("cs-CZ") + " Kč" : "–";

const getConditionLabel = (condition?: string) => {
  switch (condition) {
    case "open_box": return { label: "Rozbaleno", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    case "used": return { label: "Použité", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" };
    case "refurbished": return { label: "Repasované", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
    default: return null;
  }
};

function normalizeForGrouping(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-záčďéěíňóřšťúůýž0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getGroupingTokens(name: string): string[] {
  const normalized = normalizeForGrouping(name);
  // Remove common filler words
  const stopWords = new Set(["barva", "barev", "cerny", "cerna", "bila", "bily", "modra", "modry", "cervena", "cerveny", "zelena", "zeleny", "seda", "sedy", "ruzova", "ruzovy", "zlata", "zlaty", "stribrna", "stribrny", "bezova", "bezovy"]);
  return normalized.split(" ").filter(t => t.length > 1 && !stopWords.has(t));
}

function tokensOverlap(a: string[], b: string[]): number {
  const setA = new Set(a);
  let overlap = 0;
  for (const token of b) {
    if (setA.has(token)) overlap++;
  }
  return overlap;
}

function groupProducts(products: EshopProduct[]): GroupedProduct[] {
  const groups: GroupedProduct[] = [];
  const groupTokens: string[][] = [];
  const groupNormNames: string[] = [];

  for (const p of products) {
    const normName = (p.normalizedName || p.name).toLowerCase().trim();
    const tokens = getGroupingTokens(p.name);
    let bestGroupIdx = -1;
    let bestScore = 0;

    for (let i = 0; i < groups.length; i++) {
      // Don't merge if same eshop already present
      if (groups[i].shops.some(s => s.eshop === p.eshop)) continue;

      // Priority 1: exact normalizedName match
      if (normName === groupNormNames[i]) {
        bestGroupIdx = i;
        bestScore = 1;
        break;
      }

      // Priority 2: fuzzy token overlap
      const overlap = tokensOverlap(tokens, groupTokens[i]);
      const minLen = Math.min(tokens.length, groupTokens[i].length);
      const score = minLen > 0 ? overlap / minLen : 0;

      if (score > bestScore && score >= 0.6 && overlap >= 2) {
        bestScore = score;
        bestGroupIdx = i;
      }
    }

    if (bestGroupIdx >= 0) {
      const g = groups[bestGroupIdx];
      if (!g.imageUrl && p.imageUrl) g.imageUrl = p.imageUrl;
      g.shops.push({
        eshop: p.eshop,
        price: p.price,
        originalPrice: p.originalPrice,
        productUrl: p.productUrl,
        promoCode: p.promoCode,
        condition: p.condition,
      });
    } else {
      groups.push({
        name: p.name,
        imageUrl: p.imageUrl || null,
        category: p.category || null,
        shops: [{
          eshop: p.eshop,
          price: p.price,
          originalPrice: p.originalPrice,
          productUrl: p.productUrl,
          promoCode: p.promoCode,
          condition: p.condition,
        }],
      });
      groupTokens.push(tokens);
      groupNormNames.push(normName);
    }
  }

  return groups.sort((a, b) => {
    const minA = Math.min(...a.shops.map(s => s.price));
    const minB = Math.min(...b.shops.map(s => s.price));
    return minA - minB;
  });
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<EshopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"price-asc" | "price-desc" | "discount-desc">("price-asc");
  const [searchProgress, setSearchProgress] = useState(0);
  const [showWittyMessage, setShowWittyMessage] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [analyzingIdx, setAnalyzingIdx] = useState<number | null>(null);
  const [analyzeStep, setAnalyzeStep] = useState<"idle" | "scraping" | "analyzing">("idle");
  const [analyzeProgress, setAnalyzeProgress] = useState<{ current: number; total: number; shopName: string }>({ current: 0, total: 0, shopName: "" });
  const [analysisResults, setAnalysisResults] = useState<Record<number, InlineAnalysis>>({});
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);
  const [favoritedNames, setFavoritedNames] = useState<Set<string>>(new Set());
  const [savingFavorite, setSavingFavorite] = useState<string | null>(null);
  const wittyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisPanelRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Auto-scroll to analysis panel when expanded
  useEffect(() => {
    if (expandedAnalysis !== null && analysisResults[expandedAnalysis]) {
      setTimeout(() => {
        analysisPanelRefs.current[expandedAnalysis]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [expandedAnalysis, analysisResults]);

  const toggleFavorite = async (productName: string, imageUrl: string | null, category: string | null) => {
    if (!user) {
      toast.error("Pro uložení do oblíbených se přihlaste");
      navigate("/auth");
      return;
    }
    if (savingFavorite) return;
    setSavingFavorite(productName);

    try {
      // Find or create product in DB
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("name", productName)
        .maybeSingle();

      let productId: string;
      if (existing) {
        productId = existing.id;
      } else {
        const { data: created, error } = await supabase
          .from("products")
          .insert({ name: productName, image_url: imageUrl, category })
          .select("id")
          .single();
        if (error || !created) throw new Error("Nepodařilo se uložit produkt");
        productId = created.id;
      }

      if (favoritedNames.has(productName)) {
        // Remove
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId);
        setFavoritedNames(prev => { const n = new Set(prev); n.delete(productName); return n; });
        toast.success("Odebráno z oblíbených");
      } else {
        // Add
        const { error } = await supabase.from("favorites").insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
        setFavoritedNames(prev => new Set(prev).add(productName));
        toast.success("Přidáno do oblíbených ❤️");
      }
    } catch (err) {
      console.error("Favorite error:", err);
      toast.error("Nepodařilo se uložit");
    } finally {
      setSavingFavorite(null);
    }
  };

  const runInlineAnalysis = async (cardIdx: number, shops: GroupedProduct["shops"]) => {
    if (analyzingIdx !== null) return;
    const shopsWithUrl = shops.filter(s => s.productUrl);
    if (shopsWithUrl.length === 0) return;

    setAnalyzingIdx(cardIdx);
    setExpandedAnalysis(cardIdx);
    setAnalyzeStep("analyzing");
    const completed = { count: 0 };
    setAnalyzeProgress({ current: 0, total: shopsWithUrl.length, shopName: shopsWithUrl.map(s => ESHOP_META[s.eshop]?.name || s.eshop).join(", ") });

    try {
      const results = await Promise.allSettled(
        shopsWithUrl.map(async (shop) => {
          const url = shop.productUrl!;
          const shopMeta = ESHOP_META[shop.eshop];
          const shopName = shopMeta?.name || shop.eshop;

          const scrapeResult = await firecrawlApi.scrape(url, {
            formats: ["markdown", "html"],
            waitFor: 3000,
            location: { country: "CZ", languages: ["cs"] },
          });

          completed.count++;
          setAnalyzeProgress(prev => ({ ...prev, current: completed.count, shopName }));

          if (!scrapeResult.success) return null;

          const markdown = scrapeResult.data?.markdown || scrapeResult.markdown;
          const html = scrapeResult.data?.html || scrapeResult.html;
          if (!markdown && !html) return null;

          const { data, error } = await supabase.functions.invoke("analyze-product-page", {
            body: { url, markdownContent: markdown, htmlContent: html },
          });

          if (error || !data?.success) return null;

          const analysis = data.analysis;
          return {
            tiers: (analysis.priceTiers || []).map((tier: any) => ({ ...tier, shopUrl: url, shopName })),
            promos: analysis.promoCodes || [],
            recs: analysis.recommendations || [],
          };
        })
      );

      const allTiers: PriceTier[] = [];
      const allPromos: InlineAnalysis["promoCodes"] = [];
      const allRecs: string[] = [];

      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          allTiers.push(...r.value.tiers);
          allPromos.push(...r.value.promos);
          allRecs.push(...r.value.recs);
        }
      }

      const combinedAnalysis: InlineAnalysis = {
        productName: null,
        priceTiers: allTiers.sort((a, b) => a.price - b.price),
        promoCodes: allPromos,
        recommendations: [...new Set(allRecs)],
      };

      setAnalysisResults(prev => ({ ...prev, [cardIdx]: combinedAnalysis }));
      toast.success(`Nalezeno ${allTiers.length} cenových úrovní z ${shopsWithUrl.length} obchodů!`);
    } catch (err) {
      console.error("Inline analysis error:", err);
      toast.error(err instanceof Error ? err.message : "Analýza selhala");
    } finally {
      setAnalyzingIdx(null);
      setAnalyzeStep("idle");
    }
  };

  useEffect(() => {
    if (query.trim().length >= 2) {
      searchEshops(query.trim());
    }
  }, [query]);

  // Load user's existing favorites
  useEffect(() => {
    if (!user) return;
    supabase
      .from("favorites")
      .select("product_id, products(name)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          const names = new Set(data.map((f: any) => f.products?.name).filter(Boolean));
          setFavoritedNames(names as Set<string>);
        }
      });
  }, [user]);

  const searchEshops = async (q: string, forceRefresh = false) => {
    setIsLoading(true);
    setProducts([]);
    setErrors([]);
    setSearchProgress(0);
    setShowWittyMessage(false);
    setFromCache(false);

    progressTimerRef.current = setInterval(() => {
      setSearchProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 12));
    }, 400);

    wittyTimerRef.current = setTimeout(() => setShowWittyMessage(true), 5000);

    try {
      const { data, error } = await supabase.functions.invoke("search-eshops", {
        body: { query: q, forceRefresh },
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
            : `Nalezeno ${data.products.length} nabídek ze 4 e-shopů`
        );
      } else {
        toast.info("Žádné produkty nenalezeny");
      }
    } catch (err) {
      console.error("Search error:", err);
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

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kód ${code} zkopírován!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const grouped = useMemo(() => {
    // Client-side variant filtering
    const q = query.toLowerCase();
    const variantSuffixes = ['ultra', 'plus', 'fe', 'lite', 'neo'];
    const excludeVariants = variantSuffixes.filter(v => !q.includes(v));
    
    const filtered = products.filter(p => {
      const name = p.name.toLowerCase();
      for (const variant of excludeVariants) {
        if (name.includes(variant)) return false;
      }
      if (!q.includes('+') && /s\d{2}\+/i.test(name)) return false;
      return true;
    });
    
    const g = groupProducts(filtered);
    if (sortOrder === "price-desc") return [...g].reverse();
    return g;
  }, [products, sortOrder, query]);

  const totalPromos = products.filter(p => p.promoCode).length;
  const totalHiddenDeals = products.filter(p => p.condition && p.condition !== "new").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-24 pb-20">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Výsledky pro: <span className="text-gradient-primary">„{query}"</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            AI agenti prohledávají <span className="font-semibold text-foreground">Alza.cz</span>,{" "}
            <span className="font-semibold text-foreground">Datart.cz</span>,{" "}
            <span className="font-semibold text-foreground">Smarty.cz</span> a{" "}
            <span className="font-semibold text-foreground">Mironet.cz</span>
          </p>
          {fromCache && !isLoading && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5"
              onClick={() => searchEshops(query, true)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Aktualizovat ceny
            </Button>
          )}
        </div>

        {/* Sort bar */}
        {!isLoading && grouped.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
              <SelectTrigger className="w-52 h-9 text-sm">
                <SelectValue placeholder="Řadit podle..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Cena: od nejnižší</SelectItem>
                <SelectItem value="price-desc">Cena: od nejvyšší</SelectItem>
              </SelectContent>
            </Select>

            <span className="ml-auto text-sm text-muted-foreground">
              {grouped.length} produktů · {products.length} nabídek
            </span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div>
                  <p className="font-semibold">Prohledáváme skryté slevy...</p>
                  <p className="text-sm text-muted-foreground">
                    Stahujeme a analyzujeme stránky ze 3 e-shopů pomocí AI
                  </p>
                </div>
              </div>
              <Progress value={searchProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">{Math.round(searchProgress)}%</p>

              {showWittyMessage && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in">
                  <Bot className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm text-primary font-medium">
                    Naši AI agenti právě vyjednávají nejlepší ceny pro vás, vydržte! 🤖💰
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

        {/* Grouped results */}
        {!isLoading && grouped.length > 0 && (
          <div className="space-y-6">
            {/* Stats banner */}
            <div className="flex flex-wrap gap-3">
              {fromCache && (
                <div className="flex items-center gap-2 rounded-lg bg-accent/30 border border-border px-3 py-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Z databáze (24h cache)</span>
                  <Button variant="ghost" size="sm" onClick={() => searchEshops(query.trim())} className="h-6 px-2 gap-1">
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
                    {totalHiddenDeals} skrytých slev
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

                      {/* Top-right buttons */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {/* Favorite heart */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.name, product.imageUrl, product.category);
                          }}
                          disabled={savingFavorite === product.name}
                          className="flex items-center justify-center h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${
                              favoritedNames.has(product.name)
                                ? "fill-red-500 text-red-500"
                                : "text-muted-foreground hover:text-red-400"
                            }`}
                          />
                        </button>

                        {/* Analyze badge */}
                        {product.shops[0]?.productUrl && (
                          <button
                            onClick={() => {
                              const analysis = analysisResults[i];
                              if (analysis) {
                                setExpandedAnalysis(expandedAnalysis === i ? null : i);
                              } else {
                                runInlineAnalysis(i, product.shops);
                              }
                            }}
                            disabled={analyzingIdx !== null && analyzingIdx !== i}
                          >
                            <Badge className={`text-[10px] cursor-pointer transition-colors ${
                              analyzingIdx === i
                                ? "bg-primary/70 text-primary-foreground animate-pulse"
                                : analysisResults[i]
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "bg-primary/90 text-primary-foreground hover:bg-primary"
                            }`}>
                              {analyzingIdx === i ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Sparkles className="h-3 w-3 mr-1" />
                              )}
                              {analyzingIdx === i
                                ? `${analyzeProgress.current}/${analyzeProgress.total} ${analyzeProgress.shopName}`
                                : analysisResults[i] ? "Analyzováno ✓" : "Deep Analyze"
                              }
                            </Badge>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="px-5 pt-4 pb-2">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                        {product.name}
                      </h3>
                    </div>

                    {/* Shop prices - show all 4 shops */}
                    <div className="grid grid-cols-4 gap-1.5 px-4 pb-3">
                      {["alza", "datart", "smarty", "mironet"].map((eshopKey) => {
                        const shopOffer = product.shops.find(s => s.eshop === eshopKey);
                        const meta = ESHOP_META[eshopKey];
                        const isLowest = shopOffer && shopOffer.price === lowestPrice;

                        return (
                          <a
                            key={eshopKey}
                            href={shopOffer?.productUrl || undefined}
                            target={shopOffer?.productUrl ? "_blank" : undefined}
                            rel={shopOffer?.productUrl ? "noopener noreferrer" : undefined}
                            className={`relative flex flex-col items-center gap-1 rounded-xl p-2 transition-all duration-200 ${
                              shopOffer
                                ? isLowest
                                  ? "bg-[hsl(54,100%,50%)]/15 ring-2 ring-[hsl(54,100%,50%)] shadow-[0_0_20px_-4px_hsl(54,100%,50%/0.4)] cursor-pointer hover:scale-105"
                                  : "bg-secondary/50 hover:bg-secondary/80 cursor-pointer hover:scale-105"
                                : "bg-secondary/20 opacity-40 pointer-events-none"
                            }`}
                          >
                            {isLowest && (
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-[hsl(54,100%,50%)] px-1.5 py-0.5 text-[9px] font-bold text-black whitespace-nowrap shadow-md">
                                <Target className="h-2.5 w-2.5" />
                                Úlovek
                              </div>
                            )}

                            <div className="mt-1 flex flex-col items-center gap-0.5">
                              <img src={meta.logo} alt={meta.name} className="h-4 w-4 rounded" />
                              <span className="text-[9px] text-muted-foreground">{meta.name}</span>
                            </div>

                            {shopOffer ? (
                              <>
                                <span className={`text-xs font-bold ${isLowest ? "text-[hsl(54,100%,50%)]" : "text-foreground"}`}>
                                  {formatPrice(shopOffer.price)}
                                </span>
                                {shopOffer.originalPrice && shopOffer.originalPrice > shopOffer.price && (
                                  <span className="text-[9px] text-muted-foreground line-through">
                                    {formatPrice(shopOffer.originalPrice)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[9px] text-muted-foreground">—</span>
                            )}
                          </a>
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

                    {/* Inline Deep Analysis Panel */}
                    {expandedAnalysis === i && analysisResults[i] && (
                      <div
                        ref={(el) => { analysisPanelRefs.current[i] = el; }}
                        className="mx-4 mb-3 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 animate-fade-in"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                            <Sparkles className="h-3.5 w-3.5" />
                            Hloubková analýza cen
                          </h4>
                          <button onClick={() => setExpandedAnalysis(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Price tiers */}
                        {analysisResults[i].priceTiers?.map((tier, ti) => {
                          const tierLowest = Math.min(...analysisResults[i].priceTiers.map(t => t.price));
                          const isTierLowest = tier.price === tierLowest;
                          return (
                            <a
                              key={ti}
                              href={tier.shopUrl || undefined}
                              target={tier.shopUrl ? "_blank" : undefined}
                              rel={tier.shopUrl ? "noopener noreferrer" : undefined}
                              className={`block rounded-lg border p-3 transition-all hover:scale-[1.02] ${
                                tier.shopUrl ? "cursor-pointer" : ""
                              } ${
                                isTierLowest
                                  ? "border-green-500/40 bg-green-500/5"
                                  : "border-border bg-background hover:border-primary/30"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {tier.tierType === "promo_code" || tier.tierType === "used_promo" ? (
                                  <Tag className="h-3.5 w-3.5 text-primary" />
                                ) : tier.tierType === "cart" ? (
                                  <ShoppingCart className="h-3.5 w-3.5 text-amber-500" />
                                ) : tier.tierType === "used" || tier.tierType === "open_box" || tier.tierType === "refurbished" ? (
                                  <Package className="h-3.5 w-3.5 text-orange-500" />
                                ) : (
                                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span className="text-[11px] font-medium">{tier.label}</span>
                                {tier.shopName && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                    {tier.shopName}
                                  </Badge>
                                )}
                                {isTierLowest && (
                                  <Badge className="bg-green-600 text-white text-[9px] px-1.5 py-0">
                                    Nejlevnější!
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className={`text-lg font-bold ${isTierLowest ? "text-green-500" : ""}`}>
                                  {formatPrice(tier.price)}
                                </span>
                                {tier.originalPrice && tier.originalPrice > tier.price && (
                                  <>
                                    <span className="text-xs text-muted-foreground line-through">
                                      {formatPrice(tier.originalPrice)}
                                    </span>
                                    <span className="text-xs text-green-500 font-medium">
                                      -{Math.round(((tier.originalPrice - tier.price) / tier.originalPrice) * 100)}%
                                    </span>
                                  </>
                                )}
                                {tier.shopUrl && (
                                  <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                                )}
                              </div>
                              {tier.promoCode && (
                                <button
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyCode(tier.promoCode!); }}
                                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-xs font-mono font-bold text-primary hover:bg-primary/20 transition-colors"
                                >
                                  {tier.promoCode}
                                  {copiedCode === tier.promoCode ? (
                                    <Check className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </a>
                          );
                        })}

                        {/* Recommendations */}
                        {analysisResults[i].recommendations?.length > 0 && (
                          <div className="text-[11px] text-muted-foreground space-y-0.5">
                            {analysisResults[i].recommendations.map((r, ri) => (
                              <p key={ri}>💡 {r}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline analysis loading */}
                    {analyzingIdx === i && !analysisResults[i] && (
                      <div className="mx-4 mb-3 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <div className="flex-1">
                            <p className="text-xs font-medium">
                              {analyzeStep === "scraping"
                                ? `Načítám ${analyzeProgress.shopName}...`
                                : `Analyzuji ${analyzeProgress.shopName}...`}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Obchod {analyzeProgress.current}/{analyzeProgress.total} · {analyzeStep === "scraping" ? "Stahování" : "AI analýza"}
                            </p>
                          </div>
                        </div>
                        <Progress value={(analyzeProgress.current / analyzeProgress.total) * 100} className="h-1.5" />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="px-5 pb-4 flex gap-2">
                      {(() => {
                        const anyUrl = product.shops.find(s => s.productUrl)?.productUrl;
                        return anyUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1"
                            onClick={() => {
                              const analysis = analysisResults[i];
                              if (analysis) {
                                setExpandedAnalysis(expandedAnalysis === i ? null : i);
                              } else {
                                runInlineAnalysis(i, product.shops);
                              }
                            }}
                            disabled={analyzingIdx !== null && analyzingIdx !== i}
                          >
                            {analyzingIdx === i ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {analysisResults[i]
                              ? expandedAnalysis === i ? "Skrýt analýzu" : "Zobrazit analýzu"
                              : "Analyzovat"
                            }
                          </Button>
                        ) : null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No results */}
        {!isLoading && products.length === 0 && query && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg font-semibold">Žádné produkty nenalezeny</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {errors.length > 0
                ? "Některé e-shopy neodpověděly – zkuste to znovu"
                : "Zkuste jiný hledaný výraz"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              onClick={() => searchEshops(query.trim())}
            >
              <Loader2 className="h-4 w-4" />
              Zkusit znovu
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SearchResults;
