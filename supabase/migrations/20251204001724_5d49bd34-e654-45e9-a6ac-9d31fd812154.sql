-- Seed admin role for admin@demo.com

-- Function to automatically assign admin role when the admin user is created
CREATE OR REPLACE FUNCTION public.handle_seed_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'admin@demo.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users to call the function for every new user
DROP TRIGGER IF EXISTS on_auth_user_seed_admin ON auth.users;

CREATE TRIGGER on_auth_user_seed_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_seed_admin_role();

-- Backfill: ensure existing admin@demo.com (if already registered) has the admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'admin@demo.com'
ON CONFLICT (user_id, role) DO NOTHING;