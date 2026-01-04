import { Bot, Clock, Eye, LineChart, Lock, Zap } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Eye,
      title: t('feature1Title'),
      description: t('feature1Desc'),
    },
    {
      icon: Bot,
      title: t('feature2Title'),
      description: t('feature2Desc'),
    },
    {
      icon: Clock,
      title: t('feature3Title'),
      description: t('feature3Desc'),
    },
    {
      icon: LineChart,
      title: t('feature4Title'),
      description: t('feature4Desc'),
    },
    {
      icon: Zap,
      title: t('feature5Title'),
      description: t('feature5Desc'),
    },
    {
      icon: Lock,
      title: t('feature6Title'),
      description: t('feature6Desc'),
    },
  ];

  return (
    <section id="features" className="relative py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      <div className="container relative z-10">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            {t('featuresTitle')} <span className="text-gradient-primary">{t('featuresTitleHighlight')}</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('featuresSubtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border bg-gradient-card p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-glow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>

              <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>

              {/* Hover gradient */}
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
