import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_HOURS = 24;

const ESHOP_SEARCH_URLS = {
  datart: (q: string) => `https://www.datart.cz/vyhledavani?q=${encodeURIComponent(q)}`,
};

// Clean markdown from cookie banners, consent dialogs, navigation, and other junk
function cleanMarkdown(md: string): string {
  // Remove lines containing cookie/consent/banner keywords
  const junkPatterns = [
    /cookie/i, /souhlas/i, /consent/i, /gdpr/i, /soukromí/i, /privacy/i,
    /přijmout vše/i, /accept all/i, /odmítnout/i, /reject/i,
    /partnerů/i, /partners/i, /účel/i, /purposes/i,
    /personalizace/i, /personali[sz]/i,
    /nastavení cookies/i, /cookie settings/i,
    /přihlásit se/i, /registrace/i, /sign in/i, /sign up/i,
    /newsletter/i, /odběr/i, /subscribe/i,
    /sledovat nás/i, /follow us/i,
    /zákaznická linka/i, /kontaktujte nás/i, /customer service/i,
    /obchodní podmínky/i, /terms/i,
    /copyright\s*©/i, /©\s*\d{4}/,
    /facebook|instagram|twitter|youtube|tiktok|linkedin/i,
  ];

  const lines = md.split('\n');
  const cleaned: string[] = [];
  let skipBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect start of cookie/consent block
    if (/cookie|consent|souhlas|gdpr|soukromí|privacy policy/i.test(trimmed) && trimmed.length < 200) {
      skipBlock = true;
      continue;
    }

    // End skip block on separator or heading
    if (skipBlock && (/^---/.test(trimmed) || /^#{1,4}\s/.test(trimmed))) {
      skipBlock = false;
    }

    if (skipBlock) continue;

    // Skip individual junk lines
    if (junkPatterns.some(p => p.test(trimmed))) continue;

    // Skip very short lines that look like nav items
    if (trimmed.length > 0 && trimmed.length < 4 && !/^\d/.test(trimmed)) continue;

    cleaned.push(line);
  }

  return cleaned.join('\n');
}

async function searchViaFirecrawl(eshopName: string, domain: string, query: string, apiKey: string, imageHostPatterns: string[] = []): Promise<{ eshop: string; markdown: string | null; imageLinks: string[]; error?: string }> {
  try {
    console.log(`Searching ${domain} via Firecrawl search API for: "${query}"`);
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:${domain} ${query}`,
        limit: 8,
        lang: 'cs',
        country: 'CZ',
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`${eshopName} Firecrawl search failed:`, data);
      return { eshop: eshopName, markdown: null, imageLinks: [], error: data.error || 'Search failed' };
    }

    const results = data.data || [];
    console.log(`${eshopName} search returned ${results.length} results`);

    if (results.length === 0) {
      return { eshop: eshopName, markdown: null, imageLinks: [], error: 'No results found' };
    }

    let combinedMarkdown = '';
    const imageLinks: string[] = [];

    for (const r of results) {
      const url = r.url || '';
      if (!url.includes(domain) || url.includes('/vyhledavani') || url.includes('/img/') || url.includes('/search')) continue;

      const title = r.title || '';
      const description = r.description || '';
      const rawMarkdown = r.markdown || '';
      // Clean cookie banners and junk before processing
      const pageMarkdown = cleanMarkdown(rawMarkdown);

      const imgMatches = pageMarkdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g) || [];
      for (const imgMatch of imgMatches) {
        const urlMatch = imgMatch.match(/\((https?:\/\/[^\s)]+)\)/);
        if (urlMatch) {
          const imgUrl = urlMatch[1];
          const isHostMatch = imageHostPatterns.length === 0 || imageHostPatterns.some(p => imgUrl.includes(p));
          if (isHostMatch || /\.(jpg|jpeg|png|webp)/i.test(imgUrl)) {
            imageLinks.push(imgUrl);
          }
        }
      }

      // Pre-extract price from markdown so AI always sees it
      let extractedPrice = '';
      // Czech: "5 990 Kč", "11590,-", "od 5 990 Kč"
      const priceMatches = pageMarkdown.match(/(\d[\d\s.]*\d)\s*(?:Kč|,-|CZK)/g) || [];
      // EUR: "249,00 €"
      const eurMatches = pageMarkdown.match(/(\d[\d\s.,]*\d)\s*€/g) || [];
      if (priceMatches.length > 0) {
        extractedPrice = ` | PRICES FOUND: ${priceMatches.slice(0, 3).join(', ')}`;
      } else if (eurMatches.length > 0) {
        extractedPrice = ` | PRICES FOUND: ${eurMatches.slice(0, 3).join(', ')}`;
      }

      combinedMarkdown += `### ${title}${extractedPrice}\nURL: ${url}\n${description}\n`;
      if (pageMarkdown) {
        combinedMarkdown += pageMarkdown.substring(0, 2000) + '\n';
      }
      combinedMarkdown += '\n---\n\n';
    }

    console.log(`${eshopName} combined markdown length: ${combinedMarkdown.length}, image links: ${imageLinks.length}`);
    return { eshop: eshopName, markdown: combinedMarkdown || null, imageLinks };
  } catch (err) {
    console.error(`${eshopName} search error:`, err);
    return { eshop: eshopName, markdown: null, imageLinks: [], error: err instanceof Error ? err.message : String(err) };
  }
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

