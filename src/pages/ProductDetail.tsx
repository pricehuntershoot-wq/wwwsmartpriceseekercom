import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { usePromoCodes, getPromoCodeForShop, calculatePriceWithPromo } from "@/hooks/usePromoCodes";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, ExternalLink, ShoppingCart, Package, Sparkles, Flame, Clock, ArrowLeft, Store, Bell, BellOff, Trash2, ArrowUpDown, ChevronUp, ChevronDown, Tag, Copy } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, Currency } from "@/lib/currency";
import { trackAffiliateClick } from "@/lib/affiliate";
import { cn } from "@/lib/utils";

const getDiscountIcon = (type: string | null) => {
  switch (type) {
    case 'in_cart':
      return <ShoppingCart className="h-3 w-3" />;
    case 'open_box':
      return <Package className="h-3 w-3" />;
    case 'promo':
      return <Sparkles className="h-3 w-3" />;
    case 'clearance':
      return <Flame className="h-3 w-3" />;
    default:
      return null;
  }
};

const getDiscountColor = (type: string | null) => {
  switch (type) {
    case 'in_cart':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'open_box':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'promo':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'clearance':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { preferredCurrency, setPreferredCurrency } = useCurrencyPreference();
  const { data: promoCodes } = usePromoCodes();
  const queryClient = useQueryClient();
  const [alertPrice, setAlertPrice] = useState("");
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [tableSortField, setTableSortField] = useState<'price' | 'currency' | 'updated'>('price');
  const [tableSortDirection, setTableSortDirection] = useState<'asc' | 'desc'>('asc');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'new' | 'open_box'>('all');

  // Fetch product with prices and shops
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (productError) throw productError;
      if (!productData) return null;

      // Fetch prices with shop info
      const { data: pricesData } = await supabase
        .from('prices')
        .select(`
          id,
          current_price,
          original_price,
          discount_type,
          discount_label,
          product_url,
          discovered_at,
          currency,
          shop_id
        `)
        .eq('product_id', id)
        .eq('is_active', true)
        .order('current_price', { ascending: true });

      // Fetch shop info for each price
      const pricesWithShops = await Promise.all(
        (pricesData || []).map(async (price) => {
          const { data: shopData } = await supabase
            .from('shops')
            .select('id, name, logo_url, website_url')
            .eq('id', price.shop_id)
            .maybeSingle();
          
          return {
            ...price,
            shop: shopData || { id: price.shop_id, name: 'Unknown', logo_url: null, website_url: null }
          };
        })
      );

      return {
        ...productData,
        prices: pricesWithShops
      };
    },
    enabled: !!id
  });

  // Fetch user favorites
  const { data: isFavorited, refetch: refetchFavorite } = useQuery({
    queryKey: ['favorite', user?.id, id],
    queryFn: async () => {
      if (!user || !id) return false;
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!id
  });

  // Fetch price alert for this product
  const { data: priceAlert, refetch: refetchAlert } = useQuery({
    queryKey: ['price-alert', user?.id, id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id
  });

  const handleFavorite = async () => {
    if (!user || !id) {
      toast.error("Pro uložení oblíbených se prosím přihlaste");
      return;
    }

    if (isFavorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id);
      
      if (error) {
        toast.error("Failed to remove favorite");
        return;
      }
      toast.success("Removed from favorites");
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: id });
      
      if (error) {
        toast.error("Failed to add favorite");
        return;
      }
      toast.success("Added to favorites");
    }
    
    refetchFavorite();
  };

  const handleCreateAlert = async () => {
    if (!user || !id) {
      toast.error("Please sign in to set price alerts");
      return;
    }

    const targetPrice = parseFloat(alertPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const { error } = await supabase
      .from('price_alerts')
      .insert({ 
        user_id: user.id, 
        product_id: id,
        target_price: targetPrice
      });
    
    if (error) {
      toast.error("Failed to create price alert");
      return;
    }
    
    toast.success("Alert created");
    setAlertPrice("");
    setIsAlertDialogOpen(false);
    refetchAlert();
  };

  const handleDeleteAlert = async () => {
    if (!user || !id || !priceAlert) return;

    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', priceAlert.id);
    
    if (error) {
      toast.error("Failed to delete price alert");
      return;
    }
    
    toast.success("Price alert removed");
    refetchAlert();
  };

  // Helper to get final price after promo
  const getFinalPrice = (price: { current_price: number; shop: { id: string } }) => {
    const promoCode = getPromoCodeForShop(promoCodes, price.shop.id);
    const { finalPrice } = calculatePriceWithPromo(price.current_price, promoCode);
    return finalPrice;
  };

  // Group prices by currency
  const eurPrices = product?.prices?.filter(p => (p.currency || 'EUR') === 'EUR') || [];
  const czkPrices = product?.prices?.filter(p => p.currency === 'CZK') || [];
  
  // Find best price for each currency (using final price after promo)
  const bestEurPrice = eurPrices.length > 0 
    ? eurPrices.reduce((min, p) => getFinalPrice(p) < getFinalPrice(min) ? p : min, eurPrices[0])
    : null;
  const bestCzkPrice = czkPrices.length > 0 
    ? czkPrices.reduce((min, p) => getFinalPrice(p) < getFinalPrice(min) ? p : min, czkPrices[0])
    : null;

  // Find the absolute best price across all currencies and conditions
  const allPrices = product?.prices || [];
  const absoluteBestPrice = allPrices.length > 0
    ? allPrices.reduce((min, p) => getFinalPrice(p) < getFinalPrice(min) ? p : min, allPrices[0])
    : null;

  const bestPrice = absoluteBestPrice || bestEurPrice || bestCzkPrice;
  const currency: Currency = (bestPrice?.currency as Currency) || 'EUR';
  
  // Calculate savings for preferred currency (including promo discounts)
  const preferredBestPrice = preferredCurrency === 'EUR' ? bestEurPrice : bestCzkPrice;
  const savings = preferredBestPrice
    ? (preferredBestPrice.original_price || preferredBestPrice.current_price) - getFinalPrice(preferredBestPrice)
    : 0;

  // Filter prices by condition
  const filteredByCondition = (product?.prices || []).filter(price => {
    if (conditionFilter === 'all') return true;
    if (conditionFilter === 'new') return !price.discount_type || price.discount_type === 'new';
    if (conditionFilter === 'open_box') return price.discount_type === 'open_box';
    return true;
  });

  // Get unique conditions for filter buttons
  const availableConditions = [...new Set((product?.prices || []).map(p => p.discount_type || 'new'))];
  const hasOpenBox = availableConditions.includes('open_box');
  const hasNew = availableConditions.some(c => !c || c === 'new');

  // Sort prices for table (using final price after promo)
  const sortedPrices = [...filteredByCondition].sort((a, b) => {
    const direction = tableSortDirection === 'asc' ? 1 : -1;
    switch (tableSortField) {
      case 'price':
        return (getFinalPrice(a) - getFinalPrice(b)) * direction;
      case 'currency':
        const currA = a.currency || 'EUR';
        const currB = b.currency || 'EUR';
        return currA.localeCompare(currB) * direction;
      case 'updated':
        return (new Date(a.discovered_at).getTime() - new Date(b.discovered_at).getTime()) * direction;
      default:
        return 0;
    }
  });

  const handleTableSort = (field: 'price' | 'currency' | 'updated') => {
    if (tableSortField === field) {
      setTableSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortField(field);
      setTableSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'price' | 'currency' | 'updated' }) => {
    if (tableSortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
    }
    return tableSortDirection === 'asc' 
      ? <ChevronUp className="ml-1 h-3 w-3" /> 
      : <ChevronDown className="ml-1 h-3 w-3" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container pb-16 pt-24">
          <Skeleton className="mb-4 h-8 w-32" />
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex flex-col items-center justify-center pb-16 pt-24">
          <Package className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h1 className="mb-2 text-2xl font-bold">Product not found</h1>
          <p className="mb-4 text-muted-foreground">The product you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pb-16 pt-24">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>

        {/* Product info */}
        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          {/* Product image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted/30">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground/50" />
              </div>
            )}
            {savings > 0 && (
              <Badge className="absolute bottom-4 left-4 bg-green-500 px-3 py-1 text-lg text-white">
                Save {formatPrice(savings, preferredCurrency)}
              </Badge>
            )}
          </div>

          {/* Product details */}
          <div>
            {product.category && (
              <Badge variant="secondary" className="mb-2">
                {product.category}
              </Badge>
            )}
            <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
            {product.description && (
              <p className="mb-4 text-muted-foreground">{product.description}</p>
            )}

            {/* Dual currency price display */}
            {(bestEurPrice || bestCzkPrice) && (
              <div className="mb-6">
                <div className="flex flex-wrap items-start gap-4">
                  {bestEurPrice && (() => {
                    const promoCode = getPromoCodeForShop(promoCodes, bestEurPrice.shop.id);
                    const { finalPrice, promoApplied } = calculatePriceWithPromo(bestEurPrice.current_price, promoCode);
                    return (
                      <div className={cn(
                        "flex flex-col rounded-lg px-4 py-2 transition-colors",
                        preferredCurrency === 'EUR' 
                          ? "bg-primary/10 ring-2 ring-primary/40" 
                          : "bg-muted/50"
                      )}>
                        <span className={cn(
                          "text-sm font-medium",
                          preferredCurrency === 'EUR' ? "text-primary" : "text-muted-foreground"
                        )}>EUR {preferredCurrency === 'EUR' && "★"}</span>
                        <div className="flex items-baseline gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn(
                                  "font-bold",
                                  preferredCurrency === 'EUR' ? "text-4xl" : "text-2xl",
                                  promoApplied ? "text-green-500" : preferredCurrency === 'EUR' ? "text-primary" : "text-foreground"
                                )}>
                                  {formatPrice(finalPrice, 'EUR')}
                                  {promoApplied && <Tag className="inline h-4 w-4 ml-1" />}
                                </span>
                              </TooltipTrigger>
                              {promoApplied && promoCode && (
                                <TooltipContent>
                                  <p className="font-medium">Price after code: {promoCode.code}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Original: {formatPrice(bestEurPrice.current_price, 'EUR')}
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                          {(bestEurPrice.original_price || promoApplied) && (
                            <span className="text-lg text-muted-foreground line-through">
                              {formatPrice(bestEurPrice.original_price || bestEurPrice.current_price, 'EUR')}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Best at {bestEurPrice.shop.name}
                          {promoApplied && promoCode?.code && (
                            <span className="ml-1 text-green-500">with code {promoCode.code}</span>
                          )}
                        </p>
                      </div>
                    );
                  })()}
                  {bestEurPrice && bestCzkPrice && (
                    <div className="hidden h-16 w-px self-center bg-border sm:block" />
                  )}
                  {bestCzkPrice && (() => {
                    const promoCode = getPromoCodeForShop(promoCodes, bestCzkPrice.shop.id);
                    const { finalPrice, promoApplied } = calculatePriceWithPromo(bestCzkPrice.current_price, promoCode);
                    return (
                      <div className={cn(
                        "flex flex-col rounded-lg px-4 py-2 transition-colors",
                        preferredCurrency === 'CZK' 
                          ? "bg-primary/10 ring-2 ring-primary/40" 
                          : "bg-muted/50"
                      )}>
                        <span className={cn(
                          "text-sm font-medium",
                          preferredCurrency === 'CZK' ? "text-primary" : "text-muted-foreground"
                        )}>CZK {preferredCurrency === 'CZK' && "★"}</span>
                        <div className="flex items-baseline gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn(
                                  "font-bold",
                                  preferredCurrency === 'CZK' ? "text-4xl" : "text-2xl",
                                  promoApplied ? "text-green-500" : preferredCurrency === 'CZK' ? "text-primary" : "text-foreground"
                                )}>
                                  {formatPrice(finalPrice, 'CZK')}
                                  {promoApplied && <Tag className="inline h-4 w-4 ml-1" />}
                                </span>
                              </TooltipTrigger>
                              {promoApplied && promoCode && (
                                <TooltipContent>
                                  <p className="font-medium">Price after code: {promoCode.code}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Original: {formatPrice(bestCzkPrice.current_price, 'CZK')}
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                          {(bestCzkPrice.original_price || promoApplied) && (
                            <span className="text-lg text-muted-foreground line-through">
                              {formatPrice(bestCzkPrice.original_price || bestCzkPrice.current_price, 'CZK')}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Best at {bestCzkPrice.shop.name}
                          {promoApplied && promoCode?.code && (
                            <span className="ml-1 text-green-500">with code {promoCode.code}</span>
                          )}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {bestPrice?.product_url && (
                <Button 
                  size="lg"
                  onClick={() => {
                    trackAffiliateClick({
                      productId: product.id,
                      shopId: bestPrice.shop.id,
                      priceId: bestPrice.id,
                      userId: user?.id,
                      productUrl: bestPrice.product_url!,
                      
                    });
                  }}
                >
                  Koupit – {bestPrice.shop.name}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleFavorite}
              >
                <Heart className={`mr-2 h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                {isFavorited ? 'Saved' : 'Save'}
              </Button>
              
              {/* Price Alert Button */}
              {priceAlert ? (
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  onClick={handleDeleteAlert}
                >
                  <BellOff className="mr-2 h-4 w-4" />
                  Alert at {formatPrice(priceAlert.target_price, currency)}
                </Button>
              ) : (
                <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline">
                      <Bell className="mr-2 h-4 w-4" />
                      Set Price Alert
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Price Alert</DialogTitle>
                      <DialogDescription>
                        Get notified when the price drops below your target price.
                        {bestPrice && (
                          <span className="mt-2 block text-sm">
                            Current best price: <strong className="text-primary">{formatPrice(bestPrice.current_price, currency)}</strong>
                          </span>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <label className="mb-2 block text-sm font-medium">Target Price ({currency})</label>
                      <Input
                        type="number"
                        placeholder={bestPrice ? String(Math.floor(bestPrice.current_price * 0.9)) : "Enter target price"}
                        value={alertPrice}
                        onChange={(e) => setAlertPrice(e.target.value)}
                        min="1"
                      />
                      {bestPrice && alertPrice && parseFloat(alertPrice) >= bestPrice.current_price && (
                        <p className="mt-2 text-sm text-amber-500">
                          Tip: Set a price lower than the current best price to get meaningful alerts.
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAlert}>
                        <Bell className="mr-2 h-4 w-4" />
                        Create Alert
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Price History Chart */}
        <div className="mb-8">
          <PriceHistoryChart productId={id!} currentBestPrice={bestPrice?.current_price} />
        </div>

        {/* Price comparison table */}
        <Card>
          <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Price Comparison ({sortedPrices.length} of {product.prices?.length || 0} offers)
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              {/* Condition filter - Alza style */}
              {(hasNew || hasOpenBox) && (
                <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                  <Button
                    variant={conditionFilter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3 text-xs font-medium"
                    onClick={() => setConditionFilter('all')}
                  >
                    Vše
                  </Button>
                  {hasNew && (
                    <Button
                      variant={conditionFilter === 'new' ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        "h-8 px-3 text-xs font-medium",
                        conditionFilter === 'new' && "bg-green-600 hover:bg-green-700"
                      )}
                      onClick={() => setConditionFilter('new')}
                    >
                      <Package className="mr-1.5 h-3.5 w-3.5" />
                      Nový
                    </Button>
                  )}
                  {hasOpenBox && (
                    <Button
                      variant={conditionFilter === 'open_box' ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        "h-8 px-3 text-xs font-medium",
                        conditionFilter === 'open_box' && "bg-amber-600 hover:bg-amber-700"
                      )}
                      onClick={() => setConditionFilter('open_box')}
                    >
                      <Package className="mr-1.5 h-3.5 w-3.5" />
                      Rozbalený
                    </Button>
                  )}
                </div>
              )}
              {/* Currency toggle */}
              <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
                <Button
                  variant={preferredCurrency === 'EUR' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3"
                  onClick={() => setPreferredCurrency('EUR')}
                >
                  € EUR
                </Button>
                <Button
                  variant={preferredCurrency === 'CZK' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3"
                  onClick={() => setPreferredCurrency('CZK')}
                >
                  Kč CZK
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {product.prices && product.prices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => handleTableSort('price')}
                      >
                        <span className="flex items-center">
                          Price
                          <SortIcon field="price" />
                        </span>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => handleTableSort('currency')}
                      >
                        <span className="flex items-center">
                          Currency
                          <SortIcon field="currency" />
                        </span>
                      </TableHead>
                      <TableHead>Original</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => handleTableSort('updated')}
                      >
                        <span className="flex items-center">
                          Updated
                          <SortIcon field="updated" />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPrices.map((price, index) => {
                      const priceCurrency = (price.currency as Currency) || 'EUR';
                      const isPreferred = priceCurrency === preferredCurrency;
                      const promoCode = getPromoCodeForShop(promoCodes, price.shop.id);
                      const { finalPrice, promoApplied } = calculatePriceWithPromo(price.current_price, promoCode);
                      
                      const handleCopyCode = (code: string) => {
                        navigator.clipboard.writeText(code);
                        toast.success(`Code "${code}" copied!`);
                      };
                      
                      return (
                        <TableRow key={price.id} className={isPreferred ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {price.shop.logo_url ? (
                              <img 
                                src={price.shop.logo_url} 
                                alt={price.shop.name}
                                className="h-6 w-6 rounded object-contain"
                              />
                            ) : (
                              <Store className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className="font-medium">{price.shop.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn(
                                  "font-bold",
                                  promoApplied ? "text-green-500" : isPreferred && "text-primary"
                                )}>
                                  {formatPrice(finalPrice, priceCurrency)}
                                  {promoApplied && <Tag className="inline h-3 w-3 ml-1" />}
                                </span>
                              </TooltipTrigger>
                              {promoApplied && promoCode && (
                                <TooltipContent>
                                  <p className="font-medium">Price after code: {promoCode.code}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Original: {formatPrice(price.current_price, priceCurrency)}
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={isPreferred ? "default" : "outline"} 
                            className={cn(
                              "font-medium",
                              isPreferred && "bg-primary"
                            )}
                          >
                            {priceCurrency === 'EUR' ? '€ EUR' : 'Kč CZK'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(price.original_price || promoApplied) ? (
                            <span className="text-muted-foreground line-through">
                              {formatPrice(price.original_price || price.current_price, priceCurrency)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {promoApplied && promoCode?.code && (
                              <Badge 
                                variant="outline" 
                                className="cursor-pointer bg-green-500/20 text-green-400 border-green-500/30 text-xs hover:bg-green-500/30"
                                onClick={() => handleCopyCode(promoCode.code!)}
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {promoCode.code}
                                <Copy className="h-3 w-3 ml-1" />
                              </Badge>
                            )}
                            {price.discount_type && (
                              <Badge variant="outline" className={`text-xs ${getDiscountColor(price.discount_type)}`}>
                                {getDiscountIcon(price.discount_type)}
                                <span className="ml-1">{price.discount_type.replace('_', ' ')}</span>
                              </Badge>
                            )}
                            {price.discount_label && (
                              <Badge variant="outline" className="text-xs">
                                {price.discount_label}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(price.discovered_at), { addSuffix: true })}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {price.product_url ? (
                            <Button 
                              size="sm" 
                              variant={isPreferred ? "default" : "outline"}
                              onClick={() => {
                                trackAffiliateClick({
                                  productId: product.id,
                                  shopId: price.shop.id,
                                  priceId: price.id,
                                  userId: user?.id,
                                  productUrl: price.product_url!,
                                  
                                });
                              }}
                            >
                              Koupit
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                No price data available for this product.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;