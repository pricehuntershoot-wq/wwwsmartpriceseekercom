import { Crown, Zap, ArrowRight, Sparkles, Search, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";

export const PremiumUpsellBanner = () => {
  const { user } = useAuth();
  const { isPremium, loading } = useSubscription();

  if (loading || isPremium) return null;

  const features = [
    { icon: Search, text: "Neomezené vyhledávání" },
    { icon: Sparkles, text: "AI analýza slev" },
    { icon: BarChart3, text: "Porovnání cen" },
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.06] via-accent/[0.04] to-primary/[0.06]" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-primary/[0.08] blur-[100px]" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 h-[250px] w-[250px] rounded-full bg-accent/[0.06] blur-[80px]" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="glass-card rounded-2xl border border-primary/20 p-6 sm:p-8">
            <div className="flex flex-col items-center text-center gap-6 sm:flex-row sm:text-left">
              {/* Icon */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
                <Crown className="h-8 w-8 text-primary-foreground" />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h3 className="font-heading text-xl font-bold sm:text-2xl">
                    Odemkněte Premium
                  </h3>
                  <span className="rounded-full bg-accent/15 border border-accent/30 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    99 Kč/měsíc
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                  {features.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Button variant="hero" size="lg" className="shrink-0 rounded-xl px-6" asChild>
                <Link to={user ? "/premium" : "/auth"}>
                  <Zap className="h-4 w-4" />
                  {user ? "Získat Premium" : "Přihlásit se"}
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
