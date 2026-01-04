import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionState {
  subscribed: boolean;
  isPremium: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    isPremium: false,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setState({ subscribed: false, isPremium: false, subscriptionEnd: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setState({
        subscribed: data.subscribed || false,
        isPremium: data.isPremium || false,
        subscriptionEnd: data.subscriptionEnd || null,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [session?.access_token]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Refresh subscription every minute
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return { ...state, refreshSubscription: checkSubscription };
}
