import { useState, useEffect } from "react";
import { Star, Heart, Bell, Zap, ArrowRight, Gauge, Flame, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useABTest } from "@/hooks/useABTest";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumPlusUpsellProps {
  variant?: "full" | "compact";
}

// A/B test price config
type PriceVariant = "price_149" | "price_99";

const PRICE_CONFIG: Record<PriceVariant, { promo: number; label: string }> = {
  price_149: { promo: 149, label: "149 Kč" },
  price_99: { promo: 99, label: "99 Kč" },
};

// Countdown hook — resets daily at midnight
const useCountdown = () => {
  const getTimeLeft = () => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const diff = endOfDay.getTime() - now.getTime();
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
};

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 8, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="font-heading text-lg sm:text-xl font-bold tabular-nums text-primary"
      >
        {String(value).padStart(2, "0")}
      </motion.span>
    </AnimatePresence>
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  </div>
);

const CountdownTimer = () => {
  const { hours, minutes, seconds } = useCountdown();

  return (
    <div className="flex items-center gap-1">
      <CountdownUnit value={hours} label="hod" />
      <span className="text-lg font-bold text-primary/60 -mt-3">:</span>
      <CountdownUnit value={minutes} label="min" />
      <span className="text-lg font-bold text-primary/60 -mt-3">:</span>
      <CountdownUnit value={seconds} label="sek" />
    </div>
  );
};

export const PremiumPlusUpsell = ({ variant = "full" }: PremiumPlusUpsellProps) => {
  const { user } = useAuth();
  const { isPremiumPlus, loading } = useSubscription();
  const { variant: abVariant, trackClick } = useABTest<PriceVariant>({
    testName: "premium_plus_price",
    variants: ["price_149", "price_99"],
  });

  if (loading || isPremiumPlus) return null;

  const price = abVariant ? PRICE_CONFIG[abVariant] : PRICE_CONFIG.price_149;

  const features = [
    { icon: Heart, text: "Automatické sledování oblíbených" },
    { icon: Bell, text: "Email + in-app notifikace" },
    { icon: Gauge, text: "Nastavitelný práh poklesu ceny" },
    { icon: Zap, text: "Neomezené vyhledávání a AI analýza" },
  ];

  const ctaTarget = user ? "/premium" : "/auth";
  const ctaLabel = user ? `Získat za ${price.label}` : "Přihlásit se";

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-accent/[0.04] to-primary/[0.06] p-4"
      >
        <div className="flex flex-col gap-3">
          {/* Promo strip */}
          <div className="flex items-center justify-between gap-2 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-accent shrink-0 animate-pulse" />
              <span className="text-xs font-semibold text-accent">
                Dnešní akce: 1. měsíc za {price.label}
              </span>
            </div>
            <div className="hidden sm:block">
              <CountdownTimer />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                <Star className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">Premium Plus</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    <span className="line-through opacity-60 mr-1">249 Kč</span>
                    {price.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatické sledování cen + notifikace
                </p>
              </div>
            </div>
            <Button variant="hero" size="sm" className="shrink-0 rounded-lg" asChild onClick={trackClick}>
              <Link to={ctaTarget}>
                <Star className="h-3.5 w-3.5" />
                {ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
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
              {/* Promo ribbon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="w-full rounded-xl bg-gradient-to-r from-accent/15 via-primary/10 to-accent/15 border border-accent/25 p-4"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-accent animate-pulse" />
                    <span className="font-heading text-sm sm:text-base font-bold">
                      Akční nabídka: 1. měsíc za{" "}
                      <span className="text-accent">{price.label}</span>
                      <span className="text-xs text-muted-foreground line-through ml-1.5">
                        249 Kč
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Končí za</span>
                    <CountdownTimer />
                  </div>
                </div>
              </motion.div>

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
                  Automatické sledování cen vašich oblíbených produktů každou hodinu
                  s okamžitými notifikacemi při poklesu ceny.
                </p>
              </div>

              {/* Features grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                {features.map(({ icon: Icon, text }, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 * i }}
                    className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 text-sm"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span>{text}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center gap-2 mt-1">
                <Button variant="hero" size="lg" className="rounded-xl px-8" asChild onClick={trackClick}>
                  <Link to={ctaTarget}>
                    <Star className="h-4 w-4" />
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Poté 249 Kč/měsíc · Zrušit kdykoliv
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
