-- Add description column to subcategories
ALTER TABLE public.subcategories 
ADD COLUMN description text;
