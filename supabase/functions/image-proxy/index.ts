const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return new Response('Missing url parameter', { status: 400, headers: corsHeaders });
    }

    // Validate it's an HTTP(S) URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response('Invalid URL', { status: 400, headers: corsHeaders });
    }

    // Fetch the image with browser-like headers to bypass hotlink protection
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'cs,en;q=0.9',
        'Referer': parsedUrl.origin + '/',
      },
    });

    if (!response.ok) {
      return new Response('Image fetch failed', { status: response.status, headers: corsHeaders });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Only proxy image content types
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 400, headers: corsHeaders });
    }

    const imageData = await response.arrayBuffer();

    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new Response('Proxy error', { status: 500, headers: corsHeaders });
  }
});
