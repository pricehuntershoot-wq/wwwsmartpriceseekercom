import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, User, Bell, ArrowLeft, Save, Palette, Sun, Moon, Monitor, Crown, ExternalLink, Loader2, Percent } from "lucide-react";
import { useTheme } from "next-themes";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { isPremium, subscriptionEnd, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferredCurrency, setPreferredCurrency } = useCurrencyPreference();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  const [displayName, setDisplayName] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<{ id: string; name: string; tipli_url: string | null; cashback_percentage: number | null }[]>([]);
  const [tipliUrls, setTipliUrls] = useState<Record<string, string>>({});
  const [cashbackPcts, setCashbackPcts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setDisplayName(data.display_name || "");
      }

      // Load shops
      const { data: shopsData } = await supabase
        .from("shops")
        .select("id, name, tipli_url, cashback_percentage")
        .order("name");
      
      if (shopsData) {
        setShops(shopsData as any);
        const urls: Record<string, string> = {};
        const pcts: Record<string, string> = {};
        shopsData.forEach((s: any) => {
          if (s.tipli_url) urls[s.id] = s.tipli_url;
          if (s.cashback_percentage != null) pcts[s.id] = String(s.cashback_percentage);
        });
        setTipliUrls(urls);
        setCashbackPcts(pcts);
      }

      setLoading(false);
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user.id);

      if (error) throw error;

      // Save Plná Peněženka settings
      for (const shop of shops) {
        const newTipli = tipliUrls[shop.id]?.trim() || null;
        const newCashback = cashbackPcts[shop.id]?.trim() ? parseFloat(cashbackPcts[shop.id]) : null;
        
        const updates: Record<string, any> = {};
        if (newTipli !== shop.tipli_url) updates.tipli_url = newTipli;
        if (newCashback !== shop.cashback_percentage) updates.cashback_percentage = newCashback;
        
        if (Object.keys(updates).length > 0) {
          await supabase.from("shops").update(updates as any).eq("id", shop.id);
        }
      }

      toast({
        title: t('settingsSaved'),
        description: t('settingsSavedDesc'),
      });
    } catch (error) {
      toast({
        title: t('errorSaving'),
        description: t('errorSavingDesc'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodařilo se otevřít správu předplatného.", variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container pt-24 pb-16">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
            <SettingsIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('settings')}</h1>
            <p className="text-muted-foreground">{t('managePreferences')}</p>
          </div>
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>{t('profile')}</CardTitle>
              </div>
              <CardDescription>
                {t('updatePersonalInfo')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t('emailCannotChange')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('displayName')}</Label>
                <Input
                  id="displayName"
                  placeholder={t('enterDisplayName')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t('preferredCurrency')}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={preferredCurrency === "EUR" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreferredCurrency("EUR")}
                  >
                    € EUR
                  </Button>
                  <Button
                    variant={preferredCurrency === "CZK" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreferredCurrency("CZK")}
                  >
                    Kč CZK
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('currencySyncNote')}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t('preferredLanguage')}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={language === "en" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage("en")}
                  >
                    🇬🇧 English
                  </Button>
                  <Button
                    variant={language === "cs" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage("cs")}
                  >
                    🇨🇿 Čeština
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('languageSyncNote')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Settings */}
          <Card className={isPremium ? "border-primary/50" : ""}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle>Předplatné</CardTitle>
                {isPremium && (
                  <Badge className="ml-auto bg-primary text-primary-foreground">Aktivní</Badge>
                )}
              </div>
              <CardDescription>
                Správa vašeho Premium předplatného
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Načítání...
                </div>
              ) : isPremium ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Plán</span>
                      <span className="text-sm font-semibold text-primary">Premium – 99 Kč/měsíc</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Další obnovení</span>
                      <span className="text-sm">
                        {subscriptionEnd
                          ? new Date(subscriptionEnd).toLocaleDateString("cs-CZ")
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    Spravovat předplatné
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Změna platební metody, zrušení nebo fakturace přes Stripe
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Nemáte aktivní předplatné. S Premium získáte neomezené vyhledávání a AI analýzu cen.
                  </p>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => navigate("/premium")}
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Zobrazit Premium nabídku
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>{t('appearance')}</CardTitle>
              </div>
              <CardDescription>
                {t('appearanceDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('theme')}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    {t('lightMode')}
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    {t('darkMode')}
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    {t('systemMode')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>{t('notifications')}</CardTitle>
              </div>
              <CardDescription>
                {t('configureAlerts')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('emailNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('receiveAlertsEmail')}
                  </p>
                </div>
                <Switch
                  checked={emailAlerts}
                  onCheckedChange={setEmailAlerts}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('priceDropAlerts')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('priceDropAlertsDesc')}
                  </p>
                </div>
                <Switch
                  checked={priceDropAlerts}
                  onCheckedChange={setPriceDropAlerts}
                />
              </div>
            </CardContent>
          </Card>


           {/* Plná Peněženka Cashback Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                <CardTitle>Plná Peněženka Cashback</CardTitle>
              </div>
              <CardDescription>
                Nastavte Plná Peněženka URL a cashback procento pro každý e-shop. Uživatelům se zobrazí cashback badge u výsledků.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {shops.length === 0 ? (
                <p className="text-sm text-muted-foreground">Žádné e-shopy k dispozici.</p>
              ) : (
                shops.map((shop) => (
                  <div key={shop.id} className="flex items-center gap-3">
                    <Label className="w-32 shrink-0 text-sm font-medium">{shop.name}</Label>
                    <Input
                      placeholder="https://www.plnapenezenkacz.cz/..."
                      value={tipliUrls[shop.id] || ""}
                      onChange={(e) => setTipliUrls(prev => ({ ...prev, [shop.id]: e.target.value }))}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                        value={cashbackPcts[shop.id] || ""}
                        onChange={(e) => setCashbackPcts(prev => ({ ...prev, [shop.id]: e.target.value }))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                ))
              )}
              <p className="text-xs text-muted-foreground">
                Cashback procenta najdete na{" "}
                <a href="https://www.plnapenezenkacz.cz" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  plnapenezenkacz.cz
                </a>
              </p>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
