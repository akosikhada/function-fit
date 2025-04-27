import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Text,
  RefreshControl,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  useColorScheme,
  Platform,
} from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import {
  Footprints,
  Flame,
  Clock,
  PlayCircle,
  Activity,
  CalendarDays,
  Apple,
  Bell,
  Utensils,
  TrendingUp,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./utils/supabase";
import ThemeModule from "./utils/theme";
import { resetEmergencyFlags } from "./utils/emergency";
const { useTheme } = ThemeModule;

import DailyProgressSummary from "./components/DailyProgressSummary";
import TodaysWorkoutCard from "./components/TodaysWorkoutCard";
import BottomNavigation from "./components/BottomNavigation";
import Toast from "./components/Toast";
import {
  getUser,
  getUserDashboardData,
  getUserProfile,
} from "./utils/supabase";

// Define the Activity type
type Activity = {
  id: string;
  title: string;
  type: "workout" | "run" | "cardio" | string;
  duration?: string;
  distance?: string;
  calories?: string;
  time: string;
};

// Default data structure to use while loading or if there's an error
const defaultUserData = {
  username: "Loading...",
  stepsProgress: 0,
  caloriesProgress: 0,
  workoutProgress: 0,
  stepsValue: "0",
  caloriesValue: "0",
  workoutValue: "0m",
  streakCount: 0,
  achievements: [],
  todaysWorkout: {
    id: "",
    title: "",
    duration: "",
    level: "",
    imageUrl: "",
  },
  recentActivities: [] as Activity[],
};

const screenWidth = Dimensions.get("window").width;
const isSmallScreen = screenWidth < 360;
const horizontalPadding = isSmallScreen ? 16 : 20;
const buttonWidth = isSmallScreen ? "47%" : "48%";
const iconSpacing = isSmallScreen ? 8 : 12;

// Helper function to format date consistently across the app
const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0]; // Get YYYY-MM-DD format
};

