-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for profile creation during signup
CREATE POLICY "Users can create their own profile."
ON public.users
FOR INSERT
TO authenticated, anon
WITH CHECK (
  -- During signup, auth.uid() will match the id being inserted
  auth.uid() = id
);

-- Create policy for viewing own profile
CREATE POLICY "Users can view their own profile."
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy for updating own profile
CREATE POLICY "Users can update their own profile."
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); 