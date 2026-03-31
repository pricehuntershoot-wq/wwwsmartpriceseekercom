import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PREMIUM_PLUS_PRODUCT_ID = "prod_UFbeY69ycsk5JW";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-FAVORITES-PRICES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    logStep("Starting favorites price check");

    // Get all Premium Plus users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, display_name');

    if (profilesError) throw profilesError;

    const premiumPlusUsers: Array<{ user_id: string; email: string; display_name: string | null }> = [];

    for (const profile of profiles || []) {
      if (!profile.email) continue;
      try {
        const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
        if (customers.data.length > 0) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: "active",
            limit: 1,
          });
          if (subscriptions.data.length > 0) {
            const productId = subscriptions.data[0].items.data[0].price.product;
            if (productId === PREMIUM_PLUS_PRODUCT_ID) {
              premiumPlusUsers.push(profile);
            }
          }
        }
      } catch (e) {
        logStep("Error checking subscription", { userId: profile.user_id, error: e });
      }
    }

    logStep("Found Premium Plus users", { count: premiumPlusUsers.length });

    let notificationsSent = 0;
    let emailsSent = 0;

    for (const user of premiumPlusUsers) {
      // Get user's favorites
      const { data: favorites } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.user_id);

      if (!favorites || favorites.length === 0) continue;

      const productIds = favorites.map(f => f.product_id);

      for (const productId of productIds) {
        // Get current prices for this product
        const { data: currentPrices } = await supabase
          .from('prices')
          .select('id, current_price, original_price, currency, product_url, shop_id')
          .eq('product_id', productId)
          .eq('is_active', true);

        if (!currentPrices || currentPrices.length === 0) continue;

        // Get last recorded prices from price_history
        const { data: priceHistory } = await supabase
          .from('price_history')
          .select('price, shop_id, recorded_at')
          .eq('product_id', productId)
          .order('recorded_at', { ascending: false })
          .limit(currentPrices.length * 2);

        if (!priceHistory || priceHistory.length === 0) continue;

        for (const price of currentPrices) {
          // Find previous price for same shop
          const previousPrice = priceHistory.find(
            ph => ph.shop_id === price.shop_id && ph.price > price.current_price
          );

          if (!previousPrice) continue;

          const dropPercentage = ((previousPrice.price - price.current_price) / previousPrice.price) * 100;

          if (dropPercentage < 5) continue; // Only notify for 5%+ drops

          // Check if we already notified about this
          const { data: existingNotification } = await supabase
            .from('user_notifications')
            .select('id')
            .eq('user_id', user.user_id)
            .eq('product_id', productId)
            .eq('type', 'price_drop')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (existingNotification && existingNotification.length > 0) continue;

          // Get product & shop info
          const { data: product } = await supabase
            .from('products')
            .select('name, image_url')
            .eq('id', productId)
            .single();

          const { data: shop } = await supabase
            .from('shops')
            .select('name')
            .eq('id', price.shop_id)
            .single();

          const title = `🔥 Pokles ceny: ${Math.round(dropPercentage)}%`;
          const message = `${product?.name || 'Produkt'} klesl z ${Math.round(previousPrice.price)} na ${Math.round(price.current_price)} ${price.currency} v ${shop?.name || 'e-shopu'}.`;

          // Insert in-app notification
          await supabase
            .from('user_notifications')
            .insert({
              user_id: user.user_id,
              product_id: productId,
              title,
              message,
              type: 'price_drop',
              metadata: {
                old_price: previousPrice.price,
                new_price: price.current_price,
                drop_percentage: Math.round(dropPercentage),
                shop_name: shop?.name,
                product_url: price.product_url,
                currency: price.currency,
              },
            });

          notificationsSent++;

          // Send email notification
          if (resendApiKey && user.email) {
            try {
              const formatPrice = (p: number, c: string) =>
                new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(p);

              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${resendApiKey}`,
                },
                body: JSON.stringify({
                  from: "Price Alert <onboarding@resend.dev>",
                  to: [user.email],
                  subject: `🔥 ${Math.round(dropPercentage)}% pokles ceny: ${product?.name || 'Produkt'}`,
                  html: `
                  <!DOCTYPE html>
                  <html>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                      <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="margin: 0;">🔥 Pokles ceny!</h1>
                        <p style="margin: 10px 0 0;">Ahoj ${user.display_name || 'uživateli'}, cena produktu, který sleduješ, klesla!</p>
                      </div>
                      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
                        <div style="background: linear-gradient(135deg, #7c3aed22, #6d28d922); padding: 12px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
                          <strong>⭐ PREMIUM PLUS</strong><br>
                          <span style="font-size: 12px;">Automatické sledování oblíbených produktů</span>
                        </div>
                        <h2 style="margin: 0 0 10px;">${product?.name || 'Produkt'}</h2>
                        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                          <div style="font-size: 18px; color: #9ca3af; text-decoration: line-through;">${formatPrice(previousPrice.price, price.currency)}</div>
                          <div style="font-size: 36px; font-weight: bold; color: #10b981;">${formatPrice(price.current_price, price.currency)}</div>
                          <div style="background: #ef4444; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold;">-${Math.round(dropPercentage)}%</div>
                          <div style="color: #6b7280; margin-top: 10px;">v ${shop?.name || 'e-shopu'}</div>
                        </div>
                        ${price.product_url ? `<a href="${price.product_url}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">Zobrazit nabídku</a>` : ''}
                      </div>
                    </div>
                  </body>
                  </html>`,
                }),
              });
              emailsSent++;
            } catch (e) {
              logStep("Failed to send email", { email: user.email, error: e });
            }
          }
        }
      }
    }

    logStep("Done", { notificationsSent, emailsSent });

    return new Response(JSON.stringify({ success: true, notificationsSent, emailsSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
