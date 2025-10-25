-- Create trigger to auto-generate delivery QR codes on order insert
CREATE TRIGGER auto_generate_delivery_qr_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_delivery_qr();

-- Ensure all existing orders have delivery QR codes
UPDATE public.orders 
SET delivery_qr_code = public.generate_delivery_qr_code()
WHERE delivery_qr_code IS NULL;