-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  height NUMERIC,
  weight NUMERIC,
  fitness_goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_stats table to track daily stats
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER DEFAULT 0,
  calories INTEGER DEFAULT 0,
  workouts_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  calories INTEGER NOT NULL, -- estimated calories burned
  difficulty TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sets INTEGER,
  reps INTEGER,
  duration INTEGER, -- in seconds, for timed exercises
  sort_order INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_workouts table to track completed workouts
CREATE TABLE IF NOT EXISTS user_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration INTEGER NOT NULL, -- actual duration in minutes
  calories INTEGER NOT NULL, -- actual calories burned
  rating INTEGER, -- user rating 1-5
  notes TEXT
);

-- Create workout_plans table to schedule workouts
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_new BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Create clean policies with one policy per operation
-- Users table policies
CREATE POLICY "user_select" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_update" ON users FOR UPDATE USING (auth.uid() = id);

-- User stats policies
CREATE POLICY "stats_select" ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stats_insert" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stats_update" ON user_stats FOR UPDATE USING (auth.uid() = user_id);

-- User workouts policies
CREATE POLICY "workouts_select" ON user_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workouts_insert" ON user_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Workout plans policies
CREATE POLICY "plans_select" ON workout_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "plans_insert" ON workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "plans_update" ON workout_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "plans_delete" ON workout_plans FOR DELETE USING (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "achievements_select" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "achievements_update" ON user_achievements FOR UPDATE USING (auth.uid() = user_id);

-- Public access policies
CREATE POLICY "public_select" ON workouts FOR SELECT USING (true);
CREATE POLICY "public_select" ON exercises FOR SELECT USING (true);
CREATE POLICY "public_select" ON achievements FOR SELECT USING (true);

-- Enable realtime subscriptions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'users'
    ) THEN
        alter publication supabase_realtime add table users;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'user_stats'
    ) THEN
        alter publication supabase_realtime add table user_stats;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'workouts'
    ) THEN
        alter publication supabase_realtime add table workouts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'exercises'
    ) THEN
        alter publication supabase_realtime add table exercises;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'user_workouts'
    ) THEN
        alter publication supabase_realtime add table user_workouts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'workout_plans'
    ) THEN
        alter publication supabase_realtime add table workout_plans;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'achievements'
    ) THEN
        alter publication supabase_realtime add table achievements;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'user_achievements'
    ) THEN
        alter publication supabase_realtime add table user_achievements;
    END IF;
END $$;
