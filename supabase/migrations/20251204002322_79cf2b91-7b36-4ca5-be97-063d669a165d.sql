-- Function for admins to list users with their admin role status
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Only allow admins to use this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email,
    COALESCE(ur.role = 'admin', false) AS is_admin
  FROM auth.users u
  LEFT JOIN public.user_roles ur
    ON ur.user_id = u.id
   AND ur.role = 'admin';
END;
$$;