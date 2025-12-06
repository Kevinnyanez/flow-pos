-- Create customer_credits table for store credits from exchanges
CREATE TABLE public.customer_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  amount NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL,
  origin_sale_id UUID REFERENCES public.sales(id),
  origin_product_id UUID REFERENCES public.products(id),
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'usado', 'parcial')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_redemptions table to track when credits are used
CREATE TABLE public.credit_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID NOT NULL REFERENCES public.customer_credits(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_redemptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated full access customer_credits" 
ON public.customer_credits 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated full access credit_redemptions" 
ON public.credit_redemptions 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_customer_credits_updated_at
BEFORE UPDATE ON public.customer_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();