-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  emoji TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  notes TEXT,
  item_type TEXT, -- 'formal', 'casual', 'traditional', 'home-linen', etc.
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create service types table
CREATE TABLE public.service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  emoji TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create item prices table
CREATE TABLE public.item_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  service_type_id UUID REFERENCES public.service_types(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(item_id, service_type_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  student_id TEXT,
  status TEXT NOT NULL DEFAULT 'received', -- received, in_process, ready, completed, cancelled
  total_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
  payment_method TEXT, -- cash, card, upi, pay_later
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  service_type_id UUID REFERENCES public.service_types(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL, -- Store name in case item is deleted
  service_name TEXT NOT NULL, -- Store name in case service is deleted
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for catalog tables (publicly readable)
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view items"
  ON public.items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view service types"
  ON public.service_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view item prices"
  ON public.item_prices FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for orders (users can only see their own orders)
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for order items (users can only see items from their orders)
CREATE POLICY "Users can view their own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their orders"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_types_updated_at
  BEFORE UPDATE ON public.service_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_item_prices_updated_at
  BEFORE UPDATE ON public.item_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert categories
INSERT INTO public.categories (name, slug, emoji, description, display_order) VALUES
  ('Men''s Wear', 'mens-wear', '👔', 'Clothing for boys and men', 1),
  ('Women''s Wear', 'womens-wear', '👗', 'Clothing for girls and women', 2),
  ('Bedding & Linen', 'bedding-linen', '🛏️', 'Home linen and bedding items', 3),
  ('Others', 'others', '📦', 'Other laundry items', 4);

-- Insert service types
INSERT INTO public.service_types (name, emoji, description, display_order) VALUES
  ('Wash', '🧼', 'Washing service', 1),
  ('Iron', '🔥', 'Ironing service', 2),
  ('Wash + Iron', '🧺', 'Wash and iron combo', 3),
  ('Dry Clean', '💨', 'Dry cleaning service', 4);