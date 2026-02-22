import { useState } from "react";
import { Zap, LogOut, Heart, ShoppingBag, Bell, Crown, Settings, Menu, ChevronDown, Headphones, Smartphone, Watch, Speaker, Package, Gift, Sparkles, Tv, Tablet, Gamepad2, CircleDot, Monitor, Cable } from "lucide-react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumBadge } from "./PremiumBadge";
import { CurrencySelector } from "./CurrencySelector";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "@/hooks/useLanguage";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";
import pricehunterLogo from "@/assets/pricehunter-logo.png";

const PRODUCT_CATEGORIES = [
  { value: 'Headphones', labelKey: 'categoryHeadphones' as const, icon: Headphones, searchTerm: 'sluchátka' },
  { value: 'mobile_phones', labelKey: 'categoryMobilePhones' as const, icon: Smartphone, searchTerm: 'mobily' },
  { value: 'smart_watches', labelKey: 'categorySmartWatches' as const, icon: Watch, searchTerm: 'chytré hodinky' },
  { value: 'speakers', labelKey: 'categorySpeakers' as const, icon: Speaker, searchTerm: 'reproduktory' },
  { value: 'tv', labelKey: 'categoryTV' as const, icon: Tv, searchTerm: 'televize' },
  { value: 'tablets', labelKey: 'categoryTablets' as const, icon: Tablet, searchTerm: 'tablety' },
  { value: 'gaming_consoles', labelKey: 'categoryGamingConsoles' as const, icon: Gamepad2, searchTerm: 'herní konzole' },
  { value: 'smart_rings', labelKey: 'categorySmartRings' as const, icon: CircleDot, searchTerm: 'chytré prsteny' },
  { value: 'pc', labelKey: 'categoryPC' as const, icon: Monitor, searchTerm: 'počítač PC' },
  { value: 'accessories', labelKey: 'categoryAccessories' as const, icon: Cable, searchTerm: 'příslušenství elektronika' },
];

const CONDITION_OPTIONS = [
  { value: 'all', label: 'Everything' },
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'unpacked', label: 'Unpacked' },
];

export const Header = () => {
  const { user, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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

  const handleCategorySelect = (category: string | null, searchTerm?: string) => {
    if (searchTerm) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate('/products');
    }
  };

  const handleConditionSelect = (condition: string) => {
    const params = new URLSearchParams(searchParams);
    if (condition && condition !== 'all') {
      params.set('condition', condition);
    } else {
      params.delete('condition');
    }
    navigate(`/products?${params.toString()}`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass glass-border">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={pricehunterLogo} alt="PriceHunter Logo" className="h-16 w-16 -my-2" />
          <span className="text-xl font-bold text-yellow-400 font-display tracking-tight italic" style={{ WebkitTextStroke: '0.5px white' }}>Price Hunter</span>
          <span className="-ml-1 rounded bg-accent/90 px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground uppercase tracking-wider rotate-[-6deg]">
            Beta
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <ShoppingBag className="h-4 w-4" />
              {t('products')}
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>{t('categories')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleCategorySelect(null)}>
                <Package className="mr-2 h-4 w-4" />
                {t('allProducts')}
              </DropdownMenuItem>
              {PRODUCT_CATEGORIES.map(({ value, labelKey, icon: Icon, searchTerm }) => (
                <DropdownMenuItem key={value} onClick={() => handleCategorySelect(value, searchTerm)}>
                  <Icon className="mr-2 h-4 w-4" />
                  {t(labelKey)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              Condition
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {CONDITION_OPTIONS.map(({ value, label }) => (
                <DropdownMenuItem key={value} onClick={() => handleConditionSelect(value)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button 
            onClick={() => scrollToSection('how-it-works')} 
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {t('howItWorks')}
          </button>
          <Link 
            to="/analyzer" 
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Sparkles className="h-4 w-4" />
            Analyzér
          </Link>
          <button 
            onClick={() => toast.info("Coming Soon!", { description: "Gift cards feature is under development." })} 
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Gift className="h-4 w-4" />
            Gift Cards
          </button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-1.5 md:flex">
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
              <Button variant="default" size="sm" asChild>
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
                  <div className="space-y-2">
                    <span className="flex items-center gap-3 text-lg font-heading font-medium text-foreground">
                      <ShoppingBag className="h-5 w-5" />
                      {t('products')}
                    </span>
                    <div className="ml-8 flex flex-col gap-2">
                      <button
                        onClick={() => { handleCategorySelect(null); setIsOpen(false); }}
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                      >
                        <Package className="h-4 w-4" />
                        {t('allProducts')}
                      </button>
                      {PRODUCT_CATEGORIES.map(({ value, labelKey, icon: Icon, searchTerm }) => (
                        <button
                          key={value}
                          onClick={() => { handleCategorySelect(value, searchTerm); setIsOpen(false); }}
                          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {t(labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="flex items-center gap-3 text-lg font-heading font-medium text-foreground">
                      Condition
                    </span>
                    <div className="ml-8 flex flex-col gap-2">
                      {CONDITION_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => { handleConditionSelect(value); setIsOpen(false); }}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => scrollToSection('how-it-works')} 
                    className="flex items-center gap-3 text-lg font-heading font-medium text-foreground"
                  >
                    {t('howItWorks')}
                  </button>
                  <button 
                    onClick={() => handleNavigation('/analyzer')} 
                    className="flex items-center gap-3 text-lg font-heading font-medium text-foreground"
                  >
                    <Sparkles className="h-5 w-5" />
                    Cenový Analyzér
                  </button>
                  <button 
                    onClick={() => { toast.info("Coming Soon!", { description: "Gift cards feature is under development." }); setIsOpen(false); }} 
                    className="flex items-center gap-3 text-lg font-heading font-medium text-foreground"
                  >
                    <Gift className="h-5 w-5" />
                    Gift Cards
                  </button>
                </nav>

                <div className="h-px bg-border" />

                {user ? (
                  <div className="flex flex-col gap-4">
                    {isPremium && <PremiumBadge size="sm" />}
                    <button onClick={() => handleNavigation('/favorites')} className="flex items-center gap-3 text-lg font-heading font-medium text-foreground">
                      <Heart className="h-5 w-5" />
                      {t('favorites')}
                    </button>
                    <button onClick={() => handleNavigation('/alerts')} className="flex items-center gap-3 text-lg font-heading font-medium text-foreground">
                      <Bell className="h-5 w-5" />
                      {t('alerts')}
                    </button>
                    <button onClick={() => handleNavigation('/settings')} className="flex items-center gap-3 text-lg font-heading font-medium text-foreground">
                      <Settings className="h-5 w-5" />
                      {t('settings')}
                    </button>
                    {!isPremium && (
                      <button onClick={() => handleNavigation('/premium')} className="flex items-center gap-3 text-lg font-heading font-medium text-accent">
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
                    <Button variant="default" className="w-full" onClick={() => handleNavigation('/auth')}>
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
