import { Bot, Brain, Eye, MousePointer, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";

export const HowItWorksSection = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: Eye, title: t('step1Title'), description: t('step1Desc'), accent: "primary" as const },
    { icon: Brain, title: t('step2Title'), description: t('step2Desc'), accent: "accent" as const },
    { icon: MousePointer, title: t('step3Title'), description: t('step3Desc'), accent: "primary" as const },
    { icon: ShoppingCart, title: t('step4Title'), description: t('step4Desc'), accent: "accent" as const },
  ];

  return (
    <section id="how-it-works" className="relative py-24">
      <div className="absolute inset-0 bg-gradient-surface" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium tracking-wide uppercase text-primary">{t('howItWorksBadge')}</span>
          </div>
          <h2 className="mb-4 font-heading text-3xl font-bold sm:text-4xl md:text-5xl">
            {t('howItWorksTitle')} <span className="text-gradient-primary">{t('howItWorksTitleHighlight')}</span> {t('howItWorksTitleEnd')}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            {t('howItWorksSubtitle')}
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="group relative"
            >
              <div className="relative h-full rounded-xl border border-border bg-card/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-card">
                <div className="mb-5 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    step.accent === "primary" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