export default function HomeScreen() {
  const [userData, setUserData] = useState(defaultUserData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "info",
  });

  // Get theme colors
  const { theme: currentTheme, colors } = useTheme();
  const deviceTheme = useColorScheme() || "light";
  const isDarkMode = currentTheme === "dark";

  // Animation values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const workoutAnim = useRef(new Animated.Value(0)).current;
  const activitiesAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Parallax scroll effect
  const scrollY = useRef(new Animated.Value(0)).current;

  // Add state for progress data
  const [progressData, setProgressData] = useState({
    stepsValue: "0",
    stepsProgress: 0,
    caloriesValue: "0",
    caloriesProgress: 0,
    workoutValue: "0/0",
    workoutProgress: 0,
  });

  // onRefresh function for pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reset all data sources
      await fetchUserData();

      // Show success message
      setToast({
        visible: true,
        message: "Your fitness data has been updated",
        type: "success",
      });
    } catch (error) {
      console.error("Error during refresh:", error);
      setToast({
        visible: true,
        message: "Failed to update your data",
        type: "error",
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Add an emergency refresh handler - this will be triggered on focus
  const performEmergencyRefresh = async () => {
    try {
      console.log("EXECUTING EMERGENCY REFRESH PROTOCOL");

      // Check if emergency fix is required
      const needsEmergencyFix = await AsyncStorage.getItem(
        "EMERGENCY_FIX_REQUIRED"
      );
      if (needsEmergencyFix !== "true") {
        console.log("No emergency fix required");
        return false;
      }

      // Get emergency override values
      const workoutCountOverride = await AsyncStorage.getItem(
        "WORKOUT_COUNT_OVERRIDE"
      );
      const caloriesOverride = await AsyncStorage.getItem("CALORIES_OVERRIDE");

      console.log(
        `Emergency override values - Workouts: ${workoutCountOverride}, Calories: ${caloriesOverride}`
      );

      if (workoutCountOverride || caloriesOverride) {
        // Format values for display
        const formattedWorkouts = workoutCountOverride
          ? parseInt(workoutCountOverride, 10)
          : 0;
        const formattedCalories = caloriesOverride
          ? parseInt(caloriesOverride, 10)
          : 0;

        // Calculate progress percentages
        const workoutProgress = Math.min(
          Math.round((formattedWorkouts / 10) * 100),
          100
        );
        const calorieProgress = Math.min(
          Math.round((formattedCalories / 600) * 100),
          100
        );

        console.log(
          `Setting emergency values - Workouts: ${formattedWorkouts}/10 (${workoutProgress}%), Calories: ${formattedCalories} (${calorieProgress}%)`
        );

        // Directly update UI with emergency values
        setProgressData({
          ...progressData,
          workoutValue: `${formattedWorkouts}/10`,
          workoutProgress: workoutProgress,
          caloriesValue: String(formattedCalories),
          caloriesProgress: calorieProgress,
        });

        // Also update main userData for consistency
        setUserData((prevData) => ({
          ...prevData,
          workoutValue: `${formattedWorkouts}/10`,
          workoutProgress: workoutProgress,
          caloriesValue: String(formattedCalories),
          caloriesProgress: calorieProgress,
        }));

        // Clear emergency flags
        await resetEmergencyFlags();

        console.log("EMERGENCY REFRESH COMPLETE");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error in emergency refresh:", error);
      return false;
    }
  };

  // Check for refresh flag
  useFocusEffect(
    React.useCallback(() => {
      const checkRefreshFlag = async () => {
        try {
          console.log("Home screen focused - checking for forced refresh");

          // Check if workout was recently completed
          const lastCompletion = await AsyncStorage.getItem(
            "last_workout_completion"
          );
          const now = Date.now();
          const lastCompletionTime = lastCompletion
            ? new Date(lastCompletion).getTime()
            : 0;
          const timeSinceCompletion = now - lastCompletionTime;

          // If workout was completed recently (within 1 minute), use force cache refresh
          if (lastCompletion && timeSinceCompletion < 60 * 1000) {
            console.log(
              "Recent workout completion detected, forcing cache refresh"
            );
            // Get workout start time to calculate session duration
            const workoutStartedAt = await AsyncStorage.getItem(
              "workout_started_at"
            );
            const sessionDuration = workoutStartedAt
              ? (now - parseInt(workoutStartedAt)) / 1000
              : 0;

            // If session was very short, prioritize emergency fix
            if (sessionDuration < 60) {
              // Less than 1 minute
              // Check for emergency fix first - highest priority
              const emergencyFixDone = await performEmergencyRefresh();
              if (emergencyFixDone) {
                console.log("Emergency fix applied, skipping normal refresh");
                setLoading(false);
                await AsyncStorage.removeItem("workout_started_at");
                return;
              }
            }

            // Force immediate cache refresh first
            const success = await fetchUserData(true);
            if (success) {
              console.log("Data refreshed successfully after workout");
              setLoading(false);
              await AsyncStorage.removeItem("workout_started_at");
              return;
            }
          }

          // Normal refresh flow
          const forceRefresh = await AsyncStorage.getItem("FORCE_REFRESH_HOME");
          if (forceRefresh) {
            console.log("*** FORCED REFRESH DETECTED ***");
            // Clear the flag
            await AsyncStorage.setItem("FORCE_REFRESH_HOME", "");
            // Fetch latest data
            await fetchUserData();
            return;
          }

          // Basic refresh on focus - ALWAYS fetch user data when screen is focused
          await fetchUserData();
        } catch (error) {
          console.error("Error checking refresh flag:", error);
        } finally {
          // Ensure loading is set to false
          setLoading(false);
        }
      };

      checkRefreshFlag();
    }, [])
  );

  // Load profile picture
  useEffect(() => {
    const loadProfilePicture = async () => {
      try {
        // Get the current user ID first
        const user = await getUser();
        if (!user) return;

        // Use user-specific key for cached profile
        const cachedProfileKey = `userProfile-${user.id}`;
        const cachedProfile = await AsyncStorage.getItem(cachedProfileKey);

        if (cachedProfile) {
          const { avatarUrl } = JSON.parse(cachedProfile);
          if (avatarUrl) {
            setAvatarUrl(avatarUrl);
          }
        }
      } catch (error) {
        console.error("Error loading cached profile:", error);
      }
    };

    loadProfilePicture();
  }, []);

  // Handle start workout button
  const handleStartWorkout = async () => {
    try {
      // Mark timestamp before workout starts to detect completion later
      await AsyncStorage.setItem("workout_started_at", Date.now().toString());
      router.push("/library");
    } catch (error) {
      console.error("Error starting workout:", error);
      router.push("/library");
    }
  };

  // Fetch user data
  const fetchUserData = async (forceCacheRefresh = false) => {
    try {
      setError(null);

      // For immediate updates after workouts, prioritize cache refresh
      if (forceCacheRefresh) {
        console.log("Force cache refresh requested, prioritizing local data");
        // Clear any existing flags
        await AsyncStorage.removeItem("FORCE_REFRESH_HOME");
        const cacheRefreshed = await fetchAccurateProgressData();
        if (cacheRefreshed) {
          console.log("Successfully refreshed from cache");
          return true;
        }
      }

      // Check for emergency flags first
      const emergencyFix = await AsyncStorage.getItem("EMERGENCY_FIX_REQUIRED");
      if (emergencyFix === "true") {
        console.log(
          "Emergency flags detected in fetchUserData, running emergency refresh"
        );
        await performEmergencyRefresh();
        return true;
      }

      // Get the current authenticated user
      const user = await getUser();

      if (!user) {
        console.log("No authenticated user, using mock data");
        setLoading(false);
        return false;
      }

      // Get dashboard data for the user
      const dashboardData = await getUserDashboardData(user.id);
      const profile = await getUserProfile(user.id);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Get the latest stats for today to ensure we have the most up-to-date workout count
      const { data: latestStats } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      // Check AsyncStorage for locally cached stats that might be more recent
      let workoutValue = dashboardData.workoutValue;
      let workoutProgress = dashboardData.workoutProgress;
      let caloriesValue = dashboardData.caloriesValue;
      let caloriesProgress = dashboardData.caloriesProgress;

      try {
        const statsKey = `user_stats_${user.id}_${today}`;
        const cachedStatsStr = await AsyncStorage.getItem(statsKey);

        if (cachedStatsStr) {
          const cachedStats = JSON.parse(cachedStatsStr);
          console.log("Found cached stats in AsyncStorage:", cachedStats);

          // Use cached calories if available and greater than DB value
          const dbCalories = latestStats?.calories || 0;
          const cachedCalories = cachedStats.calories || 0;

          if (cachedCalories > dbCalories) {
            console.log(
              `Using cached calories (${cachedCalories}) instead of DB calories (${dbCalories})`
            );
            caloriesValue = cachedCalories.toString();
            caloriesProgress = Math.min(
              Math.round((cachedCalories / 600) * 100),
              100
            );
          }

          // Use cached workout count if available and greater than DB value
          const dbWorkouts = latestStats?.workouts_completed || 0;
          const cachedWorkouts = cachedStats.workouts_completed || 0;

          if (cachedWorkouts > dbWorkouts) {
            console.log(
              `Using cached workouts (${cachedWorkouts}) instead of DB workouts (${dbWorkouts})`
            );
            const cappedWorkoutCount = Math.min(cachedWorkouts, 10);
            workoutValue = `${cappedWorkoutCount}/10`;
            workoutProgress = Math.min(
              Math.round((cappedWorkoutCount / 10) * 100),
              100
            );
          }
        }
      } catch (cacheError) {
        console.error("Error checking cached stats:", cacheError);
      }

      // If we have latest stats from DB and no cache override
      if (latestStats && caloriesValue === dashboardData.caloriesValue) {
        // Cap the workouts count at 10
        const cappedWorkoutCount = Math.min(latestStats.workouts_completed, 10);
        workoutValue = `${cappedWorkoutCount}/10`;
        workoutProgress = Math.min(
          Math.round((cappedWorkoutCount / 10) * 100),
          100
        );
      }

      // Get recent activities from user_workouts table
      const { data: recentWorkouts, error: workoutsError } = await supabase
        .from("user_workouts")
        .select(
          `
					id, 
					duration, 
					calories, 
					completed_at,
					workout:workout_id (
						id, title
					)
				`
        )
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(3);

      if (workoutsError) {
        console.error("Error fetching recent workouts:", workoutsError);
      }

      // Format recent workouts for display
      const recentActivities: Activity[] = recentWorkouts
        ? recentWorkouts.map((workout) => {
            // Calculate how long ago the workout was completed
            const completedDate = workout.completed_at
              ? new Date(workout.completed_at)
              : new Date();
            const timeAgo = formatTimeAgo(completedDate);

            // Handle workout data with proper type checking
            const workoutTitle =
              workout.workout &&
              typeof workout.workout === "object" &&
              "title" in workout.workout
                ? String(workout.workout.title)
                : "Workout";

            return {
              id: String(workout.id),
              title: workoutTitle,
              type: "workout",
              duration: `${workout.duration} min`,
              calories: `${workout.calories}`,
              time: timeAgo,
            };
          })
        : [];

      // Update avatar URL if available from profile
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);

        // Update the user's cached profile
        try {
          const cachedProfileKey = `userProfile-${user.id}`;
          const cachedProfile = await AsyncStorage.getItem(cachedProfileKey);
          const parsedCache = cachedProfile ? JSON.parse(cachedProfile) : {};

          await AsyncStorage.setItem(
            cachedProfileKey,
            JSON.stringify({
              ...parsedCache,
              userId: user.id,
              avatarUrl: profile.avatar_url,
            })
          );
        } catch (cacheError) {
          console.error("Error updating profile cache:", cacheError);
        }
      }

      // Ensure all fields match the expected types
      setUserData({
        username: String(dashboardData.username),
        stepsProgress: dashboardData.stepsProgress,
        caloriesProgress: caloriesProgress,
        workoutProgress: workoutProgress,
        stepsValue: String(dashboardData.stepsValue),
        caloriesValue: String(caloriesValue),
        workoutValue: workoutValue,
        streakCount: dashboardData.streakCount,
        achievements: [],
        todaysWorkout: {
          ...dashboardData.todaysWorkout,
          level: "beginner",
        },
        recentActivities: recentActivities.length > 0 ? recentActivities : [],
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load your data. Please try again later.");
      return false;
    }
    return true;
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Check and reset daily progress function
  const checkAndResetDailyProgress = async () => {
    try {
      const user = await getUser();
      if (!user) return false;

      // Get the current date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Get the last tracked date from AsyncStorage
      const lastTrackedDateKey = `last_tracked_date_${user.id}`;
      const lastTrackedDate = await AsyncStorage.getItem(lastTrackedDateKey);

      // If the last tracked date is different from today, reset progress
      if (lastTrackedDate !== today) {
        console.log(
          `Resetting daily progress. Last: ${lastTrackedDate}, Today: ${today}`
        );

        // Update the last tracked date to today
        await AsyncStorage.setItem(lastTrackedDateKey, today);

        // Don't modify existing records, just ensure UI is updated with latest
        // This will fetch the correct data for today
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking/resetting daily progress:", error);
      return false;
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // First check if there was a recent workout completion
        const lastCompletion = await AsyncStorage.getItem(
          "last_workout_completion"
        );
        const now = Date.now();
        const lastCompletionTime = lastCompletion
          ? new Date(lastCompletion).getTime()
          : 0;
        const timeSinceCompletion = now - lastCompletionTime;

        // If a workout was completed in the last 1 minute, prioritize emergency refresh
        if (lastCompletion && timeSinceCompletion < 60 * 1000) {
          console.log(
            "Recent workout completion detected, prioritizing emergency refresh"
          );
          const emergencyFixDone = await performEmergencyRefresh();
          if (emergencyFixDone) {
            console.log("Emergency fix applied for recent workout");
            setLoading(false);
            return;
          }
        }

        // Check if we need to reset progress for a new day
        await checkAndResetDailyProgress();

        // Try to fetch accurate progress data from AsyncStorage first
        const accurateDataLoaded = await fetchAccurateProgressData();
        if (!accurateDataLoaded) {
          // If no accurate data in AsyncStorage, fall back to fetching from database
          await fetchUserData();
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        // Attempt to fetch user data as fallback
        await fetchUserData();
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Run animations
    Animated.stagger(100, [
      Animated.spring(headerAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(progressAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(actionsAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(workoutAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(activitiesAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Trigger check and reset daily progress
  useEffect(() => {
    checkAndResetDailyProgress();
  }, []);

  // Get activity icon
  const getActivityIcon = (type: "workout" | "run" | "cardio" | string) => {
    switch (type) {
      case "workout":
        return (
          <Activity size={22} color={isDarkMode ? "#818CF8" : "#8B5CF6"} />
        );
      case "run":
        return (
          <Footprints size={22} color={isDarkMode ? "#60A5FA" : "#3B82F6"} />
        );
      case "cardio":
        return <Flame size={22} color={isDarkMode ? "#F472B6" : "#EC4899"} />;
      default:
        return (
          <Activity size={22} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
        );
    }
  };

  // Fetch accurate progress data
  const fetchAccurateProgressData = async () => {
    try {
      console.log("Fetching accurate progress data from AsyncStorage");

      // Get the current user ID
      const user = await getUser();
      if (!user) {
        console.log("No user found for progress data");
        return false;
      }

      // Format today's date for consistent key usage
      const today = formatDate(new Date());

      // For debugging - check when was the last workout completion
      const lastCompletion = await AsyncStorage.getItem(
        "last_workout_completion"
      );
      console.log("Last workout completion timestamp:", lastCompletion);

      // Get all workout-related keys for this user
      const allKeys = await AsyncStorage.getAllKeys();
      const relevantKeys = allKeys.filter(
        (key) =>
          key === `user_stats_${user.id}_${today}` ||
          key.startsWith("workout_backup_")
      );

      console.log("Found relevant stats keys:", relevantKeys);

      // Check AsyncStorage for locally cached stats
      const statsKey = `user_stats_${user.id}_${today}`;
      console.log("Looking for progress data with key:", statsKey);
      const cachedStatsStr = await AsyncStorage.getItem(statsKey);

      // Collect all possible data sources to find the most recent/complete one
      let allPossibleStats = [];

      // 1. Try the primary stats key
      if (cachedStatsStr) {
        console.log("Found cached stats:", cachedStatsStr);

        try {
          const cachedStats = JSON.parse(cachedStatsStr);
          allPossibleStats.push({
            source: "primary",
            stats: cachedStats,
            calories:
              cachedStats && cachedStats.calories ? cachedStats.calories : 0,
            workouts:
              cachedStats && cachedStats.workouts_completed
                ? cachedStats.workouts_completed
                : 0,
          });
        } catch (parseError) {
          console.error("Error parsing cached stats:", parseError);
        }
      } else {
        console.log("No cached stats found for today in primary location");
      }

      // 2. Try backup keys
      const backupKeys = allKeys.filter((key) =>
        key.startsWith("workout_backup_")
      );
      for (const key of backupKeys) {
        try {
          const backupStr = await AsyncStorage.getItem(key);
          if (backupStr) {
            const backup = JSON.parse(backupStr);
            if (
              backup.userId === user.id &&
              backup.date === today &&
              backup.stats
            ) {
              allPossibleStats.push({
                source: key,
                stats: backup.stats,
                calories: backup.stats.calories || 0,
                workouts: backup.stats.workouts_completed || 0,
                timestamp: backup.timestamp,
              });
            }
          }
        } catch (error) {
          console.error(`Error processing backup key ${key}:`, error);
        }
      }

      // If we found some stats, use the one with the highest workout count or calories
      if (allPossibleStats.length > 0) {
        console.log(`Found ${allPossibleStats.length} possible stats sources`);

        // Sort by workout count (primary) and calories (secondary)
        allPossibleStats.sort((a, b) => {
          if (a.workouts !== b.workouts) {
            return b.workouts - a.workouts; // Highest workout count first
          }
          return b.calories - a.calories; // Then highest calories
        });

        const bestStats = allPossibleStats[0];
        console.log(
          `Using stats from source: ${bestStats.source}`,
          bestStats.stats
        );

        // Get the formatted values
        const cachedCalories = bestStats.calories;
        const cachedWorkouts = bestStats.workouts;

        console.log(
          `Setting progress with calories: ${cachedCalories}, workouts: ${cachedWorkouts}`
        );

        // Update progress state with cached values
        setProgressData({
          ...progressData,
          caloriesValue: String(cachedCalories),
          caloriesProgress: Math.min(
            Math.round((cachedCalories / 600) * 100),
            100
          ),
          workoutValue: `${Math.min(cachedWorkouts, 10)}/10`,
          workoutProgress: Math.min(
            Math.round((cachedWorkouts / 10) * 100),
            100
          ),
        });

        // Also update the main userData state to keep them in sync
        setUserData((prevData) => ({
          ...prevData,
          caloriesValue: String(cachedCalories),
          caloriesProgress: Math.min(
            Math.round((cachedCalories / 600) * 100),
            100
          ),
          workoutValue: `${Math.min(cachedWorkouts, 10)}/10`,
          workoutProgress: Math.min(
            Math.round((cachedWorkouts / 10) * 100),
            100
          ),
        }));

        // Save the best stats to the primary key to consolidate data
        if (bestStats.source !== "primary") {
          console.log("Saving best stats to primary key for future use");
          await AsyncStorage.setItem(statsKey, JSON.stringify(bestStats.stats));
        }

        // Clean up backup keys
        for (const key of backupKeys) {
          if (key !== bestStats.source) {
            await AsyncStorage.removeItem(key);
          }
        }

        return true;
      } else {
        console.log("No valid stats data found after checking all sources");
        return false;
      }
    } catch (error) {
      console.error("Error fetching accurate progress data:", error);
      return false;
    }
  };

  // Card Shadow style by platform
  const cardShadow = Platform.select({
    ios: {
      shadowColor: isDarkMode ? "#000" : "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: isDarkMode ? "#000" : "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 8,
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <View className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator
              size="large"
              color={isDarkMode ? "#8B5CF6" : "#4F46E5"}
            />
            <Text style={{ color: colors.secondaryText }} className="mt-4">
              Loading your fitness data...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center px-4">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
          </View>
        ) : (
          <>
            {/* Status bar spacer */}
            <View style={{ height: StatusBar.currentHeight || 0 }} />

            {/* Header with Welcome Back message */}
            <Animated.View
              style={{
                paddingHorizontal: horizontalPadding,
                paddingTop: 20,
                paddingBottom: 16,
                transform: [{ translateY: headerAnim }],
                zIndex: 10,
              }}
              className="flex-row justify-between items-center"
            >
              <View className="flex-row items-center">
                <View className="rounded-full overflow-hidden border-2 border-indigo-200 dark:border-indigo-900">
                  <Image
                    source={{
                      uri:
                        avatarUrl ||
                        "https://randomuser.me/api/portraits/men/32.jpg",
                    }}
                    className="w-12 h-12"
                    style={{ borderRadius: 24 }}
                  />
                </View>
                <View className="ml-3">
                  <Text
                    style={{ color: colors.secondaryText }}
                    className="text-sm font-medium"
                  >
                    Welcome back
                  </Text>
                  <Text
                    style={{ color: colors.text }}
                    className="text-xl font-bold"
                  >
                    {userData.username}
                  </Text>
                </View>
              </View>
              <TouchableOpacity className="p-2">
                <View
                  style={{
                    backgroundColor: colors.card,
                    ...cardShadow,
                  }}
                  className="rounded-full p-3"
                >
                  <Bell size={20} color={colors.accent} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.ScrollView
              className="flex-1 pb-20"
              contentContainerStyle={{ paddingHorizontal: horizontalPadding }}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={isDarkMode ? "#8B5CF6" : "#4F46E5"}
                  colors={[isDarkMode ? "#8B5CF6" : "#4F46E5"]}
                  progressBackgroundColor={isDarkMode ? "#1E1E1E" : "#F3F4F6"}
                  title="Updating your fitness data..."
                  titleColor={colors.secondaryText}
                />
              }
            >
              {/* Daily Progress Card */}
              <Animated.View
                style={{
                  transform: [
                    { translateY: progressAnim },
                    {
                      translateY: scrollY.interpolate({
                        inputRange: [0, 100],
                        outputRange: [0, -20],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                  marginTop: 10,
                  marginBottom: 24,
                  borderRadius: 24,
                  overflow: "hidden",
                  ...cardShadow,
                }}
              >
                <DailyProgressSummary
                  date={`Today, ${new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}`}
                  stepsProgress={progressData.stepsProgress}
                  caloriesProgress={progressData.caloriesProgress}
                  workoutProgress={progressData.workoutProgress}
                  stepsValue={progressData.stepsValue}
                  caloriesValue={progressData.caloriesValue}
                  workoutValue={progressData.workoutValue}
                />
              </Animated.View>

              {/* Quick Action Buttons */}
              <Animated.View
                className="flex-row justify-between mb-6"
                style={{
                  transform: [
                    { translateY: actionsAnim },
                    {
                      translateY: scrollY.interpolate({
                        inputRange: [0, 150],
                        outputRange: [0, -15],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  style={{ width: buttonWidth }}
                  onPress={handleStartWorkout}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      isDarkMode
                        ? ["#4F46E5", "#7C3AED"]
                        : ["#6366F1", "#4F46E5"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      height: 80,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      ...cardShadow,
                    }}
                  >
                    <PlayCircle
                      size={24}
                      color="#FFFFFF"
                      style={{ marginRight: iconSpacing }}
                    />
                    <Text className="text-white font-semibold text-base">
                      Start Workout
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/nutrition")}
                  style={{ width: buttonWidth }}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      height: 80,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      ...cardShadow,
                    }}
                  >
                    <Apple
                      size={24}
                      color={isDarkMode ? "#34D399" : "#10B981"}
                      style={{ marginRight: iconSpacing }}
                    />
                    <Text
                      style={{ color: isDarkMode ? "#34D399" : "#10B981" }}
                      className="font-semibold text-base"
                    >
                      Nutrition
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* Recent Activities Section */}
              <Animated.View
                className="mb-5"
                style={{
                  transform: [{ translateY: activitiesAnim }],
                }}
              >
                <View className="flex-row justify-between items-center mb-4">
                  <Text
                    style={{ color: colors.text }}
                    className="font-bold text-lg"
                  >
                    Recent Activities
                  </Text>
                  <TouchableOpacity activeOpacity={0.8}>
                    <Text
                      style={{ color: colors.accent }}
                      className="text-sm font-medium"
                    >
                      See All
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    ...cardShadow,
                  }}
                  className="p-4"
                >
                  {userData.recentActivities.length > 0 ? (
                    userData.recentActivities.map((activity, index) => (
                      <View
                        key={activity.id}
                        style={{
                          flexDirection: "row",
                          paddingVertical: 14,
                          borderBottomWidth:
                            index < userData.recentActivities.length - 1
                              ? 1
                              : 0,
                          borderBottomColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: isDarkMode
                              ? "rgba(79, 70, 229, 0.2)"
                              : "rgba(79, 70, 229, 0.1)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text
                            style={{ color: colors.text }}
                            className="font-bold"
                          >
                            {activity.title}
                          </Text>
                          <View className="flex-row mt-1">
                            {activity.duration && (
                              <View className="flex-row items-center mr-3">
                                <Clock
                                  size={12}
                                  color={colors.secondaryText}
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={{ color: colors.secondaryText }}
                                  className="text-xs"
                                >
                                  {activity.duration}
                                </Text>
                              </View>
                            )}
                            {activity.distance && (
                              <View className="flex-row items-center mr-3">
                                <Footprints
                                  size={12}
                                  color={colors.secondaryText}
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={{ color: colors.secondaryText }}
                                  className="text-xs"
                                >
                                  {activity.distance}
                                </Text>
                              </View>
                            )}
                            {activity.calories && (
                              <View className="flex-row items-center">
                                <Flame
                                  size={12}
                                  color={colors.secondaryText}
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={{ color: colors.secondaryText }}
                                  className="text-xs"
                                >
                                  {activity.calories} kcal
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={{ color: colors.secondaryText }}
                            className="text-xs mt-1"
                          >
                            {activity.time}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={{
                            alignSelf: "center",
                            padding: 10,
                          }}
                        >
                          <TrendingUp size={16} color={colors.secondaryText} />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <View style={{ alignItems: "center", paddingVertical: 30 }}>
                      <Activity
                        size={40}
                        color={
                          isDarkMode
                            ? "rgba(156, 163, 175, 0.5)"
                            : "rgba(156, 163, 175, 0.7)"
                        }
                        style={{ marginBottom: 12 }}
                      />
                      <Text
                        style={{ color: colors.secondaryText }}
                        className="text-base font-medium text-center"
                      >
                        No activities yet
                      </Text>
                      <Text
                        style={{ color: colors.secondaryText, opacity: 0.7 }}
                        className="text-sm text-center mt-1"
                      >
                        Complete a workout to see your activities here
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Extra spacer to ensure scrollability and account for navbar */}
              <View style={{ height: 90 }} />
            </Animated.ScrollView>
          </>
        )}

        <View className="absolute bottom-0 left-0 right-0">
          <BottomNavigation activeTab="home" />
        </View>

        {/* Existing Toast component */}
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
          duration={3000}
        />
      </View>
    </SafeAreaView>
  );
}
