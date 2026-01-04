import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', { 
    style: 'currency', 
    currency: 'CZK', 
    maximumFractionDigits: 0 
  }).format(price);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking price alerts...");

    // Fetch all active price alerts with user and product info
    const { data: alerts, error: alertsError } = await supabase
      .from('price_alerts')
      .select(`
        id,
        user_id,
        product_id,
        target_price,
        is_active,
        triggered_at
      `)
      .eq('is_active', true)
      .is('triggered_at', null);

    if (alertsError) {
      console.error("Error fetching alerts:", alertsError);
      throw alertsError;
    }

    console.log(`Found ${alerts?.length || 0} active alerts to check`);

    const triggeredAlerts: string[] = [];

    for (const alert of alerts || []) {
      // Get current best price for the product
      const { data: prices, error: pricesError } = await supabase
        .from('prices')
        .select('current_price, shop_id')
        .eq('product_id', alert.product_id)
        .eq('is_active', true)
        .order('current_price', { ascending: true })
        .limit(1);

      if (pricesError) {
        console.error(`Error fetching prices for product ${alert.product_id}:`, pricesError);
        continue;
      }

      const bestPrice = prices?.[0];
      if (!bestPrice) {
        console.log(`No active prices found for product ${alert.product_id}`);
        continue;
      }

      console.log(`Product ${alert.product_id}: Best price ${bestPrice.current_price}, Target ${alert.target_price}`);

      // Check if current price is at or below target
      if (bestPrice.current_price <= alert.target_price) {
        console.log(`Alert triggered! Price ${bestPrice.current_price} <= Target ${alert.target_price}`);

        // Get product details
        const { data: product } = await supabase
          .from('products')
          .select('name, image_url')
          .eq('id', alert.product_id)
          .single();

        // Get shop details
        const { data: shop } = await supabase
          .from('shops')
          .select('name')
          .eq('id', bestPrice.shop_id)
          .single();

        // Get user email from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, display_name')
          .eq('user_id', alert.user_id)
          .single();

        if (profile?.email && product) {
          const userName = profile.display_name || 'there';
          const savings = alert.target_price - bestPrice.current_price;

          // Send email notification using Resend API directly
          try {
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "Price Alert <onboarding@resend.dev>",
                to: [profile.email],
                subject: `🎉 Price Drop Alert: ${product.name}`,
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
                    .product-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
                    .price-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .current-price { font-size: 32px; font-weight: bold; color: #10b981; }
                    .target-price { font-size: 16px; color: #6b7280; margin-top: 5px; }
                    .savings { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; }
                    .shop-info { color: #6b7280; margin-top: 10px; }
                    .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🎉 Price Drop Alert!</h1>
                      <p>Great news, ${userName}! A product you're watching just dropped in price.</p>
                    </div>
                    <div class="content">
                      <div class="product-name">${product.name}</div>
                      
                      <div class="price-box">
                        <div class="current-price">${formatPrice(bestPrice.current_price)}</div>
                        <div class="target-price">Your target: ${formatPrice(alert.target_price)}</div>
                        ${savings > 0 ? `<div class="savings">You save ${formatPrice(savings)} extra!</div>` : ''}
                        <div class="shop-info">Best price at ${shop?.name || 'Unknown Shop'}</div>
                      </div>
                      
                      <p>The price is now at or below your target. Don't miss out on this deal!</p>
                      
                      <div class="footer">
                        <p>You received this email because you set a price alert on PriceHunter.</p>
                        <p>This alert has been marked as triggered and won't send again.</p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `,
              }),
            });

            if (!emailResponse.ok) {
              const errorData = await emailResponse.text();
              throw new Error(`Resend API error: ${errorData}`);
            }

            const emailResult = await emailResponse.json();
            console.log(`Email sent successfully to ${profile.email}:`, emailResult);
            triggeredAlerts.push(alert.id);

            // Mark alert as triggered
            await supabase
              .from('price_alerts')
              .update({ triggered_at: new Date().toISOString() })
              .eq('id', alert.id);

          } catch (emailError) {
            console.error(`Failed to send email to ${profile.email}:`, emailError);
          }
        } else {
          console.log(`No email found for user ${alert.user_id} or product not found`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: alerts?.length || 0,
        triggered: triggeredAlerts.length,
        triggeredAlertIds: triggeredAlerts
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-price-alerts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});