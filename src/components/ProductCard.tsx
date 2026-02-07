import { Link } from "react-router-dom";
import { Heart, ExternalLink, Package, Clock, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
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

const getDiscountColor = (type: string | null) => {
  switch (type) {
    case 'in_cart': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'open_box': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'promo': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'clearance': return 'bg-red-500/10 text-red-400 border-red-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const ProductCard = ({ product, onFavorite, isFavorited = false }: ProductCardProps) => {
  const { preferredCurrency } = useCurrencyPreference();
  const { data: promoCodes } = usePromoCodes();
  const prices = product.prices || [];
  
  const pricesWithPromo: PriceWithPromo[] = prices.map((price) => {
    const promoCode = getPromoCodeForShop(promoCodes, price.shop.id);
    const { finalPrice, discount, promoApplied } = calculatePriceWithPromo(price.current_price, promoCode);
    return { ...price, promoCode, finalPrice, promoDiscount: discount, promoApplied };
  });
  
  const eurPrices = pricesWithPromo.filter(p => (p.currency || 'EUR') === 'EUR');
  const czkPrices = pricesWithPromo.filter(p => p.currency === 'CZK');
  
  const bestEurPrice = eurPrices.length > 0 
    ? eurPrices.reduce((min, p) => p.finalPrice < min.finalPrice ? p : min, eurPrices[0])
    : null;
  const bestCzkPrice = czkPrices.length > 0 
    ? czkPrices.reduce((min, p) => p.finalPrice < min.finalPrice ? p : min, czkPrices[0])
    : null;
  
  const bestPrice = bestEurPrice || bestCzkPrice;
  const currency = (bestPrice?.currency as Currency) || 'EUR';
  
  const baseSavings = bestPrice?.original_price ? bestPrice.original_price - bestPrice.current_price : 0;
  const totalSavings = baseSavings + (bestPrice?.promoDiscount || 0);

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card/50 transition-all duration-300 hover:border-primary/20 hover:shadow-card">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {onFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full glass glass-border"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavorite(product.id);
              }}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
            </Button>
          )}

          {product.category && (
            <Badge variant="secondary" className="absolute left-2 top-2 glass glass-border text-xs">
              {product.category}
            </Badge>
          )}

          {totalSavings > 0 && (
            <Badge className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs">
              Save {formatPrice(totalSavings, currency)}
              {bestPrice?.promoApplied && " 🎟️"}
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="mb-1 line-clamp-2 font-heading text-sm font-semibold leading-tight hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        
        {product.description && (
          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        )}

        {/* Prices */}
        {(bestEurPrice || bestCzkPrice) && (
          <div className="mb-3">
            <div className="flex items-center gap-3">
              {bestEurPrice && (
                <PriceDisplay 
                  price={bestEurPrice} 
                  currencyCode="EUR" 
                  isPreferred={preferredCurrency === 'EUR'} 
                />
              )}
              {bestEurPrice && bestCzkPrice && <div className="h-8 w-px bg-border" />}
              {bestCzkPrice && (
                <PriceDisplay 
                  price={bestCzkPrice} 
                  currencyCode="CZK" 
                  isPreferred={preferredCurrency === 'CZK'} 
                />
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {prices.length} offer{prices.length !== 1 ? 's' : ''} · {new Set(prices.map(p => p.shop.id)).size} shop{new Set(prices.map(p => p.shop.id)).size !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Best deal */}
        {bestPrice && (
          <div className="mb-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Best at</span>
              <span className="text-xs font-medium">{bestPrice.shop.name}</span>
              {bestPrice.discount_type && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getDiscountColor(bestPrice.discount_type)}`}>
                  {bestPrice.discount_type.replace('_', ' ')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated {formatDistanceToNow(new Date(bestPrice.discovered_at), { addSuffix: true })}</span>
            </div>
          </div>
        )}

        {/* Discount labels */}
        {prices.filter(p => p.discount_label).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prices.filter(p => p.discount_label).slice(0, 2).map((price) => (
              <Badge key={price.id} variant="outline" className={`text-[10px] px-1.5 py-0 ${getDiscountColor(price.discount_type)}`}>
                {price.discount_label}
              </Badge>
            ))}
            {prices.filter(p => p.discount_label).length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{prices.filter(p => p.discount_label).length - 2}
              </Badge>
            )}
          </div>
        )}

        {bestPrice?.product_url && (
          <Button className="mt-3 w-full" size="sm" asChild>
            <a href={bestPrice.product_url} target="_blank" rel="noopener noreferrer">
              View Deal
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

// Sub-component for price display
const PriceDisplay = ({ price, currencyCode, isPreferred }: { 
  price: PriceWithPromo; 
  currencyCode: 'EUR' | 'CZK'; 
  isPreferred: boolean;
}) => (
  <div className={cn(
    "flex flex-col rounded-md px-2 py-1 -mx-1 transition-colors",
    isPreferred && "bg-primary/5 ring-1 ring-primary/20"
  )}>
    <span className={cn(
      "text-[10px] uppercase tracking-wider",
      isPreferred ? "text-primary font-medium" : "text-muted-foreground"
    )}>{currencyCode} {isPreferred && "★"}</span>
    <div className="flex items-baseline gap-1.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
              "font-heading font-bold",
              isPreferred ? "text-xl text-primary" : "text-base text-foreground",
              price.promoApplied && "text-primary"
            )}>
              {formatPrice(price.finalPrice, currencyCode)}
              {price.promoApplied && <Tag className="inline h-3 w-3 ml-0.5" />}
            </span>
          </TooltipTrigger>
          {price.promoApplied && price.promoCode && (
            <TooltipContent>
              <p className="text-xs font-medium">Price after code: {price.promoCode.code}</p>
              <p className="text-xs text-muted-foreground">Original: {formatPrice(price.current_price, currencyCode)}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      {(price.original_price || price.promoApplied) && (
        <span className="text-[11px] text-muted-foreground line-through">
          {formatPrice(price.original_price || price.current_price, currencyCode)}
        </span>
      )}
    </div>
  </div>
);
