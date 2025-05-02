import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  useColorScheme,
  Image,
  Platform,
  Animated,
  Modal,
  Alert,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  Calendar as CalendarIcon,
  Clock,
  Dumbbell,
  ChevronRight,
  Plus,
  Check,
  ArrowRight,
  Calendar,
  MoreVertical,
  Flame,
  ChevronLeft,
  Trash2,
  CheckCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import BottomNavigation from "../components/BottomNavigation";
import ThemeModule from "../utils/theme";
import { supabase } from "../utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { useTheme } = ThemeModule;

// Helper function to format date for display
const formatDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = { month: "long" };
  return (
    new Intl.DateTimeFormat("en-US", options).format(date) +
    " " +
    date.getFullYear()
  );
};

// Helper function to format a date for display in the calendar modal
const formatDisplayDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

// Helper function to get the month name
const getMonthName = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = { month: "long" };
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

// Get today's date and current day of week
const today = new Date();
const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

// Define the types needed for our workout data
type Exercise = {
  name: string;
  sets: number;
  reps: string;
  muscle: string;
};

// Define Workout type
type Workout = {
  id: string;
  planId: string;
  title: string;
  time?: string;
  duration: string;
  intensity: string;
  calories: string;
  completed: boolean;
  imageUrl: string;
  exercises?: Exercise[];
};

// Define the type for our schedule
type WorkoutScheduleDay = {
  day: number;
  workouts: Workout[];
};

// Define the WorkoutPlan type as returned from the database
type WorkoutPlan = {
  id: string;
  scheduled_date: string;
  scheduled_time?: string;
  workouts: {
    id: string;
    title: string;
    duration: number;
    calories: number;
    difficulty: string;
    image_url?: string;
  };
};

// Define type for weekly progress data
type WeeklyProgressItem = {
  day: string;
  value: number;
  target: number;
  date: string;
};

// Sample completed workouts for weekly summary
const completedWorkouts = [
  { day: "Mon", value: 1, target: 1 },
  { day: "Tue", value: 0, target: 0 },
  { day: "Wed", value: 1, target: 1 },
  { day: "Thu", value: 0, target: 0 },
  { day: "Fri", value: 0, target: 1 },
  { day: "Sat", value: 0, target: 1 },
  { day: "Sun", value: 0, target: 1 },
];

// Helper function to get user from Supabase
const getUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Helper function to get workout plans for a specific date
const getWorkoutPlans = async (
  userId: string,
  date: string
): Promise<WorkoutPlan[]> => {
  const { data, error } = await supabase
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
  return data as unknown as WorkoutPlan[];
};

// Helper function to generate week dates
const getWeekDates = () => {
  const dates = [];
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Calculate the start of the week (Sunday)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek);

  // Generate dates for the week
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push({
      date: date.getDate(),
      day: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][i],
      isToday: i === dayOfWeek,
      fullDate: date.toISOString().split("T")[0], // format: YYYY-MM-DD
    });
  }
  return dates;
};

const weekDates = getWeekDates();

