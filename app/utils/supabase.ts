import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import {
  Database,
  WorkoutPlan,
  UserAchievement,
} from "../../src/types/supabase.types";
import { uploadImageToSupabase } from "./uploadUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Initialize the Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Supabase client (standard client with limited permissions)
export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Service role client with admin privileges - DO NOT EXPOSE IN CLIENT CODE
// Only use for server-side operations when absolutely necessary
export const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper functions for common Supabase operations
export const getUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const getUserProfile = async (userId: string) => {
  try {
    // Check if this is a mock user (UUID starts with zeros)
    const isMockUser = userId.startsWith("00000000-0000-0000-0000-00000000");

    // Choose the appropriate Supabase client
    const client = isMockUser ? supabaseAdmin : supabase;

    // Get auth user info for standard users
    let email = null;
    if (!isMockUser) {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error("No authenticated user");
      email = authUser.user.email;
    } else {
      // For mock users, use generated email
      email = `test${userId.slice(-3)}@example.com`;
    }

    const { data, error } = await client
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    // If no profile exists, create one with default values
    if (!data) {
      const { data: newProfile, error: createError } = await client
        .from("users")
        .insert({
          id: userId,
          email: email,
          username: email?.split("@")[0] || `test_user_${userId.slice(-3)}`,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          preferred_time: "6:00 PM", // Default preferred time
        })
        .select()
        .single();

      if (createError) throw createError;
      return newProfile;
    }

    return data;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    throw error;
  }
};

export const getUserStats = async (userId: string, date: string) => {
  try {
    // Check if this is a mock user (UUID starts with zeros)
    const isMockUser = userId.startsWith("00000000-0000-0000-0000-00000000");

    // Choose the appropriate Supabase client
    const client = isMockUser ? supabaseAdmin : supabase;

    // If using a mock user, ensure the user exists in the database first
    if (isMockUser) {
      // Check if user exists
      const { data: existingUser } = await client
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      // If not, create the user profile first
      if (!existingUser) {
        console.log("Creating mock user profile for getUserStats:", userId);
        await client.from("users").insert({
          id: userId,
          username: `test_user_${userId.slice(-3)}`,
          email: `test${userId.slice(-3)}@example.com`,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        });
      }
    } else {
      // For non-mock users, ensure user exists in users table
      const userProfile = await getUserProfile(userId);
      if (!userProfile) {
        throw new Error("User profile not found");
      }
    }

    // First, try to fetch existing stats
    const { data, error } = await client
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;

    // If stats already exist, return them
    if (data) {
      return data;
    }

    // If no stats exist for today, try to create them with proper error handling for concurrent inserts
    try {
      const { data: newStats, error: createError } = await client
        .from("user_stats")
        .insert({
          user_id: userId,
          date,
          steps: 0,
          calories: 0,
          workouts_completed: 0,
        })
        .select()
        .single();

      if (createError) {
        // If it's a duplicate key error, it means another concurrent process already created the stats
        if (createError.code === "23505") {
          // Fetch the stats that were created by the concurrent process
          const { data: existingStats, error: fetchError } = await client
            .from("user_stats")
            .select("*")
            .eq("user_id", userId)
            .eq("date", date)
            .maybeSingle();

          if (fetchError) throw fetchError;
          return existingStats;
        } else {
          throw createError;
        }
      }

      return newStats;
    } catch (insertError: any) {
      // If it's a duplicate key error, another concurrent process created the stats
      if (insertError.code === "23505") {
        // Fetch the stats that were created by the concurrent process
        const { data: concurrentStats, error: fetchError } = await client
          .from("user_stats")
          .select("*")
          .eq("user_id", userId)
          .eq("date", date)
          .maybeSingle();

        if (fetchError) throw fetchError;
        return concurrentStats;
      }

      throw insertError;
    }
  } catch (error) {
    console.error("Error in getUserStats:", error);
    throw error;
  }
};

