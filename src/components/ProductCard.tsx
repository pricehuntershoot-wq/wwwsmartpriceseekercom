import { Link } from "react-router-dom";
import { Heart, ExternalLink, ShoppingCart, Package, Sparkles, Flame, Clock, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { formatPrice, Currency } from "@/lib/currency";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { usePromoCodes, getPromoCodeForShop, calculatePriceWithPromo, PromoCode } from "@/hooks/usePromoCodes";
import { cn } from "@/lib/utils";

interface Price {
  id: string;
  current_price: number;
  original_price: number | null;
  discount_type: string | null;
  discount_label: string | null;
  product_url: string | null;
  discovered_at: string;
  currency?: string;
  shop: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

interface PriceWithPromo extends Price {
  promoCode?: PromoCode | null;
  finalPrice: number;
  promoDiscount: number;
  promoApplied: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  prices: Price[];
}

interface ProductCardProps {
  product: Product;
  onFavorite?: (productId: string) => void;
  isFavorited?: boolean;
}

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

export const ProductCard = ({ product, onFavorite, isFavorited = false }: ProductCardProps) => {
  const { preferredCurrency } = useCurrencyPreference();
  const { data: promoCodes } = usePromoCodes();
  const prices = product.prices || [];
  
  // Apply promo codes to prices
  const pricesWithPromo: PriceWithPromo[] = prices.map((price) => {
    const promoCode = getPromoCodeForShop(promoCodes, price.shop.id);
    const { finalPrice, discount, promoApplied } = calculatePriceWithPromo(price.current_price, promoCode);
    return {
      ...price,
      promoCode,
      finalPrice,
      promoDiscount: discount,
      promoApplied,
    };
  });
  
  // Group prices by currency
  const eurPrices = pricesWithPromo.filter(p => (p.currency || 'EUR') === 'EUR');
  const czkPrices = pricesWithPromo.filter(p => p.currency === 'CZK');
  
  // Find best price for each currency (using final price after promo)
  const bestEurPrice = eurPrices.length > 0 
    ? eurPrices.reduce((min, p) => p.finalPrice < min.finalPrice ? p : min, eurPrices[0])
    : null;
  const bestCzkPrice = czkPrices.length > 0 
    ? czkPrices.reduce((min, p) => p.finalPrice < min.finalPrice ? p : min, czkPrices[0])
    : null;
  
  // Use EUR as primary, fallback to CZK
  const bestPrice = bestEurPrice || bestCzkPrice;
  const currency = (bestPrice?.currency as Currency) || 'EUR';
  
  const priceRange = pricesWithPromo.length > 1 
    ? { min: Math.min(...pricesWithPromo.map(p => p.finalPrice)), max: Math.max(...pricesWithPromo.map(p => p.finalPrice)) }
    : null;

  // Calculate total savings including promo discount
  const baseSavings = bestPrice?.original_price 
    ? bestPrice.original_price - bestPrice.current_price 
    : 0;
  const totalSavings = baseSavings + (bestPrice?.promoDiscount || 0);

  return (
    <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Favorite button */}
          {onFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavorite(product.id);
              }}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          )}

          {/* Category badge */}
          {product.category && (
            <Badge variant="secondary" className="absolute left-2 top-2 bg-background/80 backdrop-blur-sm">
              {product.category}
            </Badge>
          )}

          {/* Savings badge */}
          {totalSavings > 0 && (
            <Badge className="absolute bottom-2 left-2 bg-green-500 text-white">
              Save {formatPrice(totalSavings, currency)}
              {bestPrice?.promoApplied && " 🎟️"}
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="mb-1 line-clamp-2 font-semibold leading-tight hover:text-primary">{product.name}</h3>
        </Link>
        
        {product.description && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}

        {/* Dual currency prices */}
        {(bestEurPrice || bestCzkPrice) && (
          <div className="mb-3">
            <div className="flex items-center gap-3">
              {bestEurPrice && (
                <div className={cn(
                  "flex flex-col rounded-md px-2 py-1 -mx-2 transition-colors",
                  preferredCurrency === 'EUR' && "bg-primary/10 ring-1 ring-primary/30"
                )}>
                  <span className={cn(
                    "text-xs",
                    preferredCurrency === 'EUR' ? "text-primary font-medium" : "text-muted-foreground"
                  )}>EUR {preferredCurrency === 'EUR' && "★"}</span>
                  <div className="flex items-baseline gap-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "font-bold",
                            preferredCurrency === 'EUR' ? "text-2xl text-primary" : "text-lg text-foreground",
                            bestEurPrice.promoApplied && "text-green-500"
                          )}>
                            {formatPrice(bestEurPrice.finalPrice, 'EUR')}
                            {bestEurPrice.promoApplied && <Tag className="inline h-3 w-3 ml-1" />}
                          </span>
                        </TooltipTrigger>
                        {bestEurPrice.promoApplied && bestEurPrice.promoCode && (
                          <TooltipContent>
                            <p className="font-medium">Price after code: {bestEurPrice.promoCode.code}</p>
                            <p className="text-xs text-muted-foreground">
                              Original: {formatPrice(bestEurPrice.current_price, 'EUR')}
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    {(bestEurPrice.original_price || bestEurPrice.promoApplied) && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(bestEurPrice.original_price || bestEurPrice.current_price, 'EUR')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {bestEurPrice && bestCzkPrice && (
                <div className="h-10 w-px bg-border" />
              )}
              {bestCzkPrice && (
                <div className={cn(
                  "flex flex-col rounded-md px-2 py-1 -mx-2 transition-colors",
                  preferredCurrency === 'CZK' && "bg-primary/10 ring-1 ring-primary/30"
                )}>
                  <span className={cn(
                    "text-xs",
                    preferredCurrency === 'CZK' ? "text-primary font-medium" : "text-muted-foreground"
                  )}>CZK {preferredCurrency === 'CZK' && "★"}</span>
                  <div className="flex items-baseline gap-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "font-bold",
                            preferredCurrency === 'CZK' ? "text-2xl text-primary" : "text-lg text-foreground",
                            bestCzkPrice.promoApplied && "text-green-500"
                          )}>
                            {formatPrice(bestCzkPrice.finalPrice, 'CZK')}
                            {bestCzkPrice.promoApplied && <Tag className="inline h-3 w-3 ml-1" />}
                          </span>
                        </TooltipTrigger>
                        {bestCzkPrice.promoApplied && bestCzkPrice.promoCode && (
                          <TooltipContent>
                            <p className="font-medium">Price after code: {bestCzkPrice.promoCode.code}</p>
                            <p className="text-xs text-muted-foreground">
                              Original: {formatPrice(bestCzkPrice.current_price, 'CZK')}
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    {(bestCzkPrice.original_price || bestCzkPrice.promoApplied) && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(bestCzkPrice.original_price || bestCzkPrice.current_price, 'CZK')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {prices.length} offer{prices.length !== 1 ? 's' : ''} across {new Set(prices.map(p => p.shop.id)).size} shop{new Set(prices.map(p => p.shop.id)).size !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Best deal info */}
        {bestPrice && (
          <div className="mb-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Best at</span>
              <span className="font-medium">{bestPrice.shop.name}</span>
              {bestPrice.discount_type && (
                <Badge variant="outline" className={`text-xs ${getDiscountColor(bestPrice.discount_type)}`}>
                  {getDiscountIcon(bestPrice.discount_type)}
                  <span className="ml-1">{bestPrice.discount_type.replace('_', ' ')}</span>
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated {formatDistanceToNow(new Date(bestPrice.discovered_at), { addSuffix: true })}</span>
            </div>
          </div>
        )}

        {/* Discount labels from all shops */}
        {prices.filter(p => p.discount_label).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {prices.filter(p => p.discount_label).slice(0, 2).map((price) => (
              <Badge 
                key={price.id} 
                variant="outline" 
                className={`text-xs ${getDiscountColor(price.discount_type)}`}
              >
                {price.discount_label}
              </Badge>
            ))}
            {prices.filter(p => p.discount_label).length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{prices.filter(p => p.discount_label).length - 2} more
              </Badge>
            )}
          </div>
        )}

        {/* Action button */}
        {bestPrice?.product_url && (
          <Button className="mt-4 w-full" variant="default" asChild>
            <a href={bestPrice.product_url} target="_blank" rel="noopener noreferrer">
              View Deal
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
