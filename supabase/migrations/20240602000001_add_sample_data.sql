-- Insert sample workouts
INSERT INTO public.workouts (id, title, description, duration, calories, difficulty, category, image_url)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Full Body HIIT', 'A high-intensity interval training workout that targets your entire body, designed to burn calories and build strength.', 30, 320, 'Intermediate', 'hiit', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80'),
  ('00000000-0000-0000-0000-000000000002', 'Core Crusher', 'Focus on strengthening your core with this targeted ab workout that will help build definition and stability.', 20, 220, 'Beginner', 'strength', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80'),
  ('00000000-0000-0000-0000-000000000003', 'Upper Body Blast', 'Build strength and definition in your arms, shoulders, and back with this targeted upper body workout.', 25, 280, 'Intermediate', 'strength', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80'),
  ('00000000-0000-0000-0000-000000000004', 'Cardio Kickboxing', 'A high-energy cardio workout that combines martial arts techniques with fast-paced cardio for maximum calorie burn.', 35, 400, 'Advanced', 'cardio', 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=500&q=80')
ON CONFLICT (id) DO NOTHING;

-- Insert sample exercises for Full Body HIIT
INSERT INTO public.exercises (workout_id, name, duration, rest, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Jumping Jacks', 45, 15, 1),
  ('00000000-0000-0000-0000-000000000001', 'Push-ups', 45, 15, 2),
  ('00000000-0000-0000-0000-000000000001', 'Mountain Climbers', 45, 15, 3),
  ('00000000-0000-0000-0000-000000000001', 'Squats', 45, 15, 4),
  ('00000000-0000-0000-0000-000000000001', 'Burpees', 45, 15, 5),
  ('00000000-0000-0000-0000-000000000001', 'Plank', 45, 15, 6),
  ('00000000-0000-0000-0000-000000000001', 'Lunges', 45, 15, 7),
  ('00000000-0000-0000-0000-000000000001', 'High Knees', 45, 15, 8);

-- Insert sample exercises for Core Crusher
INSERT INTO public.exercises (workout_id, name, duration, rest, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'Crunches', 45, 15, 1),
  ('00000000-0000-0000-0000-000000000002', 'Plank', 45, 15, 2),
  ('00000000-0000-0000-0000-000000000002', 'Russian Twists', 45, 15, 3),
  ('00000000-0000-0000-0000-000000000002', 'Leg Raises', 45, 15, 4),
  ('00000000-0000-0000-0000-000000000002', 'Mountain Climbers', 45, 15, 5),
  ('00000000-0000-0000-0000-000000000002', 'Bicycle Crunches', 45, 15, 6);

-- Insert sample exercises for Upper Body Blast
INSERT INTO public.exercises (workout_id, name, duration, rest, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'Push-ups', 45, 15, 1),
  ('00000000-0000-0000-0000-000000000003', 'Tricep Dips', 45, 15, 2),
  ('00000000-0000-0000-0000-000000000003', 'Shoulder Taps', 45, 15, 3),
  ('00000000-0000-0000-0000-000000000003', 'Arm Circles', 45, 15, 4),
  ('00000000-0000-0000-0000-000000000003', 'Plank Shoulder Taps', 45, 15, 5),
  ('00000000-0000-0000-0000-000000000003', 'Superman', 45, 15, 6);

-- Insert sample exercises for Cardio Kickboxing
INSERT INTO public.exercises (workout_id, name, duration, rest, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000004', 'Jabs', 45, 15, 1),
  ('00000000-0000-0000-0000-000000000004', 'Crosses', 45, 15, 2),
  ('00000000-0000-0000-0000-000000000004', 'Hooks', 45, 15, 3),
  ('00000000-0000-0000-0000-000000000004', 'Uppercuts', 45, 15, 4),
  ('00000000-0000-0000-0000-000000000004', 'Front Kicks', 45, 15, 5),
  ('00000000-0000-0000-0000-000000000004', 'Roundhouse Kicks', 45, 15, 6),
  ('00000000-0000-0000-0000-000000000004', 'Knee Strikes', 45, 15, 7),
  ('00000000-0000-0000-0000-000000000004', 'Elbow Strikes', 45, 15, 8);

-- Insert sample achievements
INSERT INTO public.achievements (id, title, description, icon)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Early Bird', 'Complete a workout before 8 AM', 'sunrise'),
  ('00000000-0000-0000-0000-000000000002', 'Workout Warrior', 'Complete 5 workouts in a week', 'award'),
  ('00000000-0000-0000-0000-000000000003', 'Perfect Week', 'Complete a workout every day for a week', 'calendar'),
  ('00000000-0000-0000-0000-000000000004', 'Step Master', 'Reach 10,000 steps in a day', 'footprints'),
  ('00000000-0000-0000-0000-000000000005', 'Calorie Crusher', 'Burn 500 calories in a single workout', 'flame')
ON CONFLICT (id) DO NOTHING;
