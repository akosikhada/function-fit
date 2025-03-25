-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Delete all data from related tables first
DELETE FROM user_stats;
DELETE FROM user_workouts;
DELETE FROM workout_plans;
DELETE FROM user_achievements;

-- Delete from public.users
DELETE FROM public.users;

-- Delete from auth.users
DELETE FROM auth.users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY; 