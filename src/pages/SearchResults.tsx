import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ExternalLink, Tag, Copy, Check, AlertCircle, ShoppingBag, Sparkles } from "lucide-react";
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
}

const ESHOP_LOGOS: Record<string, { name: string; color: string }> = {
  alza: { name: "Alza.cz", color: "bg-green-500/20 text-green-600" },
  datart: { name: "Datart.cz", color: "bg-blue-500/20 text-blue-600" },
  smarty: { name: "Smarty.cz", color: "bg-orange-500/20 text-orange-600" },
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<EshopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length >= 2) {
      searchEshops(query.trim());
    }
  }, [query]);

  const searchEshops = async (q: string) => {
    setIsLoading(true);
    setProducts([]);
    setErrors([]);

    try {
      const { data, error } = await supabase.functions.invoke("search-eshops", {
        body: { query: q },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Vyhledávání selhalo");

      setProducts(data.products || []);
      setErrors(data.errors || []);

      if (data.products?.length > 0) {
        toast.success(`Nalezeno ${data.products.length} produktů`);
      } else {
        toast.info("Žádné produkty nenalezeny");
      }
    } catch (err) {
      console.error("Search error:", err);
      toast.error(err instanceof Error ? err.message : "Vyhledávání selhalo");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kód ${code} zkopírován!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatPrice = (price: number) => price.toLocaleString("cs-CZ") + " Kč";

  // Group products by eshop
  const groupedByEshop = products.reduce<Record<string, EshopProduct[]>>((acc, p) => {
    const key = p.eshop || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  // Find the absolute lowest price
  const lowestPrice = products.length > 0 ? Math.min(...products.map((p) => p.price)) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-24 pb-20">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Výsledky pro: <span className="text-gradient-primary">„{query}"</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vyhledáváme na Alza.cz, Datart.cz a Smarty.cz
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-6 rounded-xl bg-muted/50 border border-border">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div>
                <p className="font-semibold">Prohledáváme e-shopy...</p>
                <p className="text-sm text-muted-foreground">
                  Stahujeme výsledky z Alza.cz, Datart.cz a Smarty.cz
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
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
              {errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Results */}
        {!isLoading && products.length > 0 && (
          <div className="space-y-8">
            {/* Best deal highlight */}
            {lowestPrice !== null && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-sm font-medium text-green-600">
                  🏆 Nejnižší nalezená cena: <span className="text-lg font-bold">{formatPrice(lowestPrice)}</span>
                </p>
              </div>
            )}

            {/* All products in a grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products
                .sort((a, b) => a.price - b.price)
                .map((product, i) => {
                  const eshopInfo = ESHOP_LOGOS[product.eshop] || { name: product.eshop, color: "bg-muted text-muted-foreground" };
                  const isCheapest = product.price === lowestPrice;

                  return (
                    <Card
                      key={i}
                      className={`overflow-hidden transition-all hover:shadow-lg ${
                        isCheapest ? "ring-2 ring-green-500/50" : ""
                      }`}
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-secondary/30">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-contain p-4"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        <Badge className={`absolute top-2 left-2 ${eshopInfo.color}`}>
                          {eshopInfo.name}
                        </Badge>
                        {isCheapest && (
                          <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                            Nejlevnější!
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-4 space-y-3">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                          {product.name}
                        </h3>

                        {product.category && (
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        )}

                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-bold ${isCheapest ? "text-green-600" : ""}`}>
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <>
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.originalPrice)}
                              </span>
                              <span className="text-xs text-green-600 font-medium">
                                -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                              </span>
                            </>
                          )}
                        </div>

                        {product.condition && product.condition !== "new" && (
                          <Badge variant="secondary" className="text-xs">
                            {product.condition === "used" ? "Použité" :
                             product.condition === "open_box" ? "Rozbaleno" :
                             product.condition === "refurbished" ? "Repasované" : product.condition}
                          </Badge>
                        )}

                        {product.promoCode && (
                          <div className="flex items-center gap-2">
                            <Tag className="h-3 w-3 text-primary" />
                            <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              {product.promoCode}
                            </code>
                            <button onClick={() => copyCode(product.promoCode!)}>
                              {copiedCode === product.promoCode ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        )}

                        {product.productUrl && (
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline" className="flex-1">
                              <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                                {eshopInfo.name}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </Button>
                            <Button asChild size="sm" variant="default" className="flex-1">
                              <Link to={`/analyzer?url=${encodeURIComponent(product.productUrl)}`}>
                                <Sparkles className="mr-1 h-3 w-3" />
                                Analyzovat
                              </Link>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
              Zkuste jiný hledaný výraz
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SearchResults;
