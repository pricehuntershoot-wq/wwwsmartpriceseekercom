import { Star, Heart, Bell, Zap, ArrowRight, Gauge } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";

interface PremiumPlusUpsellProps {
  variant?: "full" | "compact";
}

export const PremiumPlusUpsell = ({ variant = "full" }: PremiumPlusUpsellProps) => {
  const { user } = useAuth();
  const { isPremiumPlus, loading } = useSubscription();

  if (loading || isPremiumPlus) return null;

  const features = [
    { icon: Heart, text: "Automatické sledování oblíbených" },
    { icon: Bell, text: "Email + in-app notifikace" },
    { icon: Gauge, text: "Nastavitelný práh poklesu ceny" },
    { icon: Zap, text: "Neomezené vyhledávání a AI analýza" },
  ];

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-accent/[0.04] to-primary/[0.06] p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Star className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Premium Plus</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  249 Kč/měsíc
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatické sledování cen + notifikace
              </p>
            </div>
          </div>
          <Button variant="hero" size="sm" className="shrink-0 rounded-lg" asChild>
            <Link to={user ? "/premium" : "/auth"}>
              <Star className="h-3.5 w-3.5" />
              {user ? "Upgradovat" : "Přihlásit se"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.06] via-primary/[0.04] to-accent/[0.06]" />
      <div className="absolute top-1/3 left-1/3 -translate-y-1/2 h-[250px] w-[250px] rounded-full bg-accent/[0.1] blur-[100px]" />
      <div className="absolute bottom-1/3 right-1/3 h-[200px] w-[200px] rounded-full bg-primary/[0.08] blur-[80px]" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="glass-card rounded-2xl border border-accent/20 p-6 sm:p-8">
            <div className="flex flex-col items-center text-center gap-5">
              {/* Header */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
                <Star className="h-8 w-8 text-primary-foreground" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="font-heading text-xl font-bold sm:text-2xl">
                    Premium Plus
                  </h3>
                  <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
                    249 Kč/měsíc
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Automatické sledování cen vašich oblíbených produktů každou hodinu s okamžitými notifikacemi při poklesu ceny.
                </p>
              </div>

              {/* Features grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                {features.map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 text-sm"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button variant="hero" size="lg" className="rounded-xl px-8 mt-1" asChild>
                <Link to={user ? "/premium" : "/auth"}>
                  <Star className="h-4 w-4" />
                  {user ? "Získat Premium Plus" : "Přihlásit se"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
