-- Add description field to sales table for easier identification
ALTER TABLE public.sales 
ADD COLUMN description text;

-- Add comment
COMMENT ON COLUMN public.sales.description IS 'Optional description to identify the sale, e.g., "possible exchange", customer note, etc.';