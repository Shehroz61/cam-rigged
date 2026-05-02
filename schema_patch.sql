-- ============================================================
-- CamRigged Schema Patch v2 — Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add notes column to orders (admin rejection reason)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Admin full access to orders (needed for powerhouse to see all users' orders)
DROP POLICY IF EXISTS "Admin full access to orders" ON public.orders;
CREATE POLICY "Admin full access to orders" ON public.orders
  FOR ALL USING (auth.jwt() ->> 'email' = 'shehrozhameed61@gmail.com');

-- 3. Allow admin to delete from content storage bucket
DROP POLICY IF EXISTS "Allow authenticated deletes from content" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from content" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'content');

-- 4. Allow admin to delete from receipts storage bucket
DROP POLICY IF EXISTS "Allow authenticated deletes from receipts" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from receipts" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'receipts');

-- 5. Allow admin to delete products
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin can manage products" ON public.products
  FOR ALL USING (auth.jwt() ->> 'email' = 'shehrozhameed61@gmail.com');

-- 6. Profiles table (for user dashboard display names)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING (auth.jwt() ->> 'email' = 'shehrozhameed61@gmail.com');
