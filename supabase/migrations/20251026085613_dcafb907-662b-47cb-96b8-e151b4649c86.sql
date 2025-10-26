-- Allow admins to create orders on behalf of customers
CREATE POLICY "Admins can create orders for any user"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));