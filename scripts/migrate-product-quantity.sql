-- Migrate products quantity field
-- This migration script consolidates product quantity fields
-- by transferring data from stock_quantity to quantity 
-- for any products where quantity is not set but stock_quantity is

-- First, create a temporary backup of the current state
CREATE TABLE IF NOT EXISTS products_quantity_backup AS 
SELECT id, title, slug, quantity, stock_quantity 
FROM products;

-- Update quantity where it's NULL or 0 but stock_quantity has a value
UPDATE products 
SET quantity = stock_quantity 
WHERE (quantity IS NULL OR quantity = 0) 
AND stock_quantity IS NOT NULL 
AND stock_quantity > 0;

-- Add a default quantity where both values are NULL or 0
UPDATE products
SET quantity = 0
WHERE (quantity IS NULL OR quantity = 0)
AND (stock_quantity IS NULL OR stock_quantity = 0);

-- Set default values for min_order_quantity where it's NULL
UPDATE products
SET min_order_quantity = 1
WHERE min_order_quantity IS NULL;

-- Log the changes for verification
SELECT 'Products updated: ' || COUNT(*) as updated_count 
FROM products 
WHERE quantity > 0;

-- Option: If you want to remove the stock_quantity column later,
-- uncomment the following line:
-- ALTER TABLE products DROP COLUMN stock_quantity; 