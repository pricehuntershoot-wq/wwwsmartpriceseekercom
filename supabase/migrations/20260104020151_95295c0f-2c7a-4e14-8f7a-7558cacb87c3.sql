-- Create price_history table to track price changes over time
CREATE TABLE public.price_history (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    price numeric NOT NULL,
    recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_price_history_product_id ON public.price_history(product_id);
CREATE INDEX idx_price_history_recorded_at ON public.price_history(recorded_at);

-- Enable Row Level Security
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read price history
CREATE POLICY "Price history is viewable by everyone" 
ON public.price_history 
FOR SELECT 
USING (true);