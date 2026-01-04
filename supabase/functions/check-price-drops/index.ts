import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_DROP_THRESHOLD = 20; // 20% drop triggers notification
const PREMIUM_EMBARGO_HOURS = 1; // Premium users get 1 hour head start

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-PRICE-DROPS] ${step}${detailsStr}`);
};

const formatPrice = (price: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('en-EU', { 
    style: 'currency', 
    currency: currency, 
    maximumFractionDigits: 0 
  }).format(price);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(STRIPE_SECRET_KEY || "", { apiVersion: "2025-08-27.basil" });
    
    logStep("Starting price drop check");

    // Get all users with their subscription status
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, display_name');

    if (profilesError) {
      logStep("Error fetching profiles", { error: profilesError });
      throw profilesError;
    }

    // Check which users have premium subscriptions
    const premiumUsers = new Set<string>();
    for (const profile of profiles || []) {
      if (profile.email) {
        try {
          const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
          if (customers.data.length > 0) {
            const subscriptions = await stripe.subscriptions.list({
              customer: customers.data[0].id,
              status: "active",
              limit: 1,
            });
            if (subscriptions.data.length > 0) {
              premiumUsers.add(profile.user_id);
            }
          }
        } catch (e) {
          logStep("Error checking subscription for user", { userId: profile.user_id, error: e });
        }
      }
    }

    logStep("Found premium users", { count: premiumUsers.size });

    // Get recent price drops that haven't been fully notified
    const { data: priceDrops, error: dropsError } = await supabase
      .from('price_drop_notifications')
      .select(`
        *,
        products:product_id (name, image_url),
        prices:price_id (current_price, currency, product_url, shop_id)
      `)
      .gte('drop_percentage', PRICE_DROP_THRESHOLD)
      .or('premium_notified_at.is.null,standard_notified_at.is.null');

    if (dropsError) {
      logStep("Error fetching price drops", { error: dropsError });
      throw dropsError;
    }

    logStep("Found price drops to process", { count: priceDrops?.length || 0 });

    const now = new Date();
    let premiumNotificationsSent = 0;
    let standardNotificationsSent = 0;

    for (const drop of priceDrops || []) {
      const detectedAt = new Date(drop.detected_at);
      const embargoEnds = new Date(detectedAt.getTime() + PREMIUM_EMBARGO_HOURS * 60 * 60 * 1000);
      const isEmbargoOver = now >= embargoEnds;

      // Get shop info
      const { data: shop } = await supabase
        .from('shops')
        .select('name')
        .eq('id', drop.prices?.shop_id)
        .single();

      // Get users who have this product in favorites or alerts
      const { data: interestedUsers } = await supabase
        .from('favorites')
        .select('user_id')
        .eq('product_id', drop.product_id);

      const { data: alertUsers } = await supabase
        .from('price_alerts')
        .select('user_id')
        .eq('product_id', drop.product_id)
        .eq('is_active', true);

      // Combine unique user IDs
      const allInterestedUserIds = new Set([
        ...(interestedUsers || []).map(u => u.user_id),
        ...(alertUsers || []).map(u => u.user_id),
      ]);

      // Send premium notifications immediately if not already sent
      if (!drop.premium_notified_at) {
        for (const userId of allInterestedUserIds) {
          if (premiumUsers.has(userId)) {
            const profile = profiles?.find(p => p.user_id === userId);
            if (profile?.email) {
              await sendPriceDropEmail({
                email: profile.email,
                userName: profile.display_name || 'there',
                productName: drop.products?.name || 'Product',
                oldPrice: drop.old_price,
                newPrice: drop.new_price,
                dropPercentage: drop.drop_percentage,
                shopName: shop?.name || 'Unknown Shop',
                productUrl: drop.prices?.product_url,
                currency: drop.prices?.currency || 'EUR',
                isPremiumEarlyAccess: true,
              });
              premiumNotificationsSent++;
            }
          }
        }

        // Mark premium notifications as sent
        await supabase
          .from('price_drop_notifications')
          .update({ premium_notified_at: now.toISOString() })
          .eq('id', drop.id);
      }

      // Send standard notifications after embargo period
      if (!drop.standard_notified_at && isEmbargoOver) {
        for (const userId of allInterestedUserIds) {
          if (!premiumUsers.has(userId)) {
            const profile = profiles?.find(p => p.user_id === userId);
            if (profile?.email) {
              await sendPriceDropEmail({
                email: profile.email,
                userName: profile.display_name || 'there',
                productName: drop.products?.name || 'Product',
                oldPrice: drop.old_price,
                newPrice: drop.new_price,
                dropPercentage: drop.drop_percentage,
                shopName: shop?.name || 'Unknown Shop',
                productUrl: drop.prices?.product_url,
                currency: drop.prices?.currency || 'EUR',
                isPremiumEarlyAccess: false,
              });
              standardNotificationsSent++;
            }
          }
        }

        // Mark standard notifications as sent
        await supabase
          .from('price_drop_notifications')
          .update({ standard_notified_at: now.toISOString() })
          .eq('id', drop.id);
      }
    }

    logStep("Notifications sent", { premium: premiumNotificationsSent, standard: standardNotificationsSent });

    return new Response(
      JSON.stringify({ 
        success: true, 
        priceDropsProcessed: priceDrops?.length || 0,
        premiumNotificationsSent,
        standardNotificationsSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    logStep("Error in check-price-drops function", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

interface EmailParams {
  email: string;
  userName: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  dropPercentage: number;
  shopName: string;
  productUrl: string | null;
  currency: string;
  isPremiumEarlyAccess: boolean;
}

async function sendPriceDropEmail(params: EmailParams) {
  const { email, userName, productName, oldPrice, newPrice, dropPercentage, shopName, productUrl, currency, isPremiumEarlyAccess } = params;
  
  const earlyAccessBanner = isPremiumEarlyAccess 
    ? `<div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
        <strong>⭐ PREMIUM EARLY ACCESS ⭐</strong><br>
        <span style="font-size: 12px;">You're seeing this 1 hour before non-premium users!</span>
       </div>`
    : '';

  try {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Price Alert <onboarding@resend.dev>",
        to: [email],
        subject: `🔥 ${Math.round(dropPercentage)}% Price Drop: ${productName}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .product-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .price-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .old-price { font-size: 18px; color: #9ca3af; text-decoration: line-through; }
            .new-price { font-size: 36px; font-weight: bold; color: #10b981; }
            .drop-badge { background: #ef4444; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; }
            .shop-info { color: #6b7280; margin-top: 10px; }
            .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔥 Massive Price Drop!</h1>
              <p>Great news, ${userName}! A product you're watching just dropped significantly in price.</p>
            </div>
            <div class="content">
              ${earlyAccessBanner}
              <div class="product-name">${productName}</div>
              
              <div class="price-box">
                <div class="old-price">${formatPrice(oldPrice, currency)}</div>
                <div class="new-price">${formatPrice(newPrice, currency)}</div>
                <div class="drop-badge">-${Math.round(dropPercentage)}% OFF</div>
                <div class="shop-info">Best price at ${shopName}</div>
              </div>
              
              <p>This is a significant price drop of <strong>${Math.round(dropPercentage)}%</strong>! Don't miss out on this deal!</p>
              
              ${productUrl ? `<a href="${productUrl}" class="cta-button" target="_blank">View Deal Now</a>` : ''}
              
              <div class="footer">
                <p>You received this email because you're tracking this product on PriceHunter.</p>
                ${isPremiumEarlyAccess ? '<p><strong>Thank you for being a Premium member!</strong></p>' : '<p>Upgrade to Premium for 1-hour early access to all price drops!</p>'}
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

    logStep("Email sent successfully", { email, isPremiumEarlyAccess });
  } catch (error) {
    logStep("Failed to send email", { email, error });
  }
}
