import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { useLanguage } from "@/hooks/useLanguage";
import { formatPrice } from "@/lib/currency";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, Clock, Crown, ArrowRight, Percent, Zap, Lock, Store, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cs, enUS } from "date-fns/locale";

interface ShopPrice {
  id: string;
  current_price: number;
  discovered_at: string;
  shop: {
    id: string;
    name: string;
    logo_url: string | null;
    website_url: string | null;
  } | null;
}

interface PriceDropWithDetails {
  id: string;
  product_id: string;
  old_price: number;
  new_price: number;
  drop_percentage: number;
  detected_at: string;
  premium_notified_at: string | null;
  standard_notified_at: string | null;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    category: string | null;
  } | null;
  price: {
    currency: string;
    shop_id: string;
    shop: {
      name: string;
    } | null;
  } | null;
  allPrices?: ShopPrice[];
}

export const PriceDropsDashboard = () => {
  const { user } = useAuth();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const { preferredCurrency } = useCurrencyPreference();
  const { t, language } = useLanguage();

  const dateLocale = language === 'cs' ? cs : enUS;

  const { data: priceDrops, isLoading } = useQuery({
    queryKey: ['price-drops-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_drop_notifications')
        .select(`
          *,
          product:products(id, name, image_url, category),
          price:prices(currency, shop_id, shop:shops(name))
        `)
        .gte('drop_percentage', 20)
        .order('detected_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      
      const drops = data as unknown as PriceDropWithDetails[];
      
      // Fetch all prices for each product to show shop comparison
      const productIds = [...new Set(drops.map(d => d.product_id))];
      const { data: allPrices } = await supabase
        .from('prices')
        .select('id, product_id, current_price, discovered_at, shop:shops(id, name, logo_url, website_url)')
        .in('product_id', productIds)
        .eq('is_active', true);
      
      // Attach all prices to each drop
      return drops.map(drop => ({
        ...drop,
        allPrices: (allPrices || [])
          .filter(p => p.product_id === drop.product_id)
          .sort((a, b) => a.current_price - b.current_price) as ShopPrice[]
      }));
    },
  });

  const now = new Date();

  const getAccessStatus = (drop: PriceDropWithDetails) => {
    const detectedAt = new Date(drop.detected_at);
    const embargoEnd = new Date(detectedAt.getTime() + 60 * 60 * 1000); // 1 hour after detection
    const isInEmbargo = now < embargoEnd;
    
    if (isPremium) {
      return { hasAccess: true, isEarlyAccess: isInEmbargo, label: isInEmbargo ? 'Early Access' : 'Available' };
    } else {
      return { hasAccess: !isInEmbargo, isEarlyAccess: false, label: isInEmbargo ? 'Premium Only' : 'Available' };
    }
  };

  const formatPriceDisplay = (amount: number, priceCurrency: string = 'EUR') => {
    return formatPrice(amount, preferredCurrency);
  };

  if (isLoading || subscriptionLoading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!priceDrops || priceDrops.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t('priceDropsAlert')}</h2>
              <p className="text-muted-foreground text-sm">{t('priceDropsDesc')}</p>
            </div>
          </div>
          
          {isPremium ? (
            <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20">
              <Crown className="h-3 w-3" />
              {t('earlyAccessActiveBadge')}
            </Badge>
          ) : (
            <Link to="/premium">
              <Button variant="outline" size="sm" className="gap-2">
                <Zap className="h-4 w-4" />
                {t('getEarlyAccess')}
              </Button>
            </Link>
          )}
        </div>

        {/* Price Drops Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {priceDrops.map((drop) => {
            const status = getAccessStatus(drop);
            const priceCurrency = drop.price?.currency || 'EUR';
            
            return (
              <Card 
                key={drop.id} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  !status.hasAccess ? 'opacity-75' : ''
                }`}
              >
                {/* Early Access Badge */}
                {status.isEarlyAccess && isPremium && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-400 text-white text-xs font-medium px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    {t('earlyAccessActiveBadge')}
                  </div>
                )}
                
                {/* Locked Overlay for non-premium during embargo */}
                {!status.hasAccess && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">{t('premiumOnly')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('availableIn')} {formatDistanceToNow(new Date(new Date(drop.detected_at).getTime() + 60 * 60 * 1000), { locale: dateLocale })}
                    </p>
                    <Link to="/premium">
                      <Button size="sm" variant="default" className="mt-2 gap-1">
                        <Crown className="h-3 w-3" />
                        {t('unlockNow')}
                      </Button>
                    </Link>
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    {drop.product?.image_url ? (
                      <img 
                        src={drop.product.image_url} 
                        alt={drop.product?.name || 'Product'} 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <TrendingDown className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium line-clamp-2">
                        {drop.product?.name || 'Unknown Product'}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {drop.price?.shop?.name || 'Unknown Shop'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-2">
                  {/* Cheapest Price - Prominent Display */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        {t('cheapestPrice')}
                      </span>
                      <span className="text-2xl font-bold text-gradient-accent">
                        {formatPriceDisplay(drop.new_price, priceCurrency)}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        {t('was')} {formatPriceDisplay(drop.old_price, priceCurrency)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="destructive" className="gap-1 text-sm font-bold px-2 py-1">
                        <Percent className="h-3.5 w-3.5" />
                        -{Math.round(drop.drop_percentage)}%
                      </Badge>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {t('saveMoney')} {formatPriceDisplay(drop.old_price - drop.new_price, priceCurrency)}
                      </span>
                    </div>
                  </div>

                  {/* Shop Price Comparison */}
                  {drop.allPrices && drop.allPrices.length > 1 && (
                    <div className="mb-3 p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Store className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                          {t('compareShops')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <TooltipProvider delayDuration={200}>
                          {drop.allPrices.slice(0, 3).map((shopPrice, idx) => {
                            const isCurrentShop = shopPrice.shop?.id === drop.price?.shop_id;
                            const isCheapest = idx === 0;
                            return (
                              <Tooltip key={shopPrice.id}>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors hover:opacity-80 ${
                                      isCheapest 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold' 
                                        : 'bg-background text-muted-foreground'
                                    }`}
                                  >
                                    {shopPrice.shop?.logo_url ? (
                                      <img 
                                        src={shopPrice.shop.logo_url} 
                                        alt={shopPrice.shop.name} 
                                        className="w-4 h-4 object-contain rounded-sm"
                                      />
                                    ) : (
                                      <Store className="w-3.5 h-3.5" />
                                    )}
                                    <span className="font-medium">{shopPrice.shop?.name}</span>
                                    <span>{formatPriceDisplay(shopPrice.current_price, priceCurrency)}</span>
                                    {!isCheapest && drop.allPrices && drop.allPrices[0] && (
                                      <span className="text-[10px] text-destructive font-medium">
                                        +{formatPriceDisplay(shopPrice.current_price - drop.allPrices[0].current_price, priceCurrency)}
                                      </span>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      {shopPrice.shop?.logo_url && (
                                        <img 
                                          src={shopPrice.shop.logo_url} 
                                          alt={shopPrice.shop.name}
                                          className="w-5 h-5 object-contain"
                                        />
                                      )}
                                      {shopPrice.shop?.website_url ? (
                                        <a 
                                          href={shopPrice.shop.website_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="font-semibold text-primary hover:underline flex items-center gap-1"
                                        >
                                          {shopPrice.shop?.name}
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : (
                                        <span className="font-semibold">{shopPrice.shop?.name}</span>
                                      )}
                                    </div>
                                    {shopPrice.shop?.website_url && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <span className="truncate">{shopPrice.shop.website_url}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>{t('updated')} {formatDistanceToNow(new Date(shopPrice.discovered_at), { addSuffix: true, locale: dateLocale })}</span>
                                    </div>
                                    <div className="pt-1 border-t text-xs">
                                      <span className="font-medium">{t('price')}: </span>
                                      <span className={isCheapest ? 'text-green-600 font-semibold' : ''}>
                                        {formatPriceDisplay(shopPrice.current_price, priceCurrency)}
                                      </span>
                                      {isCheapest && <span className="ml-1 text-green-600">({t('best')})</span>}
                                      {!isCheapest && drop.allPrices && drop.allPrices[0] && (
                                        <span className="ml-1 text-destructive">
                                          (+{formatPriceDisplay(shopPrice.current_price - drop.allPrices[0].current_price, priceCurrency)} vs {drop.allPrices[0].shop?.name})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </TooltipProvider>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(drop.detected_at), { addSuffix: true, locale: dateLocale })}
                    </div>
                    {status.hasAccess && drop.product && (
                      <Link to={`/products/${drop.product.id}`}>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                          {t('view')} <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA for non-premium users */}
        {!isPremium && user && (
          <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <Crown className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-semibold text-lg">{t('getEarlyAccessDeals')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('premiumSeeFirst')}
                </p>
              </div>
              <Link to="/premium">
                <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
                  <Zap className="h-4 w-4" />
                  {t('upgradeToPremium')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
