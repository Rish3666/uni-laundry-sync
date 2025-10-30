-- Add RLS policies for admins to manage item prices
CREATE POLICY "Admins can update item prices"
ON public.item_prices
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert item prices"
ON public.item_prices
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete item prices"
ON public.item_prices
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));