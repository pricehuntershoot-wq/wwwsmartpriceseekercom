import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

const STORAGE_KEY = 'pricehunter_search_count';
const FREE_SEARCH_LIMIT = 3;

interface SearchLimitState {
  searchesUsed: number;
  canSearch: boolean;
  remaining: number;
  isPremium: boolean;
  loading: boolean;
}

export function useSearchLimit() {
  const { user } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();

  const getStoredCount = (): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return 0;
      const parsed = JSON.parse(stored);
      // Reset daily
      const today = new Date().toDateString();
      if (parsed.date !== today) return 0;
      return parsed.count || 0;
    } catch {
      return 0;
    }
  };

  const [searchesUsed, setSearchesUsed] = useState(getStoredCount);

  const canSearch = isPremium || searchesUsed < FREE_SEARCH_LIMIT;
  const remaining = isPremium ? Infinity : Math.max(0, FREE_SEARCH_LIMIT - searchesUsed);

  const incrementSearch = useCallback(() => {
    if (isPremium) return;
    const newCount = searchesUsed + 1;
    setSearchesUsed(newCount);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      count: newCount,
      date: new Date().toDateString(),
    }));
  }, [searchesUsed, isPremium]);

  return {
    searchesUsed,
    canSearch,
    remaining,
    isPremium,
    loading: subLoading,
    incrementSearch,
    limit: FREE_SEARCH_LIMIT,
  };
}
