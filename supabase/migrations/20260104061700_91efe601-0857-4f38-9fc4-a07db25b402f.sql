-- Create table to track price drop notifications with embargo for premium early access
CREATE TABLE public.price_drop_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price_id uuid NOT NULL REFERENCES public.prices(id) ON DELETE CASCADE,
  old_price numeric NOT NULL,
  new_price numeric NOT NULL,
  drop_percentage numeric NOT NULL,
  detected_at timestamp with time zone NOT NULL DEFAULT now(),
  premium_notified_at timestamp with time zone,
  standard_notified_at timestamp with time zone,
  UNIQUE(product_id, price_id)
);

-- Enable RLS
ALTER TABLE public.price_drop_notifications ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read price drop notifications
CREATE POLICY "Price drop notifications are viewable by everyone"
ON public.price_drop_notifications
FOR SELECT
USING (true);

-- Add index for faster queries
CREATE INDEX idx_price_drop_notifications_detected_at ON public.price_drop_notifications(detected_at DESC);
CREATE INDEX idx_price_drop_notifications_product_id ON public.price_drop_notifications(product_id);