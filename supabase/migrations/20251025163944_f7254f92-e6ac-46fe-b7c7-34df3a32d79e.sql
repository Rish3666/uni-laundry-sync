-- Update the trigger to generate pickup token when ready_at is set or status becomes ready
CREATE OR REPLACE FUNCTION public.auto_generate_pickup_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Generate token if status is 'ready' or if ready_at is being set and pickup_token doesn't exist
  IF (NEW.status = 'ready' OR (NEW.ready_at IS NOT NULL AND (OLD.ready_at IS NULL OR OLD.ready_at IS DISTINCT FROM NEW.ready_at))) 
     AND NEW.pickup_token IS NULL THEN
    NEW.pickup_token := public.generate_pickup_token();
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill pickup tokens for existing orders that have ready_at but no pickup_token
UPDATE public.orders
SET pickup_token = public.generate_pickup_token()
WHERE ready_at IS NOT NULL 
  AND pickup_token IS NULL;