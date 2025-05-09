import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import {
  ChevronLeft,
  Clock,
  XCircle,
  Dumbbell,
  ArrowRight,
  Heart,
  Flame,
  CheckCircle2,
} from "lucide-react-native";
import ThemeModule from "../utils/theme";
import {
  getWorkoutById,
  completeWorkout,
  getUser as getSupabaseUser,
} from "../utils/supabase";
import { trackCalories as trackCaloriesAPI } from "../utils/fitness";
import WorkoutTimer from "../components/WorkoutTimer";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "../components/Toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { forceWorkoutProgressUpdate } from "../utils/emergency"; // Import the emergency utility
import { supabase } from "../utils/supabase"; // Import supabase client

const { useTheme } = ThemeModule;

// Define types for the workout
interface Exercise {
  id: string;
  name: string;
  duration: string;
  sets: number;
  reps: string;
  rest: string;
  description?: string;
}

interface WorkoutData {
  id: string;
  title: string;
  description: string;
  duration: string;
  calories: string;
  level: string;
  imageUrl: string;
  exercises: Exercise[];
}

export default function WorkoutPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme: currentTheme, colors } = useTheme();
  const isDarkMode = currentTheme === "dark";

  // Get screen dimensions for responsive layout
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  // Calculate responsive sizes
  const isSmallScreen = SCREEN_WIDTH < 360;
  const isMediumScreen = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 480;
  const isLargeScreen = SCREEN_WIDTH >= 480;

  // Responsive sizing functions
  const getFontSize = (small: number, regular: number, large: number) => {
    if (isSmallScreen) return small;
    if (isLargeScreen) return large;
    return regular;
  };

  const getSpacing = (small: number, regular: number, large: number) => {
    if (isSmallScreen) return small;
    if (isLargeScreen) return large;
    return regular;
  };

  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [timerActive, setTimerActive] = useState(true);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success"
  );

  // Track calorie progress for the dashboard
  const [updatedCalories, setUpdatedCalories] = useState(0);
  const [calorieProgress, setCalorieProgress] = useState(0);

  // Animation for completion confetti
  const completionAnim = useRef(new Animated.Value(0)).current;

  // Function to parse duration string to seconds
  const parseDuration = (durationStr: string | number | undefined): number => {
    // If already a number, return it
    if (typeof durationStr === "number" && !isNaN(durationStr)) {
      return Math.max(1, Math.floor(durationStr));
    }

    // Return default if undefined or empty
    if (!durationStr) {
      return 45; // Default to 45 seconds
    }

    try {
      // Convert to string if it's not already
      const durationString = String(durationStr);

      // Check if the duration is in the format "XX sec"
      const secMatch = durationString.match(/(\d+)\s*sec/);
      if (secMatch) {
        return parseInt(secMatch[1], 10);
      }

      // Check if the duration is in the format "X min"
      const minMatch = durationString.match(/(\d+)\s*min/);
      if (minMatch) {
        return parseInt(minMatch[1], 10) * 60;
      }

      // If it's just a number, assume seconds
      const numMatch = durationString.match(/^(\d+)$/);
      if (numMatch) {
        return parseInt(numMatch[1], 10);
      }

      // Fixed durations for common cases
      if (durationString === "60 sec") return 60;
      if (durationString === "45 sec") return 45;
      if (durationString === "30 sec") return 30;
      if (durationString === "15 sec") return 15;

      // Return a default value if parsing fails
      return 45; // Default to 45 seconds
    } catch (error) {
      console.error("Error parsing duration:", durationStr, error);
      return 45; // Default to 45 seconds on error
    }
  };

  // Get current exercise or rest period
  const getCurrentActivity = () => {
    if (!workout || !workout.exercises || workout.exercises.length === 0) {
      return null;
    }

    try {
      if (isResting) {
        const currentExercise = workout.exercises[currentExerciseIndex];
        if (!currentExercise) return null;

        let restDuration = 15; // Default rest period

        try {
          if (currentExercise?.rest) {
            // Handle various formats like "15 sec rest", "15 sec", "15"
            const restText = String(currentExercise.rest)
              .replace(/rest|s$/gi, "")
              .trim();
            restDuration = parseDuration(restText);
          }
        } catch (error) {
          console.error("Error parsing rest period:", error);
        }

        return {
          name: "Rest",
          duration: restDuration, // Always a number
          isRest: true,
        };
      } else {
        const currentExercise = workout.exercises[currentExerciseIndex];
        if (!currentExercise) return null;

        // Ensure we parse the duration to a number
        const duration = parseDuration(currentExercise?.duration || "45 sec");

        return {
          name: currentExercise?.name || "Exercise",
          duration: duration, // Always a number
          isRest: false,
          reps: currentExercise?.reps || "N/A",
          sets: currentExercise?.sets || 1,
        };
      }
    } catch (error) {
      console.error("Error in getCurrentActivity:", error);
      // Return a fallback activity with default duration
      return {
        name: "Exercise",
        duration: 45, // Default duration in seconds
        isRest: false,
        reps: "N/A",
        sets: 1,
      };
    }
  };

  // Get the current activity
  const currentActivity = getCurrentActivity();

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!workout || !workout.exercises || workout.exercises.length === 0)
      return 0;

    const totalExercises = workout.exercises.length;
    const completedExercises = currentExerciseIndex + (isResting ? 0.5 : 0);
    return Math.min(
      Math.floor((completedExercises / totalExercises) * 100),
      100
    );
  };

  // Fetch workout data
  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        // Map numeric IDs to proper UUID format
        let workoutId = id || "1";

        // Check if ID is just a number without UUID format
        if (/^\d+$/.test(workoutId)) {
          workoutId = `00000000-0000-0000-0000-00000000000${workoutId}`;
        }

        // Get workout data from Supabase
        const workoutData = await getWorkoutById(workoutId);

        // Deduplicate exercises by ID
        let uniqueExercises = [];
        if (workoutData?.exercises && Array.isArray(workoutData.exercises)) {
          // Create a Map to deduplicate by exercise ID
          const uniqueExerciseMap = new Map();

          for (const exercise of workoutData.exercises) {
            // Skip if we already have this exercise ID
            if (uniqueExerciseMap.has(exercise.id)) continue;

            uniqueExerciseMap.set(exercise.id, exercise);
          }

          uniqueExercises = Array.from(uniqueExerciseMap.values());
        } else {
          uniqueExercises = workoutData?.exercises || [];
        }

        console.log(
          `Original exercise count: ${workoutData?.exercises?.length || 0}`
        );
        console.log(`After deduplication: ${uniqueExercises.length}`);

        // Format the workout data
        const formattedWorkout: WorkoutData = {
          id: workoutData?.id || id || "1",
          title: workoutData?.title || "Workout",
          description: workoutData?.description || "",
          duration: workoutData?.duration || "30 mins",
          calories: workoutData?.calories || "100 cal",
          level: workoutData?.difficulty || "Beginner",
          imageUrl:
            workoutData?.image_url ||
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
          exercises:
            uniqueExercises.map((ex: any) => ({
              id: ex?.id || `ex-${Math.random().toString(36).substring(7)}`,
              name: ex?.name || "Exercise",
              duration: ex?.duration || "45 sec",
              sets: typeof ex?.sets === "number" ? ex.sets : 1,
              reps: ex?.reps || "10 reps",
              rest: ex?.rest || "15 sec rest",
              description: ex?.description || "",
            })) || [],
        };

        setWorkout(formattedWorkout);
      } catch (err) {
        console.error("Error fetching workout:", err);
        // Handle error - could navigate back or show error message
        Alert.alert("Error", "Failed to load workout. Please try again.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    };

    fetchWorkout();
  }, [id]);

  // Handle completion of a timer
  const handleTimerComplete = () => {
    if (isResting) {
      // Rest is over, move to next exercise
      setIsResting(false);
      if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
        setCurrentExerciseIndex((prevIndex) => prevIndex + 1);
      } else {
        // Workout is complete
        handleWorkoutComplete();
      }
    } else {
      // Exercise is over, move to rest unless it's the last exercise
      if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
        setIsResting(true);
      } else {
        // Last exercise complete - no rest needed
        handleWorkoutComplete();
      }
    }
  };

  // Store updated calorie and workout data in AsyncStorage to force HomeScreen refresh
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]; // Get YYYY-MM-DD format
  };

  // Handle workout completion
  const handleWorkoutComplete = async () => {
    try {
      // Get the current authenticated user
      const user = await getSupabaseUser();

      if (user && workout) {
        try {
          // Calculate workout duration in minutes - for test workouts, make sure we're storing the actual elapsed time
          // even if it's just a few seconds
          const durationInMinutes = Math.max(
            Math.ceil(totalTimeElapsed / 60),
            1
          );

          // For very short test workouts (less than 1 minute), record the actual seconds for accuracy
          const actualDurationInSeconds = totalTimeElapsed;

          // Estimate calories - use a more accurate calculation for short workouts
          const estimatedCalories = Math.max(
            Math.round(caloriesBurned),
            // For very short workouts, use a lower multiplier
            actualDurationInSeconds < 60 ? 5 : Math.round(durationInMinutes * 8)
          );

          // Log the completed workout using the updated completeWorkout function
          const result = await completeWorkout(
            user.id,
            workout.id,
            durationInMinutes, // This is what gets stored in the database
            estimatedCalories
          );

          if (!result || !result.success) {
            throw new Error("Failed to complete workout");
          }

          // Update calories specifically in tracking
          const calorieResult = await trackCaloriesAPI(
            user.id,
            estimatedCalories
          );
          const updatedCalories =
            calorieResult?.updatedValue || estimatedCalories;

          // Calculate progress towards daily goal of 600 calories
          const calorieProgress = Math.min(
            Math.round((updatedCalories / 600) * 100),
            100
          );

          // Update state with accurate values
          setUpdatedCalories(updatedCalories);
          setCalorieProgress(calorieProgress);
          setCaloriesBurned(estimatedCalories); // Update caloriesBurned to accurate value

          // CRITICAL FIX: FORCE DIRECT UPDATE OF PROGRESS DATA
          // Format today's date - use a format function to ensure consistency
          const today = formatDate(new Date());
          console.log(`*** EMERGENCY FIX: DIRECT DASHBOARD UPDATE ***`);

          try {
            // Set the workout completion marker to prevent duplicate counting
            const lastWorkoutKey = `last_workout_completion_${user.id}_${today}`;
            await AsyncStorage.setItem(
              lastWorkoutKey,
              new Date().toISOString()
            );
            console.log(`Set workout completion marker: ${lastWorkoutKey}`);

            // 1. Use our dedicated emergency function for reliable updates
            await forceWorkoutProgressUpdate(
              user.id,
              estimatedCalories,
              1 // One workout completed
            );

            // 2. Set multiple flags to ensure home screen refresh
            const timestamp = Date.now().toString();
            await AsyncStorage.setItem("FORCE_REFRESH_HOME", timestamp);
            await AsyncStorage.setItem("dashboard_needs_refresh", timestamp);

            // 3. Store the last workout completion time for reference
            await AsyncStorage.setItem(
              "last_workout_completion",
              new Date().toISOString()
            );

            console.log("Emergency fix applied via dedicated utility");
          } catch (storageError) {
            console.error("Error in emergency fix:", storageError);

            // Fallback: Try to set basic refresh flag
            await AsyncStorage.setItem("FORCE_REFRESH_HOME", "true");
          }

          // Animation for completion
          Animated.sequence([
            Animated.timing(completionAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(completionAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();

          // Show success toast
          setToastMessage(
            `${estimatedCalories} calories added to your dashboard!`
          );
          setToastType("success");
          setShowToast(true);

          // Hide toast after 3 seconds and navigate back
          setTimeout(() => {
            setShowToast(false);
            router.push("/");
          }, 3000);
        } catch (logError) {
          console.error("Error logging workout completion:", logError);

          // Show error toast
          setToastMessage("Could not update calories dashboard");
          setToastType("error");
          setShowToast(true);

          // Hide toast after 3 seconds and navigate back
          setTimeout(() => {
            setShowToast(false);
            router.push("/");
          }, 3000);
        }
      } else {
        // If we can't get the user or workout, just go back to home after a brief delay
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (error) {
      console.error("Error completing workout:", error);
      // Navigate to home after a brief delay
      setTimeout(() => {
        router.push("/");
      }, 1500);
    }
  };

  // Update the elapsed time every second while timer is active
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (timerActive) {
      timer = setInterval(() => {
        setTotalTimeElapsed((prev) => prev + 1);

        // More accurate calorie calculation based on exercise type
        setCaloriesBurned((prev) => {
          // Base calorie burn rate per second
          const baseRate = isResting ? 0.05 : 0.15;

          // Adjust based on current exercise intensity if available
          let intensityMultiplier = 1.0;

          if (
            !isResting &&
            workout?.exercises &&
            workout.exercises[currentExerciseIndex]
          ) {
            const currentExercise = workout.exercises[currentExerciseIndex];
            // Higher intensity for exercises with more reps or shorter duration
            if (currentExercise.reps && currentExercise.reps.includes("20")) {
              intensityMultiplier = 1.3; // High intensity
            } else if (
              currentExercise.reps &&
              currentExercise.reps.includes("15")
            ) {
              intensityMultiplier = 1.2; // Medium-high intensity
            } else if (
              currentExercise.reps &&
              currentExercise.reps.includes("10")
            ) {
              intensityMultiplier = 1.1; // Medium intensity
            }
          }

          return prev + baseRate * intensityMultiplier;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, isResting, currentExerciseIndex, workout]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle timer toggle
  const handleToggleTimer = () => {
    setTimerActive((prev) => !prev);
  };

  // Handle quit workout
  const handleQuitWorkout = () => {
    Alert.alert(
      "Quit Workout",
      "Are you sure you want to quit this workout? Your progress will not be saved.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Quit", style: "destructive", onPress: () => router.back() },
      ]
    );
  };

  const nextExercise =
    workout && currentExerciseIndex < workout.exercises.length - 1
      ? workout.exercises[currentExerciseIndex + 1]
      : null;

  // Get accent colors based on state
  const getAccentColor = () => {
    if (isResting) return "#22C55E"; // Brighter green for rest
    return isDarkMode ? "#7C3AED" : "#4F46E5"; // Brighter purple/indigo for exercise
  };

  // Secondary accent color (lighter version)
  const getSecondaryAccentColor = () => {
    if (isResting) return "#DCFCE7"; // Lighter green for rest
    return isDarkMode ? "#DDD6FE" : "#C7D2FE"; // Lighter purple/indigo for exercise
  };

  // Determine timer size based on screen width
  const getTimerSize = () => {
    if (isLargeScreen)
      return SCREEN_WIDTH * 0.6 > 300 ? 300 : SCREEN_WIDTH * 0.6;
    if (isMediumScreen) return SCREEN_WIDTH * 0.75;
    return SCREEN_WIDTH * 0.85; // Small screen
  };

  const timerSize = getTimerSize();

  // Log calorie tracking for user
  const trackCaloriesBurned = async (
    userId: string,
    calories: number,
    totalToday: number
  ) => {
    try {
      console.log(
        `Logged ${calories} calories for user ${userId}. Total today: ${totalToday}`
      );
      // In a real app, this would call an API to update user's calorie tracking
    } catch (error) {
      console.error("Error logging calories:", error);
    }
  };

  // Retrieve the current user
  const getUser = async (): Promise<any | null> => {
    try {
      // First try to get the authenticated user from Supabase using the imported function
      const supabaseUser = await getSupabaseUser();
      if (supabaseUser) {
        return supabaseUser;
      }

      // If no authenticated user, check AsyncStorage
      const userData = await AsyncStorage.getItem("current_user");

      // If found in AsyncStorage, use that
      if (userData) {
        return JSON.parse(userData);
      }

      // If no user in AsyncStorage or authentication, use a consistent user ID
      // Make sure to use the SAME user ID that's used in the home screen
      // (based on your logs the home screen is using 9634ed58-c9d7-4083-9076-c1d6669e27de)
      const mockUser = {
        id: "9634ed58-c9d7-4083-9076-c1d6669e27de", // Use the same ID as home screen
        name: "Test User",
        email: "your-new-email@example.com",
        goal: {
          calories: 600,
          workoutsPerWeek: 4,
        },
      };

      // Store this user for future reference
      await AsyncStorage.setItem("current_user", JSON.stringify(mockUser));
      return mockUser;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  };

  // Check if we need to reset progress for a new day
  const checkForDayChange = async (userId: string): Promise<boolean> => {
    try {
      // Get the current date in YYYY-MM-DD format using the formatDate function
      const today = formatDate(new Date());

      // Get the last tracked date from AsyncStorage
      const lastTrackedDateKey = `last_tracked_date_${userId}`;
      const lastTrackedDate = await AsyncStorage.getItem(lastTrackedDateKey);

      // If the last tracked date is different from today, reset progress
      if (lastTrackedDate !== today) {
        console.log(
          `Workout player: Day changed. Last: ${lastTrackedDate}, Today: ${today}`
        );

        // Update the last tracked date to today
        await AsyncStorage.setItem(lastTrackedDateKey, today);

        // Reset today's calorie counter in local storage
        const calorieKey = `calories_${userId}_${today}`;
        await AsyncStorage.setItem(calorieKey, "0");

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking for day change:", error);
      return false;
    }
  };

  // Track calories burned against daily goal
  const trackCalories = async (
    userId: string,
    caloriesBurned: number
  ): Promise<{ success: boolean; totalToday: number }> => {
    try {
      if (!userId) return { success: false, totalToday: 0 };

      // Check if we need to reset progress for a new day
      await checkForDayChange(userId);

      // Use the trackCalories function from fitness.ts utility
      const result = await trackCaloriesAPI(userId, caloriesBurned);

      if (!result || !result.success) {
        console.error("Failed to track calories with Supabase");
        // Even if Supabase fails, we can still update local storage
      }

      // Also keep local storage for immediate UI feedback
      const today = formatDate(new Date());
      const calorieKey = `calories_${userId}_${today}`;

      // Get existing calories for today from local storage
      const existingData = await AsyncStorage.getItem(calorieKey);
      const existingCalories = existingData ? parseInt(existingData, 10) : 0;

      // Add new calories to today's total
      const newTotal = existingCalories + caloriesBurned;

      // Save updated calories to local storage
      await AsyncStorage.setItem(calorieKey, newTotal.toString());

      // Get the stats key for today
      const statsKey = `user_stats_${userId}_${today}`;
      console.log(`Updating stats for ${statsKey}`);

      try {
        const existingStatsStr = await AsyncStorage.getItem(statsKey);
        const existingStats = existingStatsStr
          ? JSON.parse(existingStatsStr)
          : {
              calories: 0,
              workouts_completed: 0,
              active_minutes: 0,
              steps: 0,
            };

        // Update the general stats object too for dashboard consistency
        await AsyncStorage.setItem(
          statsKey,
          JSON.stringify({
            ...existingStats,
            calories: Math.max(existingStats.calories || 0, newTotal),
          })
        );

        // Log calorie progress
        await trackCaloriesBurned(
          userId,
          caloriesBurned,
          result?.updatedValue || newTotal
        );

        return { success: true, totalToday: result?.updatedValue || newTotal };
      } catch (error) {
        console.error("Error updating stats:", error);
        return { success: false, totalToday: 0 };
      }
    } catch (error) {
      console.error("Error tracking calories:", error);
      return { success: false, totalToday: 0 };
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#000000" : "transparent"}
      />

      {/* Toast notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          visible={showToast}
          onDismiss={() => setShowToast(false)}
        />
      )}

      {/* Workout completion animation */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDarkMode
            ? "rgba(0,0,0,0.8)"
            : "rgba(255,255,255,0.8)",
          zIndex: 999,
          justifyContent: "center",
          alignItems: "center",
          opacity: completionAnim,
          transform: [
            {
              scale: completionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1.2, 1],
              }),
            },
          ],
        }}
        pointerEvents="none"
      >
        <View
          style={{
            backgroundColor: isDarkMode ? colors.card : colors.background,
            padding: 24,
            borderRadius: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 5,
            },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 10,
            maxWidth: SCREEN_WIDTH * 0.9,
          }}
        >
          <CheckCircle2 size={64} color={isDarkMode ? "#10B981" : "#059669"} />
          <Text
            style={{
              color: colors.text,
              fontWeight: "800",
              fontSize: 24,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Workout Recorded!
          </Text>
          <Text
            style={{
              color: colors.secondaryText,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Your calories have been updated in the dashboard
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 16,
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
            }}
          >
            <Flame size={24} color="#EF4444" style={{ marginRight: 8 }} />
            <Text
              style={{
                color: colors.text,
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              +
              {updatedCalories
                ? Math.round(updatedCalories)
                : Math.round(caloriesBurned)}{" "}
              calories
            </Text>
          </View>

          {/* Progress towards daily goal */}
          <View
            style={{
              width: "100%",
              marginTop: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ color: colors.secondaryText, fontSize: 12 }}>
                Daily Goal
              </Text>
              <Text style={{ color: colors.secondaryText, fontSize: 12 }}>
                600 calories
              </Text>
            </View>
            <View
              style={{
                height: 8,
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <Animated.View
                style={{
                  height: "100%",
                  width: `${calorieProgress}%`,
                  backgroundColor: "#EF4444",
                  borderRadius: 4,
                }}
              />
            </View>
            <Text
              style={{
                color: colors.secondaryText,
                fontSize: 12,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              {updatedCalories || 0}/{600} calories ({calorieProgress}%)
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Header with gradient background */}
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          backgroundColor: isDarkMode ? getAccentColor() : getAccentColor(),
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.3 : 0.15,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <LinearGradient
          colors={
            isDarkMode
              ? [getAccentColor(), getAccentColor()]
              : [getAccentColor(), getAccentColor()]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 160,
            opacity: 0.9,
          }}
        />

        <View
          style={{
            padding: getSpacing(12, 16, 20),
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop:
              Platform.OS === "ios"
                ? getSpacing(12, 16, 20)
                : getSpacing(16, 24, 28),
          }}
        >
          <TouchableOpacity
            onPress={handleQuitWorkout}
            style={{
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.15)"
                : "rgba(255,255,255,0.3)",
              borderRadius: 20,
              width: getSpacing(38, 42, 46),
              height: getSpacing(38, 42, 46),
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <XCircle
              size={getSpacing(20, 22, 24)}
              color={isDarkMode ? "#FFF" : "#6366F1"}
            />
          </TouchableOpacity>

          <View
            style={{
              alignItems: "center",
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.1)"
                : "rgba(255,255,255,0.25)",
              paddingHorizontal: getSpacing(16, 20, 24),
              paddingVertical: getSpacing(6, 8, 10),
              borderRadius: 24,
              maxWidth: isSmallScreen ? SCREEN_WIDTH * 0.5 : SCREEN_WIDTH * 0.6,
              borderWidth: 1,
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.15)"
                : "rgba(255,255,255,0.4)",
            }}
          >
            <Text
              style={{
                fontSize: getFontSize(16, 18, 20),
                fontWeight: "700",
                color: isDarkMode ? "#FFFFFF" : "#4F46E5",
                textAlign: "center",
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {workout?.title}
            </Text>
          </View>

          <View
            style={{
              width: getSpacing(38, 42, 46),
              height: getSpacing(38, 42, 46),
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.15)"
                : "rgba(255,255,255,0.3)",
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Flame
              size={getSpacing(18, 20, 22)}
              color={isDarkMode ? "#FFF" : "#6366F1"}
            />
          </View>
        </View>

        {/* Workout stats */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            paddingBottom: getSpacing(16, 20, 24),
            paddingHorizontal: getSpacing(16, 20, 24),
            marginTop: getSpacing(8, 12, 16),
          }}
        >
          <View
            style={{
              alignItems: "center",
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.2)",
              borderRadius: 16,
              paddingVertical: getSpacing(6, 8, 10),
              paddingHorizontal: getSpacing(12, 16, 20),
              borderWidth: 1,
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.3)",
            }}
          >
            <Text
              style={{
                color: isDarkMode ? "rgba(255,255,255,0.8)" : "#4F46E5",
                marginBottom: 4,
                fontSize: getFontSize(11, 13, 15),
                fontWeight: "500",
              }}
            >
              TIME
            </Text>
            <Text
              style={{
                color: isDarkMode ? "#FFFFFF" : "#4F46E5",
                fontWeight: "700",
                fontSize: getFontSize(14, 16, 18),
              }}
            >
              {formatTime(totalTimeElapsed)}
            </Text>
          </View>

          <View
            style={{
              alignItems: "center",
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.2)",
              borderRadius: 16,
              paddingVertical: getSpacing(6, 8, 10),
              paddingHorizontal: getSpacing(12, 16, 20),
              borderWidth: 1,
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.3)",
            }}
          >
            <Text
              style={{
                color: isDarkMode ? "rgba(255,255,255,0.8)" : "#4F46E5",
                marginBottom: 4,
                fontSize: getFontSize(11, 13, 15),
                fontWeight: "500",
              }}
            >
              PROGRESS
            </Text>
            <Text
              style={{
                fontWeight: "700",
                fontSize: getFontSize(14, 16, 18),
                color: isDarkMode ? "#FFFFFF" : "#4F46E5",
              }}
            >
              {calculateProgress()}%
            </Text>
          </View>

          <View
            style={{
              alignItems: "center",
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.2)",
              borderRadius: 16,
              paddingVertical: getSpacing(6, 8, 10),
              paddingHorizontal: getSpacing(12, 16, 20),
              borderWidth: 1,
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.3)",
            }}
          >
            <Text
              style={{
                color: isDarkMode ? "rgba(255,255,255,0.8)" : "#4F46E5",
                marginBottom: 4,
                fontSize: getFontSize(11, 13, 15),
                fontWeight: "500",
              }}
            >
              CALORIES
            </Text>
            <Text
              style={{
                fontWeight: "700",
                fontSize: getFontSize(14, 16, 18),
                color: isDarkMode ? "#FFFFFF" : "#4F46E5",
              }}
            >
              {Math.round(caloriesBurned)}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 6,
            backgroundColor: "rgba(255,255,255,0.2)",
            width: "100%",
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${calculateProgress()}%`,
              backgroundColor: "#FFFFFF",
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: calculateProgress() === 100 ? 30 : 0,
            }}
          />
        </View>
      </View>

      {/* Main content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          {/* Current exercise section */}
          <View
            style={{
              paddingHorizontal: getSpacing(16, 20, 24),
              paddingTop: getSpacing(24, 28, 32),
              paddingBottom: getSpacing(20, 24, 30),
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: isResting
                  ? isDarkMode
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(16, 185, 129, 0.08)"
                  : isDarkMode
                  ? "rgba(139, 92, 246, 0.15)"
                  : "rgba(99, 102, 241, 0.08)",
                paddingVertical: getSpacing(6, 8, 10),
                paddingHorizontal: getSpacing(14, 18, 22),
                borderRadius: 16,
                marginBottom: getSpacing(16, 20, 24),
                borderWidth: 1,
                borderColor: isResting
                  ? isDarkMode
                    ? "rgba(16, 185, 129, 0.3)"
                    : "rgba(16, 185, 129, 0.15)"
                  : isDarkMode
                  ? "rgba(139, 92, 246, 0.3)"
                  : "rgba(99, 102, 241, 0.15)",
              }}
            >
              <Text
                style={{
                  color: isResting ? "#10B981" : getAccentColor(),
                  fontWeight: "700",
                  fontSize: getFontSize(13, 15, 17),
                  letterSpacing: 0.5,
                }}
              >
                {isResting
                  ? "REST PERIOD"
                  : `EXERCISE ${currentExerciseIndex + 1}/${
                      workout?.exercises.length || 0
                    }`}
              </Text>
            </View>

            <Text
              style={{
                color: colors.text,
                fontWeight: "800",
                fontSize: getFontSize(24, 28, 32),
                marginBottom: getSpacing(8, 12, 16),
                textAlign: "center",
                paddingHorizontal: isSmallScreen ? 8 : 0,
                letterSpacing: -0.5,
              }}
            >
              {currentActivity?.name || "Loading..."}
            </Text>

            {!isResting && currentActivity && (
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                  borderRadius: 20,
                  paddingHorizontal: getSpacing(16, 20, 24),
                  paddingVertical: getSpacing(8, 10, 12),
                  marginBottom: getSpacing(24, 28, 32),
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: isDarkMode
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                }}
              >
                <Dumbbell
                  size={getFontSize(14, 16, 18)}
                  color={colors.secondaryText}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{
                    color: colors.secondaryText,
                    textAlign: "center",
                    fontSize: getFontSize(13, 15, 17),
                    fontWeight: "500",
                  }}
                >
                  {workout?.exercises[currentExerciseIndex]?.reps || "N/A"}{" "}
                  <Text style={{ color: colors.secondaryText }}>&bull;</Text>{" "}
                  {workout?.exercises[currentExerciseIndex]?.sets || 1} set(s)
                </Text>
              </View>
            )}

            {/* Timer component */}
            {currentActivity && (
              <View
                style={{
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: isDarkMode ? 0.3 : 0.15,
                  shadowRadius: 12,
                  elevation: 8,
                  marginTop: getSpacing(8, 10, 12),
                  width: timerSize,
                  height: timerSize,
                }}
              >
                <WorkoutTimer
                  duration={parseDuration(currentActivity.duration)}
                  onComplete={handleTimerComplete}
                  isActive={timerActive}
                  onToggle={handleToggleTimer}
                />
              </View>
            )}
          </View>

          {/* Workout preview section */}
          <View
            style={{
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.05)"
                : colors.card,
              padding: getSpacing(20, 24, 28),
              borderTopWidth: 1,
              borderTopColor: isDarkMode
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: -3,
              },
              shadowOpacity: isDarkMode ? 0.3 : 0.1,
              shadowRadius: 6,
              elevation: 5,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                color: colors.secondaryText,
                marginBottom: getSpacing(14, 16, 18),
                fontSize: getFontSize(12, 14, 16),
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Workout Progress
            </Text>

            {/* Next exercise preview */}
            {nextExercise ? (
              <View style={{ marginBottom: getSpacing(16, 20, 24) }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isDarkMode
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                    borderRadius: 20,
                    padding: getSpacing(14, 16, 18),
                    borderLeftWidth: 4,
                    borderLeftColor: getAccentColor(),
                    marginBottom: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDarkMode ? 0.2 : 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: getSpacing(44, 50, 56),
                      height: getSpacing(44, 50, 56),
                      backgroundColor: getSecondaryAccentColor(),
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: getSpacing(14, 18, 22),
                      borderWidth: 1,
                      borderColor: isResting
                        ? isDarkMode
                          ? "rgba(16, 185, 129, 0.3)"
                          : "rgba(16, 185, 129, 0.2)"
                        : isDarkMode
                        ? "rgba(139, 92, 246, 0.3)"
                        : "rgba(99, 102, 241, 0.2)",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        color: getAccentColor(),
                        fontSize: getFontSize(14, 16, 18),
                      }}
                    >
                      NEXT
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontWeight: "700",
                        color: colors.text,
                        fontSize: getFontSize(15, 17, 19),
                        marginBottom: 4,
                      }}
                    >
                      {nextExercise.name || "Next Exercise"}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginRight: 10,
                          marginBottom: isSmallScreen ? 4 : 0,
                          backgroundColor: isDarkMode
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.03)",
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          borderRadius: 12,
                        }}
                      >
                        <Clock
                          size={getFontSize(12, 14, 16)}
                          color={colors.secondaryText}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            color: colors.secondaryText,
                            fontSize: getFontSize(12, 14, 16),
                            fontWeight: "500",
                          }}
                        >
                          {nextExercise.duration || "45 sec"}
                        </Text>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: isDarkMode
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.03)",
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.secondaryText,
                            fontSize: getFontSize(12, 14, 16),
                            fontWeight: "500",
                          }}
                        >
                          {nextExercise.reps || "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {!isSmallScreen && (
                    <ArrowRight
                      size={getFontSize(18, 22, 26)}
                      color={getAccentColor()}
                    />
                  )}
                </View>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDarkMode
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(16, 185, 129, 0.08)",
                  width: "100%",
                  borderRadius: 16,
                  padding: getSpacing(16, 20, 24),
                  marginBottom: getSpacing(16, 20, 24),
                  borderWidth: 1,
                  borderColor: isDarkMode
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(16, 185, 129, 0.15)",
                }}
              >
                <Heart
                  size={getFontSize(22, 26, 30)}
                  color="#10B981"
                  style={{ marginRight: getSpacing(12, 16, 20) }}
                />
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "600",
                    fontSize: getFontSize(14, 16, 18),
                    flex: 1,
                  }}
                >
                  Keep going! You're almost done with your workout!
                </Text>
              </View>
            )}

            {/* Upcoming exercises list - shown when scrolling */}
            <View style={{ marginTop: getSpacing(8, 12, 16) }}>
              <Text
                style={{
                  color: colors.secondaryText,
                  fontSize: getFontSize(12, 14, 16),
                  fontWeight: "600",
                  marginBottom: getSpacing(12, 14, 16),
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                UPCOMING EXERCISES
              </Text>

              {workout?.exercises && workout.exercises.length > 0 ? (
                <View style={{ paddingBottom: 16 }}>
                  {workout.exercises
                    .slice(currentExerciseIndex + 1)
                    .map((exercise, index) => (
                      <View
                        key={exercise.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: getSpacing(10, 12, 14),
                          borderBottomWidth:
                            index <
                            workout.exercises.slice(currentExerciseIndex + 1)
                              .length -
                              1
                              ? 1
                              : 0,
                          borderBottomColor: isDarkMode
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.05)",
                          opacity:
                            1 - index * 0.1 > 0.5 ? 1 - index * 0.1 : 0.5,
                        }}
                      >
                        <View
                          style={{
                            width: getSpacing(32, 36, 40),
                            height: getSpacing(32, 36, 40),
                            borderRadius: getSpacing(16, 18, 20),
                            backgroundColor: isDarkMode
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(99, 102, 241, 0.08)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: getSpacing(12, 16, 20),
                            borderWidth: 1,
                            borderColor: isDarkMode
                              ? "rgba(255,255,255,0.15)"
                              : "rgba(99, 102, 241, 0.15)",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: getFontSize(13, 15, 17),
                              fontWeight: "700",
                              color: isDarkMode ? "#A78BFA" : "#6366F1",
                            }}
                          >
                            {currentExerciseIndex + index + 2}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: getFontSize(14, 16, 18),
                              fontWeight: "600",
                              color: colors.text,
                              marginBottom: 4,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {exercise.name}
                          </Text>

                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: isDarkMode
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(0,0,0,0.03)",
                                paddingVertical: 3,
                                paddingHorizontal: 6,
                                borderRadius: 8,
                                marginRight: 8,
                              }}
                            >
                              <Clock
                                size={getFontSize(10, 12, 14)}
                                color={colors.secondaryText}
                                style={{ marginRight: 4 }}
                              />
                              <Text
                                style={{
                                  fontSize: getFontSize(11, 12, 14),
                                  color: colors.secondaryText,
                                  fontWeight: "500",
                                }}
                              >
                                {exercise.duration || "45 sec"}
                              </Text>
                            </View>

                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: isDarkMode
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(0,0,0,0.03)",
                                paddingVertical: 3,
                                paddingHorizontal: 6,
                                borderRadius: 8,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: getFontSize(11, 12, 14),
                                  color: colors.secondaryText,
                                  fontWeight: "500",
                                }}
                              >
                                {exercise.reps || "N/A"}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <Dumbbell
                          size={getFontSize(16, 18, 20)}
                          color={colors.secondaryText}
                          style={{ opacity: 0.6, marginLeft: 8 }}
                        />
                      </View>
                    ))}
                </View>
              ) : (
                <View
                  style={{
                    padding: getSpacing(16, 20, 24),
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDarkMode
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      color: colors.secondaryText,
                      textAlign: "center",
                      fontSize: getFontSize(13, 14, 16),
                    }}
                  >
                    No more exercises
                  </Text>
                </View>
              )}

              {/* Workout completion info */}
              <View
                style={{
                  marginTop: getSpacing(20, 24, 28),
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                  borderRadius: 16,
                  padding: getSpacing(16, 20, 24),
                  borderWidth: 1,
                  borderColor: isDarkMode
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: colors.secondaryText,
                      fontSize: getFontSize(13, 14, 15),
                      fontWeight: "500",
                    }}
                  >
                    Total Exercises
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: getFontSize(13, 14, 15),
                      fontWeight: "600",
                    }}
                  >
                    {workout?.exercises?.length || 0}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: colors.secondaryText,
                      fontSize: getFontSize(13, 14, 15),
                      fontWeight: "500",
                    }}
                  >
                    Completed
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: getFontSize(13, 14, 15),
                      fontWeight: "600",
                    }}
                  >
                    {Math.min(
                      currentExerciseIndex + (isResting ? 1 : 0),
                      workout?.exercises?.length || 0
                    )}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: colors.secondaryText,
                      fontSize: getFontSize(13, 14, 15),
                      fontWeight: "500",
                    }}
                  >
                    Estimated Time Left
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: getFontSize(13, 14, 15),
                      fontWeight: "600",
                    }}
                  >
                    {formatTime(
                      workout?.exercises
                        ?.slice(currentExerciseIndex + 1)
                        .reduce((total, ex) => {
                          const exDuration = parseDuration(ex.duration);
                          const restDuration = parseDuration(ex.rest);
                          return total + exDuration + restDuration;
                        }, 0) || 0
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
