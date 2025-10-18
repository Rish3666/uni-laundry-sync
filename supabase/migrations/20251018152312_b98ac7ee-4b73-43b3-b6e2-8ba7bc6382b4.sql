-- Add delivery QR code column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_qr_code TEXT,
ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster QR code lookups
CREATE INDEX IF NOT EXISTS idx_orders_delivery_qr_code ON public.orders(delivery_qr_code);

-- Function to generate unique delivery QR code
CREATE OR REPLACE FUNCTION public.generate_delivery_qr_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Trigger to auto-generate delivery QR code on order creation
CREATE OR REPLACE FUNCTION public.auto_generate_delivery_qr()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.delivery_qr_code IS NULL THEN
    NEW.delivery_qr_code := public.generate_delivery_qr_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_delivery_qr ON public.orders;
CREATE TRIGGER trigger_auto_generate_delivery_qr
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_delivery_qr();