import { Bot, Brain, Eye, MousePointer, ShoppingCart, ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";

export const HowItWorksSection = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: Eye, title: t('step1Title'), description: t('step1Desc'), number: "01" },
    { icon: Brain, title: t('step2Title'), description: t('step2Desc'), number: "02" },
    { icon: MousePointer, title: t('step3Title'), description: t('step3Desc'), number: "03" },
    { icon: ShoppingCart, title: t('step4Title'), description: t('step4Desc'), number: "04" },
  ];

  return (
    <section id="how-it-works" className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-surface" />
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-primary/[0.06] px-5 py-2 shadow-inner-glow">
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium tracking-widest uppercase text-primary/90">{t('howItWorksBadge')}</span>
          </div>
          <h2 className="mb-5 font-heading text-3xl font-bold sm:text-4xl md:text-5xl">
            {t('howItWorksTitle')} <span className="text-gradient-primary">{t('howItWorksTitleHighlight')}</span> {t('howItWorksTitleEnd')}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
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
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative h-full rounded-2xl glass-card p-7 transition-all duration-500 hover:border-primary/20 hover:shadow-glow hover:-translate-y-1">
                {/* Step number */}
                <span className="absolute top-6 right-6 text-[4rem] font-heading font-bold leading-none text-foreground/[0.03]">
                  {step.number}
                </span>

                <div className="relative z-10">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/10 transition-colors group-hover:bg-primary/15">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-3 font-heading text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>

                {/* Connector arrow (not on last card) */}
                {index < steps.length - 1 && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:block z-20">
                    <ArrowRight className="h-4 w-4 text-primary/30" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};