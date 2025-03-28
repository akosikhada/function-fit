# Supabase Storage Setup Instructions

Follow these steps to fix the "row-level security policy violation" error when uploading profile images:

## 1. Access the Supabase Dashboard

Log in to your Supabase dashboard at https://app.supabase.com and select your project.

## 2. Navigate to Storage Settings

1. Click on "Storage" in the left sidebar
2. Select the "Policies" tab

## 3. Delete Existing Restrictive Policies

If you see any policies for the "avatars" bucket that are too restrictive:

1. Click the three dots (...) next to each policy
2. Select "Delete policy"
3. Confirm the deletion

## 4. Create New Public Access Policies

For the "avatars" bucket, create these policies:

### READ policy (allow anyone to view avatars):

1. Click "New Policy"
2. Set Policy Name: "Allow public read access to avatars"
3. Set Policy Definition:

```sql
true
```

4. Set Policy Roles: `anon, authenticated, service_role`
5. Click "Save Policy"

### INSERT policy (allow authenticated users to upload avatars):

1. Click "New Policy"
2. Set Policy Name: "Allow authenticated users to upload avatars"
3. Set Policy Definition:

```sql
auth.role() = 'authenticated'
```

4. Set Policy Roles: `authenticated`
5. Click "Save Policy"

### UPDATE policy (allow users to update their avatars):

1. Click "New Policy"
2. Set Policy Name: "Allow users to update their avatars"
3. Set Policy Definition:

```sql
auth.role() = 'authenticated'
```

4. Set Policy Roles: `authenticated`
5. Click "Save Policy"

### DELETE policy (allow users to delete their avatars):

1. Click "New Policy"
2. Set Policy Name: "Allow users to delete their avatars"
3. Set Policy Definition:

```sql
auth.role() = 'authenticated'
```

4. Set Policy Roles: `authenticated`
5. Click "Save Policy"

## 5. Create Bucket if It Doesn't Exist

If the "avatars" bucket doesn't exist:

1. Go to the "Buckets" tab
2. Click "Create Bucket"
3. Enter "avatars" as the name
4. Select "Public" bucket type
5. Click "Create bucket"

## Testing

After implementing these changes, your app should now be able to upload profile pictures without getting row-level security policy violations.
