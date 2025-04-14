# Supabase Setup

## Storage Policy Issue Fix

If you're encountering the error: `new row violates row-level security policy` when uploading files to Supabase storage, follow these steps:

### Option 1: Run the Migration File (Recommended)

1. Make sure you have the Supabase CLI installed
2. Run the migration:
   ```
   supabase migration up
   ```
   This will apply all pending migrations including `20240605000010_fix_storage_policies.sql`

### Option 2: Apply Manually via Supabase Dashboard

If you prefer to apply the changes manually:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to Storage > Buckets
4. Create a bucket named "avatars" if it doesn't exist (set to public)
5. Go to Storage > Policies
6. Delete any existing restrictive policies for the avatars bucket
7. Add the following policies for the avatars bucket:

#### READ Policy (allow anyone to view avatars)
- Policy Name: "Allow public read access to avatars"
- Policy Definition: `bucket_id = 'avatars'`
- Policy Roles: anon, authenticated, service_role

#### INSERT Policy for authenticated users
- Policy Name: "Allow authenticated users to upload avatars"
- Policy Definition: `bucket_id = 'avatars'`
- Policy Roles: authenticated

#### INSERT Policy for anonymous users
- Policy Name: "Allow anon users to upload avatars"
- Policy Definition: `bucket_id = 'avatars'`
- Policy Roles: anon

#### UPDATE Policy
- Policy Name: "Allow users to update their avatars"
- Policy Definition: `bucket_id = 'avatars'`
- Policy Roles: authenticated

#### DELETE Policy
- Policy Name: "Allow users to delete their avatars"
- Policy Definition: `bucket_id = 'avatars'`
- Policy Roles: authenticated

After implementing these changes, the application should be able to upload profile pictures without any row-level security policy violations. 