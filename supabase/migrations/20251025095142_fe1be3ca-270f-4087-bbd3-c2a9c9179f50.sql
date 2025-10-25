-- Add room_number and gender to profiles table
ALTER TABLE public.profiles 
ADD COLUMN room_number TEXT,
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female'));

-- Add room_number to orders table for historical records
ALTER TABLE public.orders
ADD COLUMN room_number TEXT;

-- Update handle_new_user function to include room_number and gender
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_num TEXT;
BEGIN
  -- Generate customer number
  customer_num := public.generate_customer_number();
  
  -- Insert profile with QR code (customer number as QR identifier)
  INSERT INTO public.profiles (user_id, email, student_name, customer_number, qr_code, room_number, gender)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'student_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    customer_num,
    customer_num,
    NEW.raw_user_meta_data->>'room_number',
    NEW.raw_user_meta_data->>'gender'
  );
  
  -- Assign customer role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;