async function getCachedResults(supabase: any, query: string) {
  const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
  
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

  // Build variant exclusion list based on query
  const q = query.toLowerCase();
  const variantSuffixes = ['ultra', 'plus', '+', 'fe', 'lite', 'neo'];
  const queryHasVariant = variantSuffixes.filter(v => q.includes(v));
  const excludeVariants = variantSuffixes.filter(v => !q.includes(v));

  // Filter by query match — only match on product NAME, not category
  const queryTokens = q.split(/\s+/).filter((t: string) => t.length > 2);
  const matched = products.filter((p: any) => {
    const name = p.products?.name?.toLowerCase() || '';
    // Must contain query string or all tokens
    const basicMatch = name.includes(q) || 
      (queryTokens.length >= 2 && queryTokens.every((t: string) => name.includes(t)));
    if (!basicMatch) return false;
    
    // Exclude variant models not in query (e.g. if searching "s24", exclude "s24 ultra")
    for (const variant of excludeVariants) {
      if (name.includes(variant) || name.includes(variant + ' ')) return false;
    }
    // Special: exclude "+" suffix like "S24+" when not in query
    if (!q.includes('+') && /s\d{2}\+/i.test(name)) return false;
    
    return true;
  });

  // Require minimum 3 results from at least 2 different shops to serve cache
  if (matched.length < 3) return null;
  
  const uniqueShops = new Set(matched.map((p: any) => p.shops?.name));
  if (uniqueShops.size < 2) return null;

  console.log(`Found ${matched.length} cached results from ${uniqueShops.size} shops for "${query}"`);

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

// Lightweight OG image fetcher — no Firecrawl credits, just HTTP fetch
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!resp.ok) { await resp.text(); return null; }
    const reader = resp.body?.getReader();
    if (!reader) return null;
    let html = '';
    const decoder = new TextDecoder();
    while (html.length < 50000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes('</head>')) break;
    }
    reader.cancel();
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1]) {
      let imgUrl = ogMatch[1];
      if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
      if (imgUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imgUrl = urlObj.origin + imgUrl;
      }
      return imgUrl;
    }
    return null;
  } catch {
    return null;
  }
}

