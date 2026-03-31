import { supabase } from "@/integrations/supabase/client";

interface AffiliateClickParams {
  productId?: string;
  shopId?: string;
  priceId?: string;
  userId?: string;
  productUrl: string;
}

/**
 * Builds a UTM-tagged URL for tracking.
 */
export const buildAffiliateUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('utm_source', 'smartpriceseeker');
    parsed.searchParams.set('utm_medium', 'referral');
    parsed.searchParams.set('utm_campaign', 'price_comparison');
    return parsed.toString();
  } catch {
    return url;
  }
};

/**
 * Tracks an affiliate click and opens the URL in a new tab.
 */
export const trackAffiliateClick = async (
  params: AffiliateClickParams
): Promise<void> => {
  const targetUrl = buildAffiliateUrl(params.productUrl);

  // Open link immediately (don't wait for tracking)
  window.open(targetUrl, '_blank', 'noopener,noreferrer');

  // Track in background
  try {
    await supabase.from('affiliate_clicks').insert({
      product_id: params.productId || null,
      shop_id: params.shopId || null,
      price_id: params.priceId || null,
      user_id: params.userId || null,
      product_url: params.productUrl,
      referrer: 'direct',
    });
  } catch (error) {
    console.error('Failed to track affiliate click:', error);
  }
};
