import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, ExternalLink, ShoppingCart, Package, Sparkles, Flame, Clock, ArrowLeft, Store, Bell, BellOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

const getDiscountIcon = (type: string | null) => {
  switch (type) {
    case 'in_cart':
      return <ShoppingCart className="h-3 w-3" />;
    case 'open_box':
      return <Package className="h-3 w-3" />;
    case 'promo':
      return <Sparkles className="h-3 w-3" />;
    case 'clearance':
      return <Flame className="h-3 w-3" />;
    default:
      return null;
  }
};

const getDiscountColor = (type: string | null) => {
  switch (type) {
    case 'in_cart':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'open_box':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'promo':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'clearance':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(price);
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [alertPrice, setAlertPrice] = useState("");
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  // Fetch product with prices and shops
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (productError) throw productError;
      if (!productData) return null;

      // Fetch prices with shop info
      const { data: pricesData } = await supabase
        .from('prices')
        .select(`
          id,
          current_price,
          original_price,
          discount_type,
          discount_label,
          product_url,
          discovered_at,
          shop_id
        `)
        .eq('product_id', id)
        .eq('is_active', true)
        .order('current_price', { ascending: true });

      // Fetch shop info for each price
      const pricesWithShops = await Promise.all(
        (pricesData || []).map(async (price) => {
          const { data: shopData } = await supabase
            .from('shops')
            .select('id, name, logo_url, website_url')
            .eq('id', price.shop_id)
            .maybeSingle();
          
          return {
            ...price,
            shop: shopData || { id: price.shop_id, name: 'Unknown', logo_url: null, website_url: null }
          };
        })
      );

      return {
        ...productData,
        prices: pricesWithShops
      };
    },
    enabled: !!id
  });

  // Fetch user favorites
  const { data: isFavorited, refetch: refetchFavorite } = useQuery({
    queryKey: ['favorite', user?.id, id],
    queryFn: async () => {
      if (!user || !id) return false;
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!id
  });

  // Fetch price alert for this product
  const { data: priceAlert, refetch: refetchAlert } = useQuery({
    queryKey: ['price-alert', user?.id, id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id
  });

  const handleFavorite = async () => {
    if (!user || !id) {
      toast.error("Please sign in to save favorites");
      return;
    }

    if (isFavorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id);
      
      if (error) {
        toast.error("Failed to remove favorite");
        return;
      }
      toast.success("Removed from favorites");
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: id });
      
      if (error) {
        toast.error("Failed to add favorite");
        return;
      }
      toast.success("Added to favorites");
    }
    
    refetchFavorite();
  };

  const handleCreateAlert = async () => {
    if (!user || !id) {
      toast.error("Please sign in to set price alerts");
      return;
    }

    const targetPrice = parseFloat(alertPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const { error } = await supabase
      .from('price_alerts')
      .insert({ 
        user_id: user.id, 
        product_id: id,
        target_price: targetPrice
      });
    
    if (error) {
      toast.error("Failed to create price alert");
      return;
    }
    
    toast.success(`Alert set for ${formatPrice(targetPrice)}`);
    setAlertPrice("");
    setIsAlertDialogOpen(false);
    refetchAlert();
  };

  const handleDeleteAlert = async () => {
    if (!user || !id || !priceAlert) return;

    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', priceAlert.id);
    
    if (error) {
      toast.error("Failed to delete price alert");
      return;
    }
    
    toast.success("Price alert removed");
    refetchAlert();
  };

  const bestPrice = product?.prices?.[0];
  const savings = bestPrice?.original_price 
    ? bestPrice.original_price - bestPrice.current_price 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container pb-16 pt-24">
          <Skeleton className="mb-4 h-8 w-32" />
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex flex-col items-center justify-center pb-16 pt-24">
          <Package className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h1 className="mb-2 text-2xl font-bold">Product not found</h1>
          <p className="mb-4 text-muted-foreground">The product you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pb-16 pt-24">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>

        {/* Product info */}
        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          {/* Product image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted/30">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground/50" />
              </div>
            )}
            {savings > 0 && (
              <Badge className="absolute bottom-4 left-4 bg-green-500 px-3 py-1 text-lg text-white">
                Save {formatPrice(savings)}
              </Badge>
            )}
          </div>

          {/* Product details */}
          <div>
            {product.category && (
              <Badge variant="secondary" className="mb-2">
                {product.category}
              </Badge>
            )}
            <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
            {product.description && (
              <p className="mb-4 text-muted-foreground">{product.description}</p>
            )}

            {bestPrice && (
              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary">{formatPrice(bestPrice.current_price)}</span>
                  {bestPrice.original_price && (
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(bestPrice.original_price)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Best price at {bestPrice.shop.name}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {bestPrice?.product_url && (
                <Button size="lg" asChild>
                  <a href={bestPrice.product_url} target="_blank" rel="noopener noreferrer">
                    Buy at Best Price
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleFavorite}
              >
                <Heart className={`mr-2 h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                {isFavorited ? 'Saved' : 'Save'}
              </Button>
              
              {/* Price Alert Button */}
              {priceAlert ? (
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  onClick={handleDeleteAlert}
                >
                  <BellOff className="mr-2 h-4 w-4" />
                  Alert at {formatPrice(priceAlert.target_price)}
                </Button>
              ) : (
                <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline">
                      <Bell className="mr-2 h-4 w-4" />
                      Set Price Alert
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Price Alert</DialogTitle>
                      <DialogDescription>
                        Get notified when the price drops below your target price.
                        {bestPrice && (
                          <span className="mt-2 block text-sm">
                            Current best price: <strong className="text-primary">{formatPrice(bestPrice.current_price)}</strong>
                          </span>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <label className="mb-2 block text-sm font-medium">Target Price (CZK)</label>
                      <Input
                        type="number"
                        placeholder={bestPrice ? String(Math.floor(bestPrice.current_price * 0.9)) : "Enter target price"}
                        value={alertPrice}
                        onChange={(e) => setAlertPrice(e.target.value)}
                        min="1"
                      />
                      {bestPrice && alertPrice && parseFloat(alertPrice) >= bestPrice.current_price && (
                        <p className="mt-2 text-sm text-amber-500">
                          Tip: Set a price lower than the current best price to get meaningful alerts.
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAlert}>
                        <Bell className="mr-2 h-4 w-4" />
                        Create Alert
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Price comparison table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Price Comparison ({product.prices?.length || 0} shops)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {product.prices && product.prices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Original</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.prices.map((price, index) => (
                      <TableRow key={price.id} className={index === 0 ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {price.shop.logo_url ? (
                              <img 
                                src={price.shop.logo_url} 
                                alt={price.shop.name}
                                className="h-6 w-6 rounded object-contain"
                              />
                            ) : (
                              <Store className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className="font-medium">{price.shop.name}</span>
                            {index === 0 && (
                              <Badge variant="default" className="ml-2">Best</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${index === 0 ? 'text-primary' : ''}`}>
                            {formatPrice(price.current_price)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {price.original_price ? (
                            <span className="text-muted-foreground line-through">
                              {formatPrice(price.original_price)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {price.discount_type && (
                              <Badge variant="outline" className={`text-xs ${getDiscountColor(price.discount_type)}`}>
                                {getDiscountIcon(price.discount_type)}
                                <span className="ml-1">{price.discount_type.replace('_', ' ')}</span>
                              </Badge>
                            )}
                            {price.discount_label && (
                              <Badge variant="outline" className="text-xs">
                                {price.discount_label}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(price.discovered_at), { addSuffix: true })}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {price.product_url ? (
                            <Button size="sm" variant={index === 0 ? "default" : "outline"} asChild>
                              <a href={price.product_url} target="_blank" rel="noopener noreferrer">
                                Buy
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                No price data available for this product.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;