-- Fix handle_new_user trigger to save all signup fields
-- The trigger was missing student_id and mobile_no fields

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
  
  -- Insert profile with ALL signup fields including student_id and mobile_no
  INSERT INTO public.profiles (
    user_id, 
    email, 
    student_name, 
    student_id,
    mobile_no,
    customer_number, 
    qr_code, 
    room_number, 
    gender
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'student_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'student_id',
    NEW.raw_user_meta_data->>'mobile_no',
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