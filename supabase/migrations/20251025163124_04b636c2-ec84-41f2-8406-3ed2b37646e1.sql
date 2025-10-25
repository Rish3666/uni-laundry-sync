-- Add pickup_token column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pickup_token TEXT UNIQUE;

-- Create function to generate unique pickup tokens
CREATE OR REPLACE FUNCTION public.generate_pickup_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    -- Generate token in format: PKP-YYYYMMDD-XXXXX
    token := 'PKP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((FLOOR(RANDOM() * 99999) + 1)::TEXT, 5, '0');
    
    -- Check if it exists
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE pickup_token = token) THEN
      RETURN token;
    END IF;
    
    counter := counter + 1;
    -- Prevent infinite loop
    IF counter > 100 THEN
      token := 'PKP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || gen_random_uuid()::TEXT;
      RETURN token;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger function to auto-generate pickup token when status becomes ready
CREATE OR REPLACE FUNCTION public.auto_generate_pickup_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only generate token if status is changing to 'ready' and token doesn't exist
  IF NEW.status = 'ready' AND (OLD.status IS NULL OR OLD.status != 'ready') AND NEW.pickup_token IS NULL THEN
    NEW.pickup_token := public.generate_pickup_token();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate pickup token
DROP TRIGGER IF EXISTS trigger_auto_generate_pickup_token ON public.orders;
CREATE TRIGGER trigger_auto_generate_pickup_token
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_pickup_token();

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;