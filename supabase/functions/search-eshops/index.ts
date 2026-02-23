import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_HOURS = 24;

const ESHOP_SEARCH_URLS = {
  alza: (q: string) => `https://www.alza.cz/search.htm?exps=${encodeURIComponent(q)}`,
  datart: (q: string) => `https://www.datart.cz/vyhledavani?q=${encodeURIComponent(q)}`,
  smarty: (q: string) => `https://www.smarty.cz/hledej?q=${encodeURIComponent(q)}`,
};

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

async function getCachedResults(supabase: any, query: string) {
  const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
  
  // Search for products matching the query that have recent prices
  const { data: products, error } = await supabase
    .from('prices')
    .select(`
      id,
      current_price,
      original_price,
      product_url,
      discount_type,
      discount_label,
      discovered_at,
      products (id, name, image_url, category),
      shops (id, name)
    `)
    .gte('discovered_at', cutoff)
    .eq('is_active', true);

  if (error || !products || products.length === 0) return null;

  // Filter by query match (case-insensitive)
  const q = query.toLowerCase();
  const matched = products.filter((p: any) => 
    p.products?.name?.toLowerCase().includes(q)
  );

  if (matched.length === 0) return null;

  console.log(`Found ${matched.length} cached results for "${query}"`);

  return matched.map((p: any) => ({
    name: p.products?.name || '',
    price: p.current_price,
    originalPrice: p.original_price,
    eshop: p.shops?.name?.toLowerCase().replace('.cz', '').replace('.', '') || 'unknown',
    productUrl: p.product_url,
    imageUrl: p.products?.image_url,
    category: p.products?.category,
    promoCode: p.discount_label,
    condition: p.discount_type || 'new',
    fromCache: true,
    cachedAt: p.discovered_at,
  }));
}

async function saveResultsToDB(supabase: any, products: any[]) {
  const shopCache: Record<string, string> = {};

  for (const product of products) {
    try {
      // 1. Upsert shop
      const shopName = product.eshop === 'alza' ? 'Alza.cz' : 
                        product.eshop === 'datart' ? 'Datart.cz' :
                        product.eshop === 'smarty' ? 'Smarty.cz' : product.eshop;
      
      let shopId = shopCache[shopName];
      if (!shopId) {
        const { data: existingShop } = await supabase
          .from('shops')
          .select('id')
          .eq('name', shopName)
          .maybeSingle();

        if (existingShop) {
          shopId = existingShop.id;
        } else {
          const { data: newShop } = await supabase
            .from('shops')
            .insert({ name: shopName, website_url: `https://www.${shopName.toLowerCase()}` })
            .select('id')
            .single();
          shopId = newShop?.id;
        }
        if (shopId) shopCache[shopName] = shopId;
      }
      if (!shopId) continue;

      // 2. Upsert product
      let productId: string;
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('name', product.name)
        .maybeSingle();

      if (existingProduct) {
        productId = existingProduct.id;
      } else {
        const { data: newProduct } = await supabase
          .from('products')
          .insert({
            name: product.name,
            image_url: product.imageUrl || null,
            category: product.category || null,
          })
          .select('id')
          .single();
        if (!newProduct) continue;
        productId = newProduct.id;
      }

      // 3. Upsert price
      const { data: existingPrice } = await supabase
        .from('prices')
        .select('id')
        .eq('product_id', productId)
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .maybeSingle();

      if (existingPrice) {
        await supabase
          .from('prices')
          .update({
            current_price: product.price,
            original_price: product.originalPrice || null,
            product_url: product.productUrl || null,
            discount_type: product.condition || 'new',
            discount_label: product.promoCode || null,
            discovered_at: new Date().toISOString(),
          })
          .eq('id', existingPrice.id);
      } else {
        await supabase
          .from('prices')
          .insert({
            product_id: productId,
            shop_id: shopId,
            current_price: product.price,
            original_price: product.originalPrice || null,
            product_url: product.productUrl || null,
            discount_type: product.condition || 'new',
            discount_label: product.promoCode || null,
            currency: 'CZK',
          });
      }

      // 4. Record price history
      await supabase
        .from('price_history')
        .insert({
          product_id: productId,
          shop_id: shopId,
          price: product.price,
          currency: 'CZK',
        });

    } catch (err) {
      console.error(`Failed to save product "${product.name}":`, err);
    }
  }
}

