-- Temporarily disable RLS to apply changes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "user_select" ON users;
DROP POLICY IF EXISTS "user_update" ON users;
DROP POLICY IF EXISTS "user_insert" ON users;
DROP POLICY IF EXISTS "enable_insert_for_signup" ON users;
DROP POLICY IF EXISTS "enable_select_for_user" ON users;
DROP POLICY IF EXISTS "enable_update_for_user" ON users;

-- Create new, simplified policies

-- Allow new users to create their profile during signup
CREATE POLICY "enable_insert_for_signup"
ON users FOR INSERT
WITH CHECK (
  -- Allow insert if the user is authenticated and inserting their own profile
  -- OR if no profile exists for this auth user yet
  auth.uid() = id OR
  NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
  )
);

-- Allow users to read their own profile
CREATE POLICY "enable_select_for_user"
ON users FOR SELECT
USING (
  -- Users can only see their own profile
  auth.uid() = id
);

-- Allow users to update their own profile
CREATE POLICY "enable_update_for_user"
ON users FOR UPDATE
USING (
  -- Users can only update their own profile
  auth.uid() = id
);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO service_role;
GRANT ALL ON users TO postgres;
GRANT ALL ON users TO authenticated;
GRANT INSERT, SELECT ON users TO anon; 