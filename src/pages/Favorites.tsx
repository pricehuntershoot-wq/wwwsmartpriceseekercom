import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Bell, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}

interface PriceAlert {
  id: string;
  product_id: string;
  target_price: number;
  is_active: boolean;
  products: {
    id: string;
    name: string;
  };
}

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
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
      setFavorites(favResult.data as unknown as Favorite[]);
    }
    if (alertResult.data) {
      setAlerts(alertResult.data as unknown as PriceAlert[]);
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
        title: 'Error',
        description: 'Failed to remove favorite',
        variant: 'destructive'
      });
    } else {
      setFavorites(favorites.filter(f => f.id !== id));
      toast({
        title: 'Removed',
        description: 'Product removed from favorites'
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
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive'
      });
    } else {
      setAlerts(alerts.filter(a => a.id !== id));
      toast({
        title: 'Deleted',
        description: 'Price alert deleted'
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
        <h1 className="text-3xl font-bold mb-8">My Favorites & Alerts</h1>
        
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Favorites Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Saved Products ({favorites.length})
              </CardTitle>
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
                      <div>
                        <p className="font-medium">{fav.products.name}</p>
                        {fav.products.category && (
                          <p className="text-sm text-muted-foreground">{fav.products.category}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFavorite(fav.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{alert.products.name}</p>
                        <p className="text-sm text-accent font-semibold">
                          Target: ${alert.target_price.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAlert(alert.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
