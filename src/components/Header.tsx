import { Bot, Zap, LogOut, Heart, ShoppingBag, Bell, Crown, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumBadge } from "./PremiumBadge";
import { CurrencySelector } from "./CurrencySelector";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "@/hooks/useLanguage";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">CenaBuddy</span>
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
            AI
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/products" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ShoppingBag className="mr-1 inline h-4 w-4" />
            {t('products')}
          </Link>
          <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t('howItWorks')}
          </a>
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t('features')}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <CurrencySelector />
          {user ? (
            <>
              {isPremium && <PremiumBadge size="sm" />}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/favorites">
                  <Heart className="h-4 w-4 mr-1" />
                  {t('favorites')}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/alerts">
                  <Bell className="h-4 w-4 mr-1" />
                  {t('alerts')}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              {!isPremium && (
                <Button variant="accent" size="sm" asChild>
                  <Link to="/premium">
                    <Crown className="h-4 w-4 mr-1" />
                    {t('premium')}
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />
                {t('signOut')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">{t('signIn')}</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/auth">
                  <Zap className="h-4 w-4" />
                  {t('getStarted')}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
