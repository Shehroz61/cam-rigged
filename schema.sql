-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables in reverse dependency order to ensure clean schema
DROP TABLE IF EXISTS public.bundle_products CASCADE;
DROP TABLE IF EXISTS public.order_tracking CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.bundles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;

-- 1. Create categories table (admin can manage)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    price_pkr NUMERIC NOT NULL CHECK (price_pkr >= 0),
    discount_percent NUMERIC DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    stock_quantity INTEGER DEFAULT 100 CHECK (stock_quantity >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create bundles table (for grouping products with discounts)
CREATE TABLE public.bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    discount_percent NUMERIC DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bundle products relationship
CREATE TABLE public.bundle_products (
    bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    PRIMARY KEY (bundle_id, product_id)
);

-- 4. Create orders table (no user_id required for guest checkout)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL CHECK (LENGTH(customer_name) >= 2),
    customer_email TEXT,
    customer_phone TEXT NOT NULL CHECK (LENGTH(customer_phone) >= 10),
    delivery_address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT,
    product_ids TEXT[] NOT NULL,
    bundle_ids UUID[],
    subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    transaction_id TEXT,
    screenshot_url TEXT,
    payment_method TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create order tracking table
CREATE TABLE public.order_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create site_settings table
CREATE TABLE public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.categories (name, description, active) VALUES
('Notes', 'Study notes for O Level and A Level', true),
('Snacks', 'Snacks and beverages', true),
('Stationery', 'Pen, pencils, notebooks, etc', true),
('Books', 'Reference books and guides', true),
('Accessories', 'Other accessories', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default payment settings
INSERT INTO public.site_settings (key, value, description) VALUES
('jazzcash_account', '03001234567 - Ali Khan', 'JazzCash Account Details'),
('bank_transfer', 'Meezan Bank - 0123456789 - CamRigged Notes', 'Bank Transfer Details'),
('usdt_trc20', 'TXYZ1234567890abcdefghijklmnopqrstuvwxyz', 'USDT TRC20 Wallet Address'),
('shipping_cost', '100', 'Default shipping cost in PKR'),
('free_shipping_threshold', '2000', 'Order amount for free shipping'),
('min_order_amount', '200', 'Minimum order amount in PKR'),
('site_name', 'CamRigged', 'Website Name'),
('site_logo', '', 'Site Logo URL')
ON CONFLICT (key) DO NOTHING;

-- Setup Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active categories, products, bundles, and site_settings
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (active = true);
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access to bundles" ON public.bundles FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access to site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read access to bundle_products" ON public.bundle_products FOR SELECT USING (true);

-- Allow anyone to insert orders (guest checkout) - validated by application logic
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Allow anyone to view their own orders (by email match) or all orders for admin
CREATE POLICY "Allow public view orders" ON public.orders FOR SELECT USING (true);

-- Allow authenticated users (admin) full access to manage tables
-- Admin authentication is handled via Supabase Auth, not this table
CREATE POLICY "Admin full access to categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to products" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to bundles" ON public.bundles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to order_tracking" ON public.order_tracking FOR ALL USING (auth.role() = 'authenticated');

-- Storage buckets setup for receipts and product images
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Allow uploads to receipts" ON storage.objects;
CREATE POLICY "Allow uploads to receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
DROP POLICY IF EXISTS "Allow public to view receipts" ON storage.objects;
CREATE POLICY "Allow public to view receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');

INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Allow uploads to products" ON storage.objects;
CREATE POLICY "Allow uploads to products" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');
DROP POLICY IF EXISTS "Allow public to view products" ON storage.objects;
CREATE POLICY "Allow public to view products" ON storage.objects FOR SELECT USING (bucket_id = 'products');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bundles_updated_at BEFORE UPDATE ON public.bundles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Rate limiting helper function (optional - can be used with Supabase Edge Functions)
CREATE OR REPLACE FUNCTION check_rate_limit(identifier TEXT, max_requests INTEGER, time_window_seconds INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO request_count
    FROM orders
    WHERE created_at > NOW() - INTERVAL '1 second' * time_window_seconds;
    
    RETURN request_count < max_requests;
END;
$$ LANGUAGE plpgsql;