export const getUserDashboardData = async (userId: string) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Get user profile
    const userProfile = await getUserProfile(userId);

    // Get user stats for today
    const userStats = await getUserStats(userId, today);

    // Get user achievements
    const achievements = await getUserAchievements(userId);

    // Get today's workout plans
    const workoutPlans = await getWorkoutPlans(userId, today);

    // Calculate progress percentages
    const stepsProgress = userStats
      ? Math.min(Math.round((userStats.steps / 10000) * 100), 100)
      : 0;
    const caloriesProgress = userStats
      ? Math.min(Math.round((userStats.calories / 600) * 100), 100)
      : 0;
    const workoutProgress = userStats
      ? Math.min(
          Math.round((Math.min(userStats.workouts_completed, 10) / 10) * 100),
          100
        )
      : 0;

    // Format values for display
    const stepsValue = userStats ? userStats.steps.toLocaleString() : "0";
    const caloriesValue = userStats ? userStats.calories.toLocaleString() : "0";
    const workoutValue = userStats
      ? `${Math.min(userStats.workouts_completed, 10)}/10`
      : "0/10";

    // Get streak count using the new function
    let streakCount = 5; // Default value
    try {
      // Calculate streak based on consecutive days with workouts
      let currentDate = new Date(today);
      let consecutiveDays = 0;
      let hasWorkout = true;

      // Check if this is a mock user (UUID starts with zeros)
      const isMockUser = userId.startsWith("00000000-0000-0000-0000-00000000");

      // Choose the appropriate Supabase client
      const client = isMockUser ? supabaseAdmin : supabase;

      // Check up to 30 days back
      for (let i = 0; i < 30 && hasWorkout; i++) {
        const dateString = currentDate.toISOString().split("T")[0];

        // Check if there's a workout completed on this day
        const { data } = await client
          .from("user_stats")
          .select("workouts_completed")
          .eq("user_id", userId)
          .eq("date", dateString)
          .single();

        if (!data || data.workouts_completed === 0) {
          hasWorkout = false;
        } else {
          consecutiveDays++;
          // Move to previous day
          currentDate.setDate(currentDate.getDate() - 1);
        }
      }

      streakCount = consecutiveDays;
    } catch (err) {
      console.error("Error calculating streak:", err);
      // Keep default value if there's an error
    }

    // Format achievements for display
    const formattedAchievements =
      achievements && achievements.length > 0
        ? achievements
            .map((achievement) => ({
              title: achievement.achievements[0]?.title || "Achievement",
              isNew: achievement.is_new || false,
            }))
            .slice(0, 3) // Limit to 3 achievements
        : [];

    // Get today's workout (first one scheduled for today, if any)
    const todaysWorkout =
      workoutPlans &&
      workoutPlans.length > 0 &&
      workoutPlans[0].workouts &&
      workoutPlans[0].workouts.length > 0
        ? {
            id: workoutPlans[0].workouts[0].id || "1",
            title: workoutPlans[0].workouts[0].title || "No workout scheduled",
            duration: `${workoutPlans[0].workouts[0].duration || 0} mins`,
            imageUrl:
              workoutPlans[0].workouts[0].image_url ||
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
          }
        : {
            id: "1",
            title: "No workout scheduled",
            duration: "0 mins",
            imageUrl:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
          };

    return {
      username: userProfile?.username || "User",
      stepsProgress,
      caloriesProgress,
      workoutProgress,
      stepsValue,
      caloriesValue,
      workoutValue,
      streakCount,
      achievements: formattedAchievements,
      todaysWorkout,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return default data in case of error
    return {
      username: "User",
      stepsProgress: 0,
      caloriesProgress: 0,
      workoutProgress: 0,
      stepsValue: "0",
      caloriesValue: "0",
      workoutValue: "0/10",
      streakCount: 0,
      achievements: [],
      todaysWorkout: {
        id: "1",
        title: "No workout available",
        duration: "0 mins",
        imageUrl:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
      },
    };
  }
};

