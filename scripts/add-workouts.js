// Script to add workouts to the database
// Run with: node scripts/add-workouts.js

const { createClient } = require("@supabase/supabase-js");

// Use the API keys
// Load environment variables
require("dotenv").config();

// Use service role key to bypass RLS policies
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(
  `Using Supabase Service Role Key: ${supabaseServiceKey.substring(0, 10)}...`
);

// Create Supabase client with service role permissions
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Function to create a workout and its exercises
async function createWorkout(workout, exercises) {
  try {
    // 1. Insert the workout
    const { data: workoutData, error: workoutError } = await supabase
      .from("workouts")
      .insert({
        title: workout.title,
        description: workout.description,
        duration: workout.duration,
        calories: workout.calories,
        difficulty: workout.difficulty,
        category: workout.category || "custom",
        image_url: workout.image_url,
      })
      .select()
      .single();

    if (workoutError) throw workoutError;

    // 2. Insert the exercises
    const exercisesWithWorkoutId = exercises.map((exercise, index) => ({
      workout_id: workoutData.id,
      name: exercise.name,
      duration: exercise.duration,
      rest: exercise.rest || 15,
      sort_order: index + 1,
    }));

    const { error: exercisesError } = await supabase
      .from("exercises")
      .insert(exercisesWithWorkoutId);

    if (exercisesError) throw exercisesError;

    return { workout: workoutData, success: true };
  } catch (error) {
    console.error("Error creating workout:", error);
    throw error;
  }
}

// Define workouts
async function addWorkouts() {
  try {
    console.log("Adding workouts to your library...");

    // 1. HIIT Workout
    const hiitWorkout = {
      title: "Home HIIT Challenge",
      description:
        "High-intensity interval training that requires no equipment and can be done in a limited space at home.",
      duration: 25,
      calories: 300,
      difficulty: "Intermediate",
      category: "hiit",
      image_url:
        "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=500&q=80",
    };

    const hiitExercises = [
      {
        name: "Jumping Jacks",
        duration: 45,
        rest: 15,
        sort_order: 1,
      },
      {
        name: "Mountain Climbers",
        duration: 45,
        rest: 15,
        sort_order: 2,
      },
      {
        name: "Burpees",
        duration: 45,
        rest: 15,
        sort_order: 3,
      },
      {
        name: "High Knees",
        duration: 45,
        rest: 15,
        sort_order: 4,
      },
      {
        name: "Plank Jacks",
        duration: 45,
        rest: 15,
        sort_order: 5,
      },
      {
        name: "Squat Jumps",
        duration: 45,
        rest: 15,
        sort_order: 6,
      },
    ];

    // 2. Yoga Workout
    const yogaWorkout = {
      title: "Stress Relief Yoga",
      description:
        "A gentle yoga sequence designed to release tension, reduce stress, and restore balance. Perfect for winding down after a long day.",
      duration: 35,
      calories: 150,
      difficulty: "Beginner",
      category: "yoga",
      image_url:
        "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=500&q=80",
    };

    const yogaExercises = [
      {
        name: "Seated Breathing",
        duration: 120,
        rest: 0,
        sort_order: 1,
      },
      {
        name: "Cat-Cow Stretch",
        duration: 90,
        rest: 0,
        sort_order: 2,
      },
      {
        name: "Child's Pose",
        duration: 60,
        rest: 0,
        sort_order: 3,
      },
      {
        name: "Downward Facing Dog",
        duration: 60,
        rest: 0,
        sort_order: 4,
      },
      {
        name: "Warrior II",
        duration: 60,
        rest: 0,
        sort_order: 5,
      },
      {
        name: "Standing Forward Fold",
        duration: 60,
        rest: 0,
        sort_order: 6,
      },
      {
        name: "Corpse Pose (Savasana)",
        duration: 180,
        rest: 0,
        sort_order: 7,
      },
    ];

    // 3. Strength Workout
    const strengthWorkout = {
      title: "Power Lifting Fundamentals",
      description:
        "Build serious strength with this focused workout covering the fundamental power lifting movements. Great for building muscle and power.",
      duration: 50,
      calories: 420,
      difficulty: "Advanced",
      category: "strength",
      image_url:
        "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&q=80",
    };

    const strengthExercises = [
      {
        name: "Barbell Squats",
        duration: 60,
        rest: 90,
        sort_order: 1,
      },
      {
        name: "Deadlifts",
        duration: 60,
        rest: 90,
        sort_order: 2,
      },
      {
        name: "Bench Press",
        duration: 60,
        rest: 90,
        sort_order: 3,
      },
      {
        name: "Pull-ups",
        duration: 60,
        rest: 90,
        sort_order: 4,
      },
      {
        name: "Overhead Press",
        duration: 60,
        rest: 90,
        sort_order: 5,
      },
    ];

    // 4. Cardio Workout
    const cardioWorkout = {
      title: "30-Minute Cardio Blast",
      description:
        "Boost your heart rate and burn calories with this efficient cardio workout that combines both steady-state and interval training.",
      duration: 30,
      calories: 350,
      difficulty: "Intermediate",
      category: "cardio",
      image_url:
        "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&q=80",
    };

    const cardioExercises = [
      {
        name: "Warm-up Jog",
        duration: 180,
        rest: 30,
        sort_order: 1,
      },
      {
        name: "Sprint Intervals",
        duration: 30,
        rest: 60,
        sort_order: 2,
      },
      {
        name: "High Knees",
        duration: 60,
        rest: 30,
        sort_order: 3,
      },
      {
        name: "Jumping Rope",
        duration: 120,
        rest: 45,
        sort_order: 4,
      },
      {
        name: "Box Jumps",
        duration: 60,
        rest: 30,
        sort_order: 5,
      },
      {
        name: "Cool Down Walk",
        duration: 180,
        rest: 0,
        sort_order: 6,
      },
    ];

    // Create each workout one by one
    console.log("Creating HIIT workout...");
    const hiitResult = await createWorkout(hiitWorkout, hiitExercises);
    console.log(`HIIT workout created with ID: ${hiitResult.workout.id}`);

    console.log("Creating Yoga workout...");
    const yogaResult = await createWorkout(yogaWorkout, yogaExercises);
    console.log(`Yoga workout created with ID: ${yogaResult.workout.id}`);

    console.log("Creating Strength workout...");
    const strengthResult = await createWorkout(
      strengthWorkout,
      strengthExercises
    );
    console.log(
      `Strength workout created with ID: ${strengthResult.workout.id}`
    );

    console.log("Creating Cardio workout...");
    const cardioResult = await createWorkout(cardioWorkout, cardioExercises);
    console.log(`Cardio workout created with ID: ${cardioResult.workout.id}`);

    console.log("All workouts created successfully!");
  } catch (error) {
    console.error("Error in adding workouts:", error);
  }
}

// Run the script
addWorkouts()
  .then(() => console.log("Script completed successfully"))
  .catch((error) => console.error("Script failed:", error));
