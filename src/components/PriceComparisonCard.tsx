import { ExternalLink, ShoppingCart, Sparkles, Tag, TrendingDown } from "lucide-react";
import { Button } from "./ui/button";

interface PriceComparisonCardProps {
  product: {
    name: string;
    image: string;
    originalPrice: number;
    discountedPrice: number;
    shop: string;
    shopLogo: string;
    discountType: "cart" | "returned" | "flash" | "hidden";
    savings: number;
  };
}

const discountLabels = {
  cart: { label: "Cart Discount", icon: ShoppingCart, color: "bg-primary/20 text-primary" },
  returned: { label: "Returned Item", icon: Tag, color: "bg-accent/20 text-accent" },
  flash: { label: "Flash Sale", icon: Sparkles, color: "bg-destructive/20 text-destructive" },
  hidden: { label: "Hidden Deal", icon: TrendingDown, color: "bg-primary/20 text-primary" },
};

export const PriceComparisonCard = ({ product }: PriceComparisonCardProps) => {
  const discount = discountLabels[product.discountType];
  const DiscountIcon = discount.icon;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card transition-all duration-300 hover:border-primary/50 hover:shadow-glow">
      {/* Discount badge */}
      <div className={`absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${discount.color}`}>
        <DiscountIcon className="h-3.5 w-3.5" />
        {discount.label}
      </div>

      {/* Savings badge */}
      <div className="absolute right-4 top-4 z-10 rounded-full bg-gradient-accent px-3 py-1.5 text-xs font-bold text-accent-foreground shadow-accent">
        Save {product.savings}%
      </div>

      {/* Product image */}
      <div className="relative aspect-square overflow-hidden bg-secondary/50 p-8">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Shop info */}
        <div className="mb-3 flex items-center gap-2">
          <img src={product.shopLogo} alt={product.shop} className="h-5 w-5 rounded" />
          <span className="text-sm text-muted-foreground">{product.shop}</span>
        </div>

        {/* Product name */}
        <h3 className="mb-4 line-clamp-2 text-lg font-semibold leading-snug">
          {product.name}
        </h3>

        {/* Prices */}
        <div className="mb-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-gradient-accent">
            €{product.discountedPrice.toFixed(2)}
          </span>
          <span className="text-lg text-muted-foreground line-through">
            €{product.originalPrice.toFixed(2)}
          </span>
        </div>

        {/* AI insight */}
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">AI found: </span>
            {product.discountType === "cart" && "Price drops after adding to cart"}
            {product.discountType === "returned" && "14-day return, like-new condition"}
            {product.discountType === "flash" && "Limited time offer, ends soon"}
            {product.discountType === "hidden" && "Unlisted promotion discovered"}
          </p>
        </div>

        {/* Action button */}
        <Button variant="hero" className="w-full">
          View Deal
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
