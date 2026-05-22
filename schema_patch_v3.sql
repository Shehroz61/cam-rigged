-- ============================================================
-- CamRigged Schema Patch v3 — Run this in Supabase SQL Editor
-- ============================================================

-- 0. Add item_details to orders for receipt snapshot
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS item_details JSONB;

-- 1. Admin full access to bundle_products
DROP POLICY IF EXISTS "Admin full access to bundle_products" ON public.bundle_products;
CREATE POLICY "Admin full access to bundle_products" ON public.bundle_products
  FOR ALL USING (auth.jwt() ->> 'email' = 'shehrozhameed61@gmail.com' OR auth.jwt() ->> 'email' LIKE 'shehrozhameed61+%');

-- 2. Admin full access to site_settings
DROP POLICY IF EXISTS "Admin full access to site_settings" ON public.site_settings;
CREATE POLICY "Admin full access to site_settings" ON public.site_settings
  FOR ALL USING (auth.jwt() ->> 'email' = 'shehrozhameed61@gmail.com' OR auth.jwt() ->> 'email' LIKE 'shehrozhameed61+%');

-- 3. Update orders admin policy to allow + suffix emails
DROP POLICY IF EXISTS "Admin full access to orders" ON public.orders;
CREATE POLICY "Admin full access to orders" ON public.orders
  FOR ALL USING (auth.jwt() ->> 'email' = 'shehrozhameed61@gmail.com' OR auth.jwt() ->> 'email' LIKE 'shehrozhameed61+%');

-- 4. Update products admin policy
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin can manage products" ON public.products
  FOR ALL USING (auth.jwt() ->> 'email' = 'shehrozhameed61@gmail.com' OR auth.jwt() ->> 'email' LIKE 'shehrozhameed61+%');

-- 5. Update categories admin policy
DROP POLICY IF EXISTS "Admin full access to categories" ON public.categories;
CREATE POLICY "Admin full access to categories" ON public.categories
  FOR ALL USING (auth.jwt() ->> 'email' = 'shehrozhameed61@gmail.com' OR auth.jwt() ->> 'email' LIKE 'shehrozhameed61+%');

-- 6. Update bundles admin policy
DROP POLICY IF EXISTS "Admin full access to bundles" ON public.bundles;
CREATE POLICY "Admin full access to bundles" ON public.bundles
  FOR ALL USING (auth.jwt() ->> 'email' = 'shehrozhameed61@gmail.com' OR auth.jwt() ->> 'email' LIKE 'shehrozhameed61+%');

-- 7. Update order_tracking admin policy
DROP POLICY IF EXISTS "Admin full access to order_tracking" ON public.order_tracking;
CREATE POLICY "Admin full access to order_tracking" ON public.order_tracking
  FOR ALL USING (auth.jwt() ->> 'email' = 'shehrozhameed61@gmail.com' OR auth.jwt() ->> 'email' LIKE 'shehrozhameed61+%');
