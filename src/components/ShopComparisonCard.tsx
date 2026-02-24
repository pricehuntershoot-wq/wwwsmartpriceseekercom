import { ExternalLink, Target } from "lucide-react";
import { Button } from "./ui/button";

interface ShopPrice {
  shop: string;
  price: number;
  url: string;
}

interface ShopComparisonCardProps {
  product: {
    name: string;
    image: string;
    shops: ShopPrice[];
  };
}

const SHOP_META: Record<string, { logo: string; color: string }> = {
  "Alza.cz": {
    logo: "https://cdn.alza.cz/Foto/favicon/android-chrome-192x192.png",
    color: "bg-green-600",
  },
  "Smarty.cz": {
    logo: "https://www.smarty.cz/favicon.ico",
    color: "bg-blue-600",
  },
  "Datart.cz": {
    logo: "https://www.datart.cz/favicon.ico",
    color: "bg-red-600",
  },
};

export const ShopComparisonCard = ({ product }: ShopComparisonCardProps) => {
  const lowestPrice = Math.min(...product.shops.map((s) => s.price));

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-gradient-card transition-all duration-300 hover:border-primary/50 hover:shadow-glow">
      {/* Product image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary/50 p-6">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Product name */}
      <div className="px-5 pt-5 pb-2">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">
          {product.name}
        </h3>
      </div>

      {/* Shop prices side by side */}
      <div className="grid grid-cols-3 gap-2 px-5 pb-5">
        {product.shops.map((shopPrice) => {
          const meta = SHOP_META[shopPrice.shop];
          const isLowest = shopPrice.price === lowestPrice;

          return (
            <a
              key={shopPrice.shop}
              href={shopPrice.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`relative flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-200 hover:scale-[1.03] ${
                isLowest
                  ? "bg-[hsl(54,100%,50%)]/15 ring-2 ring-[hsl(54,100%,50%)] shadow-[0_0_20px_-4px_hsl(54,100%,50%/0.4)]"
                  : "bg-secondary/50 hover:bg-secondary/80"
              }`}
            >
              {/* Hunter badge */}
              {isLowest && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-[hsl(54,100%,50%)] px-2 py-0.5 text-[10px] font-bold text-black whitespace-nowrap shadow-md">
                  <Target className="h-3 w-3" />
                  Hunterův úlovek
                </div>
              )}

              {/* Shop logo */}
              <div className="mt-2 flex flex-col items-center gap-1">
                {meta?.logo ? (
                  <img
                    src={meta.logo}
                    alt={shopPrice.shop}
                    className="h-6 w-6 rounded"
                  />
                ) : (
                  <div className={`h-6 w-6 rounded ${meta?.color || "bg-muted"}`} />
                )}
                <span className="text-[11px] text-muted-foreground">
                  {shopPrice.shop}
                </span>
              </div>

              {/* Price */}
              <span
                className={`text-lg font-bold ${
                  isLowest
                    ? "text-[hsl(54,100%,50%)]"
                    : "text-foreground"
                }`}
              >
                {shopPrice.price.toLocaleString("cs-CZ")} Kč
              </span>

              {/* View link */}
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                Zobrazit
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};
