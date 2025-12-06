-- Fix the get_users_with_roles function - cast email to text properly
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(id uuid, email text, is_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Only allow admins to use this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    COALESCE(ur.role = 'admin', false) AS is_admin
  FROM auth.users u
  LEFT JOIN public.user_roles ur
    ON ur.user_id = u.id
   AND ur.role = 'admin';
END;
$function$;

-- Add new payment methods
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'transferencia';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'mercado_pago';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'bna';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'dni';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'otro';

-- Add clothing-specific columns to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS material text,
ADD COLUMN IF NOT EXISTS gender text;