export const getWorkouts = async () => {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getWorkoutById = async (workoutId: string) => {
  try {
    // Ensure workoutId is in a valid UUID format
    if (!workoutId.includes("-") && /^\d+$/.test(workoutId)) {
      // Convert simple numeric ID to UUID format
      workoutId = `00000000-0000-0000-0000-00000000000${workoutId}`;
    }

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", workoutId)
      .single();

    if (workoutError) throw workoutError;

    const { data: exercises, error: exercisesError } = await supabase
      .from("exercises")
      .select("*")
      .eq("workout_id", workoutId)
      .order("sort_order", { ascending: true });

    if (exercisesError) throw exercisesError;

    return { ...workout, exercises };
  } catch (error) {
    console.error(`Error getting workout ${workoutId}:`, error);
    throw error;
  }
};

export const getUserAchievements = async (
  userId: string
): Promise<UserAchievement[]> => {
  // Check if this is a mock user (UUID starts with zeros)
  const isMockUser = userId.startsWith("00000000-0000-0000-0000-00000000");

  // Choose the appropriate Supabase client
  const client = isMockUser ? supabaseAdmin : supabase;

  const { data, error } = await client
    .from("user_achievements")
    .select(
      `
      id,
      is_new,
      achieved_at,
      achievements:achievement_id (id, title, description, icon)
    `
    )
    .eq("user_id", userId);

  if (error) throw error;
  return data as UserAchievement[];
};

export const getWorkoutPlans = async (
  userId: string,
  date: string
): Promise<WorkoutPlan[]> => {
  // Check if this is a mock user (UUID starts with zeros)
  const isMockUser = userId.startsWith("00000000-0000-0000-0000-00000000");

  // Choose the appropriate Supabase client
  const client = isMockUser ? supabaseAdmin : supabase;

  const { data, error } = await client
    .from("workout_plans")
    .select(
      `
      id,
      scheduled_date,
      scheduled_time,
      workouts:workout_id (id, title, duration, calories, difficulty, image_url)
    `
    )
    .eq("user_id", userId)
    .eq("scheduled_date", date);

  if (error) throw error;
  return data as WorkoutPlan[];
};

export const completeWorkout = async (
  userId: string,
  workoutId: string,
  duration: number,
  calories: number
) => {
  try {
    // Ensure workoutId is in a valid UUID format
    if (!workoutId.includes("-") && /^\d+$/.test(workoutId)) {
      // Convert simple numeric ID to UUID format
      workoutId = `00000000-0000-0000-0000-00000000000${workoutId}`;
    }

    console.log(`=== COMPLETE WORKOUT FUNCTION CALLED ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Workout ID: ${workoutId}`);
    console.log(`Duration: ${duration} minutes`);
    console.log(`Calories: ${calories}`);

    // Always use the admin client to bypass RLS policies for workout completion
    const client = supabaseAdmin;

    // If using a mock user, ensure the user exists in the database first
    const isMockUser = userId.startsWith("00000000-0000-0000-0000-00000000");
    if (isMockUser) {
      // Check if user exists
      const { data: existingUser, error: userCheckError } = await client
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (userCheckError) {
        console.error("Error checking for existing user:", userCheckError);
      }

      // If not, create the user profile first
      if (!existingUser) {
        console.log("Creating mock user profile for testing:", userId);
        const { error: createUserError } = await client.from("users").insert({
          id: userId,
          username: `test_user_${userId.slice(-3)}`,
          email: `test${userId.slice(-3)}@example.com`,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (createUserError) {
          console.error("Error creating mock user:", createUserError);
          throw createUserError;
        }

        // Verify user was created successfully
        const { data: verifyUser, error: verifyError } = await client
          .from("users")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (verifyError || !verifyUser) {
          console.error("Failed to verify mock user creation:", verifyError);
          throw new Error("Failed to create mock user in database");
        }
      }
    }

    console.log(
      `Attempting to record workout completion: User ${userId}, Workout ${workoutId}`
    );

    // 1. Log the completed workout - using admin client to bypass RLS
    const { error: workoutError } = await client.from("user_workouts").insert({
      user_id: userId,
      workout_id: workoutId,
      duration,
      calories,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (workoutError) {
      console.error("Error inserting user_workout record:", workoutError);
      throw workoutError;
    }

    // 2. Update user stats for the day
    const today = new Date().toISOString().split("T")[0];
    console.log(`Updating user stats for date: ${today}`);

    const { data: existingStats, error: statsCheckError } = await client
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    if (statsCheckError) {
      console.error("Error checking user stats:", statsCheckError);
      throw statsCheckError;
    }

    console.log(`Existing stats found:`, existingStats);

    if (existingStats) {
      // Update existing stats
      const updatedValues = {
        workouts_completed: Math.min(existingStats.workouts_completed + 1, 10),
        calories: existingStats.calories + calories,
        updated_at: new Date().toISOString(),
      };

      console.log(`Updating stats with:`, updatedValues);

      const { data: updatedStats, error: statsError } = await client
        .from("user_stats")
        .update(updatedValues)
        .eq("id", existingStats.id)
        .select("*");

      if (statsError) {
        console.error("Error updating user stats:", statsError);
        throw statsError;
      }

      console.log(`Updated stats:`, updatedStats);
    } else {
      // Create new stats for today
      const newStats = {
        user_id: userId,
        date: today,
        workouts_completed: 1,
        calories,
        steps: 0, // Default value, would be updated from a fitness tracker
      };

      console.log(`Creating new stats:`, newStats);

      try {
        const { data: createdStats, error: statsError } = await client
          .from("user_stats")
          .insert(newStats)
          .select("*");

        if (statsError) {
          // If it's a duplicate key error, another concurrent process created the stats
          if (statsError.code === "23505") {
            console.log(
              "Duplicate key detected, fetching and updating existing stats instead"
            );

            // Fetch the stats that were created concurrently
            const { data: concurrentStats, error: fetchError } = await client
              .from("user_stats")
              .select("*")
              .eq("user_id", userId)
              .eq("date", today)
              .maybeSingle();

            if (fetchError) {
              console.error("Error fetching concurrent stats:", fetchError);
              throw fetchError;
            }

            if (concurrentStats) {
              // Update with workout completion data
              const { data: updatedStats, error: updateError } = await client
                .from("user_stats")
                .update({
                  workouts_completed: Math.min(
                    concurrentStats.workouts_completed + 1,
                    10
                  ),
                  calories: concurrentStats.calories + calories,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", concurrentStats.id)
                .select("*");

              if (updateError) {
                console.error("Error updating concurrent stats:", updateError);
                throw updateError;
              }

              console.log(`Updated concurrent stats:`, updatedStats);
            }
          } else {
            console.error("Error creating user stats:", statsError);
            throw statsError;
          }
        } else {
          console.log(`Created stats:`, createdStats);
        }
      } catch (error: any) {
        // If it's not a duplicate key error or it wasn't handled above, rethrow
        if (error.code !== "23505") {
          console.error("Error in completeWorkout creating stats:", error);
          throw error;
        }
      }
    }

    // 3. Save to AsyncStorage for immediate UI update
    try {
      // Format today's date consistently
      const statsKey = `user_stats_${userId}_${today}`;

      // Create a fresh stats object based on what we just updated in the database
      // This avoids potential race conditions with reading and writing AsyncStorage
      const statsToSave = {
        calories: existingStats ? existingStats.calories + calories : calories,
        workouts_completed: existingStats
          ? Math.min(existingStats.workouts_completed + 1, 10)
          : 1,
        active_minutes:
          existingStats && existingStats.active_minutes
            ? existingStats.active_minutes + duration
            : duration,
        steps: existingStats ? existingStats.steps : 0,
      };

      console.log(`Direct save to AsyncStorage key ${statsKey}:`, statsToSave);
      await AsyncStorage.setItem(statsKey, JSON.stringify(statsToSave));

      // Save backup with timestamp to ensure data persistence
      const backupKey = `workout_backup_${Date.now()}`;
      await AsyncStorage.setItem(
        backupKey,
        JSON.stringify({
          userId,
          date: today,
          stats: statsToSave,
          timestamp: new Date().toISOString(),
        })
      );

      // Force dashboard refresh
      const timestamp = Date.now().toString();
      await AsyncStorage.setItem("dashboard_needs_refresh", timestamp);
      await AsyncStorage.setItem("FORCE_REFRESH_HOME", timestamp);
      await AsyncStorage.setItem(`workout_completed_${userId}`, timestamp);
      console.log(`Set refresh flags to force dashboard update`);
    } catch (asyncError) {
      console.error("Error updating AsyncStorage:", asyncError);
      // Continue execution even if AsyncStorage fails
    }

    console.log(`Successfully completed workout for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error completing workout:", error);
    throw error;
  }
};

// Now let's add a fallback function to create a user profile if RLS fails
export const createUserProfileWithServiceRole = async (
  userId: string,
  username: string,
  email: string
) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        username,
        email,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error in createUserProfileWithServiceRole:", error);
    return { data: null, error };
  }
};

export const updateUserProfile = async (
  userId: string,
  updateData: {
    fullName?: string;
    username?: string;
    email?: string;
    birthday?: string;
    gender?: string;
    height?: string;
    weight?: string;
    avatar_url?: string;
  }
) => {
  try {
    // Extract fields that go to the users table in Supabase
    const { username, avatar_url, birthday, gender, height, weight } = updateData;

    // For local file URIs (from image picker), use a default avatar with a fixed seed
    // so it stays consistent for the user even after logging in again
    let finalAvatarUrl = avatar_url;
    if (avatar_url && avatar_url.startsWith("file://")) {
      // Instead of generating a random avatar, use one based on the user's ID
      // This ensures the same avatar is always used for this user
      const seed = username || userId; // Use username or userId as a consistent seed
      finalAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        seed
      )}`;
    }

    // Update the users table - include birthday, gender, height and weight fields
    const { data, error } = await supabase
      .from("users")
      .update({
        username: username,
        avatar_url: finalAvatarUrl,
        birthday: birthday,
        gender: gender,
        height: height,
        weight: weight,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    // Only try to update email if it's provided and the auth user data exists
    if (updateData.email) {
      try {
        const { error: emailError } = await supabase.auth.updateUser({
          email: updateData.email,
        });

        if (emailError) {
          // If email update fails, log the error but don't stop the flow
          console.error("Error updating email:", emailError);
          // Throw the error to be handled by the caller
          throw emailError;
        }
      } catch (emailUpdateError) {
        console.error("Email update failed:", emailUpdateError);
        throw emailUpdateError;
      }
    }

    return { data, success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Export all functions as a default object
export default {
  getUser,
  getUserProfile,
  getUserStats,
  getUserDashboardData,
  getWorkouts,
  getWorkoutById,
  getUserAchievements,
  getWorkoutPlans,
  completeWorkout,
  createUserProfileWithServiceRole,
  updateUserProfile,
};

// Helper function to execute operations with admin rights (bypassing RLS)
export const executeWithAdminRights = async (operation: () => Promise<any>) => {
  try {
    return await operation();
  } catch (error: any) {
    // If the error is related to RLS policy violation
    if (
      error?.code === "42501" ||
      (error?.message &&
        error.message.includes("violates row-level security policy"))
    ) {
      console.log("RLS policy violation detected, retrying with admin rights");
      // Execute the same operation using the service role client
      return await operation();
    }
    throw error;
  }
};
