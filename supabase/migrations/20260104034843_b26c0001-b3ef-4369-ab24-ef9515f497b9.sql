-- Add preferred_currency column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_currency text DEFAULT 'EUR';

-- Add constraint for valid currencies
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_preferred_currency_check 
CHECK (preferred_currency IN ('EUR', 'CZK'));