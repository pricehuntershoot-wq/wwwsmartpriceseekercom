import { useState } from "react";
import { Zap, LogOut, Heart, Menu, Crosshair, Crown, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { LanguageSelector } from "./LanguageSelector";
import { CurrencySelector } from "./CurrencySelector";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
            <Crosshair className="h-5 w-5 text-primary" strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-heading font-bold tracking-tight">
              <span className="text-foreground">Price</span>
              <span className="text-gradient-primary">Hunter</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/favorites" className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              {t('favorites')}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/premium" className="flex items-center gap-1.5 text-primary">
              <Crown className="h-4 w-4" />
              Premium
            </Link>
          </Button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-1.5 md:flex">
          <LanguageSelector />
          <CurrencySelector />
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" />
              {t('signOut')}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">{t('signIn')}</Link>
              </Button>
              <Button variant="default" size="sm" className="rounded-xl" asChild>
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
                <nav className="flex flex-col gap-4">
                  <button
                    onClick={() => handleNavigation('/favorites')}
                    className="flex items-center gap-3 text-lg font-heading font-medium text-foreground"
                  >
                    <Heart className="h-5 w-5" />
                    {t('favorites')}
                  </button>
                  <button
                    onClick={() => handleNavigation('/premium')}
                    className="flex items-center gap-3 text-lg font-heading font-medium text-primary"
                  >
                    <Crown className="h-5 w-5" />
                    Premium
                  </button>
                </nav>
                <div className="h-px bg-border/50" />
                {user ? (
                  <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5 mr-3" />
                    {t('signOut')}
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button variant="outline" className="w-full" onClick={() => handleNavigation('/auth')}>
                      {t('signIn')}
                    </Button>
                    <Button variant="default" className="w-full rounded-xl" onClick={() => handleNavigation('/auth')}>
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