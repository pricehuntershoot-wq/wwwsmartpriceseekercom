ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS tipli_url text DEFAULT NULL;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS cashback_percentage numeric DEFAULT NULL;