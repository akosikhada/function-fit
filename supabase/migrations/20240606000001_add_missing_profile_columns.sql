-- Add missing columns to the users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birthday DATE;

-- Recreate the users profile view to include the new columns
COMMENT ON COLUMN public.users.gender IS 'User''s gender preference';
COMMENT ON COLUMN public.users.birthday IS 'User''s date of birth';

-- Notify about the change
DO $$
BEGIN
  RAISE NOTICE 'Added gender and birthday columns to the users table';
END $$; 