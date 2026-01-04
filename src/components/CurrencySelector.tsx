import { Euro, DollarSign } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { Currency } from "@/lib/currency";

const currencies: { value: Currency; label: string; symbol: string }[] = [
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'CZK', label: 'Czech Koruna', symbol: 'Kč' },
];

export const CurrencySelector = () => {
  const { preferredCurrency, setPreferredCurrency } = useCurrencyPreference();
  
  const currentCurrency = currencies.find(c => c.value === preferredCurrency) || currencies[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 font-medium">
          <span className="text-base">{currentCurrency.symbol}</span>
          <span className="text-xs text-muted-foreground">{currentCurrency.value}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.value}
            onClick={() => setPreferredCurrency(currency.value)}
            className={preferredCurrency === currency.value ? 'bg-accent' : ''}
          >
            <span className="mr-2 text-base">{currency.symbol}</span>
            <span>{currency.label}</span>
            <span className="ml-auto text-xs text-muted-foreground">{currency.value}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
