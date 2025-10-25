-- Fix trigger helper functions - TG_OP is not available in nested function calls
-- Remove TG_OP checks from helper functions that are called by trigger functions

-- Update generate_customer_number - remove TG_OP check
CREATE OR REPLACE FUNCTION public.generate_customer_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update generate_delivery_qr_code - remove TG_OP check
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