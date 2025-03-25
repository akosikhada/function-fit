-- Create users table that extends the auth.users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create workouts table
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  calories INTEGER,
  difficulty TEXT,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES public.workouts NOT NULL,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  rest INTEGER NOT NULL, -- in seconds
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users NOT NULL,
  date DATE NOT NULL,
  steps INTEGER DEFAULT 0,
  calories INTEGER DEFAULT 0,
  workouts_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, date)
);

-- Create user_workouts table to track completed workouts
CREATE TABLE IF NOT EXISTS public.user_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users NOT NULL,
  workout_id UUID REFERENCES public.workouts NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  duration INTEGER NOT NULL, -- actual duration in minutes
  calories INTEGER, -- actual calories burned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users NOT NULL,
  achievement_id UUID REFERENCES public.achievements NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_new BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- Create workout_plans table
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users NOT NULL,
  workout_id UUID REFERENCES public.workouts NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable row level security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read all workouts
DROP POLICY IF EXISTS "Workouts are viewable by everyone" ON public.workouts;
CREATE POLICY "Workouts are viewable by everyone" ON public.workouts
  FOR SELECT USING (true);

-- Users can read all exercises
DROP POLICY IF EXISTS "Exercises are viewable by everyone" ON public.exercises;
CREATE POLICY "Exercises are viewable by everyone" ON public.exercises
  FOR SELECT USING (true);

-- Users can read all achievements
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements
  FOR SELECT USING (true);

-- Users can only read their own user data
DROP POLICY IF EXISTS "Users can only view their own data" ON public.users;
CREATE POLICY "Users can only view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can only read their own stats
DROP POLICY IF EXISTS "Users can only view their own stats" ON public.user_stats;
CREATE POLICY "Users can only view their own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only read their own completed workouts
DROP POLICY IF EXISTS "Users can only view their own completed workouts" ON public.user_workouts;
CREATE POLICY "Users can only view their own completed workouts" ON public.user_workouts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only read their own achievements
DROP POLICY IF EXISTS "Users can only view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can only view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only read their own workout plans
DROP POLICY IF EXISTS "Users can only view their own workout plans" ON public.workout_plans;
CREATE POLICY "Users can only view their own workout plans" ON public.workout_plans
  FOR SELECT USING (auth.uid() = user_id);

-- Enable realtime subscriptions
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.workouts;
alter publication supabase_realtime add table public.exercises;
alter publication supabase_realtime add table public.user_stats;
alter publication supabase_realtime add table public.user_workouts;
alter publication supabase_realtime add table public.achievements;
alter publication supabase_realtime add table public.user_achievements;
alter publication supabase_realtime add table public.workout_plans;
