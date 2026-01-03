import { Heart, ExternalLink, ShoppingCart, Package, Sparkles, Flame } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface Price {
  id: string;
  current_price: number;
  original_price: number | null;
  discount_type: string | null;
  discount_label: string | null;
  product_url: string | null;
  shop: {
    id: string;
    name: string;
    logo_url: string | null;
  };
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
  const prices = product.prices || [];
  const bestPrice = prices.length > 0 
    ? prices.reduce((min, p) => p.current_price < min.current_price ? p : min, prices[0])
    : null;
  
  const priceRange = prices.length > 1 
    ? { min: Math.min(...prices.map(p => p.current_price)), max: Math.max(...prices.map(p => p.current_price)) }
    : null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(price);
  };

  const savings = bestPrice?.original_price 
    ? bestPrice.original_price - bestPrice.current_price 
    : 0;

  return (
    <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
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
            onClick={() => onFavorite(product.id)}
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
        {savings > 0 && (
          <Badge className="absolute bottom-2 left-2 bg-green-500 text-white">
            Save {formatPrice(savings)}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="mb-1 line-clamp-2 font-semibold leading-tight">{product.name}</h3>
        
        {product.description && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}

        {/* Best price */}
        {bestPrice && (
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">{formatPrice(bestPrice.current_price)}</span>
              {bestPrice.original_price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(bestPrice.original_price)}
                </span>
              )}
            </div>
            {priceRange && priceRange.min !== priceRange.max && (
              <p className="text-xs text-muted-foreground">
                {prices.length} shops • {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
              </p>
            )}
          </div>
        )}

        {/* Best deal info */}
        {bestPrice && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Best at</span>
            <span className="font-medium">{bestPrice.shop.name}</span>
            {bestPrice.discount_type && (
              <Badge variant="outline" className={`text-xs ${getDiscountColor(bestPrice.discount_type)}`}>
                {getDiscountIcon(bestPrice.discount_type)}
                <span className="ml-1">{bestPrice.discount_type.replace('_', ' ')}</span>
              </Badge>
            )}
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
