-- Migration: Add sizes array to products table
ALTER TABLE products ADD COLUMN sizes TEXT[] DEFAULT '{}'; 