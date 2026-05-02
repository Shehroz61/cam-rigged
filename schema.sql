-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('O Level', 'A Level')),
    description TEXT,
    price_pkr NUMERIC NOT NULL,
    price_usdt NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Single', 'Bundle')),
    encrypted_content_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create bundles table (join table)
CREATE TABLE public.bundles (
    bundle_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    single_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    PRIMARY KEY (bundle_id, single_id)
);

-- 3. Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    amount NUMERIC NOT NULL,
    transaction_id TEXT,
    screenshot_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create user_devices table
CREATE TABLE public.user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, fingerprint)
);

-- 5. Create site_settings table
CREATE TABLE public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default payment settings
INSERT INTO public.site_settings (key, value, description) VALUES
('jazzcash_account', '03001234567 - Ali Khan', 'JazzCash Account Details'),
('bank_transfer', 'Meezan Bank - 0123456789 - CamRigged Notes', 'Bank Transfer Details'),
('usdt_trc20', 'TXYZ1234567890abcdefghijklmnopqrstuvwxyz', 'USDT TRC20 Wallet Address');

-- Setup Row Level Security (RLS)

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to products, bundles, and site_settings for everyone
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access to bundles" ON public.bundles FOR SELECT USING (true);
CREATE POLICY "Allow public read access to site_settings" ON public.site_settings FOR SELECT USING (true);

-- Allow authenticated users to view their own orders and insert new orders
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view and insert their own devices
CREATE POLICY "Users can view their own devices" ON public.user_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own devices" ON public.user_devices FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage buckets setup for receipts and content
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Allow authenticated uploads to receipts" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
DROP POLICY IF EXISTS "Allow public to view receipts" ON storage.objects;
CREATE POLICY "Allow public to view receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');

INSERT INTO storage.buckets (id, name, public) VALUES ('content', 'content', false) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Allow authenticated uploads to content" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to content" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'content');
-- Note: Viewing content requires a signed URL or strict RLS in production, but for simplicity, we allow authenticated users to read.
DROP POLICY IF EXISTS "Allow authenticated to view content" ON storage.objects;
CREATE POLICY "Allow authenticated to view content" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'content');

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
