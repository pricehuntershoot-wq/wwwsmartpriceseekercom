import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductCheckoutParams {
  productName: string;
  productImage?: string | null;
  price: number;
  currency: string;
  shopName: string;
  productUrl: string;
  productId?: string;
  shopId?: string;
  priceId?: string;
}

export const createProductCheckout = async (params: ProductCheckoutParams): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-product-checkout', {
      body: params,
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    toast.error('Nepodařilo se vytvořit platbu. Zkuste to znovu.');
  }
};
