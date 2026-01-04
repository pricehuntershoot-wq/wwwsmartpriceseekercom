import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscountPattern {
  type: 'promo_code_field' | 'cart_discount' | 'returned_item' | 'open_box' | 'refurbished' | 'bundle_deal' | 'hidden_discount';
  confidence: 'high' | 'medium' | 'low';
  description: string;
  selector?: string;
  actionRequired?: string;
}

interface AnalysisResult {
  url: string;
  productName?: string;
  currentPrice?: string;
  originalPrice?: string;
  discountPatterns: DiscountPattern[];
  promoCodeFields: {
    detected: boolean;
    possibleCodes?: string[];
    inputSelectors?: string[];
  };
  cartDiscountIndicators: string[];
  conditionType?: 'new' | 'returned' | 'used' | 'open_box' | 'refurbished';
  recommendations: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, htmlContent } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If HTML content is provided, analyze it. Otherwise, provide guidance for what to look for.
    const contentToAnalyze = htmlContent 
      ? `Analyze this product page HTML from ${url}:\n\n${htmlContent.substring(0, 50000)}`
      : `I need you to describe what discount patterns and hidden deals we should look for on the Czech e-shop: ${url}`;

    console.log(`Analyzing product page: ${url}`);

    const systemPrompt = `You are an expert at analyzing e-commerce product pages to find hidden discounts and deals that traditional price comparison engines miss.

Your task is to identify:
1. **Promo Code Fields**: Input fields where discount codes can be entered (in cart, checkout, or on product page)
2. **Cart-Only Discounts**: Indicators that suggest prices change when added to cart (e.g., "Cena v košíku", "Sleva po přidání do košíku", "Add to cart for special price")
3. **Product Condition**: Whether the product is new, returned ("Vrácené zboží"), open-box ("Rozbaleno"), refurbished ("Repasované"), or used ("Použité")
4. **Bundle Deals**: Discounts for buying multiple items together
5. **Hidden Promotions**: Any text suggesting hidden deals, flash sales, or member-only prices

For Czech e-shops like Alza.cz, Datart.cz, Mall.cz, Notino.cz, look for:
- "Sleva v košíku" (cart discount)
- "Zadejte slevový kód" (enter promo code)
- "Kód kupónu" (coupon code)
- "Vrácené zboží" (returned goods)
- "Rozbaleno" (unpacked/open box)
- "Záruka vrácení peněz" with special pricing
- Product badges indicating special conditions

Return your analysis as a JSON object with this structure:
{
  "productName": "string or null",
  "currentPrice": "string or null",
  "originalPrice": "string or null if there's a strikethrough price",
  "discountPatterns": [
    {
      "type": "promo_code_field | cart_discount | returned_item | open_box | refurbished | bundle_deal | hidden_discount",
      "confidence": "high | medium | low",
      "description": "what was found",
      "selector": "CSS selector if identifiable",
      "actionRequired": "what action reveals the discount"
    }
  ],
  "promoCodeFields": {
    "detected": true/false,
    "possibleCodes": ["any codes mentioned on page"],
    "inputSelectors": ["CSS selectors for promo code inputs"]
  },
  "cartDiscountIndicators": ["list of text snippets suggesting cart discounts"],
  "conditionType": "new | returned | used | open_box | refurbished | null",
  "recommendations": ["specific actions to discover hidden prices"]
}`;

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
        temperature: 0.3,
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
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits to continue.' }),
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
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ success: false, error: 'No analysis result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to parse the JSON from the response
    let analysis: AnalysisResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      const parsed = JSON.parse(jsonStr);
      
      analysis = {
        url,
        productName: parsed.productName,
        currentPrice: parsed.currentPrice,
        originalPrice: parsed.originalPrice,
        discountPatterns: parsed.discountPatterns || [],
        promoCodeFields: parsed.promoCodeFields || { detected: false },
        cartDiscountIndicators: parsed.cartDiscountIndicators || [],
        conditionType: parsed.conditionType,
        recommendations: parsed.recommendations || [],
      };
    } catch (parseError) {
      console.log('Could not parse JSON, returning raw analysis');
      analysis = {
        url,
        discountPatterns: [],
        promoCodeFields: { detected: false },
        cartDiscountIndicators: [],
        recommendations: [content],
      };
    }

    console.log('Analysis complete for:', url);
    
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
