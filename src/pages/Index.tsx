import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Index = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: allProducts, isLoading } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      if (!products) return [];

      const productsWithPrices = await Promise.all(
        products.map(async (product) => {
          const { data: pricesData } = await supabase
            .from('prices')
            .select(`id, current_price, original_price, discount_type, discount_label, product_url, discovered_at, currency, shop_id`)
            .eq('product_id', product.id)
            .eq('is_active', true);

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

          return { ...product, prices: pricesWithShops };
        })
      );

      return productsWithPrices;
    }
  });

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
      const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
      if (error) { toast.error("Failed to remove favorite"); return; }
      toast.success("Removed from favorites");
    } else {
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
      if (error) { toast.error("Failed to add favorite"); return; }
      toast.success("Added to favorites");
    }
    refetchFavorites();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <HowItWorksSection />

      <main className="container py-20">
        {/* All Products */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium tracking-wide uppercase text-primary">{t('featuredDealBadge')}</span>
            </div>
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              {t('seeItInAction')}
            </h2>
          </div>
          
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : allProducts && allProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <ProductCard
                    product={product}
                    onFavorite={handleFavorite}
                    isFavorited={favorites?.includes(product.id)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No products found</p>
          )}
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Link to="/products">
            <Button size="lg" className="gap-2">
              {t('browseAllProducts')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
