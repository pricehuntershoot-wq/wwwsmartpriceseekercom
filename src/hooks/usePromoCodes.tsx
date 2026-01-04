import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PromoCode {
  id: string;
  shop_id: string | null;
  code: string | null;
  description: string | null;
  discount_value: string | null;
  discount_percentage: number | null;
  min_order_value: number | null;
  expiry_date: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
}

export function usePromoCodes() {
  return useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discovered_promo_codes")
        .select("*")
        .eq("is_active", true)
        .order("discount_percentage", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as PromoCode[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function getPromoCodeForShop(
  promoCodes: PromoCode[] | undefined,
  shopId: string
): PromoCode | null {
  if (!promoCodes) return null;
  return promoCodes.find((code) => code.shop_id === shopId) || null;
}

export function calculatePriceWithPromo(
  price: number,
  promoCode: PromoCode | null
): { finalPrice: number; discount: number; promoApplied: boolean } {
  if (!promoCode) {
    return { finalPrice: price, discount: 0, promoApplied: false };
  }

  let discount = 0;

  if (promoCode.discount_percentage && promoCode.discount_percentage > 0) {
    discount = price * (promoCode.discount_percentage / 100);
  } else if (promoCode.discount_value) {
    // Parse discount value (e.g., "10€" or "100 CZK")
    const numericValue = parseFloat(promoCode.discount_value.replace(/[^0-9.-]/g, ""));
    if (!isNaN(numericValue)) {
      discount = numericValue;
    }
  }

  const finalPrice = Math.max(0, price - discount);

  return {
    finalPrice,
    discount,
    promoApplied: discount > 0,
  };
}
