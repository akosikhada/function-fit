-- Add email column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing records with email from auth.users
UPDATE public.users u
SET email = (
  SELECT email 
  FROM auth.users au 
  WHERE au.id = u.id
);

-- After ensuring all records have email populated,
-- make it not null and add constraints
DO $$ 
BEGIN
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
  ) THEN
    ALTER TABLE public.users 
      ALTER COLUMN email SET NOT NULL,
      ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END $$;

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email); 