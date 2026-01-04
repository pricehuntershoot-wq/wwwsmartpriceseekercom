import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, Trash2, ExternalLink, TrendingDown, Check, AlertCircle, Pencil, Search, ArrowUpDown, X, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { formatPrice as formatCurrencyPrice, Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface PriceAlert {
  id: string;
  product_id: string;
  target_price: number;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    category: string | null;
  } | null;
  current_best_price?: number;
}

type StatusFilter = 'all' | 'active' | 'paused' | 'triggered' | 'reached';
type SortOption = 'date_desc' | 'date_asc' | 'product_asc' | 'product_desc' | 'target_asc' | 'target_desc';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Alerts' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'triggered', label: 'Triggered' },
  { value: 'reached', label: 'Target Reached' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'product_asc', label: 'Product A-Z' },
  { value: 'product_desc', label: 'Product Z-A' },
  { value: 'target_asc', label: 'Target: Low to High' },
  { value: 'target_desc', label: 'Target: High to Low' },
];

// Use the imported formatCurrencyPrice with preferred currency
const MyAlerts = () => {
  const { user, loading: authLoading } = useAuth();
  const { preferredCurrency } = useCurrencyPreference();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  const [editTargetPrice, setEditTargetPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data: alertsData, error: alertsError } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      const alertsWithDetails = await Promise.all(
        (alertsData || []).map(async (alert) => {
          const { data: productData } = await supabase
            .from('products')
            .select('id, name, image_url, category')
            .eq('id', alert.product_id)
            .maybeSingle();

          const { data: pricesData } = await supabase
            .from('prices')
            .select('current_price')
            .eq('product_id', alert.product_id)
            .eq('is_active', true)
            .order('current_price', { ascending: true })
            .limit(1);

          return {
            ...alert,
            product: productData,
            current_best_price: pricesData?.[0]?.current_price,
          };
        })
      );

      setAlerts(alertsWithDetails);
      setSelectedIds(new Set()); // Clear selection on refresh
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const getAlertStatusType = (alert: PriceAlert): StatusFilter => {
    if (alert.triggered_at) return 'triggered';
    if (!alert.is_active) return 'paused';
    if (alert.current_best_price && alert.current_best_price <= Number(alert.target_price)) return 'reached';
    return 'active';
  };

  const getAlertStatus = (alert: PriceAlert) => {
    const type = getAlertStatusType(alert);
    switch (type) {
      case 'triggered':
        return { type, label: 'Triggered', color: 'bg-green-500/20 text-green-400' };
      case 'paused':
        return { type, label: 'Paused', color: 'bg-muted text-muted-foreground' };
      case 'reached':
        return { type, label: 'Target Reached!', color: 'bg-accent/20 text-accent' };
      default:
        return { type, label: 'Active', color: 'bg-primary/20 text-primary' };
    }
  };

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    let result = alerts.filter(alert => {
      const matchesSearch = !searchQuery || 
        alert.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.product?.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const alertStatus = getAlertStatusType(alert);
      const matchesStatus = statusFilter === 'all' || alertStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'product_asc':
          return (a.product?.name || '').localeCompare(b.product?.name || '');
        case 'product_desc':
          return (b.product?.name || '').localeCompare(a.product?.name || '');
        case 'target_asc':
          return Number(a.target_price) - Number(b.target_price);
        case 'target_desc':
          return Number(b.target_price) - Number(a.target_price);
        default:
          return 0;
      }
    });

    return result;
  }, [alerts, searchQuery, statusFilter, sortOption]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || sortOption !== 'date_desc';

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter('all');
    setSortOption('date_desc');
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAlerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAlerts.map(a => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk actions
  const bulkPause = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const idsToUpdate = Array.from(selectedIds);
      const { error } = await supabase
        .from('price_alerts')
        .update({ is_active: false })
        .in('id', idsToUpdate);

      if (error) throw error;

      setAlerts(prev =>
        prev.map(alert =>
          selectedIds.has(alert.id) ? { ...alert, is_active: false } : alert
        )
      );
      toast.success(`Paused ${idsToUpdate.length} alert${idsToUpdate.length > 1 ? 's' : ''}`);
      clearSelection();
    } catch (error) {
      console.error('Error pausing alerts:', error);
      toast.error("Failed to pause alerts");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const bulkActivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const idsToUpdate = Array.from(selectedIds);
      const { error } = await supabase
        .from('price_alerts')
        .update({ is_active: true })
        .in('id', idsToUpdate);

      if (error) throw error;

      setAlerts(prev =>
        prev.map(alert =>
          selectedIds.has(alert.id) ? { ...alert, is_active: true } : alert
        )
      );
      toast.success(`Activated ${idsToUpdate.length} alert${idsToUpdate.length > 1 ? 's' : ''}`);
      clearSelection();
    } catch (error) {
      console.error('Error activating alerts:', error);
      toast.error("Failed to activate alerts");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => !selectedIds.has(alert.id)));
      toast.success(`Deleted ${idsToDelete.length} alert${idsToDelete.length > 1 ? 's' : ''}`);
      clearSelection();
    } catch (error) {
      console.error('Error deleting alerts:', error);
      toast.error("Failed to delete alerts");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const toggleAlert = async (alertId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .update({ is_active: !currentStatus })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId ? { ...alert, is_active: !currentStatus } : alert
        )
      );

      toast.success(currentStatus ? "Alert paused" : "Alert activated");
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast.error("Failed to update alert");
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success("Alert deleted");
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error("Failed to delete alert");
    }
  };

  const openEditDialog = (alert: PriceAlert) => {
    setEditingAlert(alert);
    setEditTargetPrice(String(alert.target_price));
  };

  const closeEditDialog = () => {
    setEditingAlert(null);
    setEditTargetPrice("");
  };

  const handleUpdateTargetPrice = async () => {
    if (!editingAlert) return;

    const newPrice = parseFloat(editTargetPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('price_alerts')
        .update({ 
          target_price: newPrice,
          triggered_at: null
        })
        .eq('id', editingAlert.id);

      if (error) throw error;

      setAlerts(prev =>
        prev.map(alert =>
          alert.id === editingAlert.id 
            ? { ...alert, target_price: newPrice, triggered_at: null } 
            : alert
        )
      );

      toast.success("Target price updated");
      closeEditDialog();
    } catch (error) {
      console.error('Error updating target price:', error);
      toast.error("Failed to update target price");
    } finally {
      setIsUpdating(false);
    }
  };

  const isAllSelected = filteredAlerts.length > 0 && selectedIds.size === filteredAlerts.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredAlerts.length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container pb-16 pt-24">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pb-16 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            My <span className="text-gradient">Price Alerts</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Get notified when prices drop below your targets
          </p>
        </div>

        {/* Search, Filter & Sort Controls */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Bulk selection bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                  className="data-[state=indeterminate]:bg-primary"
                  {...(isSomeSelected ? { "data-state": "indeterminate" } : {})}
                />
                <label htmlFor="select-all" className="text-sm cursor-pointer">
                  {isAllSelected ? 'Deselect all' : 'Select all'}
                </label>
              </div>

              {selectedIds.size > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={bulkActivate}
                      disabled={isBulkProcessing}
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={bulkPause}
                      disabled={isBulkProcessing}
                    >
                      <BellOff className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={bulkDelete}
                      disabled={isBulkProcessing}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
              Showing {filteredAlerts.length} of {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No price alerts yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Set price alerts on products to get notified when prices drop
              </p>
              <Button asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : filteredAlerts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No matching alerts</h3>
              <p className="text-muted-foreground text-center mb-4">
                Try adjusting your search or filters
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const status = getAlertStatus(alert);
              const priceDiff = alert.current_best_price 
                ? alert.current_best_price - Number(alert.target_price)
                : null;
              const isSelected = selectedIds.has(alert.id);

              return (
                <Card 
                  key={alert.id} 
                  className={`overflow-hidden transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Checkbox */}
                    <div className="flex items-center justify-center p-3 sm:pl-4 sm:pr-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectOne(alert.id)}
                        aria-label={`Select ${alert.product?.name || 'alert'}`}
                      />
                    </div>

                    {/* Product Image */}
                    <Link 
                      to={`/products/${alert.product_id}`}
                      className="sm:w-32 sm:h-32 bg-muted flex-shrink-0"
                    >
                      {alert.product?.image_url ? (
                        <img
                          src={alert.product.image_url}
                          alt={alert.product.name || 'Product'}
                          className="w-full h-32 sm:h-full object-cover hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-32 sm:h-full flex items-center justify-center">
                          <Bell className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge className={status.color}>
                              {status.type === 'triggered' && <Check className="h-3 w-3 mr-1" />}
                              {status.label}
                            </Badge>
                            {alert.product?.category && (
                              <Badge variant="outline">{alert.product.category}</Badge>
                            )}
                          </div>
                          
                          <Link 
                            to={`/products/${alert.product_id}`}
                            className="font-semibold hover:text-primary transition-colors line-clamp-1"
                          >
                            {alert.product?.name || 'Unknown Product'}
                          </Link>

                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                            <button
                              onClick={() => openEditDialog(alert)}
                              className="flex items-center gap-1 hover:text-primary transition-colors group"
                            >
                              <span className="text-muted-foreground">Target: </span>
                              <span className={cn(
                                "font-medium",
                                preferredCurrency === 'EUR' ? "text-primary" : "text-accent"
                              )}>
                                {formatCurrencyPrice(Number(alert.target_price), preferredCurrency)}
                              </span>
                              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            {alert.current_best_price && (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Current: </span>
                                <span className="font-medium">
                                  {formatCurrencyPrice(alert.current_best_price, preferredCurrency)}
                                </span>
                                {priceDiff !== null && priceDiff > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    ({formatCurrencyPrice(priceDiff, preferredCurrency)} above)
                                  </span>
                                )}
                                {priceDiff !== null && priceDiff <= 0 && (
                                  <TrendingDown className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground mt-2">
                            Created {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                            {alert.triggered_at && (
                              <> • Triggered {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}</>
                            )}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(alert)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAlert(alert.id, alert.is_active)}
                          >
                            {alert.is_active ? (
                              <>
                                <BellOff className="h-4 w-4 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Bell className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAlert(alert.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link to={`/products/${alert.product_id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Target Price Dialog */}
        <Dialog open={!!editingAlert} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Target Price</DialogTitle>
              <DialogDescription>
                {editingAlert?.product?.name && (
                  <span className="block mt-1">
                    Update your target price for <strong>{editingAlert.product.name}</strong>
                  </span>
                )}
                {editingAlert?.current_best_price && (
                  <span className="block mt-1 text-sm">
                    Current best price: {formatCurrencyPrice(editingAlert.current_best_price, preferredCurrency)}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="mb-2 block text-sm font-medium">New Target Price ({preferredCurrency})</label>
              <Input
                type="number"
                placeholder="Enter target price"
                value={editTargetPrice}
                onChange={(e) => setEditTargetPrice(e.target.value)}
                min="1"
                step="1"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTargetPrice} disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Price"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default MyAlerts;