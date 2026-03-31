import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BarChart3, Eye, MousePointerClick, TrendingUp, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface VariantStats {
  variant: string;
  impressions: number;
  clicks: number;
  conversionRate: number;
}

const VARIANT_LABELS: Record<string, string> = {
  price_149: "149 Kč",
  price_99: "99 Kč",
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))"];

const ABTestDashboard = () => {
  const [stats, setStats] = useState<VariantStats[]>([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);

    const { data: events } = await supabase
      .from("ab_test_events")
      .select("variant, event_type")
      .eq("test_name", "premium_plus_price");

    const { data: assignments } = await supabase
      .from("ab_test_assignments")
      .select("variant")
      .eq("test_name", "premium_plus_price");

    if (!events || !assignments) {
      setLoading(false);
      return;
    }

    setTotalVisitors(assignments.length);

    const variantMap = new Map<string, { impressions: number; clicks: number }>();

    for (const e of events) {
      if (!variantMap.has(e.variant)) {
        variantMap.set(e.variant, { impressions: 0, clicks: 0 });
      }
      const s = variantMap.get(e.variant)!;
      if (e.event_type === "impression") s.impressions++;
      if (e.event_type === "click") s.clicks++;
    }

    const result: VariantStats[] = Array.from(variantMap.entries()).map(([variant, s]) => ({
      variant,
      impressions: s.impressions,
      clicks: s.clicks,
      conversionRate: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0,
    }));

    setStats(result);
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const winner = stats.length >= 2
    ? stats.reduce((a, b) => (a.conversionRate > b.conversionRate ? a : b))
    : null;

  const chartData = stats.map((s) => ({
    name: VARIANT_LABELS[s.variant] || s.variant,
    Zobrazení: s.impressions,
    Kliknutí: s.clicks,
    "Konverze (%)": Number(s.conversionRate.toFixed(1)),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">A/B Test Dashboard</h1>
              <p className="text-muted-foreground">
                Premium Plus cenové varianty · {totalVisitors} návštěvníků
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Obnovit
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Zatím nejsou k dispozici žádná data. Zobrazte Premium Plus banner pro sběr dat.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s, i) => (
                <Card key={s.variant} className={winner?.variant === s.variant ? "border-primary/50" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {VARIANT_LABELS[s.variant] || s.variant}
                      </CardTitle>
                      {winner?.variant === s.variant && stats.length >= 2 && (
                        <Badge className="bg-primary text-primary-foreground text-[10px]">Vítěz</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{s.conversionRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.clicks} kliknutí / {s.impressions} zobrazení
                    </p>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Celkem návštěvníků
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalVisitors}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unikátních přiřazení</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Celkem kliknutí
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.reduce((a, s) => a + s.clicks, 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Napříč všemi variantami
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Porovnání variant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar dataKey="Zobrazení" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.3} />
                        ))}
                      </Bar>
                      <Bar dataKey="Kliknutí" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detail table */}
            <Card>
              <CardHeader>
                <CardTitle>Detail variant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.map((s, i) => (
                    <div key={s.variant}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <div>
                            <p className="font-medium">{VARIANT_LABELS[s.variant] || s.variant}</p>
                            <p className="text-xs text-muted-foreground">Varianta {s.variant}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{s.impressions}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{s.clicks}</span>
                          </div>
                          <Badge variant={s.conversionRate > 0 ? "default" : "secondary"}>
                            {s.conversionRate.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      {i < stats.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ABTestDashboard;
