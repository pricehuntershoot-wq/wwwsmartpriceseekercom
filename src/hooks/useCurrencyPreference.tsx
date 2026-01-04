import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CurrencyPreferenceContextType {
  preferredCurrency: Currency;
  setPreferredCurrency: (currency: Currency) => void;
}

const CurrencyPreferenceContext = createContext<CurrencyPreferenceContextType | undefined>(undefined);

const STORAGE_KEY = 'cenabuddy_preferred_currency';

export const CurrencyPreferenceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [preferredCurrency, setPreferredCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'EUR' || stored === 'CZK') ? stored : 'EUR';
  });

  // Sync from database when user logs in
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.preferred_currency) {
            const currency = data.preferred_currency as Currency;
            setPreferredCurrencyState(currency);
            localStorage.setItem(STORAGE_KEY, currency);
          }
        });
    }
  }, [user]);

  const setPreferredCurrency = async (currency: Currency) => {
    setPreferredCurrencyState(currency);
    localStorage.setItem(STORAGE_KEY, currency);
    
    // Sync to database if logged in
    if (user) {
      await supabase
        .from('profiles')
        .update({ preferred_currency: currency })
        .eq('user_id', user.id);
    }
  };

  return (
    <CurrencyPreferenceContext.Provider value={{ preferredCurrency, setPreferredCurrency }}>
      {children}
    </CurrencyPreferenceContext.Provider>
  );
};

export const useCurrencyPreference = () => {
  const context = useContext(CurrencyPreferenceContext);
  if (context === undefined) {
    throw new Error('useCurrencyPreference must be used within a CurrencyPreferenceProvider');
  }
  return context;
};
