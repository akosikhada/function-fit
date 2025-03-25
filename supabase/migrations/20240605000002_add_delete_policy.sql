-- Add delete policy
CREATE POLICY "enable_delete_for_user" ON users
  FOR DELETE
  TO public
  USING (auth.uid() = id);

-- Add delete cascade to user_stats
ALTER TABLE user_stats
  DROP CONSTRAINT IF EXISTS user_stats_user_id_fkey,
  ADD CONSTRAINT user_stats_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

-- Add delete cascade to user_workouts
ALTER TABLE user_workouts
  DROP CONSTRAINT IF EXISTS user_workouts_user_id_fkey,
  ADD CONSTRAINT user_workouts_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

-- Add delete cascade to workout_plans
ALTER TABLE workout_plans
  DROP CONSTRAINT IF EXISTS workout_plans_user_id_fkey,
  ADD CONSTRAINT workout_plans_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

-- Add delete cascade to user_achievements
ALTER TABLE user_achievements
  DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey,
  ADD CONSTRAINT user_achievements_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

-- Grant delete permission
GRANT DELETE ON users TO authenticated;

-- Function to delete user completely
CREATE OR REPLACE FUNCTION delete_user_complete(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete from public.users first (this will cascade to related tables)
  DELETE FROM public.users WHERE id = user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER; 