
-- Add module_kalkulation_enabled to bonus_settings
ALTER TABLE public.bonus_settings ADD COLUMN IF NOT EXISTS module_kalkulation_enabled boolean NOT NULL DEFAULT true;

-- Categories (hierarchical)
CREATE TABLE public.kalkulation_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  parent_id uuid REFERENCES public.kalkulation_categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kalkulation_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage kalkulation_categories" ON public.kalkulation_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Office can manage kalkulation_categories" ON public.kalkulation_categories FOR ALL USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Teamleiter can manage kalkulation_categories" ON public.kalkulation_categories FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Monteurs can view kalkulation_categories" ON public.kalkulation_categories FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));

-- PriceBooks
CREATE TABLE public.kalkulation_pricebooks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kalkulation_pricebooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage kalkulation_pricebooks" ON public.kalkulation_pricebooks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Office can manage kalkulation_pricebooks" ON public.kalkulation_pricebooks FOR ALL USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Teamleiter can manage kalkulation_pricebooks" ON public.kalkulation_pricebooks FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Monteurs can view kalkulation_pricebooks" ON public.kalkulation_pricebooks FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));

-- Products
CREATE TABLE public.kalkulation_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_number text NOT NULL DEFAULT '',
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.kalkulation_categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kalkulation_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage kalkulation_products" ON public.kalkulation_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Office can manage kalkulation_products" ON public.kalkulation_products FOR ALL USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Teamleiter can manage kalkulation_products" ON public.kalkulation_products FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Monteurs can view kalkulation_products" ON public.kalkulation_products FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));

-- Product Prices (junction: product + pricebook)
CREATE TABLE public.kalkulation_product_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.kalkulation_products(id) ON DELETE CASCADE,
  pricebook_id uuid NOT NULL REFERENCES public.kalkulation_pricebooks(id) ON DELETE CASCADE,
  material_cost numeric NOT NULL DEFAULT 0,
  hourly_rate numeric NOT NULL DEFAULT 0,
  time_budget numeric NOT NULL DEFAULT 0,
  calculation_factor numeric NOT NULL DEFAULT 1,
  final_vk numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, pricebook_id)
);
ALTER TABLE public.kalkulation_product_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage kalkulation_product_prices" ON public.kalkulation_product_prices FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Office can manage kalkulation_product_prices" ON public.kalkulation_product_prices FOR ALL USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Teamleiter can manage kalkulation_product_prices" ON public.kalkulation_product_prices FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Monteurs can view kalkulation_product_prices" ON public.kalkulation_product_prices FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));

-- Packages
CREATE TABLE public.kalkulation_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_number text NOT NULL DEFAULT '',
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.kalkulation_categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kalkulation_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage kalkulation_packages" ON public.kalkulation_packages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Office can manage kalkulation_packages" ON public.kalkulation_packages FOR ALL USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Teamleiter can manage kalkulation_packages" ON public.kalkulation_packages FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Monteurs can view kalkulation_packages" ON public.kalkulation_packages FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));

-- Package Items (products in a package)
CREATE TABLE public.kalkulation_package_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid NOT NULL REFERENCES public.kalkulation_packages(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.kalkulation_products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kalkulation_package_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage kalkulation_package_items" ON public.kalkulation_package_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Office can manage kalkulation_package_items" ON public.kalkulation_package_items FOR ALL USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Teamleiter can manage kalkulation_package_items" ON public.kalkulation_package_items FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Monteurs can view kalkulation_package_items" ON public.kalkulation_package_items FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));

-- Package Prices (junction: package + pricebook)
CREATE TABLE public.kalkulation_package_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid NOT NULL REFERENCES public.kalkulation_packages(id) ON DELETE CASCADE,
  pricebook_id uuid NOT NULL REFERENCES public.kalkulation_pricebooks(id) ON DELETE CASCADE,
  custom_override_vk numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(package_id, pricebook_id)
);
ALTER TABLE public.kalkulation_package_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage kalkulation_package_prices" ON public.kalkulation_package_prices FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Office can manage kalkulation_package_prices" ON public.kalkulation_package_prices FOR ALL USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Teamleiter can manage kalkulation_package_prices" ON public.kalkulation_package_prices FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Monteurs can view kalkulation_package_prices" ON public.kalkulation_package_prices FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));
