-- Remove unique constraint on product code to allow duplicate SKUs
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_code_key;