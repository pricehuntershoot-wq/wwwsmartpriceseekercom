import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, htmlContent, markdownContent } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use markdown (preferred) or HTML content for analysis
    let contentToAnalyze: string;
    if (markdownContent) {
      contentToAnalyze = `Analyze this product page content from ${url}:\n\n${markdownContent.substring(0, 60000)}`;
    } else if (htmlContent) {
      contentToAnalyze = `Analyze this product page HTML from ${url}:\n\n${htmlContent.substring(0, 50000)}`;
    } else {
      contentToAnalyze = `I need you to describe what discount patterns and hidden deals we should look for on the Czech e-shop: ${url}`;
    }

    console.log(`Analyzing product page: ${url}`);

    const systemPrompt = `You are an expert at analyzing Czech e-commerce product pages (Alza.cz, Datart.cz, Mall.cz, Notino.cz, CZC.cz, etc.) to extract ALL price tiers and hidden discounts.

Your task is to extract a COMPLETE price breakdown with these tiers:

1. **Main Price (Základní cena)**: The displayed retail price
2. **Promo Code Price (Cena se slevovým kódem)**: Price after applying a visible promo/coupon code shown on the page (e.g., "Koupit s kódem ALZADNY20 → 9 272,-")
3. **Cart Price (Cena v košíku)**: Price that only appears when added to cart
4. **Used/Returned Price (Cena použitého/vráceného)**: Price for used, returned, open-box, or refurbished condition
5. **Used + Promo Price**: Used price combined with promo code if applicable

Look for these Czech patterns:
- "Koupit s kódem [CODE]" → promo code + discounted price
- "Stav zboží: Nový / Použitý / Rozbaleno" → condition selector with different prices
- "S kódem od X,-" → price with code for specific condition
- "Sleva v košíku" or "Cena v košíku" → cart-only discount
- "bez DPH" → price without VAT (ignore this, use with-VAT price)
- "Garance nejlepší ceny" → best price guarantee badge

Return your analysis as a JSON object with this EXACT structure:
{
  "productName": "string",
  "priceTiers": [
    {
      "tierType": "main | promo_code | cart | used | used_promo | open_box | refurbished",
      "price": number (in CZK, without currency symbol),
      "originalPrice": number or null (strikethrough price if shown),
      "condition": "new | used | returned | open_box | refurbished",
      "promoCode": "string or null (the actual code like ALZADNY20)",
      "promoDescription": "string or null (e.g., 'Koupit s kódem ALZADNY20')",
      "label": "string (human readable label like 'Nový', 'Použitý s kódem')",
      "confidence": "high | medium | low"
    }
  ],
  "promoCodes": [
    {
      "code": "string (e.g., ALZADNY20)",
      "discount": "string (e.g., '20%' or '2318 Kč')",
      "description": "string",
      "applicableTo": "all | new | used"
    }
  ],
  "conditions": ["new", "used", "returned", "open_box", "refurbished"],
  "cartDiscountIndicators": ["list of text snippets suggesting cart discounts"],
  "recommendations": ["specific actions to discover more hidden prices"],
  "currency": "CZK"
}

IMPORTANT: Extract ACTUAL numeric prices. Parse Czech price format: "11 590,-" → 11590, "9 272,-" → 9272. Remove spaces, commas, dashes, and currency symbols.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contentToAnalyze }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'No analysis result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.log('Could not parse JSON, returning raw analysis');
      analysis = {
        productName: null,
        priceTiers: [],
        promoCodes: [],
        conditions: [],
        cartDiscountIndicators: [],
        recommendations: [content],
        currency: 'CZK',
      };
    }

    console.log('Analysis complete for:', url, 'Found', analysis.priceTiers?.length || 0, 'price tiers');
    
    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing product page:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