// Firecrawl-based image fetcher for sites that block direct fetch (e.g. Amazon)
async function fetchImageViaFirecrawl(url: string, firecrawlKey: string): Promise<string | null> {
  try {
    console.log(`Fetching image via Firecrawl scrape for: ${url}`);
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Firecrawl image scrape failed:', data);
      return null;
    }
    
    // Strategy 1: Extract from links
    const links: string[] = data.data?.links || data.links || [];
    const imageLinks = links.filter((l: string) =>
      /\.(jpg|jpeg|png|webp)/i.test(l) || /\/(img|image|foto|Foto|ImgW|product|Product)/i.test(l)
    );
    for (const img of imageLinks) {
      if (img.includes('m.media-amazon.com') || img.includes('images-eu.ssl-images-amazon.com')) {
        if (img.includes('/images/I/') || img.includes('._AC_') || img.includes('._SL') || img.includes('._SX')) {
          console.log(`Found Firecrawl link image: ${img}`);
          return img;
        }
      }
      if (/\/(img|image|foto|Foto|ImgW|product|Product|pic\/)/i.test(img) && /\.(jpg|jpeg|png|webp)/i.test(img)) {
        console.log(`Found Firecrawl link image: ${img}`);
        return img;
      }
    }
    
    // Strategy 2: Extract from markdown ![alt](url) patterns
    const markdown: string = data.data?.markdown || data.markdown || '';
    const mdImageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    while ((match = mdImageRegex.exec(markdown)) !== null) {
      const imgUrl = match[1];
      if (imgUrl.includes('m.media-amazon.com') && imgUrl.includes('/images/I/')) {
        console.log(`Found Firecrawl markdown image: ${imgUrl}`);
        return imgUrl;
      }
      if (/\.(jpg|jpeg|png|webp)/i.test(imgUrl) && !/favicon|logo|icon|badge|pixel|sprite/i.test(imgUrl)) {
        console.log(`Found Firecrawl markdown image: ${imgUrl}`);
        return imgUrl;
      }
    }
    
    // Strategy 3: Extract from metadata og:image
    const metadata = data.data?.metadata || data.metadata || {};
    if (metadata.ogImage) {
      console.log(`Found Firecrawl OG image: ${metadata.ogImage}`);
      return metadata.ogImage;
    }
    
    console.log(`No image found via Firecrawl for: ${url}, links: ${links.length}, markdown length: ${markdown.length}`);
    return null;
  } catch (e) {
    console.error('Firecrawl image fetch error:', e);
    return null;
  }
}

