import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ShoppingCart, Package, Sparkles, Flame, X } from "lucide-react";
import { toast } from "sonner";

const DISCOUNT_FILTERS = [
  { type: 'in_cart', label: 'In Cart', icon: ShoppingCart },
  { type: 'open_box', label: 'Open Box', icon: Package },
  { type: 'promo', label: 'Promo', icon: Sparkles },
  { type: 'clearance', label: 'Clearance', icon: Flame },
];

const Products = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDiscountTypes, setSelectedDiscountTypes] = useState<string[]>([]);

  // Fetch products with prices and shops
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');
      
      if (productsError) throw productsError;

      // Fetch prices with shop info for each product
      const productsWithPrices = await Promise.all(
        productsData.map(async (product) => {
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
        })
      );

      return productsWithPrices;
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

  // Get unique categories
  const categories = products 
    ? [...new Set(products.map(p => p.category).filter(Boolean))]
    : [];

  // Filter products
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    const matchesDiscount = selectedDiscountTypes.length === 0 || 
      product.prices.some(p => selectedDiscountTypes.includes(p.discount_type || ''));

    return matchesSearch && matchesCategory && matchesDiscount;
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

  const toggleDiscountType = (type: string) => {
    setSelectedDiscountTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedDiscountTypes([]);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedDiscountTypes.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pb-16 pt-24">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">
            Discover <span className="text-gradient">Hidden Deals</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Compare prices across shops and find discounts others miss
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Discount type filters */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Discount type:
            </span>
            {DISCOUNT_FILTERS.map(({ type, label, icon: Icon }) => (
              <Badge
                key={type}
                variant={selectedDiscountTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleDiscountType(type)}
              >
                <Icon className="mr-1 h-3 w-3" />
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results count */}
        {filteredProducts && (
          <p className="mb-4 text-sm text-muted-foreground">
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onFavorite={handleFavorite}
                isFavorited={favorites?.includes(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Products;
