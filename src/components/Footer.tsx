import { Github, Linkedin, Twitter } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import pricehunterLogo from "@/assets/pricehunter-logo.png";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card py-16">
      <div className="container">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <img src={pricehunterLogo} alt="PriceHunter Logo" className="h-11 w-11" />
              <span className="text-2xl font-bold text-yellow-400 font-display tracking-tight italic" style={{ WebkitTextStroke: '1.5px white', textShadow: '2px 2px 0 rgba(255,255,255,0.3)' }}>Price Hunter</span>
            </div>
            <p className="mb-6 max-w-md text-muted-foreground">
              {t('footerDesc')}
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-semibold">{t('footerProduct')}</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><a href="#" className="transition-colors hover:text-foreground">{t('features')}</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">{t('footerPricing')}</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">{t('footerApi')}</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">{t('footerExtension')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">{t('footerCompany')}</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><a href="#" className="transition-colors hover:text-foreground">{t('footerAbout')}</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">{t('footerBlog')}</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">{t('footerCareers')}</a></li>
              <li><a href="#" className="transition-colors hover:text-foreground">{t('footerContact')}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            {t('footerRights')}
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">{t('footerPrivacy')}</a>
            <a href="#" className="transition-colors hover:text-foreground">{t('footerTerms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
