-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Add QR code and customer number to profiles
ALTER TABLE public.profiles
ADD COLUMN qr_code TEXT UNIQUE,
ADD COLUMN customer_number TEXT UNIQUE,
ADD COLUMN wallet_saved BOOLEAN DEFAULT false;

-- Function to generate customer number
CREATE OR REPLACE FUNCTION public.generate_customer_number()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Update handle_new_user function to assign customer role and generate QR
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_num TEXT;
BEGIN
  -- Generate customer number
  customer_num := public.generate_customer_number();
  
  -- Insert profile with QR code (customer number as QR identifier)
  INSERT INTO public.profiles (user_id, email, student_name, customer_number, qr_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'student_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    customer_num,
    customer_num
  );
  
  -- Assign customer role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Update orders table to add more status options and tracking
ALTER TABLE public.orders
ADD COLUMN ready_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN sms_sent BOOLEAN DEFAULT false,
ALTER COLUMN status TYPE TEXT,
ALTER COLUMN status SET DEFAULT 'pending';

-- Add check constraint for status values
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'ready', 'delivered', 'cancelled'));

-- Add RLS policy for admins to manage all orders
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders"
  ON public.orders
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update item_prices to include all service type combinations
-- This will be populated via the app