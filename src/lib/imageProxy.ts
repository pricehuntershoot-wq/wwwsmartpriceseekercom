/**
 * Returns a proxied URL for e-shop product images to bypass CORS/hotlink blocks.
 * Falls back to the original URL if no Supabase URL is configured.
 */
export function getProxiedImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  
  // Don't proxy data URIs or already-proxied URLs
  if (imageUrl.startsWith('data:')) return imageUrl;
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return imageUrl;
  
  // Don't double-proxy
  if (imageUrl.includes('/functions/v1/image-proxy')) return imageUrl;
  
  return `${supabaseUrl}/functions/v1/image-proxy?url=${encodeURIComponent(imageUrl)}`;
}
