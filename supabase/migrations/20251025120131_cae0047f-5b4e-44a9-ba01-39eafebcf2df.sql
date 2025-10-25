-- Add batch management fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS batch_number INTEGER,
ADD COLUMN IF NOT EXISTS batch_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scanned_by UUID REFERENCES auth.users(id);

-- Create index for batch queries
CREATE INDEX IF NOT EXISTS idx_orders_batch_number ON public.orders(batch_number);
CREATE INDEX IF NOT EXISTS idx_orders_batch_status ON public.orders(batch_status);

-- Function to auto-assign batch numbers (groups of 30)
CREATE OR REPLACE FUNCTION public.assign_batch_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_batch INTEGER;
  orders_in_current_batch INTEGER;
BEGIN
  -- Get the current batch with available slots
  SELECT batch_number INTO next_batch
  FROM public.orders
  WHERE batch_number IS NOT NULL
  GROUP BY batch_number
  HAVING COUNT(*) < 30
  ORDER BY batch_number DESC
  LIMIT 1;
  
  -- If no batch found or all batches are full, create new batch
  IF next_batch IS NULL THEN
    SELECT COALESCE(MAX(batch_number), 0) + 1 INTO next_batch
    FROM public.orders;
  ELSE
    -- Check if current batch is actually full
    SELECT COUNT(*) INTO orders_in_current_batch
    FROM public.orders
    WHERE batch_number = next_batch;
    
    IF orders_in_current_batch >= 30 THEN
      next_batch := next_batch + 1;
    END IF;
  END IF;
  
  NEW.batch_number := next_batch;
  NEW.batch_status := 'pending';
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign batch numbers
DROP TRIGGER IF EXISTS auto_assign_batch_trigger ON public.orders;
CREATE TRIGGER auto_assign_batch_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.assign_batch_number();

-- Update existing orders to have batch numbers
DO $$
DECLARE
  order_record RECORD;
  current_batch INTEGER := 1;
  batch_count INTEGER := 0;
BEGIN
  FOR order_record IN 
    SELECT id FROM public.orders 
    WHERE batch_number IS NULL 
    ORDER BY created_at
  LOOP
    UPDATE public.orders 
    SET batch_number = current_batch,
        batch_status = COALESCE(batch_status, 'pending')
    WHERE id = order_record.id;
    
    batch_count := batch_count + 1;
    
    IF batch_count >= 30 THEN
      current_batch := current_batch + 1;
      batch_count := 0;
    END IF;
  END LOOP;
END $$;

-- Add RLS policy for admins to update batch status
CREATE POLICY "Admins can update batch status and received status"
ON public.orders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));