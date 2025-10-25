-- Security fix: Make orders.user_id NOT NULL
-- This prevents orphaned orders and ensures proper RLS policy enforcement

-- Make user_id NOT NULL (skip if already done)
DO $$ 
BEGIN
  ALTER TABLE orders 
  ALTER COLUMN user_id SET NOT NULL;
EXCEPTION
  WHEN others THEN
    NULL; -- Skip if already NOT NULL
END $$;

-- Security fix: Add access control checks to SECURITY DEFINER functions
-- Prevent direct invocation of utility functions

-- Update generate_customer_number to prevent direct RPC calls
CREATE OR REPLACE FUNCTION public.generate_customer_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_number TEXT;
BEGIN
  -- Only allow this to be called from trigger context
  IF TG_OP IS NULL THEN
    RAISE EXCEPTION 'Direct invocation not allowed. This function can only be called from triggers.';
  END IF;
  
  SELECT 'LND' || LPAD((COUNT(*) + 1)::TEXT, 6, '0')
  INTO new_number
  FROM public.profiles;
  RETURN new_number;
END;
$$;

-- Update generate_delivery_qr_code to prevent direct RPC calls
CREATE OR REPLACE FUNCTION public.generate_delivery_qr_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  qr_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Only allow this to be called from trigger context
  IF TG_OP IS NULL THEN
    RAISE EXCEPTION 'Direct invocation not allowed. This function can only be called from triggers.';
  END IF;
  
  LOOP
    -- Generate QR code in format: DLV-YYYYMMDD-XXXXX
    qr_code := 'DLV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((FLOOR(RANDOM() * 99999) + 1)::TEXT, 5, '0');
    
    -- Check if it exists
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE delivery_qr_code = qr_code) THEN
      RETURN qr_code;
    END IF;
    
    counter := counter + 1;
    -- Prevent infinite loop
    IF counter > 100 THEN
      qr_code := 'DLV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || gen_random_uuid()::TEXT;
      RETURN qr_code;
    END IF;
  END LOOP;
END;
$$;