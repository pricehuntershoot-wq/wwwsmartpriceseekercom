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

const PLANS = {
  premium: {
    monthly: { priceId: "price_1TDF3mFmWsNdyjNFbzPta9mx", price: 99 },
    yearly: { priceId: "price_1THskiFmWsNdyjNF1eod9lRM", price: 990, monthlyEquiv: 83 },
  },
  plus: {
    monthly: { priceId: "price_1TH6RRFmWsNdyjNF2dMiGI3e", price: 249 },
    yearly: { priceId: "price_1THslGFmWsNdyjNFHYQDlVUB", price: 2490, monthlyEquiv: 208 },
  },
};

const Premium = () => {
  const { user, session } = useAuth();
  const { isPremium, isPremiumPlus, subscriptionEnd, loading: subscriptionLoading, refreshSubscription } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
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

  const handleSubscribe = async (tier: "premium" | "plus") => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const priceId = PLANS[tier][billingInterval].priceId;
    setCheckoutLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
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
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
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
    { icon: Crown, text: "Premium členský přístup", highlight: false },
  ];

  const premiumPlusFeatures = [
    { icon: Zap, text: "Vše z Premium", highlight: false },
    { icon: Heart, text: "Automatické sledování oblíbených každou hodinu", highlight: true },
    { icon: Bell, text: "Email + in-app upozornění na pokles ceny", highlight: true },
    { icon: Star, text: "Prioritní zákaznická podpora", highlight: false },
  ];

  const currentTier = isPremiumPlus ? "plus" : isPremium ? "premium" : null;
  const isYearly = billingInterval === "yearly";

  const savingsPercent = (tier: "premium" | "plus") => {
    const monthlyTotal = PLANS[tier].monthly.price * 12;
    const yearlyTotal = PLANS[tier].yearly.price;
    return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
  };

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

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-full bg-muted p-1">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                !isYearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Měsíčně
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={`relative rounded-full px-5 py-2 text-sm font-medium transition-all ${
                isYearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ročně
              <span className="absolute -right-2 -top-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                -{savingsPercent("premium")}%
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Premium */}
          <PlanCard
            tier="premium"
            title="Premium"
            description="Pro chytré nakupování"
            icon={Crown}
            features={premiumFeatures}
            plan={PLANS.premium}
            billingInterval={billingInterval}
            savings={savingsPercent("premium")}
            currentTier={currentTier}
            subscriptionEnd={subscriptionEnd}
            subscriptionLoading={subscriptionLoading}
            checkoutLoading={checkoutLoading}
            portalLoading={portalLoading}
            user={user}
            onSubscribe={() => handleSubscribe("premium")}
            onManage={handleManageSubscription}
          />

          {/* Premium Plus */}
          <PlanCard
            tier="plus"
            title="Premium Plus"
            description="Sledujeme za vás, 24/7"
            icon={Star}
            features={premiumPlusFeatures}
            plan={PLANS.plus}
            billingInterval={billingInterval}
            savings={savingsPercent("plus")}
            currentTier={currentTier}
            subscriptionEnd={subscriptionEnd}
            subscriptionLoading={subscriptionLoading}
            checkoutLoading={checkoutLoading}
            portalLoading={portalLoading}
            user={user}
            onSubscribe={() => handleSubscribe("plus")}
            onManage={handleManageSubscription}
            recommended
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

interface PlanCardProps {
  tier: "premium" | "plus";
  title: string;
  description: string;
  icon: React.ElementType;
  features: { icon: React.ElementType; text: string; highlight: boolean }[];
  plan: typeof PLANS.premium;
  billingInterval: "monthly" | "yearly";
  savings: number;
  currentTier: string | null;
  subscriptionEnd: string | null;
  subscriptionLoading: boolean;
  checkoutLoading: string | null;
  portalLoading: boolean;
  user: any;
  onSubscribe: () => void;
  onManage: () => void;
  recommended?: boolean;
}

const PlanCard = ({
  tier, title, description, icon: Icon, features, plan, billingInterval, savings,
  currentTier, subscriptionEnd, subscriptionLoading, checkoutLoading, portalLoading,
  user, onSubscribe, onManage, recommended,
}: PlanCardProps) => {
  const isActive = currentTier === tier;
  const isYearly = billingInterval === "yearly";
  const currentPlan = plan[billingInterval];
  const isPlus = tier === "plus";
  const hasHigherPlan = tier === "premium" && currentTier === "plus";

  return (
    <Card className={`relative overflow-hidden ${isPlus ? "border-2" : ""} ${
      isActive ? "border-primary shadow-glow" : isPlus ? "border-primary/30" : ""
    }`}>
      {!currentTier && recommended && (
        <div className="absolute right-4 top-4">
          <Badge className="bg-gradient-primary text-primary-foreground">
            <Star className="mr-1 h-3 w-3" />
            Doporučeno
          </Badge>
        </div>
      )}
      {isActive && (
        <div className="absolute right-4 top-4">
          <Badge className="bg-primary text-primary-foreground">
            <Check className="mr-1 h-3 w-3" />
            Aktivní
          </Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
          isPlus ? "bg-gradient-to-br from-primary to-accent" : "bg-gradient-primary"
        }`}>
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          {isYearly ? (
            <>
              <div className="mb-1 text-sm text-muted-foreground line-through">
                {plan.monthly.price * 12} Kč/rok
              </div>
              <span className="text-4xl font-bold">{currentPlan.price} Kč</span>
              <span className="text-muted-foreground">/rok</span>
              <div className="mt-1 text-sm text-primary font-medium">
                = {plan.yearly.monthlyEquiv} Kč/měsíc · ušetříte {savings}%
              </div>
            </>
          ) : (
            <>
              <span className="text-4xl font-bold">{currentPlan.price} Kč</span>
              <span className="text-muted-foreground">/měsíc</span>
            </>
          )}
        </div>

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                feature.highlight
                  ? isPlus ? "bg-gradient-to-br from-primary to-accent" : "bg-gradient-primary"
                  : "bg-primary/10"
              }`}>
                <feature.icon className={`h-4 w-4 ${feature.highlight ? "text-primary-foreground" : "text-primary"}`} />
              </div>
              <span className={`text-sm ${feature.highlight ? "font-medium" : ""}`}>{feature.text}</span>
              {feature.highlight && isPlus && (
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
        ) : isActive ? (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Předplatné se obnoví{" "}
              {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("cs-CZ") : "—"}
            </p>
            <Button variant="outline" className="w-full" onClick={onManage} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
              Spravovat předplatné
            </Button>
          </div>
        ) : hasHigherPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Máte vyšší plán
          </Button>
        ) : (
          <Button
            className={`w-full ${isPlus
              ? "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
              : ""
            }`}
            variant={isPlus ? "default" : "hero"}
            onClick={onSubscribe}
            disabled={checkoutLoading === tier}
          >
            {checkoutLoading === tier ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isPlus ? (
              <Star className="mr-2 h-4 w-4" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {user ? (isPlus ? "Předplatit Premium Plus" : "Předplatit nyní") : "Přihlaste se"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default Premium;
