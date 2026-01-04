import { ExternalLink, Package, RotateCcw, ShoppingCart, Sparkles, Tag, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface PriceComparisonCardProps {
  product: {
    name: string;
    image: string;
    originalPrice: number;
    discountedPrice: number;
    shop: string;
    shopLogo: string;
    discountType: "cart" | "returned" | "used" | "new" | "openBox" | "refurbished";
    savings: number;
  };
}

export const PriceComparisonCard = ({ product }: PriceComparisonCardProps) => {
  const { t } = useLanguage();

  const discountLabels = {
    cart: { label: t('cartDiscount'), icon: ShoppingCart, color: "bg-primary/20 text-primary" },
    returned: { label: t('returnedItem'), icon: RotateCcw, color: "bg-amber-500/20 text-amber-600 dark:text-amber-400" },
    used: { label: t('usedItem'), icon: Package, color: "bg-orange-500/20 text-orange-600 dark:text-orange-400" },
    new: { label: t('newItem'), icon: CheckCircle, color: "bg-green-500/20 text-green-600 dark:text-green-400" },
    openBox: { label: t('openBox'), icon: Tag, color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
    refurbished: { label: t('refurbished'), icon: Sparkles, color: "bg-purple-500/20 text-purple-600 dark:text-purple-400" },
  };

  const aiInsights = {
    cart: t('aiInsightCart'),
    returned: t('aiInsightReturned'),
    used: t('aiInsightUsed'),
    new: t('aiInsightNew'),
    openBox: t('aiInsightOpenBox'),
    refurbished: t('aiInsightRefurbished'),
  };

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
      {product.savings > 0 && (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-gradient-accent px-3 py-1.5 text-xs font-bold text-accent-foreground shadow-accent">
          -{product.savings}%
        </div>
      )}

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
            {product.discountedPrice.toLocaleString('cs-CZ')} Kč
          </span>
          {product.originalPrice !== product.discountedPrice && (
            <span className="text-lg text-muted-foreground line-through">
              {product.originalPrice.toLocaleString('cs-CZ')} Kč
            </span>
          )}
        </div>

        {/* AI insight */}
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">AI: </span>
            {aiInsights[product.discountType]}
          </p>
        </div>

        {/* Action button */}
        <Button variant="hero" className="w-full">
          {t('viewDeal')}
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
