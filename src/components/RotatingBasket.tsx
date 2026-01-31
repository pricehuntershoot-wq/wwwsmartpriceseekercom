import { ShoppingBasket } from "lucide-react";

export const RotatingBasket = () => {
  return (
    <div className="rotating-basket-container">
      <div className="rotating-basket">
        <ShoppingBasket className="h-16 w-16 text-muted-foreground/50" />
      </div>
    </div>
  );
};
