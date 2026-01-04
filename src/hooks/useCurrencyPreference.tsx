import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency } from '@/lib/currency';

interface CurrencyPreferenceContextType {
  preferredCurrency: Currency;
  setPreferredCurrency: (currency: Currency) => void;
}

const CurrencyPreferenceContext = createContext<CurrencyPreferenceContextType | undefined>(undefined);

const STORAGE_KEY = 'cenabuddy_preferred_currency';

export const CurrencyPreferenceProvider = ({ children }: { children: ReactNode }) => {
  const [preferredCurrency, setPreferredCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'EUR' || stored === 'CZK') ? stored : 'EUR';
  });

  const setPreferredCurrency = (currency: Currency) => {
    setPreferredCurrencyState(currency);
    localStorage.setItem(STORAGE_KEY, currency);
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
