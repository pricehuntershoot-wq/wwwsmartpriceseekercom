import { useState } from "react";
import { Zap, LogOut, Heart, ShoppingBag, Bell, Crown, Settings, Menu } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumBadge } from "./PremiumBadge";
import { CurrencySelector } from "./CurrencySelector";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "@/hooks/useLanguage";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import pricehunterLogo from "@/assets/pricehunter-logo.png";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-emerald-900/95 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={pricehunterLogo} alt="PriceHunter Logo" className="h-20 w-20 -my-2" />
          <span className="text-2xl font-bold text-yellow-400 font-display tracking-tight italic" style={{ WebkitTextStroke: '0.5px white' }}>Price Hunter</span>
          <span className="-ml-1 rounded-md bg-orange-500 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wide rotate-[-8deg] shadow-md">
            Beta
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/products" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ShoppingBag className="mr-1 inline h-4 w-4" />
            {t('products')}
          </Link>
          <button 
            onClick={() => scrollToSection('how-it-works')} 
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('howItWorks')}
          </button>
          <button 
            onClick={() => scrollToSection('features')} 
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('features')}
          </button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
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

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSelector />
          <CurrencySelector />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <div className="flex flex-col gap-6 pt-6">
                {/* Mobile Navigation Links */}
                <nav className="flex flex-col gap-4">
                  <button
                    onClick={() => handleNavigation('/products')}
                    className="flex items-center gap-3 text-lg font-medium text-foreground"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {t('products')}
                  </button>
                  <button 
                    onClick={() => scrollToSection('how-it-works')} 
                    className="flex items-center gap-3 text-lg font-medium text-foreground"
                  >
                    {t('howItWorks')}
                  </button>
                  <button 
                    onClick={() => scrollToSection('features')} 
                    className="flex items-center gap-3 text-lg font-medium text-foreground"
                  >
                    {t('features')}
                  </button>
                </nav>

                <div className="h-px bg-border" />

                {/* Mobile User Actions */}
                {user ? (
                  <div className="flex flex-col gap-4">
                    {isPremium && <PremiumBadge size="sm" />}
                    <button
                      onClick={() => handleNavigation('/favorites')}
                      className="flex items-center gap-3 text-lg font-medium text-foreground"
                    >
                      <Heart className="h-5 w-5" />
                      {t('favorites')}
                    </button>
                    <button
                      onClick={() => handleNavigation('/alerts')}
                      className="flex items-center gap-3 text-lg font-medium text-foreground"
                    >
                      <Bell className="h-5 w-5" />
                      {t('alerts')}
                    </button>
                    <button
                      onClick={() => handleNavigation('/settings')}
                      className="flex items-center gap-3 text-lg font-medium text-foreground"
                    >
                      <Settings className="h-5 w-5" />
                      {t('settings')}
                    </button>
                    {!isPremium && (
                      <button
                        onClick={() => handleNavigation('/premium')}
                        className="flex items-center gap-3 text-lg font-medium text-accent"
                      >
                        <Crown className="h-5 w-5" />
                        {t('premium')}
                      </button>
                    )}
                    <div className="h-px bg-border" />
                    <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                      <LogOut className="h-5 w-5 mr-3" />
                      {t('signOut')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button variant="outline" className="w-full" onClick={() => handleNavigation('/auth')}>
                      {t('signIn')}
                    </Button>
                    <Button variant="hero" className="w-full" onClick={() => handleNavigation('/auth')}>
                      <Zap className="h-4 w-4 mr-2" />
                      {t('getStarted')}
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