async function saveResultsToDB(supabase: any, products: any[]) {
  const shopCache: Record<string, string> = {};

  for (const product of products) {
    try {
      // 1. Upsert shop
      const shopName = product.eshop === 'alza' ? 'Alza.cz' : 
                        product.eshop === 'datart' ? 'Datart.cz' :
                        product.eshop === 'smarty' ? 'Smarty.cz' :
                        product.eshop === 'mironet' ? 'Mironet.cz' :
                        product.eshop === 'czc' ? 'CZC.cz' :
                        product.eshop === 'mp' ? 'MP.cz' :
                        product.eshop === 'refurbed' ? 'Refurbed.cz' :
                        product.eshop === 'amazon' ? 'Amazon.de' :
                        product.eshop === 'xiaomi' ? 'Xiaomi Store' :
                        product.eshop === 'gigacomputer' ? 'Gigacomputer.cz' :
                        product.eshop === 'tsbohemia' ? 'TSBohemia.cz' :
                        product.eshop === 'allegro' ? 'Allegro.cz' :
                        product.eshop === 'samsung' ? 'Samsung.cz' :
                        product.eshop === 'isetos' ? 'iSetos.cz' : product.eshop;
      
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
        // Update image if product has none and we found one
        if (product.imageUrl) {
          await supabase
            .from('products')
            .update({ image_url: product.imageUrl })
            .eq('id', productId)
            .is('image_url', null);
        }
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

async function scrapeEshop(eshopName: string, url: string, apiKey: string, maxRetries = 2): Promise<{ eshop: string; markdown: string | null; imageLinks: string[]; error?: string }> {
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
          formats: ['markdown', 'links'],
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
        return { eshop: eshopName, markdown: null, imageLinks: [], error: errMsg };
      }

      const rawMarkdown = data.data?.markdown || data.markdown || null;
      const markdown = rawMarkdown ? cleanMarkdown(rawMarkdown) : null;
      const links: string[] = data.data?.links || data.links || [];
      // Filter to only image URLs
      const imageLinks = links.filter((l: string) => 
        /\.(jpg|jpeg|png|webp|gif)/i.test(l) || /\/(img|image|foto|Foto|ImgW)/i.test(l)
      );
      console.log(`${eshopName} scraped, markdown length: ${markdown?.length || 0}, image links: ${imageLinks.length}`);
      return { eshop: eshopName, markdown, imageLinks };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isRetryable = errMsg.includes('ERR_TUNNEL') || errMsg.includes('TUNNEL') || errMsg.includes('proxy') || errMsg.includes('fetch failed');
      if (isRetryable && attempt < maxRetries) {
        console.warn(`${eshopName} fetch error (attempt ${attempt}): ${errMsg}`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      console.error(`${eshopName} error:`, err);
      return { eshop: eshopName, markdown: null, imageLinks: [], error: errMsg };
    }
  }
  return { eshop: eshopName, markdown: null, imageLinks: [], error: 'Max retries exceeded' };
}

function regexFallbackParse(scrapeResults: { eshop: string; markdown: string | null; imageLinks: string[] }[], query: string): any[] {
  const products: any[] = [];
  const queryLower = query.toLowerCase();

  const domainMap: Record<string, string> = {
    alza: 'https://www.alza.cz',
    czc: 'https://www.czc.cz',
    datart: 'https://www.datart.cz',
    smarty: 'https://www.smarty.cz',
    mironet: 'https://www.mironet.cz',
    amazon: 'https://www.amazon.de',
    mp: 'https://www.mobilpohotovost.cz',
    refurbed: 'https://www.refurbed.cz',
    xiaomi: 'https://www.mi-home.cz',
    gigacomputer: 'https://www.gigacomputer.cz',
    tsbohemia: 'https://www.tsbohemia.cz',
    allegro: 'https://www.allegro.cz',
    samsung: 'https://www.samsung.com',
    isetos: 'https://www.isetos.cz',
  };

  for (const result of scrapeResults) {
    if (!result.markdown) continue;
    const eshop = result.eshop;
    const domain = domainMap[eshop] || '';
    const lines = result.markdown.split('\n');
    const seenNames = new Set<string>();

    // Strategy 1: Find markdown headings (### Title) followed by price patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Match ### headings or bold text as product names
      const headingMatch = line.match(/^#{1,4}\s+(.+)/) || line.match(/^\*\*(.+?)\*\*/);
      if (!headingMatch) continue;

      const name = headingMatch[1].replace(/\[|\]|\(.*?\)/g, '').trim();
      if (name.length < 5 || name.length > 200) continue;
      if (!name.toLowerCase().includes(queryLower.split(' ')[0])) continue;

      // Look ahead for price in next 8 lines
      let price: number | null = null;
      let originalPrice: number | null = null;
      let productUrl: string | null = null;

      for (let j = i; j < Math.min(i + 8, lines.length); j++) {
        const ctx = lines[j];

        // Czech price patterns: "11 590 Kč", "11590,-", "od 5 990 Kč", "5.990 Kč"
        if (!price) {
          const priceMatch = ctx.match(/(\d[\d\s.,]*)\s*(?:Kč|,-|CZK)/i);
          if (priceMatch) {
            const cleaned = priceMatch[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
            const parsed = parseFloat(cleaned);
            if (parsed > 50 && parsed < 500000) price = Math.round(parsed);
          }
        }

        // EUR price (Amazon)
        if (!price && eshop === 'amazon') {
          const eurMatch = ctx.match(/(\d[\d\s.,]*)\s*€/);
          if (eurMatch) {
            const cleaned = eurMatch[1].replace(/\s/g, '').replace('.', '').replace(',', '.');
            const parsed = parseFloat(cleaned);
            if (parsed > 1 && parsed < 20000) price = Math.round(parsed * 25.2);
          }
        }

        // Original/crossed price
        if (!originalPrice) {
          const origMatch = ctx.match(/(?:~~|původní|běžná|doporučená).*?(\d[\d\s.,]*)\s*(?:Kč|,-|CZK)/i);
          if (origMatch) {
            const cleaned = origMatch[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
            const parsed = parseFloat(cleaned);
            if (parsed > 50) originalPrice = Math.round(parsed);
          }
        }

        // URL
        if (!productUrl) {
          const urlMatch = ctx.match(/\(?(https?:\/\/[^\s)]+)/);
          if (urlMatch && urlMatch[1].includes(domainMap[eshop]?.replace('https://www.', '') || eshop)) {
            productUrl = urlMatch[1];
          }
          // Relative URL
          const relMatch = ctx.match(/URL:\s*(\/[^\s]+)/);
          if (relMatch && domain) {
            productUrl = domain + relMatch[1];
          }
        }
      }

      if (!price || seenNames.has(name.toLowerCase())) continue;
      seenNames.add(name.toLowerCase());

      // Pick first matching image
      let imageUrl: string | null = null;
      if (result.imageLinks.length > 0) {
        imageUrl = result.imageLinks[products.filter(p => p.eshop === eshop).length] || null;
      }

      products.push({
        name,
        normalizedName: name.replace(/\s+(černá|bílá|modrá|zelená|šedá|zlatá|stříbrná|růžová|fialová|červená|black|white|blue|green|silver|gold|pink|purple|red)\b/gi, '').trim(),
        price,
        originalPrice,
        eshop,
        productUrl,
        imageUrl,
        category: 'jiné',
        condition: eshop === 'refurbed' ? 'refurbished' : 'new',
        promoCode: null,
      });
    }
  }

  return products;
}

// Smarty and Mironet use the generic searchViaFirecrawl function defined above

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, forceRefresh, isPremium } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search query is required (min 2 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedQuery = query.trim();
    console.log(`Searching for "${trimmedQuery}" across e-shops...${forceRefresh ? ' (force refresh)' : ''}`);

    // Step 1: Check database cache first (skip if force refresh)
    const supabase = getSupabaseAdmin();
    
    if (!forceRefresh) {
      const cachedResults = await getCachedResults(supabase, trimmedQuery);

      if (cachedResults && cachedResults.length > 0) {
        console.log(`Returning ${cachedResults.length} cached results for "${trimmedQuery}"`);
        return new Response(
          JSON.stringify({ success: true, products: cachedResults, errors: [], fromCache: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

    // Core 6 e-shops (always searched)
    const coreSearches = [
      ...Object.entries(ESHOP_SEARCH_URLS).map(([name, urlFn]) =>
        scrapeEshop(name, urlFn(trimmedQuery), FIRECRAWL_API_KEY)
      ),
      searchViaFirecrawl('alza', 'alza.cz', trimmedQuery, FIRECRAWL_API_KEY, ['cdn.alza.cz', 'image.alza.cz', 'i.alza.cz']),
      searchViaFirecrawl('czc', 'czc.cz', trimmedQuery, FIRECRAWL_API_KEY, ['czc.cz']),
      searchViaFirecrawl('smarty', 'smarty.cz', trimmedQuery, FIRECRAWL_API_KEY, ['doc.smarty.cz', 'files.smarty.cz']),
      searchViaFirecrawl('mironet', 'mironet.cz', trimmedQuery, FIRECRAWL_API_KEY, ['img.mironet.cz']),
      searchViaFirecrawl('amazon', 'amazon.de', trimmedQuery, FIRECRAWL_API_KEY, ['m.media-amazon.com', 'images-eu.ssl-images-amazon.com']),
    ];

    // Premium-only: 8 additional e-shops
    const premiumSearches = isPremium ? [
      searchViaFirecrawl('mp', 'mobilpohotovost.cz', trimmedQuery, FIRECRAWL_API_KEY, ['mobilpohotovost.cz']),
      searchViaFirecrawl('refurbed', 'refurbed.cz', trimmedQuery, FIRECRAWL_API_KEY, ['refurbed.cz', 'refurbed.com']),
      searchViaFirecrawl('xiaomi', 'mi-home.cz', trimmedQuery, FIRECRAWL_API_KEY, ['mi-home.cz']),
      searchViaFirecrawl('gigacomputer', 'gigacomputer.cz', trimmedQuery, FIRECRAWL_API_KEY, ['gigacomputer.cz']),
      searchViaFirecrawl('tsbohemia', 'tsbohemia.cz', trimmedQuery, FIRECRAWL_API_KEY, ['tsbohemia.cz']),
      searchViaFirecrawl('allegro', 'allegro.cz', trimmedQuery, FIRECRAWL_API_KEY, ['allegro.cz', 'a.allegroimg.com']),
      searchViaFirecrawl('samsung', 'samsung.com', trimmedQuery, FIRECRAWL_API_KEY, ['samsung.com', 'image-us.samsung.com']),
      searchViaFirecrawl('isetos', 'isetos.cz', trimmedQuery, FIRECRAWL_API_KEY, ['isetos.cz']),
    ] : [];

    console.log(`Searching ${coreSearches.length + premiumSearches.length} e-shops (premium: ${!!isPremium})`);
    const scrapeResults = await Promise.all([...coreSearches, ...premiumSearches]);

    // Build combined content for AI analysis
    // Give each shop a fair share of context - more shops = less per shop but ensure all are included
    const shopsWithData = scrapeResults.filter(r => r.markdown);
    const perShopLimit = Math.max(3000, Math.floor(30000 / Math.max(shopsWithData.length, 1)));
    const combinedContent = shopsWithData
      .map(r => {
        let section = `=== ${r.eshop.toUpperCase()} (EXTRACT AT LEAST 2-3 PRODUCTS FROM THIS SECTION) ===\n${r.markdown!.substring(0, perShopLimit)}`;
        if (r.imageLinks.length > 0) {
          section += `\nIMAGES:\n${r.imageLinks.slice(0, 10).join('\n')}`;
        }
        return section;
      })
      .join('\n\n');


    if (!combinedContent) {
      return new Response(
        JSON.stringify({ success: true, products: [], errors: scrapeResults.filter(r => r.error).map(r => `${r.eshop}: ${r.error}`) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to extract structured product data via tool calling
    const availableShops = isPremium
      ? 'ALZA, CZC, DATART, SMARTY, MIRONET, AMAZON, MP, REFURBED, XIAOMI, GIGACOMPUTER, TSBOHEMIA, ALLEGRO, SAMSUNG, ISETOS'
      : 'ALZA, CZC, DATART, SMARTY, MIRONET, AMAZON';
    const systemPrompt = `Extract product listings from Czech e-shop search results. Each section is labeled with the shop name: ${availableShops}.

CRITICAL RULES:
1. You MUST extract products from EVERY section that has data. Do NOT skip any shop section.
2. Extract at least 2-3 products PER SHOP section. Target 15-30 total products.
3. RELEVANCE: Only products matching the search query. "Galaxy Buds 4 Pro" → include Galaxy Buds4 Pro / Galaxy Buds 4 Pro variants. Exclude unrelated products.
4. normalizedName: canonical name without color (e.g. "Samsung Galaxy Buds4 Pro").
5. Czech prices: "11 590,-" → 11590. "11 590 Kč" → 11590. Amazon EUR: multiply by 25.2 to get CZK.
6. URLs: prepend domain if path starts with "/". alza.cz paths → https://www.alza.cz/..., mironet.cz → https://www.mironet.cz/...
7. imageUrl: direct product image URL or null. Skip junk (logos, icons, social).
8. Refurbed → condition "refurbished". Amazon EUR → convert to CZK.
9. If a shop section contains the product but price format differs, still extract it.
10. IGNORE prices from cookie banners, consent dialogs, partner counts (e.g. "905 partnerů" is NOT a price), and navigation menus. Only extract actual product prices.

Call extract_products with ALL found products from ALL shops.`;

    const tools = [{
      type: "function" as const,
      function: {
        name: "extract_products",
        description: "Extract structured product data from e-shop search results",
        parameters: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Full product name as shown on page" },
                  normalizedName: { type: "string", description: "Canonical name without color/variant, e.g. 'Sony WH-1000XM5'" },
                  price: { type: "number", description: "Current price in CZK" },
                  originalPrice: { type: ["number", "null"], description: "Original/crossed-out price or null" },
                  eshop: { type: "string", enum: ["alza", "czc", "datart", "smarty", "mironet", "amazon", "mp", "refurbed", "xiaomi", "gigacomputer", "tsbohemia", "allegro", "samsung", "isetos"] },
                  productUrl: { type: ["string", "null"], description: "Full product URL" },
                  imageUrl: { type: ["string", "null"], description: "Direct product image URL or null" },
                  category: { type: "string", enum: ["mobily", "sluchátka", "tv", "reproduktory", "chytré hodinky", "chytré prsteny", "tablety", "herní konzole", "pc", "příslušenství", "jiné"] },
                  promoCode: { type: ["string", "null"], description: "Visible promo/discount code or null" },
                  condition: { type: "string", enum: ["new", "used", "open_box", "refurbished"] },
                },
                required: ["name", "normalizedName", "price", "eshop", "category", "condition"],
                additionalProperties: false,
              },
            },
          },
          required: ["products"],
          additionalProperties: false,
        },
      },
    }];

    const models = [
      { name: 'google/gemini-2.5-flash', temperature: 0.1 },
      { name: 'google/gemini-3-flash-preview', temperature: 0.1 },
      { name: 'google/gemini-2.5-flash-lite', temperature: 0.1 },
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
              tools,
              tool_choice: { type: "function", function: { name: "extract_products" } },
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
          if (response.status === 429 || response.status === 402) {
            // Rate limit or credits — skip to next model
            break;
          }
          if (attempt < 1) await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
          console.error(`AI ${model} fetch error:`, err);
        }
      }
      if (success) break;
    }

    let products: any[] = [];

    if (!aiResponse) {
      console.log('AI unavailable, falling back to regex parser...');
      products = regexFallbackParse(scrapeResults, trimmedQuery);
      console.log(`Regex fallback extracted ${products.length} products`);
    } else {
      // Parse tool call response
      try {
        const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          products = parsed.products || [];
        } else {
          const content = aiResponse.choices?.[0]?.message?.content;
          if (content) {
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
            const parsed = JSON.parse(jsonStr);
            products = Array.isArray(parsed) ? parsed : (parsed.products || []);
          }
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        products = regexFallbackParse(scrapeResults, trimmedQuery);
      }
      console.log(`AI extracted ${products.length} products`);
      if (products.length === 0) {
        console.log('AI returned 0 products, falling back to regex...');
        products = regexFallbackParse(scrapeResults, trimmedQuery);
        console.log(`Regex fallback extracted ${products.length} products`);
      }
    }

    // Blocklist for junk images (social meta, favicons, logos, tracking pixels)
    const IMAGE_BLOCKLIST = [
      'facebook', 'fbcdn.net', 'fb.com', 'scontent',
      'twitter.com', 'x.com/favicon', 'twimg.com',
      'google.com/images', 'googletagmanager', 'analytics', 'gstatic.com/images',
      'favicon.ico', 'favicon', 'sprite', 'pixel', 'tracker',
      'og-image', 'opengraph', 'share-', 'social-',
      'badge', 'banner-ad', 'placeholder',
      'linkedin.com', 'instagram.com', 'youtube.com', 'ytimg.com',
      'gravatar.com', 'wp-content/plugins', 'data:image',
      '/login/', '/auth/', '/sign', 'google.png', 'apple.png',
      'empty.', 'slevy', 'menu2-', 'vyprodej',
      'cookies-alzak', 'cookie', 'web-static/catalog',
    ];
    
    // Known product image CDN patterns (allowlist for extra confidence)
    const PRODUCT_IMAGE_HOSTS = [
      'cdn.alza.cz', 'image.alza.cz', 'i.alza.cz',
      'czc.cz', 'image.datart.cz', 'doc.smarty.cz', 'files.smarty.cz',
      'm.media-amazon.com', 'images-eu.ssl-images-amazon.com',
      'images-na.ssl-images-amazon.com',
      'img.mironet.cz', 'mobilpohotovost.cz', 'refurbed.cz', 'refurbed.com',
      'mi-home.cz', 'gigacomputer.cz', 'tsbohemia.cz',
      'allegro.cz', 'a.allegroimg.com', 'samsung.com', 'image-us.samsung.com',
      'isetos.cz',
    ];
    
    function isValidProductImage(url: string): boolean {
      if (!url || !url.startsWith('http')) return false;
      const lower = url.toLowerCase();
      if (IMAGE_BLOCKLIST.some(blocked => lower.includes(blocked))) return false;
      // Block tiny icon-like filenames (2-3 char names like CZ.png, US.png)
      const filename = lower.split('/').pop() || '';
      if (/^[a-z]{2,3}\.(png|jpg|gif|svg)$/.test(filename)) return false;
      // Must be from a known product CDN or have a product-like path
      const isKnownHost = PRODUCT_IMAGE_HOSTS.some(host => lower.includes(host));
      const hasImagePath = /\/(img|image|foto|photo|Foto|ImgW|product|Product|pic\/)/i.test(lower);
      return isKnownHost || hasImagePath;
    }

    // Build per-eshop image lookup from scraped imageLinks (pre-filtered)
    const eshopImageMap: Record<string, string[]> = {};
    for (const r of scrapeResults) {
      if (r.imageLinks && r.imageLinks.length > 0) {
        eshopImageMap[r.eshop] = r.imageLinks.filter(isValidProductImage);
      }
    }

    // Minimum realistic prices per category to filter cookie-banner junk numbers
    const MIN_PRICE_BY_CATEGORY: Record<string, number> = {
      'sluchátka': 300,
      'mobily': 1500,
      'tv': 2000,
      'reproduktory': 200,
      'chytré hodinky': 500,
      'chytré prsteny': 1000,
      'tablety': 1500,
      'herní konzole': 2000,
      'pc': 3000,
      'příslušenství': 30,
      'jiné': 30,
    };

    // Validate, deduplicate and clean products
    const seenImages = new Set<string>();
    const seenProductKeys = new Set<string>();
    const eshopImageIdx: Record<string, number> = {};
    const preFilterCount = products.length;
    products = products
      .filter((p: any) => {
        if (!p.price || typeof p.price !== 'number' || p.price <= 0) {
          console.log(`FILTERED (invalid price): ${p.name} from ${p.eshop}, price: ${p.price}`);
          return false;
        }
        // Filter unrealistically low prices (cookie banner numbers, partner counts, etc.)
        const minPrice = MIN_PRICE_BY_CATEGORY[p.category] || 30;
        if (p.price < minPrice) {
          console.log(`FILTERED (suspiciously low price ${p.price} < ${minPrice} for ${p.category}): ${p.name} from ${p.eshop}`);
          return false;
        }
        if (!p.name || p.name.trim().length < 3) {
          console.log(`FILTERED (short name): ${p.name} from ${p.eshop}`);
          return false;
        }
        const key = `${p.eshop}:${(p.normalizedName || p.name).toLowerCase().trim()}`;
        if (seenProductKeys.has(key)) {
          console.log(`FILTERED (duplicate): ${p.name} from ${p.eshop}`);
          return false;
        }
        seenProductKeys.add(key);
        return true;
      })
      .map((p: any) => {
        let img = p.imageUrl;
        
        // Validate URL format and content
        if (img && typeof img === 'string') {
          if (!isValidProductImage(img)) {
            console.log(`BLOCKED image for ${p.name}: ${img}`);
            img = null;
          }
          if (img && seenImages.has(img)) img = null;
        } else {
          img = null;
        }
        
        // Fallback: pick from scraped imageLinks if AI didn't provide one
        if (!img && eshopImageMap[p.eshop]) {
          const idx = eshopImageIdx[p.eshop] || 0;
          const candidates = eshopImageMap[p.eshop];
          if (idx < candidates.length) {
            img = candidates[idx];
            eshopImageIdx[p.eshop] = idx + 1;
          }
        }
        
        if (img && seenImages.has(img)) img = null;
        if (img) seenImages.add(img);
        
        return { ...p, imageUrl: img };
      });

    // Step 2.5: Auto-fetch missing images from product pages (lightweight, no Firecrawl credits)
    const productsNeedingImages = products.filter((p: any) => !p.imageUrl && p.productUrl);
    if (productsNeedingImages.length > 0) {
      console.log(`Fetching OG images for ${productsNeedingImages.length} products without images...`);
      await Promise.allSettled(
        productsNeedingImages.map(async (p: any) => {
          try {
            const img = await fetchOgImage(p.productUrl);
            if (img && isValidProductImage(img)) {
              console.log(`Found OG image for "${p.name}": ${img}`);
              p.imageUrl = img;
            }
          } catch (e) {
            // Silent fail — not critical
          }
        })
      );
    }

    // Step 2.6: Firecrawl fallback for products still without images (Amazon etc.)
    const stillNeedImages = products.filter((p: any) => !p.imageUrl && p.productUrl);
    if (stillNeedImages.length > 0 && FIRECRAWL_API_KEY) {
      console.log(`Firecrawl image fallback for ${stillNeedImages.length} products...`);
      // Limit to max 2 Firecrawl calls to save credits
      const toFetch = stillNeedImages.slice(0, 2);
      await Promise.allSettled(
        toFetch.map(async (p: any) => {
          try {
            const img = await fetchImageViaFirecrawl(p.productUrl, FIRECRAWL_API_KEY);
            if (img) {
              p.imageUrl = img;
            }
          } catch (e) {
            // Silent fail
          }
        })
      );
    }

    // Outlier price filter: remove products with prices far below the median for the same normalizedName
    // This catches cookie-banner numbers (e.g., "905 partnerů" parsed as 905 Kč)
    const pricesByNormalized: Record<string, number[]> = {};
    for (const p of products) {
      const key = (p.normalizedName || p.name).toLowerCase().trim();
      if (!pricesByNormalized[key]) pricesByNormalized[key] = [];
      pricesByNormalized[key].push(p.price);
    }
    products = products.filter((p: any) => {
      const key = (p.normalizedName || p.name).toLowerCase().trim();
      const prices = pricesByNormalized[key];
      if (prices.length < 2) return true; // Can't compare with just one price
      const sorted = [...prices].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      if (p.price < median * 0.3) {
        console.log(`FILTERED (outlier price ${p.price} vs median ${median}): ${p.name} from ${p.eshop}`);
        return false;
      }
      return true;
    });

    console.log(`Found ${products.length} products across e-shops`);

    // Step 3: Save results to database (non-blocking)
    if (products.length > 0) {
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
