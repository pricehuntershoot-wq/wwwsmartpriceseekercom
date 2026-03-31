CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
  price_id uuid REFERENCES public.prices(id) ON DELETE SET NULL,
  user_id uuid,
  product_url text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  referrer text
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert affiliate clicks"
ON public.affiliate_clicks FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can view own clicks"
ON public.affiliate_clicks FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_affiliate_clicks_product ON public.affiliate_clicks(product_id);
CREATE INDEX idx_affiliate_clicks_shop ON public.affiliate_clicks(shop_id);
CREATE INDEX idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at);