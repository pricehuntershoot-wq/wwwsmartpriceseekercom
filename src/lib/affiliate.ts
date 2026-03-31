import { supabase } from "@/integrations/supabase/client";

interface AffiliateClickParams {
  productId?: string;
  shopId?: string;
  priceId?: string;
  userId?: string;
  productUrl: string;
}

/**
 * Builds an eHub affiliate tracking URL if the shop has an eHub program ID.
 * Falls back to UTM-tagged direct URL otherwise.
 */
export const buildAffiliateUrl = (url: string, ehubProgramId?: string | null): string => {
  try {
    if (ehubProgramId) {
      // eHub tracking URL format
      const encodedUrl = encodeURIComponent(url);
      return `https://www.ehub.cz/goto/${ehubProgramId}/?url=${encodedUrl}`;
    }
    
    // Fallback: direct URL with UTM parameters
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
  params: AffiliateClickParams & { ehubProgramId?: string | null }
): Promise<void> => {
  const affiliateUrl = buildAffiliateUrl(params.productUrl, params.ehubProgramId);

  // Open link immediately (don't wait for tracking)
  window.open(affiliateUrl, '_blank', 'noopener,noreferrer');

  // Track in background
  try {
    await supabase.from('affiliate_clicks').insert({
      product_id: params.productId || null,
      shop_id: params.shopId || null,
      price_id: params.priceId || null,
      user_id: params.userId || null,
      product_url: params.productUrl,
    });
  } catch (error) {
    console.error('Failed to track affiliate click:', error);
  }
};
