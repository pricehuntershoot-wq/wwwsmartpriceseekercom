import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Tag, ShoppingCart, Package, Sparkles, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { toast } from "sonner";

interface PriceTier {
  tierType: string;
  price: number;
  originalPrice?: number | null;
  condition: string;
  promoCode?: string | null;
  promoDescription?: string | null;
  label: string;
  confidence: string;
}

interface PromoCodeInfo {
  code: string;
  discount: string;
  description: string;
  applicableTo: string;
}

interface AnalysisResult {
  productName: string | null;
  priceTiers: PriceTier[];
  promoCodes: PromoCodeInfo[];
  conditions: string[];
  cartDiscountIndicators: string[];
  recommendations: string[];
  currency: string;
}

export function DiscountAnalyzer() {
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<"idle" | "scraping" | "analyzing">("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Auto-start analysis if URL is passed via query param
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam && !isAnalyzing && !result) {
      setUrl(urlParam);
      // Trigger analysis on next tick after state is set
      setTimeout(() => {
        analyzeUrl(urlParam);
      }, 100);
    }
  }, [searchParams]);

  const analyzeUrl = async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      toast.error("Zadejte URL produktu");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setStep("scraping");

    try {
      const scrapeResult = await firecrawlApi.scrape(targetUrl.trim(), {
        formats: ["markdown", "html"],
        waitFor: 3000,
        location: { country: "CZ", languages: ["cs"] },
      });

      if (!scrapeResult.success) {
        throw new Error(scrapeResult.error || "Nepodařilo se načíst stránku");
      }

      const markdown = scrapeResult.data?.markdown || scrapeResult.markdown;
      const html = scrapeResult.data?.html || scrapeResult.html;

      if (!markdown && !html) {
        throw new Error("Stránka nevrátila žádný obsah");
      }

      setStep("analyzing");

      const { data, error } = await supabase.functions.invoke("analyze-product-page", {
        body: {
          url: targetUrl.trim(),
          markdownContent: markdown,
          htmlContent: html,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Analýza selhala");

      setResult(data.analysis);
      toast.success(`Nalezeno ${data.analysis.priceTiers?.length || 0} cenových úrovní!`);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Analýza selhala");
    } finally {
      setIsAnalyzing(false);
      setStep("idle");
    }
  };

  const handleAnalyze = () => analyzeUrl(url);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kód ${code} zkopírován!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("cs-CZ") + " Kč";
  };

  const getTierIcon = (tierType: string) => {
    switch (tierType) {
      case "promo_code":
      case "used_promo":
        return <Tag className="h-4 w-4" />;
      case "cart":
        return <ShoppingCart className="h-4 w-4" />;
      case "used":
      case "open_box":
      case "refurbished":
        return <Package className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTierColor = (tierType: string) => {
    switch (tierType) {
      case "main":
        return "bg-secondary text-secondary-foreground";
      case "promo_code":
        return "bg-primary/20 text-primary";
      case "cart":
        return "bg-amber-500/20 text-amber-600";
      case "used":
      case "returned":
        return "bg-orange-500/20 text-orange-600";
      case "used_promo":
        return "bg-green-500/20 text-green-600";
      case "open_box":
        return "bg-blue-500/20 text-blue-600";
      case "refurbished":
        return "bg-purple-500/20 text-purple-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const lowestPrice = result?.priceTiers?.length
    ? Math.min(...result.priceTiers.map((t) => t.price))
    : null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Cenový Analyzér
        </CardTitle>
        <CardDescription>
          Zadejte URL produktu z e-shopu a odhalíme všechny cenové úrovně – hlavní cenu, slevy s kódem i ceny použitého zboží
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="https://www.alza.cz/produkt/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            disabled={isAnalyzing}
          />
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Loading state */}
        {isAnalyzing && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-medium text-sm">
                {step === "scraping" ? "Načítám stránku..." : "AI analyzuje ceny..."}
              </p>
              <p className="text-xs text-muted-foreground">
                {step === "scraping"
                  ? "Stahujeme obsah produktové stránky"
                  : "Hledáme všechny cenové úrovně a slevové kódy"}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Product Name */}
            {result.productName && (
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold text-lg">{result.productName}</h3>
              </div>
            )}

            {/* Price Tiers - the main feature */}
            {result.priceTiers?.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Nalezené cenové úrovně
                </h4>
                {result.priceTiers
                  .sort((a, b) => a.price - b.price)
                  .map((tier, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border transition-all ${
                        tier.price === lowestPrice
                          ? "border-green-500/50 bg-green-500/5 ring-1 ring-green-500/20"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {getTierIcon(tier.tierType)}
                          <Badge className={getTierColor(tier.tierType)}>
                            {tier.label}
                          </Badge>
                          {tier.price === lowestPrice && (
                            <Badge className="bg-green-600 text-white">
                              Nejlevnější!
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {tier.confidence}
                        </Badge>
                      </div>

                      <div className="mt-2 flex items-baseline gap-3">
                        <span className={`text-2xl font-bold ${
                          tier.price === lowestPrice ? "text-green-600" : ""
                        }`}>
                          {formatPrice(tier.price)}
                        </span>
                        {tier.originalPrice && tier.originalPrice !== tier.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(tier.originalPrice)}
                          </span>
                        )}
                        {tier.originalPrice && tier.originalPrice > tier.price && (
                          <span className="text-sm text-green-600 font-medium">
                            -{Math.round(((tier.originalPrice - tier.price) / tier.originalPrice) * 100)}%
                          </span>
                        )}
                      </div>

                      {tier.promoCode && (
                        <div className="mt-2 flex items-center gap-2">
                          <code className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-mono font-bold">
                            {tier.promoCode}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => copyCode(tier.promoCode!)}
                          >
                            {copiedCode === tier.promoCode ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          {tier.promoDescription && (
                            <span className="text-xs text-muted-foreground">
                              {tier.promoDescription}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Promo Codes */}
            {result.promoCodes?.length > 0 && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-medium mb-3 text-primary flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Nalezené slevové kódy
                </h4>
                <div className="space-y-2">
                  {result.promoCodes.map((promo, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded bg-background">
                      <code className="px-2 py-1 rounded bg-primary/10 text-primary font-mono font-bold text-sm">
                        {promo.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => copyCode(promo.code)}
                      >
                        {copiedCode === promo.code ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <div className="flex-1 text-sm">
                        <span className="font-medium">{promo.discount}</span>
                        {promo.description && (
                          <span className="text-muted-foreground ml-2">{promo.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-medium mb-2">Doporučení</h4>
                <ul className="text-sm space-y-1">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
