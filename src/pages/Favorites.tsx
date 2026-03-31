import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useCurrencyPreference } from '@/hooks/useCurrencyPreference';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Bell, Trash2, Loader2, ExternalLink, TrendingDown, Zap, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, Currency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface FavoritePrice {
  current_price: number;
  currency: string;
}

interface Favorite {
  id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    image_url: string | null;
  };
  best_eur_price?: number;
  best_czk_price?: number;
}

interface PriceAlert {
  id: string;
  product_id: string;
  target_price: number;
  is_active: boolean;
  currency?: string;
  products: {
    id: string;
    name: string;
  };
  current_best_price?: number;
}

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPremiumPlus } = useSubscription();
  const { preferredCurrency } = useCurrencyPreference();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    const [favResult, alertResult] = await Promise.all([
      supabase
        .from('favorites')
        .select('id, product_id, products(id, name, description, category, image_url)')
        .eq('user_id', user!.id),
      supabase
        .from('price_alerts')
        .select('id, product_id, target_price, is_active, products(id, name)')
        .eq('user_id', user!.id)
    ]);

    if (favResult.data) {
      // Fetch prices for each favorite to show best prices
      const favsWithPrices = await Promise.all(
        (favResult.data as unknown as Favorite[]).map(async (fav) => {
          const { data: pricesData } = await supabase
            .from('prices')
            .select('current_price, currency')
            .eq('product_id', fav.product_id)
            .eq('is_active', true);
          
          const eurPrices = (pricesData || []).filter(p => (p.currency || 'EUR') === 'EUR');
          const czkPrices = (pricesData || []).filter(p => p.currency === 'CZK');
          
          return {
            ...fav,
            best_eur_price: eurPrices.length > 0 ? Math.min(...eurPrices.map(p => p.current_price)) : undefined,
            best_czk_price: czkPrices.length > 0 ? Math.min(...czkPrices.map(p => p.current_price)) : undefined,
          };
        })
      );
      setFavorites(favsWithPrices);
    }
    
    if (alertResult.data) {
      // Fetch current prices for alerts
      const alertsWithPrices = await Promise.all(
        (alertResult.data as unknown as PriceAlert[]).map(async (alert) => {
          const { data: pricesData } = await supabase
            .from('prices')
            .select('current_price')
            .eq('product_id', alert.product_id)
            .eq('is_active', true)
            .order('current_price', { ascending: true })
            .limit(1);
          
          return {
            ...alert,
            current_best_price: pricesData?.[0]?.current_price,
          };
        })
      );
      setAlerts(alertsWithPrices);
    }
    
    setLoading(false);
  };

  const removeFavorite = async (id: string) => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se odebrat z oblíbených',
        variant: 'destructive'
      });
    } else {
      setFavorites(favorites.filter(f => f.id !== id));
      toast({
        title: 'Odebráno',
        description: 'Produkt byl odebrán z oblíbených'
      });
    }
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se smazat upozornění',
        variant: 'destructive'
      });
    } else {
      setAlerts(alerts.filter(a => a.id !== id));
      toast({
        title: 'Smazáno',
        description: 'Cenové upozornění bylo smazáno'
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-8">Oblíbené a upozornění</h1>
        
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Favorites Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Saved Products ({favorites.length})
              </CardTitle>
              {isPremiumPlus && (
                <div className="flex items-center gap-2 rounded-md bg-primary/10 border border-primary/20 px-3 py-2 mt-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs text-primary font-medium">
                    Premium Plus — ceny se automaticky kontrolují každou hodinu
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {favorites.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No saved products yet. Browse deals and save your favorites!
                </p>
              ) : (
                <div className="space-y-3">
                  {favorites.map((fav) => (
                    <div key={fav.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <Link to={`/products/${fav.product_id}`} className="flex-1 hover:text-primary transition-colors">
                        <p className="font-medium">{fav.products.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {fav.best_eur_price !== undefined && (
                            <span className={cn(
                              "text-sm",
                              preferredCurrency === 'EUR' ? "text-primary font-semibold" : "text-muted-foreground"
                            )}>
                              {preferredCurrency === 'EUR' && "★ "}{formatPrice(fav.best_eur_price, 'EUR')}
                            </span>
                          )}
                          {fav.best_eur_price !== undefined && fav.best_czk_price !== undefined && (
                            <span className="text-muted-foreground">|</span>
                          )}
                          {fav.best_czk_price !== undefined && (
                            <span className={cn(
                              "text-sm",
                              preferredCurrency === 'CZK' ? "text-primary font-semibold" : "text-muted-foreground"
                            )}>
                              {preferredCurrency === 'CZK' && "★ "}{formatPrice(fav.best_czk_price, 'CZK')}
                            </span>
                          )}
                        </div>
                        {fav.products.category && (
                          <Badge variant="outline" className="mt-1 text-xs">{fav.products.category}</Badge>
                        )}
                        {isPremiumPlus && (
                          <Badge className="mt-1 text-xs bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
                            <Star className="h-3 w-3 mr-1" />
                            Automaticky sledováno
                          </Badge>
                        )}
                      </Link>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link to={`/products/${fav.product_id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFavorite(fav.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-accent" />
                Price Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No price alerts set. Set alerts to get notified when prices drop!
                </p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const isTargetReached = alert.current_best_price && alert.current_best_price <= alert.target_price;
                    return (
                      <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <Link to={`/products/${alert.product_id}`} className="flex-1 hover:text-primary transition-colors">
                          <p className="font-medium">{alert.products.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              "text-sm font-semibold",
                              preferredCurrency === 'EUR' ? "text-primary" : "text-accent"
                            )}>
                              Target: {formatPrice(alert.target_price, preferredCurrency)}
                            </span>
                            {alert.current_best_price && (
                              <>
                                <span className="text-muted-foreground">|</span>
                                <span className="text-sm text-muted-foreground">
                                  Current: {formatPrice(alert.current_best_price, preferredCurrency)}
                                </span>
                                {isTargetReached && (
                                  <TrendingDown className="h-4 w-4 text-green-500" />
                                )}
                              </>
                            )}
                          </div>
                          {!alert.is_active && (
                            <Badge variant="outline" className="mt-1 text-xs">Paused</Badge>
                          )}
                        </Link>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link to={`/products/${alert.product_id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAlert(alert.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
