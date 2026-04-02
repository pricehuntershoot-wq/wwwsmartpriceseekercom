import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Clock, Bell, Loader2, ExternalLink, Heart, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PREMIUM_PRICE_IDS = ["price_1TDF3mFmWsNdyjNFbzPta9mx"];
const PREMIUM_PLUS_PRICE_ID = "price_1TH6RRFmWsNdyjNF2dMiGI3e";

const Premium = () => {
  const { user, session } = useAuth();
  const { isPremium, isPremiumPlus, subscriptionEnd, loading: subscriptionLoading, refreshSubscription } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Vítejte v Premium! Vaše předplatné je nyní aktivní.");
      refreshSubscription();
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Platba byla zrušena.");
    }
  }, [searchParams, refreshSubscription]);

  const handleSubscribe = async (priceId: string, tier: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setCheckoutLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Nepodařilo se spustit platbu. Zkuste to znovu.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      toast.error("Nepodařilo se otevřít správu předplatného.");
    } finally {
      setPortalLoading(false);
    }
  };

  const premiumFeatures = [
    { icon: Zap, text: "Neomezené vyhledávání across e-shops", highlight: true },
    { icon: Clock, text: "Hloubková AI analýza cen a slev", highlight: true },
    { icon: Crown, text: "Premium členský přístup" },
  ];

  const premiumPlusFeatures = [
    { icon: Zap, text: "Vše z Premium", highlight: false },
    { icon: Heart, text: "Automatické sledování oblíbených každou hodinu", highlight: true },
    { icon: Bell, text: "Email + in-app upozornění na pokles ceny", highlight: true },
    { icon: Star, text: "Prioritní zákaznická podpora", highlight: false },
  ];

  const currentTier = isPremiumPlus ? 'plus' : isPremium ? 'premium' : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
            <Crown className="mr-1 h-3 w-3" />
            Premium
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Vyberte si plán
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Neomezené vyhledávání, hloubková AI analýza cen a automatické sledování oblíbených produktů.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Premium */}
          <Card className={`relative overflow-hidden ${currentTier === 'premium' ? "border-primary shadow-glow" : ""}`}>
            {currentTier === 'premium' && (
              <div className="absolute right-4 top-4">
                <Badge className="bg-primary text-primary-foreground">
                  <Check className="mr-1 h-3 w-3" />
                  Aktivní
                </Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>Pro chytré nakupování</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold">99 Kč</span>
                <span className="text-muted-foreground">/měsíc</span>
              </div>

              <ul className="space-y-3">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${feature.highlight ? 'bg-gradient-primary' : 'bg-primary/10'}`}>
                      <feature.icon className={`h-4 w-4 ${feature.highlight ? 'text-primary-foreground' : 'text-primary'}`} />
                    </div>
                    <span className={`text-sm ${feature.highlight ? 'font-medium' : ''}`}>{feature.text}</span>
                  </li>
                ))}
              </ul>

              {subscriptionLoading ? (
                <Button disabled className="w-full">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </Button>
              ) : currentTier === 'premium' ? (
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">
                    Předplatné se obnoví{" "}
                    {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("cs-CZ") : "—"}
                  </p>
                  <Button variant="outline" className="w-full" onClick={handleManageSubscription} disabled={portalLoading}>
                    {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                    Spravovat předplatné
                  </Button>
                </div>
              ) : currentTier === 'plus' ? (
                <Button variant="outline" className="w-full" disabled>
                  Máte vyšší plán
                </Button>
              ) : (
                <Button
                  variant="hero"
                  className="w-full"
                  onClick={() => handleSubscribe(PREMIUM_PRICE_IDS[0], 'premium')}
                  disabled={checkoutLoading === 'premium'}
                >
                  {checkoutLoading === 'premium' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  {user ? "Předplatit nyní" : "Přihlaste se"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Plus */}
          <Card className={`relative overflow-hidden border-2 ${currentTier === 'plus' ? "border-primary shadow-glow" : "border-primary/30"}`}>
            {!currentTier && (
              <div className="absolute right-4 top-4">
                <Badge className="bg-gradient-primary text-primary-foreground">
                  <Star className="mr-1 h-3 w-3" />
                  Doporučeno
                </Badge>
              </div>
            )}
            {currentTier === 'plus' && (
              <div className="absolute right-4 top-4">
                <Badge className="bg-primary text-primary-foreground">
                  <Check className="mr-1 h-3 w-3" />
                  Aktivní
                </Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <Star className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Premium Plus</CardTitle>
              <CardDescription>Sledujeme za vás, 24/7</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold">249 Kč</span>
                <span className="text-muted-foreground">/měsíc</span>
              </div>

              <ul className="space-y-3">
                {premiumPlusFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${feature.highlight ? 'bg-gradient-to-br from-primary to-accent' : 'bg-primary/10'}`}>
                      <feature.icon className={`h-4 w-4 ${feature.highlight ? 'text-primary-foreground' : 'text-primary'}`} />
                    </div>
                    <span className={`text-sm ${feature.highlight ? 'font-medium' : ''}`}>{feature.text}</span>
                    {feature.highlight && (
                      <Badge variant="secondary" className="ml-auto text-xs">New</Badge>
                    )}
                  </li>
                ))}
              </ul>

              {subscriptionLoading ? (
                <Button disabled className="w-full">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </Button>
              ) : currentTier === 'plus' ? (
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">
                    Předplatné se obnoví{" "}
                    {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("cs-CZ") : "—"}
                  </p>
                  <Button variant="outline" className="w-full" onClick={handleManageSubscription} disabled={portalLoading}>
                    {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                    Spravovat předplatné
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                  onClick={() => handleSubscribe(PREMIUM_PLUS_PRICE_ID, 'plus')}
                  disabled={checkoutLoading === 'plus'}
                >
                  {checkoutLoading === 'plus' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                  {user ? "Předplatit Premium Plus" : "Přihlaste se"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Premium;
