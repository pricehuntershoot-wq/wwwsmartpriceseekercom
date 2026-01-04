-- Add preferred_language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_language text DEFAULT 'en';

-- Add constraint for valid languages
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_preferred_language_check 
CHECK (preferred_language IN ('en', 'cs'));