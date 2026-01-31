import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const FEATURED_PRODUCT_ID = "bbbb2222-2222-2222-2222-222222222222"; // Sony WH-1000XM6

const Index = () => {
  const { user } = useAuth();

  // Fetch featured product with prices and shops
  const { data: featuredProduct, isLoading } = useQuery({
    queryKey: ['featured-product', FEATURED_PRODUCT_ID],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', FEATURED_PRODUCT_ID)
        .maybeSingle();
      
      if (error) throw error;
      if (!product) return null;

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
          currency,
          shop_id
        `)
        .eq('product_id', product.id)
        .eq('is_active', true);

      // Fetch shop info for each price
      const pricesWithShops = await Promise.all(
        (pricesData || []).map(async (price) => {
          const { data: shopData } = await supabase
            .from('shops')
            .select('id, name, logo_url')
            .eq('id', price.shop_id)
            .maybeSingle();
          
          return {
            ...price,
            shop: shopData || { id: price.shop_id, name: 'Unknown', logo_url: null }
          };
        })
      );

      return {
        ...product,
        prices: pricesWithShops
      };
    }
  });

  // Fetch user favorites
  const { data: favorites, refetch: refetchFavorites } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(f => f.product_id);
    },
    enabled: !!user
  });

  const handleFavorite = async (productId: string) => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }

    const isFavorited = favorites?.includes(productId);

    if (isFavorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (error) {
        toast.error("Failed to remove favorite");
        return;
      }
      toast.success("Removed from favorites");
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: productId });
      
      if (error) {
        toast.error("Failed to add favorite");
        return;
      }
      toast.success("Added to favorites");
    }
    
    refetchFavorites();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with search and value prop */}
      <HeroSection />
      
      {/* How It Works - explains our AI-powered technology */}
      <HowItWorksSection />

      <main className="container py-16">
        {/* Featured Product */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Featured Deal</span>
            </div>
            <h2 className="text-3xl font-bold md:text-4xl">
              See It In Action
            </h2>
          </div>
          
          <div className="mx-auto max-w-md">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="aspect-square" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : featuredProduct ? (
              <ProductCard
                product={featuredProduct}
                onFavorite={handleFavorite}
                isFavorited={favorites?.includes(featuredProduct.id)}
              />
            ) : (
              <p className="text-center text-muted-foreground">Featured product not found</p>
            )}
          </div>
        </section>

        {/* CTA to Products */}
        <section className="text-center">
          <Link to="/products">
            <Button variant="hero" size="lg" className="gap-2">
              Browse All Products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
