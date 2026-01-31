import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { EarlyAccessBanner } from "@/components/EarlyAccessBanner";
import { ProductsSidebar } from "@/components/ProductsSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { usePromoCodes, getPromoCodeForShop, calculatePriceWithPromo } from "@/hooks/usePromoCodes";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Search, Package, X, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

type SortOption = 'price_asc' | 'price_desc' | 'savings' | 'updated';
type CurrencyFilter = 'all' | 'EUR' | 'CZK';

const Products = () => {
  const { user } = useAuth();
  const { preferredCurrency } = useCurrencyPreference();
  const { data: promoCodes } = usePromoCodes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDiscountTypes, setSelectedDiscountTypes] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('price_asc');

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

  // Helper to get the final price after promo for a price entry
  const getFinalPrice = (price: { current_price: number; shop: { id: string } }) => {
    const promoCode = getPromoCodeForShop(promoCodes, price.shop.id);
    const { finalPrice } = calculatePriceWithPromo(price.current_price, promoCode);
    return finalPrice;
  };

  // Helper to get best price for a product (lowest final price after promos)
  const getBestPrice = (product: typeof products[0]) => {
    if (!product.prices?.length) return null;
    return product.prices.reduce((best, price) => 
      getFinalPrice(price) < getFinalPrice(best) ? price : best
    , product.prices[0]);
  };

  // Helper to get savings for a product (including promo discounts)
  const getSavings = (product: typeof products[0]) => {
    const best = getBestPrice(product);
    if (!best) return 0;
    const originalPrice = best.original_price || best.current_price;
    const finalPrice = getFinalPrice(best);
    return originalPrice - finalPrice;
  };

  // Helper to get most recent update
  const getLatestUpdate = (product: typeof products[0]) => {
    if (!product.prices?.length) return new Date(0);
    return new Date(Math.max(...product.prices.map(p => new Date(p.discovered_at).getTime())));
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products?.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      
      const matchesDiscount = selectedDiscountTypes.length === 0 || 
        product.prices.some(p => selectedDiscountTypes.includes(p.discount_type || ''));

      // Filter by currency - only show products that have prices in the selected currency
      const matchesCurrency = selectedCurrency === 'all' || 
        product.prices.some(p => (p.currency || 'EUR') === selectedCurrency);

      return matchesSearch && matchesCategory && matchesDiscount && matchesCurrency;
    });

    // If filtering by currency, also filter the prices within each product
    if (result && selectedCurrency !== 'all') {
      result = result.map(product => ({
        ...product,
        prices: product.prices.filter(p => (p.currency || 'EUR') === selectedCurrency)
      }));
    }

    if (result) {
      result = [...result].sort((a, b) => {
        switch (sortOption) {
          case 'price_asc': {
            const bestA = getBestPrice(a);
            const bestB = getBestPrice(b);
            const priceA = bestA ? getFinalPrice(bestA) : Infinity;
            const priceB = bestB ? getFinalPrice(bestB) : Infinity;
            return priceA - priceB;
          }
          case 'price_desc': {
            const bestA = getBestPrice(a);
            const bestB = getBestPrice(b);
            const priceA = bestA ? getFinalPrice(bestA) : 0;
            const priceB = bestB ? getFinalPrice(bestB) : 0;
            return priceB - priceA;
          }
          case 'savings': {
            return getSavings(b) - getSavings(a);
          }
          case 'updated': {
            return getLatestUpdate(b).getTime() - getLatestUpdate(a).getTime();
          }
          default:
            return 0;
        }
      });
    }

    return result;
  }, [products, promoCodes, searchQuery, selectedCategory, selectedDiscountTypes, selectedCurrency, sortOption]);

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
    setSelectedCurrency('all');
    setSortOption('price_asc');
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedDiscountTypes.length > 0 || selectedCurrency !== 'all';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SidebarProvider defaultOpen={true}>
        <div className="flex w-full pt-16">
          <ProductsSidebar
            categories={categories as string[]}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedDiscountTypes={selectedDiscountTypes}
            toggleDiscountType={toggleDiscountType}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            productCount={filteredProducts?.length}
          />
          
          <main className="flex-1 p-6 lg:p-8">
            {/* Early Access Banner */}
            <EarlyAccessBanner />
            
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold md:text-4xl">
                Discover <span className="text-gradient">Hidden Deals</span>
              </h1>
              <p className="mt-2 text-muted-foreground">
                Compare prices across shops and find discounts others miss
              </p>
            </div>

            {/* Search & Sort Bar */}
            <div className="mb-6 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="savings">Biggest Savings</SelectItem>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>

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
        </div>
      </SidebarProvider>
      <Footer />
    </div>
  );
};

export default Products;
