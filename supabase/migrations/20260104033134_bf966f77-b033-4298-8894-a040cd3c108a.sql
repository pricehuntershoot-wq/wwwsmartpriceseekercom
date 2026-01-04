-- Add currency column to prices table
ALTER TABLE public.prices ADD COLUMN currency text NOT NULL DEFAULT 'EUR';

-- Add currency column to price_history table for consistency
ALTER TABLE public.price_history ADD COLUMN currency text NOT NULL DEFAULT 'EUR';