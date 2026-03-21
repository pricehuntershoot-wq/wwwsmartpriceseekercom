import { Github, Linkedin, Twitter } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import pricehunterLogo from "@/assets/pricehunter-logo.png";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="relative border-t border-border/50 py-16">
      <div className="absolute inset-0 bg-gradient-surface opacity-50" />
      <div className="container relative z-10">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <img src={pricehunterLogo} alt="PriceHunter Logo" className="h-12 w-12" />
              <span className="text-xl font-bold text-yellow-400 font-display tracking-tight italic" style={{ WebkitTextStroke: '0.5px white' }}>Price Hunter</span>
            </div>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">
              {t('footerDesc')}
            </p>
            <div className="flex items-center gap-2">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 text-muted-foreground transition-all hover:bg-primary/10 hover:border-primary/20 hover:text-primary">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">{t('footerProduct')}</h4>
            <ul className="space-y-3">
              {[t('features'), t('footerPricing'), t('footerApi'), t('footerExtension')].map((label, i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-foreground/60 transition-colors hover:text-foreground">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">{t('footerCompany')}</h4>
            <ul className="space-y-3">
              {[t('footerAbout'), t('footerBlog'), t('footerCareers'), t('footerContact')].map((label, i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-foreground/60 transition-colors hover:text-foreground">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground/60">
            {t('footerRights')}
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground/60">
            <a href="#" className="transition-colors hover:text-foreground">{t('footerPrivacy')}</a>
            <a href="#" className="transition-colors hover:text-foreground">{t('footerTerms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};