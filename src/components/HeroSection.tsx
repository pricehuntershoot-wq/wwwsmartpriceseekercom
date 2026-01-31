import { ArrowRight, Bot, Search, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { RotatingBasket } from "./RotatingBasket";

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen overflow-hidden pt-32 pb-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-accent/10 blur-[100px]" />
      
      {/* Floating elements */}
      <div className="absolute top-40 left-20 animate-float opacity-20">
        <Bot className="h-12 w-12 text-primary" />
      </div>
      <div className="absolute top-60 right-32 animate-float opacity-20" style={{ animationDelay: "2s" }}>
        <Sparkles className="h-8 w-8 text-accent" />
      </div>
      
      {/* 3D Rotating Basket */}
      <div className="absolute top-1/3 left-16 opacity-30 lg:left-32">
        <RotatingBasket />
      </div>
      <div className="absolute bottom-1/4 right-16 opacity-25 lg:right-32">
        <RotatingBasket />
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {t('heroBadge')}
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            {t('heroTitlePart1')}{" "}
            <span className="text-gradient-primary">{t('heroTitleHighlight')}</span>
            <br />
            {t('heroTitlePart2')}
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            {t('heroSubtitle')}
          </p>

          {/* Search Bar */}
          <div className="mx-auto mb-8 max-w-2xl">
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-primary opacity-50 blur transition-opacity group-hover:opacity-75" />
              <div className="relative flex items-center gap-2 rounded-xl border border-border bg-card p-2">
                <Search className="ml-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('heroSearchPlaceholder')}
                  className="flex-1 bg-transparent px-2 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <Button variant="hero" size="lg">
                  {t('heroSearchButton')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>{t('heroStat1')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <span>{t('heroStat2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>{t('heroStat3')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
