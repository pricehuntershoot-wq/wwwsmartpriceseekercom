import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Tag, ShoppingCart, Package, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiscountPattern {
  type: string;
  description: string;
  confidence: string;
  location?: string;
}

interface PromoCodeField {
  found: boolean;
  fieldType?: string;
  placeholder?: string;
  nearbyText?: string;
}

interface CartDiscountIndicator {
  found: boolean;
  indicators: string[];
}

interface ProductCondition {
  isNew: boolean;
  condition?: string;
  conditionIndicators: string[];
}

interface AnalysisResult {
  url: string;
  analyzedAt: string;
  discountPatterns: DiscountPattern[];
  promoCodeField: PromoCodeField;
  cartDiscountIndicators: CartDiscountIndicator;
  productCondition: ProductCondition;
  hiddenDiscounts: string[];
  recommendations: string[];
  rawAnalysis?: string;
}

export function DiscountAnalyzer() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error("Please enter a product URL");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-product-page", {
        body: { url: url.trim() },
      });

      if (error) {
        throw error;
      }

      setResult(data);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze the page. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case "high":
        return "default";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Discount Pattern Analyzer
        </CardTitle>
        <CardDescription>
          Enter a product URL to discover hidden discounts, promo codes, and cart-based deals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="flex gap-2">
          <Input
            placeholder="https://www.notino.cz/product/..."
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

        {/* Results Section */}
        {result && (
          <div className="space-y-4">
            {/* Promo Code Field */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4" />
                <h4 className="font-medium">Promo Code Field</h4>
              </div>
              {result.promoCodeField.found ? (
                <div className="space-y-1 text-sm">
                  <Badge variant="default" className="bg-green-600">Found</Badge>
                  {result.promoCodeField.placeholder && (
                    <p className="text-muted-foreground">
                      Placeholder: {result.promoCodeField.placeholder}
                    </p>
                  )}
                  {result.promoCodeField.nearbyText && (
                    <p className="text-muted-foreground">
                      Context: {result.promoCodeField.nearbyText}
                    </p>
                  )}
                </div>
              ) : (
                <Badge variant="outline">Not detected</Badge>
              )}
            </div>

            {/* Cart Discount Indicators */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4" />
                <h4 className="font-medium">Cart Discount Indicators</h4>
              </div>
              {result.cartDiscountIndicators.found ? (
                <div className="space-y-2">
                  <Badge variant="default" className="bg-green-600">Found</Badge>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {result.cartDiscountIndicators.indicators.map((indicator, i) => (
                      <li key={i}>{indicator}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Badge variant="outline">No cart-specific discounts detected</Badge>
              )}
            </div>

            {/* Product Condition */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4" />
                <h4 className="font-medium">Product Condition</h4>
              </div>
              <div className="space-y-2">
                <Badge variant={result.productCondition.isNew ? "outline" : "secondary"}>
                  {result.productCondition.condition || (result.productCondition.isNew ? "New" : "Unknown")}
                </Badge>
                {result.productCondition.conditionIndicators.length > 0 && (
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {result.productCondition.conditionIndicators.map((indicator, i) => (
                      <li key={i}>{indicator}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Discount Patterns */}
            {result.discountPatterns.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">Discount Patterns Detected</h4>
                <div className="space-y-3">
                  {result.discountPatterns.map((pattern, i) => (
                    <div key={i} className="p-3 bg-background rounded border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{pattern.type}</span>
                        <Badge variant={getConfidenceBadgeVariant(pattern.confidence)}>
                          {pattern.confidence}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{pattern.description}</p>
                      {pattern.location && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Location: {pattern.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-medium mb-2 text-primary">Recommendations</h4>
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

            {/* Hidden Discounts */}
            {result.hiddenDiscounts.length > 0 && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <h4 className="font-medium mb-2 text-green-600">Hidden Discounts Found!</h4>
                <ul className="text-sm space-y-1">
                  {result.hiddenDiscounts.map((discount, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {discount}
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