export default function PlanScreen() {
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 380;
  const isMediumDevice = width >= 380 && width < 600;
  const isLargeDevice = width >= 600;
  const isExtraLargeDevice = width >= 1024;
  const { theme: currentTheme, colors } = useTheme();
  const isDarkMode = currentTheme === "dark";

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Success modal animation values
  const successScaleAnim = useRef(new Animated.Value(0.3)).current;
  const successOpacityAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScaleAnim = useRef(new Animated.Value(0)).current;

  // Calculate responsive sizes
  const contentPadding = isExtraLargeDevice
    ? 32
    : isLargeDevice
    ? 24
    : isMediumDevice
    ? 16
    : 12;

  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [refreshing, setRefreshing] = useState(false);
  const [monthDisplay, setMonthDisplay] = useState(formatDate(new Date()));
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [workoutSchedule, setWorkoutSchedule] = useState<WorkoutScheduleDay[]>([
    { day: 0, workouts: [] },
    { day: 1, workouts: [] },
    { day: 2, workouts: [] },
    { day: 3, workouts: [] },
    { day: 4, workouts: [] },
    { day: 5, workouts: [] },
    { day: 6, workouts: [] },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deletedWorkoutTitle, setDeletedWorkoutTitle] = useState("");
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressItem[]>(
    []
  );
  const [weeklyProgressPercent, setWeeklyProgressPercent] = useState(0);

  // Handle calendar icon press in header
  const handleCalendarPress = () => {
    setShowCalendarModal(true);
    // Reset the calendar month to current month when opening
    const currentDate = new Date();
    setCalendarMonth(currentDate);
    setSelectedCalendarDate(currentDate);
  };

  // Function to handle month navigation
  const navigateMonth = (direction: number) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCalendarMonth(newMonth);

    // Keep the day the same if possible in the new month
    const newSelectedDate = new Date(selectedCalendarDate);
    newSelectedDate.setMonth(newSelectedDate.getMonth() + direction);
    // Check if the day exists in the new month
    const daysInMonth = new Date(
      newSelectedDate.getFullYear(),
      newSelectedDate.getMonth() + 1,
      0
    ).getDate();
    if (newSelectedDate.getDate() > daysInMonth) {
      newSelectedDate.setDate(daysInMonth);
    }
    setSelectedCalendarDate(newSelectedDate);
  };

  // Function to generate days for the calendar
  const getDaysInMonth = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    let days: (number | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Function to select a date from the calendar
  const selectDate = (day: number | null) => {
    if (!day) return; // Skip empty slots

    const newDate = new Date(calendarMonth);
    newDate.setDate(day);

    // Update the selected calendar date
    setSelectedCalendarDate(newDate);

    // Update the month display
    setMonthDisplay(formatDate(newDate));

    // Find the day of week
    const dayOfWeek = newDate.getDay();
    setSelectedDay(dayOfWeek);

    // Close the modal
    setShowCalendarModal(false);
  };

  // Function to delete a workout from the plan
  const deleteWorkout = async (planId: string) => {
    try {
      // Close the menu
      setMenuVisible(false);

      // Store the workout title before deleting
      const workoutTitle = selectedWorkoutPlan?.title || "Workout";
      setDeletedWorkoutTitle(workoutTitle);

      // Get the current user
      const user = await getUser();
      if (!user) return;

      // Delete from database
      const { error } = await supabase
        .from("workout_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      // Refresh the data
      fetchWorkoutSchedule();

      // Show success modal instead of Alert
      setShowSuccessModal(true);

      // Animate the success modal elements
      Animated.sequence([
        Animated.parallel([
          Animated.timing(successScaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(successOpacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(checkmarkScaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide the success modal after 2.5 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        // Reset animation values
        successScaleAnim.setValue(0.3);
        successOpacityAnim.setValue(0);
        checkmarkScaleAnim.setValue(0);
      }, 2500);
    } catch (error) {
      console.error("Error deleting workout:", error);
      Alert.alert("Error", "Failed to remove workout. Please try again.");
    }
  };

  // Function to handle opening the menu
  const handleOpenMenu = (workout: Workout, planId: string) => {
    setSelectedWorkoutPlan({
      id: planId,
      title: workout.title,
    });
    setMenuVisible(true);
  };

  // Function to fetch workout schedule data
  const fetchWorkoutSchedule = async () => {
    try {
      setIsLoading(true);

      // Get the current user
      const user = await getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Prepare an empty schedule structure
      const newSchedule: WorkoutScheduleDay[] = Array(7)
        .fill(0)
        .map((_, i) => ({
          day: i,
          workouts: [],
        }));

      // Get today's date and create dates for the entire week
      const today = new Date();

      // First, fetch all completed workouts for this user
      const { data: completedWorkouts, error: completedError } = await supabase
        .from("user_workouts")
        .select("workout_id")
        .eq("user_id", user.id);

      if (completedError) {
        console.error("Error fetching completed workouts:", completedError);
      }

      // Create a Set of completed workout IDs for faster lookup
      const completedWorkoutIds = new Set(
        completedWorkouts?.map((cw) => cw.workout_id) || []
      );

      // Fetch workout plans for each day of the week
      for (let i = 0; i < 7; i++) {
        try {
          const plans = await getWorkoutPlans(user.id, weekDates[i].fullDate);

          if (plans && plans.length > 0) {
            // Convert to our Workout format
            const workoutsForDay = plans.map((plan) => ({
              id: plan.workouts.id,
              planId: plan.id,
              title: plan.workouts.title,
              duration: `${plan.workouts.duration || 30} mins`,
              intensity: plan.workouts.difficulty || "Medium",
              calories: `${plan.workouts.calories || 0}`,
              completed: completedWorkoutIds.has(plan.workouts.id), // Check if this workout is completed
              imageUrl:
                plan.workouts.image_url ||
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
              time: plan.scheduled_time || "Any time",
              exercises: [], // Could be fetched in a real app
            }));

            // Add to schedule
            newSchedule[i].workouts = workoutsForDay;
          }
        } catch (error) {
          console.error(`Error fetching workouts for day ${i}:`, error);
        }
      }

      // Update the workout schedule state
      setWorkoutSchedule(newSchedule);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching workout schedule:", error);
      setIsLoading(false);
    }
  };

  // Function to fetch weekly progress data
  const fetchWeeklyProgress = async () => {
    try {
      // Get the current user
      const user = await getUser();
      if (!user) return;

      // Get the start and end dates of the current week
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Calculate the start date (Sunday) of the current week
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);

      // Calculate the end date (Saturday) of the current week
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      // Format dates for query
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      console.log(
        `Fetching weekly progress from ${startDateStr} to ${endDateStr}`
      );

      // DIRECT APPROACH: First, get ALL completed workouts for the week
      const { data: completedWorkouts, error: completedError } = await supabase
        .from("user_workouts")
        .select(
          `
          id,
          workout_id,
          completed_at
        `
        )
        .eq("user_id", user.id)
        .gte("completed_at", startDate.toISOString())
        .lte("completed_at", endDate.toISOString());

      if (completedError) {
        console.error("Error fetching completed workouts:", completedError);
        throw completedError;
      }

      console.log(
        `Found ${completedWorkouts?.length || 0} completed workouts this week`
      );

      if (completedWorkouts && completedWorkouts.length > 0) {
        console.log("Sample completed workout:", completedWorkouts[0]);
      }

      // Second, get scheduled workouts for targets
      const { data: scheduledWorkouts, error: scheduleError } = await supabase
        .from("workout_plans")
        .select(
          `
          id,
          scheduled_date,
          workout_id
        `
        )
        .eq("user_id", user.id)
        .gte("scheduled_date", startDateStr)
        .lte("scheduled_date", endDateStr);

      if (scheduleError) {
        console.error("Error fetching scheduled workouts:", scheduleError);
        throw scheduleError;
      }

      console.log(
        `Found ${scheduledWorkouts?.length || 0} scheduled workouts this week`
      );

      // Initialize progress data for each day of the week
      const progressByDay: Record<
        number,
        { completed: number; total: number; date: string }
      > = {};

      // Initialize empty counts for all days
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        progressByDay[i] = {
          completed: 0,
          total: 0,
          date: dayDate.toISOString().split("T")[0],
        };
      }

      // Count scheduled workouts as targets
      if (scheduledWorkouts && scheduledWorkouts.length > 0) {
        scheduledWorkouts.forEach((workout) => {
          const workoutDate = new Date(workout.scheduled_date);
          const dayIndex = workoutDate.getDay();
          progressByDay[dayIndex].total += 1;
        });
      }

      // Count completed workouts directly
      if (completedWorkouts && completedWorkouts.length > 0) {
        completedWorkouts.forEach((workout) => {
          const completionDate = new Date(workout.completed_at);
          const dayIndex = completionDate.getDay();
          progressByDay[dayIndex].completed += 1;

          // If there are more completed than scheduled, adjust the target
          if (
            progressByDay[dayIndex].completed > progressByDay[dayIndex].total
          ) {
            progressByDay[dayIndex].total = progressByDay[dayIndex].completed;
          }
        });
      }

      // Convert to array format for display
      const progressData: WeeklyProgressItem[] = Object.entries(
        progressByDay
      ).map(([dayIndex, data]) => ({
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          parseInt(dayIndex)
        ],
        value: data.completed,
        target: data.total,
        date: data.date,
      }));

      console.log(
        "Weekly progress data:",
        JSON.stringify(progressData, null, 2)
      );

      // Update the state with new progress data
      setWeeklyProgress(progressData);

      // Calculate overall weekly progress percentage
      const totalCompleted = progressData.reduce(
        (sum, day) => sum + day.value,
        0
      );
      const totalTarget = progressData.reduce(
        (sum, day) => sum + day.target,
        0
      );

      console.log(
        `Total completed: ${totalCompleted}, Total target: ${totalTarget}`
      );

      const progressPercent =
        totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

      console.log(`Setting weekly progress percentage to ${progressPercent}%`);

      setWeeklyProgressPercent(progressPercent);
    } catch (error) {
      console.error("Error fetching weekly progress:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWorkoutSchedule(), fetchWeeklyProgress()]);
    setRefreshing(false);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchWorkoutSchedule();
    fetchWeeklyProgress();
  }, []);

  const selectedDayWorkouts =
    workoutSchedule.find((schedule) => schedule.day === selectedDay)
      ?.workouts || [];

  // Animate in the content on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Get weekly workout stats - Use actual data instead of static completedWorkouts
  const totalWeeklyWorkouts = weeklyProgress.reduce(
    (acc, curr) => acc + curr.value,
    0
  );
  const totalWeeklyTargets = weeklyProgress.reduce(
    (acc, curr) => acc + curr.target,
    0
  );
  // Use the calculated percentage directly
  // const weeklyProgress =
  //	totalWeeklyTargets > 0
  //		? Math.round((totalWeeklyWorkouts / totalWeeklyTargets) * 100)
  //		: 0;

  // Add function to generate years for selector
  const generateYearOptions = () => {
    const startYear = 1950;
    const endYear = 2050;
    const years = [];

    // Show years from 1950 to 2050
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };

  // Add function to handle year selection
  const selectYear = (year: number) => {
    // Update the calendar month with the new year
    const newDate = new Date(calendarMonth);
    newDate.setFullYear(year);
    setCalendarMonth(newDate);

    // Update the selected date with the new year
    const newSelectedDate = new Date(selectedCalendarDate);
    newSelectedDate.setFullYear(year);
    setSelectedCalendarDate(newSelectedDate);

    // Update the month display with the new year
    setMonthDisplay(formatDate(newSelectedDate));

    // Close the year selector
    setShowYearSelector(false);
  };

  // Update the handleYearSelector function
  const handleYearSelector = () => {
    // Toggle the year selector visibility
    setShowYearSelector(!showYearSelector);
  };

  // Add this helper function before the return statement
  const getMuscleColor = (muscle: string, isDarkMode: boolean) => {
    switch (muscle.toLowerCase()) {
      case "chest":
        return isDarkMode ? "#EC4899" : "#BE185D";
      case "back":
        return isDarkMode ? "#8B5CF6" : "#5B21B6";
      case "arms":
      case "triceps":
      case "biceps":
      case "shoulders":
        return isDarkMode ? "#60A5FA" : "#1D4ED8";
      case "legs":
      case "quads":
      case "hamstrings":
      case "calves":
        return isDarkMode ? "#34D399" : "#047857";
      case "core":
      case "abs":
      case "obliques":
      case "lower abs":
        return isDarkMode ? "#FBBF24" : "#B45309";
      case "cardio":
      case "full body":
        return isDarkMode ? "#F87171" : "#B91C1C";
      default:
        return isDarkMode ? "#A78BFA" : "#6D28D9";
    }
  };

  // Function to mark a workout as completed
  const markWorkoutAsCompleted = async (
    workoutId: string,
    workout: Workout
  ) => {
    try {
      // Get the current user
      const user = await getUser();
      if (!user) return;

      console.log(`Marking workout as completed: ${workoutId}`);

      // Get the current date and time
      const completedAt = new Date().toISOString();

      // Extract numeric duration from string (e.g. "30 mins" -> 30)
      const durationMatch = workout.duration.match(/\d+/);
      const duration = durationMatch ? parseInt(durationMatch[0], 10) : 30; // Default to 30 if parsing fails

      // Extract numeric calories from string
      const caloriesMatch = workout.calories.match(/\d+/);
      const calories = caloriesMatch ? parseInt(caloriesMatch[0], 10) : 0; // Default to 0 if parsing fails

      // Insert a record into the user_workouts table
      const { data, error } = await supabase.from("user_workouts").insert([
        {
          user_id: user.id,
          workout_id: workoutId,
          completed_at: completedAt,
          duration: duration,
          calories: calories,
          // Removed difficulty field as it doesn't exist in the table
        },
      ]);

      if (error) {
        console.error("Database error marking workout as completed:", error);
        throw error;
      }

      console.log("Successfully inserted workout completion record");

      // Update local state to reflect completion in the UI
      const updatedSchedule = [...workoutSchedule];
      const scheduleDay = updatedSchedule.find(
        (day) => day.day === selectedDay
      );
      if (scheduleDay) {
        const workoutIndex = scheduleDay.workouts.findIndex(
          (w) => w.id === workoutId
        );
        if (workoutIndex !== -1) {
          scheduleDay.workouts[workoutIndex].completed = true;
          setWorkoutSchedule(updatedSchedule);
        }
      }

      // Set flags for home screen to detect the completion
      const today = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format
      await AsyncStorage.setItem("last_workout_completion", completedAt);
      await AsyncStorage.setItem(
        `workout_completed_${user.id}`,
        Date.now().toString()
      );
      await AsyncStorage.setItem(
        `last_workout_completion_${user.id}_${today}`,
        completedAt
      );
      await AsyncStorage.setItem("FORCE_REFRESH_HOME", "true");
      await AsyncStorage.setItem("dashboard_needs_refresh", "true");

      // Also update local stats in AsyncStorage
      try {
        const statsKey = `user_stats_${user.id}_${today}`;
        // Get existing stats or create new ones
        const existingStatsStr = await AsyncStorage.getItem(statsKey);
        const existingStats = existingStatsStr
          ? JSON.parse(existingStatsStr)
          : {};

        // Update workout count and calories
        const updatedStats = {
          ...existingStats,
          workouts_completed: (existingStats.workouts_completed || 0) + 1,
          calories: (existingStats.calories || 0) + calories,
          updated_at: new Date().toISOString(),
          timestamp: Date.now(),
        };

        // Save back to AsyncStorage
        await AsyncStorage.setItem(statsKey, JSON.stringify(updatedStats));

        // Also create a backup with timestamp
        const backupKey = `workout_backup_${Date.now()}`;
        await AsyncStorage.setItem(
          backupKey,
          JSON.stringify({
            userId: user.id,
            date: today,
            stats: updatedStats,
          })
        );

        console.log("Updated local stats in AsyncStorage");
      } catch (storageError) {
        console.error("Error updating local stats:", storageError);
      }

      // Show success message
      Alert.alert(
        "Workout Completed",
        "Great job! Your workout has been marked as completed.",
        [{ text: "OK" }]
      );

      // Refresh the weekly progress data
      console.log("Refreshing weekly progress after workout completion");
      await fetchWeeklyProgress();
    } catch (error) {
      console.error("Error marking workout as completed:", error);
      Alert.alert(
        "Error",
        "Failed to mark workout as completed. Please try again."
      );
    }
  };

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.background,
        paddingTop: Platform.OS === "android" ? 25 : 10,
      }}
      className="flex-1"
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View className="flex-1">
        {/* Header */}
        <View
          className="flex-row items-center justify-between border-b"
          style={{
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
            paddingHorizontal: contentPadding,
            paddingVertical: contentPadding * 0.9,
            marginTop: Platform.OS === "ios" ? 20 : 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDarkMode ? 0.2 : 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <LinearGradient
              colors={
                isDarkMode ? ["#8B5CF6", "#6D28D9"] : ["#818CF8", "#4F46E5"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Dumbbell size={isSmallDevice ? 18 : 20} color="#FFFFFF" />
            </LinearGradient>
            <Text
              className="font-bold"
              style={{
                color: colors.text,
                fontSize: isSmallDevice ? 18 : 22,
                letterSpacing: -0.5,
              }}
            >
              Workout Plan
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCalendarPress}
            className="p-2 rounded-full"
            style={{
              backgroundColor: isDarkMode
                ? "rgba(139, 92, 246, 0.15)"
                : "rgba(99, 102, 241, 0.08)",
              width: 42,
              height: 42,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CalendarIcon
              size={isSmallDevice ? 20 : 22}
              color={isDarkMode ? "#8B5CF6" : "#6366F1"}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDarkMode ? "#8B5CF6" : "#6366F1"}
              colors={[isDarkMode ? "#8B5CF6" : "#6366F1"]}
              progressBackgroundColor={isDarkMode ? "#1E1E1E" : "#F3F4F6"}
            />
          }
          contentContainerStyle={{
            paddingBottom: 100,
            ...(isExtraLargeDevice && {
              maxWidth: 1200,
              alignSelf: "center",
              width: "100%",
            }),
          }}
        >
          {/* Weekly Progress */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              backgroundColor: colors.card,
              marginHorizontal: contentPadding,
              marginTop: contentPadding + 6,
              marginBottom: contentPadding + 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDarkMode ? 0.3 : 0.12,
              shadowRadius: 8,
              elevation: 5,
              borderRadius: 24,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.02)",
            }}
            className="mx-4 mt-6 mb-6"
          >
            {/* Progress card gradient accent */}
            <LinearGradient
              colors={
                isDarkMode
                  ? ["#8B5CF6", "#6D28D9", "#5B21B6"]
                  : ["#818CF8", "#6366F1", "#4F46E5"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 6,
              }}
            />

            {/* Main content container */}
            <View className="p-6">
              {/* Header with title and percentage indicator */}
              <View className="flex-row justify-between items-center mb-5">
                {/* Title section */}
                <View className="flex-row items-center">
                  <View
                    style={{
                      backgroundColor: isDarkMode
                        ? "rgba(139, 92, 246, 0.15)"
                        : "rgba(99, 102, 241, 0.08)",
                      padding: 12,
                      borderRadius: 16,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDarkMode ? 0.15 : 0.05,
                      shadowRadius: 3,
                      elevation: isDarkMode ? 2 : 1,
                    }}
                  >
                    <Flame
                      size={isSmallDevice ? 18 : 20}
                      color={isDarkMode ? "#A78BFA" : "#6366F1"}
                    />
                  </View>
                  <View className="ml-2">
                    <Text
                      className="font-bold"
                      style={{
                        color: colors.text,
                        fontSize: isSmallDevice ? 16 : 18,
                        letterSpacing: -0.3,
                      }}
                    >
                      Weekly Progress
                    </Text>
                    <Text
                      style={{
                        color: colors.secondaryText,
                        fontSize: isSmallDevice ? 12 : 13,
                        marginTop: 2,
                      }}
                    >
                      {totalWeeklyWorkouts} / {totalWeeklyTargets} workouts
                      completed
                    </Text>
                  </View>
                </View>

                {/* Percentage indicator */}
                <View
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(139, 92, 246, 0.15)"
                      : "rgba(99, 102, 241, 0.08)",
                    borderRadius: 20,
                    height: 40,
                    minWidth: 110,
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "row",
                    paddingHorizontal: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDarkMode ? 0.2 : 0.08,
                    shadowRadius: 3,
                    elevation: isDarkMode ? 2 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 35,
                      height: 35,
                      borderRadius: 17,
                      backgroundColor: isDarkMode
                        ? "rgba(124, 58, 237, 0.3)"
                        : "rgba(79, 70, 229, 0.12)",
                      justifyContent: "center",
                      alignItems: "center",
                      position: "absolute",
                      left: 0,
                    }}
                  >
                    <Text
                      style={{
                        color: isDarkMode ? "#C4B5FD" : "#4F46E5",
                        fontSize: isSmallDevice ? 13 : 15,
                        fontWeight: "700",
                      }}
                    >
                      {weeklyProgressPercent}%
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: isDarkMode ? "#C4B5FD" : "#4F46E5",
                      fontSize: isSmallDevice ? 13 : 14,
                      fontWeight: "600",
                      marginLeft: 35,
                    }}
                  >
                    Complete
                  </Text>
                </View>
              </View>

              {/* Weekly progress visualization - days of week */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginTop: 6,
                  paddingTop: 6,
                }}
              >
                {weeklyProgress.map((dayProgress, index) => {
                  const height =
                    dayProgress.target > 0
                      ? (dayProgress.value / dayProgress.target) * 100
                      : 0;

                  // Is today's column
                  const isToday =
                    dayProgress.day ===
                    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                      new Date().getDay()
                    ];

                  return (
                    <View
                      key={index}
                      style={{
                        alignItems: "center",
                        width: `${100 / 7}%`,
                      }}
                    >
                      {/* Day label */}
                      <Text
                        style={{
                          color: isToday
                            ? isDarkMode
                              ? "#A78BFA"
                              : "#4F46E5"
                            : colors.secondaryText,
                          fontSize: 12,
                          marginBottom: 8,
                          fontWeight: isToday ? "700" : "600",
                        }}
                      >
                        {dayProgress.day}
                      </Text>

                      {/* Bar container */}
                      <View
                        style={{
                          width: isSmallDevice ? 24 : 28,
                          height: 110,
                          borderRadius: 14,
                          backgroundColor: isDarkMode
                            ? "rgba(31, 41, 55, 0.7)"
                            : "rgba(243, 244, 246, 0.8)",
                          overflow: "hidden",
                          justifyContent: "flex-end",
                          marginBottom: 8,
                          borderWidth: isToday ? 1 : 0,
                          borderColor: isDarkMode ? "#6D28D9" : "#4F46E5",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isDarkMode ? 0.2 : 0.08,
                          shadowRadius: 3,
                          elevation: isToday ? 3 : 1,
                        }}
                      >
                        {dayProgress.value > 0 && (
                          <LinearGradient
                            colors={
                              isToday
                                ? isDarkMode
                                  ? ["#A78BFA", "#8B5CF6", "#7C3AED"]
                                  : ["#818CF8", "#6366F1", "#4F46E5"]
                                : isDarkMode
                                ? ["#8B5CF6", "#7C3AED", "#6D28D9"]
                                : ["#818CF8", "#6366F1", "#4F46E5"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={{
                              width: "100%",
                              height: `${height}%`,
                              borderTopLeftRadius: 13,
                              borderTopRightRadius: 13,
                            }}
                          />
                        )}
                      </View>

                      {/* Workout count label */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "center",
                          alignItems: "center",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 10,
                          backgroundColor:
                            dayProgress.value > 0
                              ? isDarkMode
                                ? "rgba(139, 92, 246, 0.2)"
                                : "rgba(99, 102, 241, 0.1)"
                              : "transparent",
                          minWidth: 30,
                          opacity: dayProgress.target > 0 ? 1 : 0.5,
                        }}
                      >
                        <Text
                          style={{
                            color: isDarkMode
                              ? dayProgress.value > 0
                                ? "#C4B5FD"
                                : colors.secondaryText
                              : dayProgress.value > 0
                              ? "#4F46E5"
                              : colors.secondaryText,
                            fontSize: 12,
                            fontWeight: dayProgress.value > 0 ? "700" : "500",
                          }}
                        >
                          {dayProgress.value}/{dayProgress.target}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>

          {/* Calendar Strip */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginHorizontal: contentPadding,
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDarkMode ? 0.25 : 0.1,
              shadowRadius: 6,
              elevation: 4,
              borderWidth: 1,
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.02)",
            }}
            className="mb-8"
          >
            <View className="flex-row justify-between items-center mb-5 mt-2">
              <View className="flex-row items-center">
                <View
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(139, 92, 246, 0.15)"
                      : "rgba(99, 102, 241, 0.08)",
                    padding: 12,
                    borderRadius: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDarkMode ? 0.15 : 0.05,
                    shadowRadius: 3,
                    elevation: isDarkMode ? 2 : 1,
                  }}
                >
                  <Calendar
                    size={isSmallDevice ? 18 : 20}
                    color={isDarkMode ? "#A78BFA" : "#6366F1"}
                  />
                </View>
                <View className="ml-3">
                  <Text
                    className="font-bold"
                    style={{
                      color: colors.text,
                      fontSize: isSmallDevice ? 16 : 18,
                      letterSpacing: -0.3,
                    }}
                  >
                    {monthDisplay}
                  </Text>
                  <Text
                    style={{
                      color: colors.secondaryText,
                      fontSize: isSmallDevice ? 12 : 13,
                      marginTop: 2,
                    }}
                  >
                    {formatDisplayDate(new Date())}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-row items-center"
                onPress={() => router.push("/calendar" as any)}
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(139, 92, 246, 0.15)"
                    : "rgba(99, 102, 241, 0.08)",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDarkMode ? 0.2 : 0.1,
                  shadowRadius: 3,
                  elevation: isDarkMode ? 2 : 1,
                }}
              >
                <Text
                  style={{
                    color: isDarkMode ? "#A78BFA" : "#6366F1",
                    fontSize: isSmallDevice ? 12 : 14,
                    marginRight: 6,
                    fontWeight: "600",
                  }}
                >
                  View Calendar
                </Text>
                <ArrowRight
                  size={isSmallDevice ? 14 : 16}
                  color={isDarkMode ? "#A78BFA" : "#6366F1"}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingVertical: 12,
                paddingHorizontal: 4,
              }}
              className="mb-2"
              style={{
                marginHorizontal: -4,
              }}
            >
              {weekDates.map((date, index) => {
                const isSelected = selectedDay === index;
                const hasWorkout =
                  (workoutSchedule.find((schedule) => schedule.day === index)
                    ?.workouts?.length ?? 0) > 0;

                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    key={index}
                    onPress={() => setSelectedDay(index)}
                    className="items-center mx-2"
                    style={{
                      width: isSmallDevice ? 50 : 58,
                    }}
                  >
                    <View
                      style={{
                        width: isSmallDevice ? 48 : 54,
                        height: isSmallDevice ? 48 : 54,
                        borderRadius: isSmallDevice ? 24 : 27,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 8,
                        backgroundColor: isSelected
                          ? isDarkMode
                            ? "#7C3AED"
                            : "#6366F1"
                          : date.isToday
                          ? isDarkMode
                            ? "rgba(139, 92, 246, 0.2)"
                            : "rgba(99, 102, 241, 0.1)"
                          : isDarkMode
                          ? "rgba(31, 41, 55, 0.7)"
                          : "rgba(249, 250, 251, 0.8)",
                        borderWidth: 1,
                        borderColor: isSelected
                          ? isDarkMode
                            ? "#9333EA"
                            : "#4F46E5"
                          : date.isToday
                          ? isDarkMode
                            ? "rgba(147, 51, 234, 0.5)"
                            : "rgba(79, 70, 229, 0.5)"
                          : isDarkMode
                          ? "rgba(55, 65, 81, 0.3)"
                          : "rgba(229, 231, 235, 0.7)",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected ? 0.4 : 0.1,
                        shadowRadius: isSelected ? 4 : 2,
                        elevation: isSelected ? 4 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected
                            ? "#FFFFFF"
                            : date.isToday
                            ? isDarkMode
                              ? "#C4B5FD"
                              : "#4F46E5"
                            : colors.text,
                          fontWeight:
                            isSelected || date.isToday ? "700" : "600",
                          fontSize: isSmallDevice ? 16 : 18,
                          marginBottom: 2,
                        }}
                      >
                        {date.date}
                      </Text>
                      <Text
                        style={{
                          color: isSelected
                            ? "rgba(255, 255, 255, 0.8)"
                            : colors.secondaryText,
                          fontSize: isSmallDevice ? 10 : 11,
                          fontWeight:
                            isSelected || date.isToday ? "600" : "500",
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                        }}
                      >
                        {date.day.substring(0, 3)}
                      </Text>
                    </View>

                    {hasWorkout && (
                      <View
                        style={{
                          height: 6,
                          width: hasWorkout ? 30 : 0,
                          borderRadius: 3,
                          backgroundColor: isSelected
                            ? isDarkMode
                              ? "#A78BFA"
                              : "#818CF8"
                            : isDarkMode
                            ? "#7C3AED"
                            : "#6366F1",
                          opacity: hasWorkout ? 1 : 0,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 1,
                          elevation: 1,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Workouts for Selected Day */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginHorizontal: contentPadding,
            }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <View
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(139, 92, 246, 0.15)"
                      : "rgba(99, 102, 241, 0.08)",
                    borderRadius: 16,
                    padding: 12,
                    marginRight: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDarkMode ? 0.15 : 0.05,
                    shadowRadius: 3,
                    elevation: isDarkMode ? 2 : 1,
                  }}
                >
                  <Dumbbell
                    size={isSmallDevice ? 18 : 20}
                    color={isDarkMode ? "#A78BFA" : "#6366F1"}
                  />
                </View>
                <View>
                  <Text
                    className="font-bold"
                    style={{
                      color: colors.text,
                      fontSize: isSmallDevice ? 17 : 19,
                      letterSpacing: -0.3,
                    }}
                  >
                    {selectedDayWorkouts.length > 0
                      ? "Today's Workouts"
                      : "Rest Day"}
                  </Text>
                  <Text
                    style={{
                      color: colors.secondaryText,
                      fontSize: isSmallDevice ? 12 : 14,
                      marginTop: 3,
                    }}
                  >
                    {selectedDayWorkouts.length > 0
                      ? `${selectedDayWorkouts.length} workout${
                          selectedDayWorkouts.length > 1 ? "s" : ""
                        } scheduled`
                      : "No workouts scheduled"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center"
                onPress={() => router.push("/library" as any)}
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(124, 58, 237, 0.25)"
                    : "rgba(99, 102, 241, 0.12)",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDarkMode ? 0.3 : 0.1,
                  shadowRadius: 3,
                  elevation: isDarkMode ? 3 : 2,
                }}
              >
                <Plus
                  size={isSmallDevice ? 15 : 17}
                  color={isDarkMode ? "#A78BFA" : "#6366F1"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: isDarkMode ? "#A78BFA" : "#6366F1",
                    fontSize: isSmallDevice ? 13 : 15,
                    fontWeight: "600",
                  }}
                >
                  Add Workout
                </Text>
              </TouchableOpacity>
            </View>

            {selectedDayWorkouts.length > 0 ? (
              selectedDayWorkouts.map((workout, index) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  key={index}
                  className="mb-6 overflow-hidden"
                  style={{
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: isDarkMode ? 0.3 : 0.15,
                    shadowRadius: 7,
                    elevation: 5,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: isDarkMode
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                    transform: [{ translateY: 0 }],
                  }}
                  onPress={() => router.push(`/library` as any)}
                >
                  {/* Header section with image */}
                  <View
                    style={{
                      height: isExtraLargeDevice
                        ? 160
                        : isLargeDevice
                        ? 150
                        : isMediumDevice
                        ? 140
                        : 130,
                    }}
                  >
                    <View className="flex-row h-full">
                      {/* Workout Image */}
                      <View
                        style={{
                          width: "40%",
                          position: "relative",
                          borderTopLeftRadius: 24,
                          borderBottomLeftRadius: 24,
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          source={{ uri: workout.imageUrl }}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderTopLeftRadius: 24,
                            borderBottomLeftRadius: 24,
                          }}
                          resizeMode="cover"
                        />
                        {workout.completed && (
                          <View
                            className="absolute top-3 left-3 rounded-full p-1.5"
                            style={{
                              backgroundColor: "rgba(16, 185, 129, 0.9)",
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.3,
                              shadowRadius: 2,
                              elevation: 3,
                            }}
                          >
                            <Check size={16} color="#FFFFFF" />
                          </View>
                        )}
                        <LinearGradient
                          colors={["transparent", "rgba(0,0,0,0.7)"]}
                          start={{ x: 0.5, y: 0 }}
                          end={{ x: 0.5, y: 1 }}
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: "50%",
                          }}
                        />
                      </View>

                      {/* Workout Details */}
                      <View
                        className="flex-1 justify-between"
                        style={{
                          padding: isSmallDevice ? 14 : 16,
                        }}
                      >
                        <View>
                          <View className="flex-row items-center mb-2 justify-between">
                            <View className="flex-row items-center">
                              <View
                                className="rounded-md px-3 py-2 mr-2 bg-opacity-10"
                                style={{
                                  backgroundColor:
                                    workout.intensity === "High"
                                      ? isDarkMode
                                        ? "rgba(239, 68, 68, 0.25)"
                                        : "rgba(254, 226, 226, 1)"
                                      : workout.intensity === "Medium"
                                      ? isDarkMode
                                        ? "rgba(59, 130, 246, 0.25)"
                                        : "rgba(219, 234, 254, 1)"
                                      : isDarkMode
                                      ? "rgba(16, 185, 129, 0.25)"
                                      : "rgba(209, 250, 229, 1)",
                                }}
                              >
                                <Text
                                  className="font-medium"
                                  style={{
                                    color:
                                      workout.intensity === "High"
                                        ? isDarkMode
                                          ? "#F87171"
                                          : "#B91C1C"
                                        : workout.intensity === "Medium"
                                        ? isDarkMode
                                          ? "#60A5FA"
                                          : "#1E40AF"
                                        : isDarkMode
                                        ? "#34D399"
                                        : "#065F46",
                                    fontSize: 10,
                                    fontWeight: "700",
                                  }}
                                >
                                  {workout.intensity}
                                </Text>
                              </View>
                              <View
                                className="flex-row items-center bg-opacity-10 px-3 py-2 rounded-md"
                                style={{
                                  backgroundColor: isDarkMode
                                    ? "rgba(139, 92, 246, 0.15)"
                                    : "rgba(99, 102, 241, 0.08)",
                                }}
                              >
                                <Clock
                                  size={isSmallDevice ? 10 : 12}
                                  color={isDarkMode ? "#C4B5FD" : "#6366F1"}
                                  style={{ marginRight: 3 }}
                                />
                                <Text
                                  style={{
                                    color: isDarkMode ? "#C4B5FD" : "#6366F1",
                                    fontSize: isSmallDevice ? 10 : 12,
                                    fontWeight: "600",
                                  }}
                                >
                                  {workout.time}
                                </Text>
                              </View>
                            </View>

                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                justifyContent: "center",
                                alignItems: "center",
                                backgroundColor: isDarkMode
                                  ? "rgba(55, 65, 81, 0.7)"
                                  : "rgba(243, 244, 246, 0.8)",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.2,
                                shadowRadius: 1.5,
                                elevation: 2,
                              }}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleOpenMenu(workout, workout.planId);
                              }}
                            >
                              <MoreVertical
                                size={isSmallDevice ? 14 : 16}
                                color={colors.secondaryText}
                              />
                            </TouchableOpacity>
                          </View>

                          <Text
                            className="font-bold mb-1.5"
                            style={{
                              color: colors.text,
                              fontSize: isSmallDevice ? 16 : 18,
                              letterSpacing: -0.3,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {workout.title}
                          </Text>

                          <View className="flex-row items-center">
                            <View
                              className="flex-row items-center mr-3 bg-opacity-5 px-2.5 py-1.5 rounded-md"
                              style={{
                                backgroundColor: isDarkMode
                                  ? "rgba(255,255,255,0.08)"
                                  : "rgba(0,0,0,0.04)",
                              }}
                            >
                              <Clock
                                size={isSmallDevice ? 10 : 12}
                                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                                style={{ marginRight: 3 }}
                              />
                              <Text
                                style={{
                                  color: colors.secondaryText,
                                  fontSize: isSmallDevice ? 10 : 12,
                                  fontWeight: "600",
                                }}
                                numberOfLines={1}
                              >
                                {workout.duration || ""}
                              </Text>
                            </View>
                            <View
                              className="flex-row items-center bg-opacity-5 px-2.5 py-1.5 rounded-md"
                              style={{
                                backgroundColor: isDarkMode
                                  ? "rgba(255,255,255,0.08)"
                                  : "rgba(0,0,0,0.04)",
                              }}
                            >
                              <Flame
                                size={isSmallDevice ? 10 : 12}
                                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                                style={{ marginRight: 3 }}
                              />
                              <Text
                                style={{
                                  color: colors.secondaryText,
                                  fontSize: isSmallDevice ? 10 : 12,
                                  fontWeight: "600",
                                }}
                                numberOfLines={1}
                              >
                                {workout.calories
                                  ? workout.calories + " cal"
                                  : ""}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Exercise details section - only show if we have exercises */}
                  {workout.exercises && workout.exercises.length > 0 && (
                    <View
                      style={{
                        paddingHorizontal: 20,
                        paddingBottom: 22,
                        borderTopWidth: 1,
                        borderTopColor: isDarkMode
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.06)",
                        marginTop: 10,
                        paddingTop: 18,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          marginBottom: 14,
                          color: colors.secondaryText,
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                        }}
                      >
                        Exercises
                      </Text>

                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {workout.exercises.map((exercise, idx) => (
                          <View
                            key={idx}
                            style={{
                              width: "50%",
                              paddingRight: idx % 2 === 0 ? 6 : 0,
                              paddingLeft: idx % 2 === 1 ? 6 : 0,
                              marginBottom: 14,
                            }}
                          >
                            <View
                              style={{
                                backgroundColor: isDarkMode
                                  ? "rgba(75, 85, 99, 0.35)"
                                  : "rgba(243, 244, 246, 1)",
                                borderRadius: 16,
                                padding: 14,
                                borderLeftWidth: 4,
                                borderLeftColor: getMuscleColor(
                                  exercise.muscle,
                                  isDarkMode
                                ),
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: isDarkMode ? 0.25 : 0.1,
                                shadowRadius: 3,
                                elevation: 2,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: isSmallDevice ? 14 : 15,
                                  fontWeight: "700",
                                  color: colors.text,
                                  marginBottom: 6,
                                }}
                              >
                                {exercise.name}
                              </Text>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginTop: 2,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 11,
                                    color: getMuscleColor(
                                      exercise.muscle,
                                      isDarkMode
                                    ),
                                    fontWeight: "600",
                                    backgroundColor: isDarkMode
                                      ? "rgba(0,0,0,0.2)"
                                      : "rgba(255,255,255,0.5)",
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 8,
                                  }}
                                >
                                  {exercise.muscle}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 13,
                                    color: colors.secondaryText,
                                    fontWeight: "700",
                                  }}
                                >
                                  {exercise.sets} × {exercise.reps}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View
                className="items-center py-10 rounded-3xl mb-4"
                style={{
                  backgroundColor: colors.card,
                  padding: 28,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: isDarkMode ? 0.3 : 0.15,
                  shadowRadius: 8,
                  elevation: 5,
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: isDarkMode
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                }}
              >
                <LinearGradient
                  colors={
                    isDarkMode
                      ? ["rgba(139, 92, 246, 0.18)", "rgba(79, 70, 229, 0.08)"]
                      : ["rgba(224, 231, 255, 0.9)", "rgba(239, 246, 255, 0.5)"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 28,
                  }}
                />

                <View
                  className="mb-7"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: isDarkMode
                      ? "rgba(124, 58, 237, 0.15)"
                      : "rgba(99, 102, 241, 0.1)",
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isDarkMode ? 0.2 : 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Dumbbell
                    size={46}
                    color={isDarkMode ? "#A78BFA" : "#6366F1"}
                  />
                </View>
                <Text
                  className="font-bold mb-3 text-center"
                  style={{
                    color: colors.text,
                    fontSize: 24,
                    letterSpacing: -0.5,
                  }}
                >
                  Rest Day
                </Text>
                <Text
                  className="text-center mb-8"
                  style={{
                    color: colors.secondaryText,
                    fontSize: 16,
                    lineHeight: 26,
                    maxWidth: 320,
                  }}
                >
                  Recovery is just as important as training. Take time to rest
                  or add a workout to your plan.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  className="rounded-xl px-8 py-4 items-center"
                  style={{
                    backgroundColor: isDarkMode ? "#7C3AED" : "#6366F1",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDarkMode ? 0.4 : 0.2,
                    shadowRadius: 6,
                    elevation: 4,
                    width: "70%",
                    maxWidth: 240,
                  }}
                  onPress={() => router.push("/library" as any)}
                >
                  <Text
                    className="font-semibold"
                    style={{
                      color: "#FFFFFF",
                      fontSize: 17,
                      fontWeight: "700",
                    }}
                  >
                    Browse Workouts
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="plan" />

      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              padding: 20,
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Workout Completed
            </Text>
            <Text
              style={{
                color: colors.secondaryText,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              Great job! Your workout has been marked as completed.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                backgroundColor: "#6366F1",
                padding: 10,
                borderRadius: 5,
                marginTop: 10,
                width: "100%",
              }}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Menu Modal for 3-dot button */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 6,
              width: "80%",
              maxWidth: 300,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              borderWidth: 1,
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderRadius: 12,
              }}
              onPress={() => {
                setMenuVisible(false);
                if (selectedWorkoutPlan?.id) {
                  router.push(
                    `/workout-player/${selectedWorkoutPlan.id}` as any
                  );
                }
              }}
            >
              <Dumbbell
                size={20}
                color={isDarkMode ? "#A78BFA" : "#6366F1"}
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isDarkMode ? "#A78BFA" : "#6366F1",
                }}
              >
                Start Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderRadius: 12,
                marginTop: 4,
              }}
              onPress={() => {
                setMenuVisible(false);
                // Get the workout object from the selected plan ID
                const daySchedule = workoutSchedule.find(
                  (schedule) => schedule.day === selectedDay
                );
                if (daySchedule) {
                  const workout = daySchedule.workouts.find(
                    (w) => w.planId === selectedWorkoutPlan?.id
                  );
                  if (workout) {
                    markWorkoutAsCompleted(workout.id, workout);
                  }
                }
              }}
            >
              <CheckCircle
                size={20}
                color={isDarkMode ? "#34D399" : "#059669"}
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isDarkMode ? "#34D399" : "#059669",
                }}
              >
                Complete Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderRadius: 12,
                marginTop: 4,
              }}
              onPress={() => {
                if (selectedWorkoutPlan?.id) {
                  deleteWorkout(selectedWorkoutPlan.id);
                }
              }}
            >
              <Trash2
                size={20}
                color={isDarkMode ? "#F87171" : "#EF4444"}
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isDarkMode ? "#F87171" : "#EF4444",
                }}
              >
                Delete Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderRadius: 12,
                marginTop: 4,
              }}
              onPress={() => setMenuVisible(false)}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.text,
                  textAlign: "center",
                  width: "100%",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
