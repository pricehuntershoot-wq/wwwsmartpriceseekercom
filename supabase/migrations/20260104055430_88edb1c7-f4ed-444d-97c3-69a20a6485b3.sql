-- Create enum for discount types discovered by AI
CREATE TYPE public.discovered_discount_type AS ENUM (
  'promo_code',
  'cart_discount',
  'open_box',
  'returned',
  'refurbished',
  'bundle',
  'loyalty',
  'first_purchase',
  'newsletter',
  'seasonal',
  'other'
);

-- Create enum for confidence levels
CREATE TYPE public.confidence_level AS ENUM ('low', 'medium', 'high');

-- Table for storing discovered promo codes
CREATE TABLE public.discovered_promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  code TEXT,
  description TEXT,
  discount_value TEXT,
  discount_percentage NUMERIC,
  min_order_value NUMERIC,
  expiry_date TIMESTAMP WITH TIME ZONE,
  source_url TEXT NOT NULL,
  confidence confidence_level NOT NULL DEFAULT 'medium',
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Table for storing cart-based discount patterns
CREATE TABLE public.cart_discount_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  pattern_type discovered_discount_type NOT NULL,
  description TEXT NOT NULL,
  trigger_conditions TEXT,
  expected_discount TEXT,
  source_url TEXT NOT NULL,
  confidence confidence_level NOT NULL DEFAULT 'medium',
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Table for storing analysis logs/history
CREATE TABLE public.page_analysis_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  raw_analysis JSONB,
  promo_code_found BOOLEAN DEFAULT false,
  cart_discount_found BOOLEAN DEFAULT false,
  product_condition TEXT,
  hidden_discounts_count INTEGER DEFAULT 0,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.discovered_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_discount_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_analysis_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for discovered_promo_codes (public read, admin write via service role)
CREATE POLICY "Promo codes are viewable by everyone"
ON public.discovered_promo_codes
FOR SELECT
USING (true);

-- RLS policies for cart_discount_patterns (public read)
CREATE POLICY "Cart discount patterns are viewable by everyone"
ON public.cart_discount_patterns
FOR SELECT
USING (true);

-- RLS policies for page_analysis_logs (users can view their own, public for anonymous)
CREATE POLICY "Users can view their own analysis logs"
ON public.page_analysis_logs
FOR SELECT
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Anyone can insert analysis logs"
ON public.page_analysis_logs
FOR INSERT
WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX idx_promo_codes_shop ON public.discovered_promo_codes(shop_id);
CREATE INDEX idx_promo_codes_active ON public.discovered_promo_codes(is_active) WHERE is_active = true;
CREATE INDEX idx_cart_patterns_shop ON public.cart_discount_patterns(shop_id);
CREATE INDEX idx_cart_patterns_type ON public.cart_discount_patterns(pattern_type);
CREATE INDEX idx_analysis_logs_url ON public.page_analysis_logs(url);
CREATE INDEX idx_analysis_logs_analyzed_at ON public.page_analysis_logs(analyzed_at DESC);