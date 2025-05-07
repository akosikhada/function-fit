import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

// This utility file contains emergency functions for fixing critical issues

/**
 * Emergency function to directly set workout progress in AsyncStorage
 * Used when the normal data flow is not working correctly
 */
export const forceWorkoutProgressUpdate = async (
  userId: string,
  calories: number,
  workoutCount: number = 1
) => {
  try {
    console.log("🚨 EMERGENCY: Force updating workout progress");

    // Format today's date
    const today = new Date().toISOString().split("T")[0];

    // Get existing values first
    const statsKey = `user_stats_${userId}_${today}`;
    const existingStatsStr = await AsyncStorage.getItem(statsKey);
    const existingStats = existingStatsStr
      ? JSON.parse(existingStatsStr)
      : {
          calories: 0,
          workouts_completed: 0,
          active_minutes: 0,
          steps: 0,
        };

    // Check if we've already recorded this workout completion
    const lastWorkoutKey = `last_workout_completion_${userId}_${today}`;
    const lastWorkoutCompletion = await AsyncStorage.getItem(lastWorkoutKey);

    // Determine if we should increment the workout count or use existing count
    let updatedWorkouts;

    if (lastWorkoutCompletion) {
      // A workout was already logged today, don't increment the count again
      console.log("Workout already logged today - not incrementing count");
      updatedWorkouts = existingStats.workouts_completed || 0;
    } else {
      // This is a new workout completion, increment the count
      console.log("New workout completion - incrementing count");
      updatedWorkouts = Math.min(
        (existingStats.workouts_completed || 0) + workoutCount,
        10
      );

      // Record this workout completion to prevent duplicate counting
      await AsyncStorage.setItem(lastWorkoutKey, new Date().toISOString());
    }

    // Update calories value, ensuring we always use the highest value
    const updatedCalories = Math.max(existingStats.calories || 0, calories);

    // Create stats object with updated values
    const statsObject = {
      calories: updatedCalories,
      workouts_completed: updatedWorkouts,
      active_minutes: existingStats.active_minutes || 30, // Default value
      steps: existingStats.steps || 0,
      emergency_update: true,
      timestamp: new Date().toISOString(),
    };

    // Save to AsyncStorage under the standard key
    await AsyncStorage.setItem(statsKey, JSON.stringify(statsObject));
    console.log(`Saved emergency stats to ${statsKey}:`, statsObject);

    // Create a backup with timestamp in case primary storage fails
    const backupKey = `workout_backup_${Date.now()}`;
    await AsyncStorage.setItem(
      backupKey,
      JSON.stringify({
        userId,
        date: today,
        stats: statsObject,
        timestamp: Date.now(),
      })
    );
    console.log(`Created backup at ${backupKey}`);

    // Set emergency flags
    await AsyncStorage.setItem("EMERGENCY_FIX_REQUIRED", "true");
    await AsyncStorage.setItem(
      "WORKOUT_COUNT_OVERRIDE",
      String(updatedWorkouts)
    );
    await AsyncStorage.setItem("CALORIES_OVERRIDE", String(updatedCalories));

    // Force refresh flags - use explicit timestamps to ensure change is detected
    const timestamp = Date.now().toString();
    await AsyncStorage.setItem("dashboard_needs_refresh", timestamp);
    await AsyncStorage.setItem("FORCE_REFRESH_HOME", timestamp);
    await AsyncStorage.setItem(`workout_completed_${userId}`, timestamp);

    // Store last workout completion time for reference and detection
    await AsyncStorage.setItem(
      "last_workout_completion",
      new Date().toISOString()
    );

    console.log("🚨 EMERGENCY FIX COMPLETE");
    return true;
  } catch (error) {
    console.error("Error in emergency workout progress update:", error);
    return false;
  }
};

/**
 * Reset all emergency flags and workout data
 */
export const resetEmergencyFlags = async () => {
  try {
    const keys = [
      "EMERGENCY_FIX_REQUIRED",
      "WORKOUT_COUNT_OVERRIDE",
      "CALORIES_OVERRIDE",
    ];

    await AsyncStorage.multiRemove(keys);
    console.log("Reset all emergency flags");
    return true;
  } catch (error) {
    console.error("Error resetting emergency flags:", error);
    return false;
  }
};

// Add this function to clear corrupted profile cache that's causing "Row too big" errors
export const clearCorruptedProfileCache = async (): Promise<boolean> => {
  try {
    console.log("🧹 Emergency profile cache cleanup started");
    // Get the current user
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      console.log("No authenticated user found");
      return false;
    }

    // First, get all AsyncStorage keys
    const allKeys = await AsyncStorage.getAllKeys();

    // Find profile-related keys for the current user
    const profileKeys = allKeys.filter(
      (key) =>
        key.includes(`userProfile-${user.user.id}`) ||
        key.includes(`editProfile-${user.user.id}`)
    );

    if (profileKeys.length === 0) {
      console.log("No profile cache keys found");
      return false;
    }

    console.log(`Found ${profileKeys.length} profile cache keys to clean`);

    // Remove all profile cache keys
    await AsyncStorage.multiRemove(profileKeys);
    console.log("Successfully removed corrupted profile cache");

    // Save a minimal profile with just the essential data
    const minimalProfile = {
      username: user.user.email?.split("@")[0] || "User",
      email: user.user.email,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user.id}`,
    };

    await AsyncStorage.setItem(
      `userProfile-${user.user.id}`,
      JSON.stringify(minimalProfile)
    );
    console.log("Saved minimal profile data");

    return true;
  } catch (error) {
    console.error("Error clearing corrupted profile cache:", error);
    return false;
  }
};
