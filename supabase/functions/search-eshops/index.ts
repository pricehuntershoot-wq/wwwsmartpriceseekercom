import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ESHOP_SEARCH_URLS = {
  alza: (q: string) => `https://www.alza.cz/search.htm?exps=${encodeURIComponent(q)}`,
  datart: (q: string) => `https://www.datart.cz/vyhledavani?q=${encodeURIComponent(q)}`,
  smarty: (q: string) => `https://www.smarty.cz/hledej?q=${encodeURIComponent(q)}`,
};

async function scrapeEshop(eshopName: string, url: string, apiKey: string): Promise<{ eshop: string; markdown: string | null; error?: string }> {
  try {
    console.log(`Scraping ${eshopName}: ${url}`);
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
      console.error(`${eshopName} scrape failed:`, data);
      return { eshop: eshopName, markdown: null, error: data.error || 'Scrape failed' };
    }

    const markdown = data.data?.markdown || data.markdown || null;
    console.log(`${eshopName} scraped, markdown length: ${markdown?.length || 0}`);
    return { eshop: eshopName, markdown };
  } catch (err) {
    console.error(`${eshopName} error:`, err);
    return { eshop: eshopName, markdown: null, error: err.message };
  }
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

    const trimmedQuery = query.trim();
    console.log(`Searching for "${trimmedQuery}" across e-shops...`);

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

    const errors = scrapeResults.filter(r => r.error).map(r => `${r.eshop}: ${r.error}`);

    return new Response(
      JSON.stringify({ success: true, products, errors }),
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
