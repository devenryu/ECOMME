-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'inactive')),
  template_type TEXT NOT NULL CHECK (template_type IN ('minimal', 'standard', 'premium')),
  image_url TEXT,
  features TEXT[] DEFAULT '{}',
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Sellers can manage their own products" ON products;
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON orders;
DROP POLICY IF EXISTS "Sellers can update orders for their products" ON orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;

-- Create RLS policies
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Sellers can manage their own products"
  ON products FOR ALL
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can view orders for their products"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = orders.product_id
      AND products.seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update orders for their products"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = orders.product_id
      AND products.seller_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Insert test data (optional - uncomment if you want test data)
-- First, create a test user if you haven't already:
-- INSERT INTO auth.users (id, email)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com')
-- ON CONFLICT (id) DO NOTHING;

-- Then insert test products:
-- INSERT INTO products (
--   seller_id,
--   title,
--   description,
--   price,
--   currency,
--   status,
--   template_type,
--   features,
--   slug
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'Test Product',
--   'This is a test product description',
--   99.99,
--   'USD',
--   'active',
--   'minimal',
--   ARRAY['Feature 1', 'Feature 2', 'Feature 3'],
--   'test-product'
-- ) ON CONFLICT (slug) DO NOTHING; 