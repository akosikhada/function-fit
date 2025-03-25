-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "user_select" ON users;
DROP POLICY IF EXISTS "user_update" ON users;
DROP POLICY IF EXISTS "user_insert" ON users;
DROP POLICY IF EXISTS "enable_insert_for_signup" ON users;
DROP POLICY IF EXISTS "enable_select_for_user" ON users;
DROP POLICY IF EXISTS "enable_update_for_user" ON users;

-- Create new policies
-- Allow anyone to insert during signup (no RLS check for insert)
CREATE POLICY "enable_insert_for_all" ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "enable_select_for_user" ON users
  FOR SELECT
  TO public
  USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "enable_update_for_user" ON users
  FOR UPDATE
  TO public
  USING (auth.uid() = id);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT INSERT ON users TO anon;
GRANT SELECT ON users TO anon; 