async function scrapeEshop(eshopName: string, url: string, apiKey: string, maxRetries = 2): Promise<{ eshop: string; markdown: string | null; error?: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Scraping ${eshopName} (attempt ${attempt}): ${url}`);
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 5000,
          location: { country: 'CZ', languages: ['cs'] },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errMsg = data.error || 'Scrape failed';
        const isRetryable = typeof errMsg === 'string' && (errMsg.includes('ERR_TUNNEL') || errMsg.includes('TUNNEL') || errMsg.includes('proxy') || response.status >= 500);
        if (isRetryable && attempt < maxRetries) {
          console.warn(`${eshopName} retryable error (attempt ${attempt}): ${errMsg}`);
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }
        console.error(`${eshopName} scrape failed:`, data);
        return { eshop: eshopName, markdown: null, error: errMsg };
      }

      const markdown = data.data?.markdown || data.markdown || null;
      console.log(`${eshopName} scraped, markdown length: ${markdown?.length || 0}`);
      return { eshop: eshopName, markdown };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isRetryable = errMsg.includes('ERR_TUNNEL') || errMsg.includes('TUNNEL') || errMsg.includes('proxy') || errMsg.includes('fetch failed');
      if (isRetryable && attempt < maxRetries) {
        console.warn(`${eshopName} fetch error (attempt ${attempt}): ${errMsg}`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      console.error(`${eshopName} error:`, err);
      return { eshop: eshopName, markdown: null, error: errMsg };
    }
  }
  return { eshop: eshopName, markdown: null, error: 'Max retries exceeded' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search query is required (min 2 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedQuery = query.trim();
    console.log(`Searching for "${trimmedQuery}" across e-shops...`);

    // Step 1: Check database cache first
    const supabase = getSupabaseAdmin();
    const cachedResults = await getCachedResults(supabase, trimmedQuery);

    if (cachedResults && cachedResults.length > 0) {
      console.log(`Returning ${cachedResults.length} cached results for "${trimmedQuery}"`);
      return new Response(
        JSON.stringify({ success: true, products: cachedResults, errors: [], fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: No cache — scrape live
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape all 3 e-shops in parallel
    const scrapeResults = await Promise.all(
      Object.entries(ESHOP_SEARCH_URLS).map(([name, urlFn]) =>
        scrapeEshop(name, urlFn(trimmedQuery), FIRECRAWL_API_KEY)
      )
    );

    // Build combined content for AI analysis
    const combinedContent = scrapeResults
      .filter(r => r.markdown)
      .map(r => `=== ${r.eshop.toUpperCase()} ===\n${r.markdown!.substring(0, 15000)}`)
      .join('\n\n');

    if (!combinedContent) {
      return new Response(
        JSON.stringify({ success: true, products: [], errors: scrapeResults.filter(r => r.error).map(r => `${r.eshop}: ${r.error}`) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to extract structured product data
    const systemPrompt = `You are an expert at extracting product listings from Czech e-shop search results.

Given search results from multiple Czech e-shops (Alza.cz, Datart.cz, Smarty.cz), extract ALL products found.

For each product, extract:
- name: full product name
- price: the lowest/main price in CZK (as a number, no currency symbol)
- originalPrice: the original/crossed-out price if shown (number or null)
- eshop: which e-shop it's from ("alza", "datart", "smarty")
- productUrl: the product URL if you can find it (or null)
- imageUrl: the product image URL if found (or null)  
- category: detected category (mobily, sluchátka, tv, reproduktory, chytré hodinky, chytré prsteny, tablety, herní konzole, pc, příslušenství, jiné)
- promoCode: any visible promo/discount code (or null)
- condition: "new", "used", "open_box", or "refurbished"

Parse Czech price format: "11 590,-" → 11590, "9 272 Kč" → 9272.

Return a JSON array of products. Maximum 10 products per e-shop, sorted by relevance.

IMPORTANT: Return ONLY valid JSON array, no markdown code fences.`;

    const models = [
      { name: 'google/gemini-2.5-flash-lite', temperature: 0.1 },
      { name: 'google/gemini-2.5-flash', temperature: 0.1 },
      { name: 'openai/gpt-5-mini', temperature: 1 },
    ];
    let aiResponse = null;
    
    for (const { name: model, temperature } of models) {
      let success = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Search query: "${trimmedQuery}"\n\nSearch results:\n${combinedContent}` },
              ],
              temperature,
            }),
          });

          if (response.ok) {
            aiResponse = await response.json();
            success = true;
            console.log(`AI succeeded with model: ${model}`);
            break;
          }

          const errorText = await response.text();
          console.error(`AI ${model} attempt ${attempt + 1} failed:`, response.status, errorText);
          if (attempt < 1) await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
          console.error(`AI ${model} fetch error:`, err);
        }
      }
      if (success) break;
    }

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed after retries' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const content = aiResponse.choices?.[0]?.message?.content;

    let products = [];
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      products = JSON.parse(jsonStr);
      if (!Array.isArray(products)) products = [];
    } catch {
      console.error('Failed to parse AI response:', content?.substring(0, 500));
      products = [];
    }

    console.log(`Found ${products.length} products across e-shops`);

    // Step 3: Save results to database (non-blocking)
    if (products.length > 0) {
      // We await this to ensure data is saved, but it's fast with service role
      await saveResultsToDB(supabase, products);
      console.log(`Saved ${products.length} products to database`);
    }

    const errors = scrapeResults.filter(r => r.error).map(r => `${r.eshop}: ${r.error}`);

    return new Response(
      JSON.stringify({ success: true, products, errors, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
