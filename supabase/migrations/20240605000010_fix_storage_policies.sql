-- Create proper storage policies for avatars bucket

-- First check if bucket exists, create if it doesn't
DO $$
BEGIN
    -- This is a workaround since there's no direct bucket creation in SQL
    -- We use the storage extension's function instead
    BEGIN
        -- Create the avatars bucket if it doesn't exist using the proper function
        PERFORM storage.create_bucket('avatars', '{"public": true}');
    EXCEPTION WHEN OTHERS THEN
        -- Bucket likely already exists, continue silently
        RAISE NOTICE 'Bucket may already exist: %', SQLERRM;
    END;
END $$;

-- Remove any existing restrictive policies
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their avatars" ON storage.objects;

-- Create new public access policies for the avatars bucket

-- READ policy (allow anyone to view avatars)
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
TO anon, authenticated, service_role
USING (bucket_id = 'avatars');

-- INSERT policy (allow authenticated users to upload avatars)
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- INSERT policy for anon users (useful for initial signup)
CREATE POLICY "Allow anon users to upload avatars"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'avatars');

-- UPDATE policy (allow users to update their avatars)
CREATE POLICY "Allow users to update their avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- DELETE policy (allow users to delete their avatars)
CREATE POLICY "Allow users to delete their avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars'); 