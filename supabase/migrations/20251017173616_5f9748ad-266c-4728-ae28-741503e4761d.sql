-- Fix function search paths for security

-- Update generate_customer_number function with security definer and search path
CREATE OR REPLACE FUNCTION public.generate_customer_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
BEGIN
  SELECT 'LND' || LPAD((COUNT(*) + 1)::TEXT, 6, '0')
  INTO new_number
  FROM public.profiles;
  RETURN new_number;
END;
$$;

-- Ensure update_updated_at_column has proper security settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;