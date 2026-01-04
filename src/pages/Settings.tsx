import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, User, Bell, ArrowLeft, Save } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Currency } from "@/lib/currency";

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferredCurrency, setPreferredCurrency } = useCurrencyPreference();
  
  const [displayName, setDisplayName] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setDisplayName(data.display_name || "");
      }
      setLoading(false);
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container pt-24 pb-16">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
            <SettingsIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Profile</CardTitle>
              </div>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Preferred Currency</Label>
                <div className="flex gap-2">
                  <Button
                    variant={preferredCurrency === "EUR" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreferredCurrency("EUR")}
                  >
                    € EUR
                  </Button>
                  <Button
                    variant={preferredCurrency === "CZK" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreferredCurrency("CZK")}
                  >
                    Kč CZK
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This preference syncs across all your devices
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Configure how you receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via email
                  </p>
                </div>
                <Switch
                  checked={emailAlerts}
                  onCheckedChange={setEmailAlerts}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Price Drop Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when prices drop on your tracked products
                  </p>
                </div>
                <Switch
                  checked={priceDropAlerts}
                  onCheckedChange={setPriceDropAlerts}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
