import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  className?: string;
  size?: "sm" | "default";
}

export const PremiumBadge = ({ className, size = "default" }: PremiumBadgeProps) => {
  return (
    <Badge 
      className={cn(
        "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md",
        size === "sm" && "text-xs px-1.5 py-0",
        className
      )}
    >
      <Crown className={cn("mr-1", size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      Premium
    </Badge>
  );
};
