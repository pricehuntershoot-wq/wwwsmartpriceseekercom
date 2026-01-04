export type Currency = 'EUR' | 'CZK';

export const formatPrice = (price: number, currency: Currency = 'EUR') => {
  const locale = currency === 'CZK' ? 'cs-CZ' : 'de-DE';
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency, 
    maximumFractionDigits: currency === 'CZK' ? 0 : 2 
  }).format(price);
};

export const getCurrencySymbol = (currency: Currency) => {
  return currency === 'CZK' ? 'Kč' : '€';
};
