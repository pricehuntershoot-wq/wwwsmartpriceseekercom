import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Clock, Bell, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Premium = () => {
  const { user, session } = useAuth();
  const { isPremium, subscriptionEnd, loading: subscriptionLoading, refreshSubscription } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Welcome to Premium! Your early deal alerts are now active.");
      refreshSubscription();
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Checkout was canceled.");
    }
  }, [searchParams, refreshSubscription]);

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
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
      toast.error("Failed to open subscription management.");
    } finally {
      setPortalLoading(false);
    }
  };

  const features = [
    { icon: Zap, text: "Neomezené vyhledávání across e-shops", highlight: true },
    { icon: Clock, text: "Hloubková AI analýza cen a slev", highlight: true },
    { icon: Bell, text: "Prioritní upozornění na slevy" },
    { icon: Crown, text: "Premium členský přístup" },
  ];

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
            Get Early Deal Alerts
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Be the first to know about price drops and hidden discounts. Premium members get alerts 1 hour before everyone else.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-md">
          <Card className={`relative overflow-hidden ${isPremium ? "border-primary shadow-glow" : ""}`}>
            {isPremium && (
              <div className="absolute right-4 top-4">
                <Badge className="bg-primary text-primary-foreground">
                  <Check className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Premium Plan</CardTitle>
              <CardDescription>Everything you need to catch the best deals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold">€10</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${feature.highlight ? 'bg-gradient-primary' : 'bg-primary/10'}`}>
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
              ) : isPremium ? (
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">
                    Your subscription renews on{" "}
                    {subscriptionEnd
                      ? new Date(subscriptionEnd).toLocaleDateString()
                      : "—"}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <Button
                  variant="hero"
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  {user ? "Subscribe Now" : "Sign In to Subscribe"}
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
