-- Create suggestions table
CREATE TABLE public.suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id),
  suggestion_text TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Users can insert suggestions (authenticated or not - but we'll use authenticated)
CREATE POLICY "Users can create suggestions"
ON public.suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
ON public.suggestions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
ON public.suggestions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));