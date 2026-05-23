-- Fix receipt uploads (allow public insert instead of only authenticated)
DROP POLICY IF EXISTS "Allow uploads to receipts" ON storage.objects;
CREATE POLICY "Allow uploads to receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts');

-- Add performance indexes for main page queries
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_bundles_is_active ON public.bundles (is_active);

-- Fix public orders access vulnerability
-- 1. Drop the overly permissive public select policy
DROP POLICY IF EXISTS "Allow public view orders" ON public.orders;

-- 2. Create an RPC function to securely fetch an order by ID or tracking number
CREATE OR REPLACE FUNCTION public.get_order_by_tracking(search_track TEXT)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.orders 
  WHERE tracking_number = search_track 
     OR id::text = search_track;
$$;

-- Insert default site_settings for the new custom bank fields
INSERT INTO public.site_settings (key, value, description) VALUES
('custom_bank_name', 'Meezan Bank', 'Custom Bank Name'),
('custom_bank_details', '0123456789 - CamRigged Notes', 'Custom Bank Details')
ON CONFLICT (key) DO NOTHING;
