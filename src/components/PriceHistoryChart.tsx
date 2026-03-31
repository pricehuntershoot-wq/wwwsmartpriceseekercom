import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PriceHistoryChartProps {
  productId: string;
  currentBestPrice?: number;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(price);
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const PriceHistoryChart = ({ productId, currentBestPrice }: PriceHistoryChartProps) => {
  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ['price-history', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select(`
          id,
          price,
          recorded_at,
          shop_id,
          shops (
            id,
            name
          )
        `)
        .eq('product_id', productId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!productId
  });

  // Group data by date and shop for the chart
  const chartData = priceHistory?.reduce((acc, item) => {
    const date = format(new Date(item.recorded_at), 'MMM d');
    const shopName = (item.shops as any)?.name || 'Unknown';
    
    let existingEntry = acc.find(e => e.date === date);
    if (!existingEntry) {
      existingEntry = { date };
      acc.push(existingEntry);
    }
    existingEntry[shopName] = item.price;
    
    return acc;
  }, [] as Record<string, any>[]) || [];

  // Get unique shop names
  const shopNames = [...new Set(priceHistory?.map(item => (item.shops as any)?.name || 'Unknown'))];

  // Calculate price trend
  const getPriceTrend = () => {
    if (!priceHistory || priceHistory.length < 2) return null;
    const firstPrice = priceHistory[0].price;
    const lastPrice = priceHistory[priceHistory.length - 1].price;
    const diff = lastPrice - firstPrice;
    const percentChange = ((diff / firstPrice) * 100).toFixed(1);
    
    return {
      diff,
      percentChange,
      direction: diff < 0 ? 'down' : diff > 0 ? 'up' : 'stable'
    };
  };

  const trend = getPriceTrend();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Historie cen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingDown className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              No price history available yet.
            </p>
            <p className="text-sm text-muted-foreground/70">
              Price changes will be tracked over time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Price History
          </CardTitle>
          {trend && (
            <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
              trend.direction === 'down' 
                ? 'bg-green-500/20 text-green-500' 
                : trend.direction === 'up' 
                  ? 'bg-red-500/20 text-red-500'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {trend.direction === 'down' ? (
                <TrendingDown className="h-4 w-4" />
              ) : trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span>{Math.abs(Number(trend.percentChange))}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [formatPrice(value), '']}
              />
              <Legend />
              {shopNames.map((shopName, index) => (
                <Line
                  key={shopName}
                  type="monotone"
                  dataKey={shopName}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Price stats */}
        {priceHistory.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Lowest</p>
              <p className="text-lg font-bold text-green-500">
                {formatPrice(Math.min(...priceHistory.map(p => p.price)))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-lg font-bold">
                {formatPrice(priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Highest</p>
              <p className="text-lg font-bold text-red-500">
                {formatPrice(Math.max(...priceHistory.map(p => p.price)))}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};