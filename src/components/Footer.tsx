import { Github, Linkedin, Twitter } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import pricehunterLogo from "@/assets/pricehunter-logo.png";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card/50 py-16">
      <div className="container">
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
            <div className="flex items-center gap-3">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('footerProduct')}</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-sm text-foreground/70 transition-colors hover:text-foreground">{t('features')}</a></li>
              <li><a href="#" className="text-sm text-foreground/70 transition-colors hover:text-foreground">{t('footerPricing')}</a></li>
              <li><a href="#" className="text-sm text-foreground/70 transition-colors hover:text-foreground">{t('footerApi')}</a></li>
              <li><a href="#" className="text-sm text-foreground/70 transition-colors hover:text-foreground">{t('footerExtension')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('footerCompany')}</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-sm text-foreground/70 transition-colors hover:text-foreground">{t('footerAbout')}</a></li>
              <li><a href="#" className="text-sm text-foreground/70 transition-colors hover:text-foreground">{t('footerBlog')}</a></li>
              <li><a href="#" className="text-sm text-foreground/70 transition-colors hover:text-foreground">{t('footerCareers')}</a></li>
              <li><a href="#" className="text-sm text-foreground/70 transition-colors hover:text-foreground">{t('footerContact')}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            {t('footerRights')}
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">{t('footerPrivacy')}</a>
            <a href="#" className="transition-colors hover:text-foreground">{t('footerTerms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
