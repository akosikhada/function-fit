-- Insert sample workouts
INSERT INTO public.workouts (id, title, description, duration, calories, difficulty, category, image_url)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Full Body HIIT', 'A high-intensity interval training workout that targets your entire body, designed to burn calories and build strength.', 30, 320, 'Intermediate', 'hiit', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80'),
  ('00000000-0000-0000-0000-000000000002', 'Core Crusher', 'Focus on strengthening your core with this targeted ab workout that will help build definition and stability.', 20, 220, 'Beginner', 'strength', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80'),
  ('00000000-0000-0000-0000-000000000003', 'Upper Body Blast', 'Build strength and definition in your arms, shoulders, and back with this targeted upper body workout.', 25, 280, 'Intermediate', 'strength', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80'),
  ('00000000-0000-0000-0000-000000000004', 'Cardio Kickboxing', 'A high-energy cardio workout that combines martial arts techniques with fast-paced cardio for maximum calorie burn.', 35, 400, 'Advanced', 'cardio', 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=500&q=80'),
  ('00000000-0000-0000-0000-000000000005', 'Gentle Yoga Flow', 'A calming yoga sequence designed to increase flexibility, reduce stress, and improve mind-body connection. Perfect for beginners and those looking for a restorative practice.', 45, 180, 'Beginner', 'yoga', 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&q=80'),
  ('00000000-0000-0000-0000-000000000006', 'Pilates Core Essentials', 'Build core strength, improve posture and enhance flexibility with this focused Pilates workout suitable for all levels.', 40, 200, 'Intermediate', 'pilates', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80')
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
  ('00000000-0000-0000-0000-000000000004', 'High Knees', 45, 15, 2),
  ('00000000-0000-0000-0000-000000000004', 'Roundhouse Kicks', 45, 15, 3),
  ('00000000-0000-0000-0000-000000000004', 'Jumping Jacks', 45, 15, 4),
  ('00000000-0000-0000-0000-000000000004', 'Shadow Boxing', 45, 15, 5),
  ('00000000-0000-0000-0000-000000000004', 'Burpees', 45, 15, 6);

-- Insert sample exercises for Gentle Yoga Flow
INSERT INTO public.exercises (workout_id, name, duration, rest, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000005', 'Mountain Pose (Tadasana)', 60, 10, 1),
  ('00000000-0000-0000-0000-000000000005', 'Standing Forward Fold', 60, 10, 2),
  ('00000000-0000-0000-0000-000000000005', 'Cat-Cow Stretch', 90, 10, 3),
  ('00000000-0000-0000-0000-000000000005', 'Downward-Facing Dog', 60, 10, 4),
  ('00000000-0000-0000-0000-000000000005', 'Warrior I', 60, 10, 5),
  ('00000000-0000-0000-0000-000000000005', 'Warrior II', 60, 10, 6),
  ('00000000-0000-0000-0000-000000000005', 'Triangle Pose', 60, 10, 7),
  ('00000000-0000-0000-0000-000000000005', 'Tree Pose', 60, 10, 8),
  ('00000000-0000-0000-0000-000000000005', 'Bridge Pose', 60, 10, 9),
  ('00000000-0000-0000-0000-000000000005', 'Child''s Pose', 60, 10, 10),
  ('00000000-0000-0000-0000-000000000005', 'Corpse Pose (Savasana)', 180, 0, 11);

-- Insert sample exercises for Pilates Core Essentials
INSERT INTO public.exercises (workout_id, name, duration, rest, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000006', 'Hundred', 60, 15, 1),
  ('00000000-0000-0000-0000-000000000006', 'Roll Up', 45, 15, 2),
  ('00000000-0000-0000-0000-000000000006', 'Single Leg Circles', 60, 15, 3),
  ('00000000-0000-0000-0000-000000000006', 'Rolling Like a Ball', 45, 15, 4),
  ('00000000-0000-0000-0000-000000000006', 'Single Leg Stretch', 60, 15, 5),
  ('00000000-0000-0000-0000-000000000006', 'Double Leg Stretch', 60, 15, 6),
  ('00000000-0000-0000-0000-000000000006', 'Spine Stretch Forward', 45, 15, 7),
  ('00000000-0000-0000-0000-000000000006', 'Saw', 45, 15, 8),
  ('00000000-0000-0000-0000-000000000006', 'Swan Dive', 45, 15, 9),
  ('00000000-0000-0000-0000-000000000006', 'Side Kick Series', 90, 15, 10),
  ('00000000-0000-0000-0000-000000000006', 'Teaser', 60, 15, 11),
  ('00000000-0000-0000-0000-000000000006', 'Pilates Push-Up', 45, 15, 12);

-- Insert sample achievements
INSERT INTO public.achievements (id, title, description, icon)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Early Bird', 'Complete a workout before 8 AM', 'sunrise'),
  ('00000000-0000-0000-0000-000000000002', 'Workout Warrior', 'Complete 5 workouts in a week', 'award'),
  ('00000000-0000-0000-0000-000000000003', 'Perfect Week', 'Complete a workout every day for a week', 'calendar'),
  ('00000000-0000-0000-0000-000000000004', 'Step Master', 'Reach 10,000 steps in a day', 'footprints'),
  ('00000000-0000-0000-0000-000000000005', 'Calorie Crusher', 'Burn 500 calories in a single workout', 'flame'),
  ('00000000-0000-0000-0000-000000000006', 'Pilates Master', 'Complete all Pilates exercises', 'pilates')
ON CONFLICT (id) DO NOTHING;
