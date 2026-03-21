import { motion } from "framer-motion";
import { Shield, TrendingDown, Zap, Eye } from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Hloubková analýza",
    description: "AI prochází každou stránku a hledá skryté slevy, promo kódy a cenové úrovně.",
  },
  {
    icon: TrendingDown,
    title: "Sledování cen",
    description: "Automatické upozornění na pokles ceny u vašich sledovaných produktů.",
  },
  {
    icon: Shield,
    title: "Ověřené zdroje",
    description: "Porovnáváme ceny pouze z ověřených českých e-shopů s garancí přesnosti.",
  },
  {
    icon: Zap,
    title: "Okamžité výsledky",
    description: "Díky paralelnímu scrapingu dostanete výsledky ze všech obchodů najednou.",
  },
];

export const TrustSection = () => {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
      <div className="absolute inset-0 dot-grid opacity-15" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <h2 className="mb-5 font-heading text-3xl font-bold sm:text-4xl md:text-5xl">
            Proč <span className="text-gradient-accent">Price Hunter</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Nejsme jen další srovnávač. Naše AI odhaluje ceny, které ostatní nevidí.
          </p>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="group relative flex gap-5 rounded-2xl glass-card p-7 transition-all duration-500 hover:border-primary/20 hover:-translate-y-1">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.08] border border-primary/10 transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2 font-heading text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};