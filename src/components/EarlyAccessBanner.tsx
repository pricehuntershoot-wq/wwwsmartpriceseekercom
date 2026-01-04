import { Clock, Crown, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export const EarlyAccessBanner = () => {
  const { user } = useAuth();
  const { isPremium, loading } = useSubscription();

  if (loading) return null;

  if (isPremium) {
    return (
      <div className="mb-6 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-600 dark:text-amber-400">Early Access Active</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              You're seeing deals 1 hour before standard users
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-border bg-secondary/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <span className="font-medium">Want deals 1 hour earlier?</span>
            <p className="text-sm text-muted-foreground">
              Upgrade to Premium for early access alerts
            </p>
          </div>
        </div>
        <Button variant="hero" size="sm" asChild>
          <Link to={user ? "/premium" : "/auth"}>
            <Zap className="mr-1 h-4 w-4" />
            {user ? "Get Premium" : "Sign In"}
          </Link>
        </Button>
      </div>
    </div>
  );
};
