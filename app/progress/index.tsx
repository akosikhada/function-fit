import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  Activity,
  Clock,
  Flame,
  Medal,
  Route,
  ChevronRight,
  Settings,
} from "lucide-react-native";
import BottomNavigation from "../components/BottomNavigation";
import { useColorScheme } from "react-native";
import ThemeModule from "../utils/theme";
import {
  supabase,
  getUser,
  getUserStats,
  getUserDashboardData,
} from "../utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
const { useTheme } = ThemeModule;

// Define types for workout data
interface WorkoutHistoryItem {
  id: string;
  date: string;
  workoutId: string;
  workoutName: string;
  durationMinutes: number;
  caloriesBurned: number;
  exercises?: any[];
}

interface StatisticItem {
  value: number;
  change: string;
}

interface WeeklyMonthlyData {
  workoutsCompleted: number;
  daysActive: number;
}

interface ActivityDataItem {
  day: string;
  value: number;
  date?: string;
}

interface Achievement {
  id: string;
  title: string;
  date: string;
  icon: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

// Mock data for the week progress
const thisWeekData = {
  workoutsCompleted: 24,
  daysActive: 5,
};

// Mock data for monthly tab
const monthlyData = {
  workoutsCompleted: 78,
  daysActive: 18,
};

// Mock data for statistics
const statisticsData = {
  totalWorkouts: {
    value: 156,
    change: "+12%",
  },
  totalMinutes: {
    value: 1248,
    change: "+8%",
  },
  caloriesBurned: {
    value: 12450,
    change: "+15%",
  },
  distance: {
    value: 48.2,
    change: "+6%",
  },
};

// Mock data for activity trends
const activityTrendsData = [
  { day: "Mon", value: 55 },
  { day: "Tue", value: 25 },
  { day: "Wed", value: 70 },
  { day: "Thu", value: 50 },
  { day: "Fri", value: 87 },
  { day: "Sat", value: 65 },
  { day: "Sun", value: 40 },
];

// Mock data for achievements
const achievementsData = [
  {
    id: "1",
    title: "7 Day Streak",
    date: "Jan 15, 2024",
    icon: "🏅",
  },
  {
    id: "2",
    title: "50 Workouts",
    date: "Jan 10, 2024",
    icon: "🏅",
  },
];

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const router = useRouter() as any;
  const horizontalPadding = 20;
  const [activeTab, setActiveTab] = useState("week"); // 'week' or 'month'
  
  // Current date state
  const [today] = useState(new Date());
  
  // Refreshing state
  const [refreshing, setRefreshing] = useState(false);

  // State for dashboard data
  const [statisticsData, setStatisticsData] = useState({
    totalWorkouts: {
      value: 0,
      change: "+0%",
    },
    totalMinutes: {
      value: 0,
      change: "+0%",
    },
    caloriesBurned: {
      value: 0,
      change: "+0%",
    },
    distance: {
      value: 0,
      change: "+0%",
    },
  });

  // State for weekly/monthly data
  const [thisWeekData, setThisWeekData] = useState<WeeklyMonthlyData>({
    workoutsCompleted: 0,
    daysActive: 0,
  });

  const [monthlyData, setMonthlyData] = useState<WeeklyMonthlyData>({
    workoutsCompleted: 0,
    daysActive: 0,
  });

  // State for activity trends
  const [activityTrendsData, setActivityTrendsData] = useState<
    ActivityDataItem[]
  >([
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
    { day: "Sat", value: 0 },
    { day: "Sun", value: 0 },
  ]);

  // State for achievements
  const [achievementsData, setAchievementsData] = useState<Achievement[]>([]);

  // Add theme support
  const { theme: currentTheme, colors } = useTheme();
  const deviceTheme = useColorScheme() || "light";

  // Use window dimensions for responsive layout
  const { width, height } = useWindowDimensions();
  const [barChartWidth, setBarChartWidth] = useState((width - 64) / 7); // Initial calculation
  const [cardWidth, setCardWidth] = useState(width * 0.48); // 48% of screen width
  const [isSmallDevice, setIsSmallDevice] = useState(false);

  // Calculate responsive dimensions based on screen size
  useEffect(() => {
    const smallDevice = width < 360;
    setIsSmallDevice(smallDevice);

    // Adjust horizontal padding based on screen width
    const padding = width < 360 ? 12 : width > 768 ? 24 : 16;

    // Calculate bar width for activity chart (7 days)
    setBarChartWidth((width - padding * 2 * 2) / 7); // Double padding for container and inner padding

    // Calculate card width for 2-column grid
    // For larger screens add more breathing room between cards
    const cardWidthValue = width > 768 ? width * 0.47 : width * 0.48;
    setCardWidth(cardWidthValue);
  }, [width]);

  // Load workout data
  useEffect(() => {
    fetchProgressData();
  }, []);

  // Get activity data for current week
  const getActivityTrendsForWeek = async (): Promise<ActivityDataItem[]> => {
    try {
      const user = await getUser();
      if (!user) return [];

      // Calculate dates for the current week (Sunday to Saturday)
      const today = new Date();
      const currentDay = today.getDay(); // 0 is Sunday, 6 is Saturday
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - currentDay); // Go to beginning of week (Sunday)

      // Create array with all days of the week
      const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const activityData: (ActivityDataItem & { date: string })[] =
        dayLabels.map((day, index) => {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + index);
          return {
            day,
            value: 0,
            date: date.toISOString().split("T")[0],
          };
        });

      // Get activity from multiple sources for most accurate data

      // 1. Check user_stats table first (this has the most reliable historical data)
      const { data: statsData, error } = await supabase
        .from("user_stats")
        .select("date, workouts_completed, calories")
        .eq("user_id", user.id)
        .gte("date", activityData[0].date)
        .lte("date", activityData[6].date)
        .order("date", { ascending: true });

      if (error) throw error;

      // 2. Check user_workouts table for actual completed workouts
      // This may have recorded workouts that haven't been reflected in user_stats yet
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("user_workouts")
        .select("workout_id, completed_at, calories")
        .eq("user_id", user.id)
        .gte("completed_at", activityData[0].date)
        .lte("completed_at", activityData[6].date);

      if (workoutsError) throw workoutsError;

      // Create a map of dates to workouts completed
      const workoutsByDate: Record<
        string,
        { count: number; calories: number }
      > = {};

      // Process user_workouts data
      workoutsData?.forEach((workout) => {
        // Extract just the date part
        const dateStr = new Date(workout.completed_at)
          .toISOString()
          .split("T")[0];

        if (!workoutsByDate[dateStr]) {
          workoutsByDate[dateStr] = { count: 0, calories: 0 };
        }

        workoutsByDate[dateStr].count += 1;
        workoutsByDate[dateStr].calories += workout.calories || 0;
      });

      // Process user_stats data
      statsData?.forEach((stat) => {
        const dateStr = stat.date;

        // Check for valid activity in stats (some workouts or calories)
        const hasActivity = stat.workouts_completed > 0 || stat.calories > 0;

        if (hasActivity) {
          // If this date is already recorded from workouts data, take the higher value
          if (workoutsByDate[dateStr]) {
            workoutsByDate[dateStr].calories = Math.max(
              workoutsByDate[dateStr].calories,
              stat.calories || 0
            );
            workoutsByDate[dateStr].count = Math.max(
              workoutsByDate[dateStr].count,
              stat.workouts_completed || 0
            );
          } else {
            workoutsByDate[dateStr] = {
              count: stat.workouts_completed || 0,
              calories: stat.calories || 0,
            };
          }
        }
      });

      // 3. Check AsyncStorage for real-time updates from a workout that was just completed
      // (This handles the case where the user just finished a workout but it hasn't synced to the database yet)
      for (const item of activityData) {
        const calorieKey = `calories_${user.id}_${item.date}`;
        const todayData = await AsyncStorage.getItem(calorieKey);

        if (todayData) {
          const todayCalories = parseInt(todayData, 10);

          // Only update if there are actual calories burned
          if (todayCalories > 0) {
            if (workoutsByDate[item.date]) {
              workoutsByDate[item.date].calories = Math.max(
                workoutsByDate[item.date].calories,
                todayCalories
              );
            } else {
              workoutsByDate[item.date] = {
                count: 1, // Assume at least one workout if calories were burned
                calories: todayCalories,
              };
            }
          }
        }
      }

      // Now map our consolidated data to the activity display
      activityData.forEach((item) => {
        const dateActivity = workoutsByDate[item.date];
        if (dateActivity) {
          // Use calories as the value for chart height
          item.value = dateActivity.calories || 0;
        }
      });

      // Normalize values for better chart visualization
      // Make sure we have a reasonable minimum height
      const maxCalorie = Math.max(
        ...activityData.map((item) => item.value),
        100
      );
      const normalizedData = activityData.map((item) => ({
        day: item.day,
        value: Math.min(Math.round((item.value / maxCalorie) * 100), 100),
        date: item.date,
      }));

      return normalizedData;
    } catch (error) {
      console.error("Error fetching activity trends:", error);
      return [];
    }
  };

  // Get streak and achievements data
  const getStreakAndAchievements = async (): Promise<{
    streak: StreakData;
    achievements: Achievement[];
  } | null> => {
    try {
      const user = await getUser();
      if (!user) return null;

      // Get streak data from local storage
      const streakKey = `workout_streak_${user.id}`;
      const streakData = await AsyncStorage.getItem(streakKey);
      let streak = streakData ? JSON.parse(streakData) : null;

      // Format achievements based on streak data
      const achievements: Achievement[] = [];

      if (streak) {
        // Add current streak if it's at least 3 days
        if (streak.currentStreak >= 3) {
          achievements.push({
            id: "streak-current",
            title: `${streak.currentStreak} Day Streak`,
            date: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            icon: "🔥",
          });
        }

        // Add longest streak achievement
        if (streak.longestStreak >= 5) {
          achievements.push({
            id: "streak-longest",
            title: `${streak.longestStreak} Day Record`,
            date: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            icon: "🏆",
          });
        }
      }

      // Get workout count from storage
      const historyKey = `workout_history_${user.id}`;
      const historyData = await AsyncStorage.getItem(historyKey);
      const history = historyData ? JSON.parse(historyData) : [];

      // Add workout count achievement
      if (history.length > 0) {
        achievements.push({
          id: "workout-count",
          title: `${history.length} Workouts Completed`,
          date: new Date(
            history[history.length - 1]?.date || new Date()
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          icon: "🏋️",
        });
      }

      return {
        streak: streak || { currentStreak: 0, longestStreak: 0 },
        achievements,
      };
    } catch (error) {
      console.error("Error getting streak and achievements:", error);
      return null;
    }
  };

  // Function to fetch progress data
  const fetchProgressData = async () => {
    try {
      setRefreshing(true);

      // Get current user
      const user = await getUser();
      if (!user) return;

      // Check if we need to reset for a new day
      await checkForDayChange(user.id);

      // Get activity trends data which contains accurate day-by-day activity
      const activityData = await getActivityTrendsForWeek();
      setActivityTrendsData(activityData);

      // Calculate active days for the week - a day is active if it has any value > 0
      const activeWeekDays = activityData.filter((day) => day.value > 0).length;

      // Get all user stats from Supabase for accurate workout and calorie data
      const { data: statsData, error: statsError } = await supabase
        .from("user_stats")
        .select("date, calories, workouts_completed, steps")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (statsError) throw statsError;

      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      // Get data from actual completed workouts in user_workouts table
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("user_workouts")
        .select("workout_id, completed_at, calories")
        .eq("user_id", user.id);

      if (workoutsError) throw workoutsError;

      // Process workouts data to get counts by date
      const workoutsByDate: Record<
        string,
        { count: number; calories: number }
      > = {};

      // Process user_workouts data - this is the most accurate source
      workoutsData?.forEach((workout) => {
        const dateStr = new Date(workout.completed_at)
          .toISOString()
          .split("T")[0];

        if (!workoutsByDate[dateStr]) {
          workoutsByDate[dateStr] = { count: 0, calories: 0 };
        }

        workoutsByDate[dateStr].count += 1;
        workoutsByDate[dateStr].calories += workout.calories || 0;
      });

      // Process user_stats data as a fallback
      statsData?.forEach((stat) => {
        if (
          !workoutsByDate[stat.date] &&
          (stat.workouts_completed > 0 || stat.calories > 0)
        ) {
          workoutsByDate[stat.date] = {
            count: stat.workouts_completed || 0,
            calories: stat.calories || 0,
          };
        }
      });

      // Check AsyncStorage for any real-time updates
      const todayCalorieKey = `calories_${user.id}_${today}`;
      const todayData = await AsyncStorage.getItem(todayCalorieKey);

      if (todayData) {
        const todayCalories = parseInt(todayData, 10);
        if (todayCalories > 0) {
          if (!workoutsByDate[today]) {
            workoutsByDate[today] = { count: 1, calories: todayCalories };
          }
        }
      }

      // Get dates for weekly and monthly calculations
      const currentDate = new Date();

      // Calculate the start of the current week (Sunday)
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Calculate the start of the current month
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      startOfMonth.setHours(0, 0, 0, 0);

      // Calculate the number of workouts and active days for the week and month
      let weeklyWorkouts = 0;
      let weeklyActiveDays = new Set<string>();
      let monthlyWorkouts = 0;
      let monthlyActiveDays = new Set<string>();

      // Process all workout dates
      Object.entries(workoutsByDate).forEach(([dateStr, data]) => {
        const workoutDate = new Date(dateStr);

        // Only count if there was actual activity
        if (data.count > 0 || data.calories > 0) {
          // Check if this workout belongs to the current week
          if (workoutDate >= startOfWeek) {
            weeklyWorkouts += data.count;
            weeklyActiveDays.add(dateStr);
          }

          // Check if this workout belongs to the current month
          if (workoutDate >= startOfMonth) {
            monthlyWorkouts += data.count;
            monthlyActiveDays.add(dateStr);
          }
        }
      });

      // Update state with the correct counts
      setThisWeekData({
        workoutsCompleted: weeklyWorkouts,
        daysActive: weeklyActiveDays.size,
      });

      setMonthlyData({
        workoutsCompleted: monthlyWorkouts,
        daysActive: monthlyActiveDays.size,
      });

      // Calculate other stats
      const totalWorkouts = Object.values(workoutsByDate).reduce(
        (sum, data) => sum + data.count,
        0
      );
      const totalCalories = Object.values(workoutsByDate).reduce(
        (sum, data) => sum + data.calories,
        0
      );

      // Estimate workout minutes (assume 30 minutes per workout as a default)
      const totalMinutes = totalWorkouts * 30;

      // Update statistics data
      setStatisticsData({
        totalWorkouts: {
          value: totalWorkouts,
          change: "+0%", // Calculate this if you have previous period data
        },
        totalMinutes: {
          value: totalMinutes,
          change: "+0%",
        },
        caloriesBurned: {
          value: totalCalories,
          change: "+0%",
        },
        distance: {
          value: 0, // You would need to aggregate this from your run tracking data
          change: "+0%",
        },
      });

      // Get streak and achievements
      const streakData = await getStreakAndAchievements();
      if (streakData) {
        setAchievementsData(streakData.achievements);
      }

      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching progress data:", error);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    await fetchProgressData();
  }, []);

  // Get active progress data based on selected tab
  const progressData = activeTab === "week" ? thisWeekData : monthlyData;

  // Calculate maximum value for bar chart scaling
  const maxValue = Math.max(...activityTrendsData.map((day) => day.value), 1);

  // Responsive text sizes
  const titleSize = isSmallDevice ? "text-lg" : "text-xl";
  const subtitleSize = isSmallDevice ? "text-base" : "text-lg";
  const statValueSize = isSmallDevice ? "text-lg" : "text-xl";
  const tabNumberSize = isSmallDevice ? "text-2xl" : "text-3xl";

  // Update the bar color in the renderBar function to handle dark mode
  const renderBar = (value: number) => {
    const maxVal = Math.max(...activityTrendsData.map((day) => day.value), 1);
    const height = Math.max((value / maxVal) * 120, 4);
    return (
      <View
        className="w-7 rounded-t-md"
        style={{
          height,
          backgroundColor: isDarkMode ? "#8B5CF6" : "#6366F1",
        }}
      />
    );
  };

  // Check if day has changed and we need to reset progress
  const checkForDayChange = async (userId: string) => {
    try {
      // Get the current date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Get the last tracked date from AsyncStorage
      const lastTrackedDateKey = `last_tracked_date_${userId}`;
      const lastTrackedDate = await AsyncStorage.getItem(lastTrackedDateKey);

      // If the last tracked date is different from today, reset progress
      if (lastTrackedDate !== today) {
        console.log(
          `Progress page: Day changed. Last: ${lastTrackedDate}, Today: ${today}`
        );

        // Update the last tracked date to today
        await AsyncStorage.setItem(lastTrackedDateKey, today);

        // Any cached today values should be invalidated
        // For AsyncStorage tracked values, clear or reset them
        const todayCalorieKey = `calories_${userId}_${today}`;
        await AsyncStorage.setItem(todayCalorieKey, "0");

        // Check if we have a record for today already
        const { data } = await supabase
          .from("user_stats")
          .select("id")
          .eq("user_id", userId)
          .eq("date", today)
          .maybeSingle();

        // If there's no record for today yet, initialize one with zeroes
        if (!data) {
          try {
            const { error } = await supabase.from("user_stats").insert({
              user_id: userId,
              date: today,
              steps: 0,
              calories: 0,
              workouts_completed: 0,
            });

            // If error is duplicate key, it means another process created the record
            // This is fine, we can ignore this error
            if (error && error.code !== "23505") {
              console.error("Error creating user stats for day change:", error);
            }
          } catch (error: any) {
            // Only log error if it's not a duplicate key error
            if (error.code !== "23505") {
              console.error("Error in checkForDayChange:", error);
            }
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking for day change:", error);
      return false;
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: colors.background,
        paddingTop: Platform.OS === "android" ? 16 : 0,
      }}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View className="flex-1">
        {/* Header with more space at top */}
        <View
          style={{
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.05)",
            marginTop: 16,
            paddingHorizontal: horizontalPadding,
          }}
          className="py-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <View
              style={{
                backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                borderRadius: 10,
                padding: 8,
                marginRight: 10
              }}
            >
              <Activity
                size={20}
                color={isDarkMode ? "#8B5CF6" : "#6366F1"}
              />
            </View>
            <Text style={{ color: colors.text }} className="text-xl font-bold">
              Progress
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDarkMode ? "#8B5CF6" : "#6366F1"}
              colors={[isDarkMode ? "#8B5CF6" : "#6366F1"]}
              progressBackgroundColor={isDarkMode ? "#1E1E1E" : "#F3F4F6"}
            />
          }
        >
          {/* Weekly/Monthly Tabs */}
          <View
            style={{ paddingHorizontal: horizontalPadding }}
            className="mb-8"
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 6,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDarkMode ? 0.25 : 0.1,
                shadowRadius: 6,
                elevation: 4,
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              }}
            >
              <View className="flex-row">
                <TouchableOpacity
                  className="flex-1 p-4 rounded-2xl"
                  style={{
                    backgroundColor:
                      activeTab === "week"
                        ? isDarkMode ? "#7C3AED" : "#6366F1"
                        : "transparent",
                  }}
                  onPress={() => {
                    setActiveTab("week");
                  }}
                  activeOpacity={0.7}
                >
                  <View className="items-center">
                    <Text
                      style={{
                        color:
                          activeTab === "week"
                            ? "#FFFFFF"
                            : isDarkMode
                            ? colors.text
                            : "#374151",
                        fontWeight: "600"
                      }}
                      className="text-sm"
                    >
                      This Week
                    </Text>
                    <Text
                      style={{
                        color:
                          activeTab === "week"
                            ? "#FFFFFF"
                            : isDarkMode
                            ? colors.text
                            : "#1F2937",
                      }}
                      className="text-3xl font-bold mt-2"
                    >
                      {thisWeekData.workoutsCompleted}
                    </Text>
                    <Text
                      style={{
                        color:
                          activeTab === "week"
                            ? "rgba(255,255,255,0.8)"
                            : isDarkMode
                            ? colors.secondaryText
                            : "#6B7280",
                      }}
                      className="text-xs mt-1"
                    >
                      Workouts
                    </Text>

                    {/* Days active indicator */}
                    <View 
                      style={{
                        backgroundColor: activeTab === "week"
                          ? "rgba(255,255,255,0.2)"
                          : isDarkMode
                            ? "rgba(139, 92, 246, 0.15)"
                            : "rgba(99, 102, 241, 0.08)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginTop: 8
                      }}
                    >
                      <Text
                        style={{
                          color:
                            activeTab === "week"
                              ? "rgba(255,255,255,0.9)"
                              : isDarkMode
                              ? "#A78BFA"
                              : "#4F46E5",
                          fontWeight: "500"
                        }}
                        className="text-xs"
                      >
                        {thisWeekData.daysActive} active {thisWeekData.daysActive === 1 ? "day" : "days"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 p-4 rounded-2xl"
                  style={{
                    backgroundColor:
                      activeTab === "month"
                        ? isDarkMode ? "#7C3AED" : "#6366F1"
                        : "transparent",
                  }}
                  onPress={() => {
                    setActiveTab("month");
                  }}
                  activeOpacity={0.7}
                >
                  <View className="items-center">
                    <Text
                      style={{
                        color:
                          activeTab === "month"
                            ? "#FFFFFF"
                            : isDarkMode
                            ? colors.text
                            : "#374151",
                        fontWeight: "600"
                      }}
                      className="text-sm"
                    >
                      Monthly
                    </Text>
                    <Text
                      style={{
                        color:
                          activeTab === "month"
                            ? "#FFFFFF"
                            : isDarkMode
                            ? colors.text
                            : "#1F2937",
                      }}
                      className="text-3xl font-bold mt-2"
                    >
                      {monthlyData.workoutsCompleted}
                    </Text>
                    <Text
                      style={{
                        color:
                          activeTab === "month"
                            ? "rgba(255,255,255,0.8)"
                            : isDarkMode
                            ? colors.secondaryText
                            : "#6B7280",
                      }}
                      className="text-xs mt-1"
                    >
                      Workouts
                    </Text>

                    {/* Days active indicator */}
                    <View 
                      style={{
                        backgroundColor: activeTab === "month"
                          ? "rgba(255,255,255,0.2)"
                          : isDarkMode
                            ? "rgba(139, 92, 246, 0.15)"
                            : "rgba(99, 102, 241, 0.08)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginTop: 8
                      }}
                    >
                      <Text
                        style={{
                          color:
                            activeTab === "month"
                              ? "rgba(255,255,255,0.9)"
                              : isDarkMode
                              ? "#A78BFA"
                              : "#4F46E5",
                          fontWeight: "500"
                        }}
                        className="text-xs"
                      >
                        {monthlyData.daysActive} active {monthlyData.daysActive === 1 ? "day" : "days"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Your Statistics */}
          <View
            style={{ paddingHorizontal: horizontalPadding }}
            className="mb-8"
          >
            <View className="flex-row items-center mb-5">
              <View
                style={{
                  backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                  borderRadius: 8,
                  padding: 5,
                  marginRight: 8
                }}
              >
                <Settings
                  size={16}
                  color={isDarkMode ? "#8B5CF6" : "#6366F1"}
                />
              </View>
              <Text
                style={{ color: colors.text }}
                className="text-lg font-semibold"
              >
                Your Statistics
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDarkMode ? 0.25 : 0.1,
                shadowRadius: 5,
                elevation: 3,
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              }}
            >
              <View className="flex-row flex-wrap">
                {/* Row 1 */}
                <View className="flex-row w-full mb-4">
                  {/* Total Workouts */}
                  <TouchableOpacity
                    className="w-1/2 pr-2"
                    onPress={() => {
                      // Navigate to workout details
                      console.log("Workouts pressed");
                      // Uncomment when routes exist:
                      // router.push("/workout-history" as any);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={{ 
                        backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.4)' : 'rgba(243, 244, 246, 0.8)',
                        borderRadius: 16,
                        padding: 16,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: isDarkMode ? "rgba(49, 46, 129, 0.5)" : "#E0E7FF",
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 10,
                        }}
                      >
                        <Activity
                          size={20}
                          color={isDarkMode ? "#8B5CF6" : "#6366F1"}
                        />
                      </View>
                      <Text
                        style={{ color: colors.secondaryText }}
                        className="text-xs"
                      >
                        Total Workouts
                      </Text>
                      <View className="flex-row items-baseline mt-1">
                        <Text
                          style={{ color: colors.text }}
                          className="text-2xl font-bold"
                        >
                          {statisticsData.totalWorkouts.value}
                        </Text>
                        {statisticsData.totalWorkouts.change !== "+0%" && (
                          <Text
                            style={{ 
                              color: isDarkMode ? "#A78BFA" : "#6366F1",
                              marginLeft: 4, 
                            }}
                            className="text-xs font-semibold"
                          >
                            {statisticsData.totalWorkouts.change}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Total Minutes */}
                  <TouchableOpacity
                    className="w-1/2 pl-2"
                    onPress={() => {
                      // Navigate to workout minutes details
                      console.log("Minutes pressed");
                      // Uncomment when routes exist:
                      // router.push("/workout-time" as any);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={{ 
                        backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.4)' : 'rgba(243, 244, 246, 0.8)',
                        borderRadius: 16,
                        padding: 16,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: isDarkMode ? "rgba(30, 58, 138, 0.5)" : "#DBEAFE",
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 10,
                        }}
                      >
                        <Clock
                          size={20}
                          color={isDarkMode ? "#60A5FA" : "#3B82F6"}
                        />
                      </View>
                      <Text
                        style={{ color: colors.secondaryText }}
                        className="text-xs"
                      >
                        Total Minutes
                      </Text>
                      <View className="flex-row items-baseline mt-1">
                        <Text
                          style={{ color: colors.text }}
                          className="text-2xl font-bold"
                        >
                          {statisticsData.totalMinutes.value}
                        </Text>
                        {statisticsData.totalMinutes.change !== "+0%" && (
                          <Text
                            style={{ 
                              color: isDarkMode ? "#93C5FD" : "#2563EB",
                              marginLeft: 4, 
                            }}
                            className="text-xs font-semibold"
                          >
                            {statisticsData.totalMinutes.change}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Row 2 */}
                <View className="flex-row w-full">
                  {/* Calories Burned */}
                  <TouchableOpacity
                    className="w-1/2 pr-2"
                    onPress={() => {
                      // Navigate to calories details
                      console.log("Calories pressed");
                      // Uncomment when routes exist:
                      // router.push("/calorie-history" as any);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={{ 
                        backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.4)' : 'rgba(243, 244, 246, 0.8)',
                        borderRadius: 16,
                        padding: 16,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: isDarkMode ? "rgba(127, 29, 29, 0.5)" : "#FEE2E2",
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 10,
                        }}
                      >
                        <Flame
                          size={20}
                          color={isDarkMode ? "#F87171" : "#EF4444"}
                        />
                      </View>
                      <Text
                        style={{ color: colors.secondaryText }}
                        className="text-xs"
                      >
                        Calories Burned
                      </Text>
                      <View className="flex-row items-baseline mt-1">
                        <Text
                          style={{ color: colors.text }}
                          className="text-2xl font-bold"
                        >
                          {statisticsData.caloriesBurned.value}
                        </Text>
                        {statisticsData.caloriesBurned.change !== "+0%" && (
                          <Text
                            style={{ 
                              color: isDarkMode ? "#FCA5A5" : "#DC2626",
                              marginLeft: 4, 
                            }}
                            className="text-xs font-semibold"
                          >
                            {statisticsData.caloriesBurned.change}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Distance */}
                  <TouchableOpacity
                    className="w-1/2 pl-2"
                    onPress={() => {
                      // Navigate to distance details
                      console.log("Distance pressed");
                      // Uncomment when routes exist:
                      // router.push("/distance-history" as any);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={{ 
                        backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.4)' : 'rgba(243, 244, 246, 0.8)',
                        borderRadius: 16,
                        padding: 16,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: isDarkMode ? "rgba(6, 78, 59, 0.5)" : "#D1FAE5",
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 10,
                        }}
                      >
                        <Route
                          size={20}
                          color={isDarkMode ? "#34D399" : "#10B981"}
                        />
                      </View>
                      <Text
                        style={{ color: colors.secondaryText }}
                        className="text-xs"
                      >
                        Distance
                      </Text>
                      <View className="flex-row items-baseline mt-1">
                        <Text
                          style={{ color: colors.text }}
                          className="text-2xl font-bold"
                        >
                          {statisticsData.distance.value} km
                        </Text>
                        {statisticsData.distance.change !== "+0%" && (
                          <Text
                            style={{ 
                              color: isDarkMode ? "#6EE7B7" : "#059669",
                              marginLeft: 4, 
                            }}
                            className="text-xs font-semibold"
                          >
                            {statisticsData.distance.change}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Activity Trends */}
          <View
            style={{ paddingHorizontal: horizontalPadding }}
            className="mb-8"
          >
            <View className="flex-row items-center mb-5">
              <View
                style={{
                  backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                  borderRadius: 8,
                  padding: 5,
                  marginRight: 8
                }}
              >
                <Activity
                  size={16}
                  color={isDarkMode ? "#8B5CF6" : "#6366F1"}
                />
              </View>
              <Text
                style={{ color: colors.text }}
                className="text-lg font-semibold"
              >
                Activity Trends
              </Text>
            </View>

            <View
              style={{ 
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDarkMode ? 0.25 : 0.1,
                shadowRadius: 5,
                elevation: 3,
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              }}
            >
              <View className="mb-2">
                <Text style={{ color: colors.secondaryText }} className="text-xs font-medium mb-4">
                  Calories Burned Per Day
                </Text>
              </View>
              
              <View className="flex-row justify-between items-end h-36 mb-4">
                {activityTrendsData.map((day, index) => (
                  <View key={index} className="items-center">
                    <View className="relative">
                      <View 
                        className="rounded-t-md"
                        style={{
                          width: 28,
                          height: Math.max((day.value / maxValue) * 120, 4),
                          backgroundColor: isDarkMode 
                            ? day.value > 50 ? "#8B5CF6" : "rgba(139, 92, 246, 0.5)" 
                            : day.value > 50 ? "#6366F1" : "rgba(99, 102, 241, 0.5)",
                          shadowColor: day.value > 50 ? (isDarkMode ? "#8B5CF6" : "#6366F1") : "transparent",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 2,
                          elevation: day.value > 50 ? 2 : 0,
                        }}
                      />
                    </View>
                    <View 
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 8,
                        backgroundColor: index === today.getDay() 
                          ? isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)'
                          : 'transparent',
                        borderRadius: 12,
                        marginTop: 8
                      }}
                    >
                      <Text
                        style={{ 
                          color: index === today.getDay() 
                            ? isDarkMode ? "#A78BFA" : "#6366F1" 
                            : colors.secondaryText,
                          fontWeight: index === today.getDay() ? "600" : "400"
                        }}
                        className="text-xs"
                      >
                        {day.day}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              
              <View className="h-px w-full my-1" style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
              
              <View className="mt-4 flex-row justify-between">
                <Text style={{ color: colors.secondaryText }} className="text-xs">
                  Weekly Average: {Math.round(activityTrendsData.reduce((sum, day) => sum + day.value, 0) / 7)}%
                </Text>
                <Text style={{ color: isDarkMode ? "#A78BFA" : "#6366F1", fontWeight: "500" }} className="text-xs">
                  View Details
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Achievements */}
          <View
            style={{ paddingHorizontal: horizontalPadding }}
            className="mb-20"
          >
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center">
                <View
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                    borderRadius: 8,
                    padding: 5,
                    marginRight: 8
                  }}
                >
                  <Medal
                    size={16}
                    color={isDarkMode ? "#8B5CF6" : "#6366F1"}
                  />
                </View>
                <Text
                  style={{ color: colors.text }}
                  className="text-lg font-semibold"
                >
                  Recent Achievements
                </Text>
              </View>
              <TouchableOpacity>
                <Text style={{ color: isDarkMode ? "#A78BFA" : "#6366F1", fontWeight: "500" }} className="text-xs">
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{ 
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDarkMode ? 0.25 : 0.1,
                shadowRadius: 5,
                elevation: 3,
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              }}
            >
              {achievementsData.length > 0 ? (
                achievementsData.map((achievement, index) => (
                  <TouchableOpacity
                    key={achievement.id}
                    onPress={() => {
                      // Navigate to achievement details
                      console.log("Achievement pressed:", achievement.id);
                      // Uncomment when routes exist:
                      // router.push(`/achievement/${achievement.id}` as any);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={{
                        borderBottomWidth: index < achievementsData.length - 1 ? 1 : 0,
                        borderBottomColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                      }}
                      className="flex-row items-center"
                    >
                      <View
                        style={{
                          backgroundColor: isDarkMode ? "rgba(49, 46, 129, 0.5)" : "#E0E7FF",
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 14,
                        }}
                      >
                        <Medal
                          size={20}
                          color={isDarkMode ? "#8B5CF6" : "#6366F1"}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          style={{ color: colors.text }}
                          className="font-semibold text-base"
                        >
                          {achievement.title}
                        </Text>
                        <Text
                          style={{ color: colors.secondaryText }}
                          className="text-xs mt-1"
                        >
                          {achievement.date}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.4)' : 'rgba(243, 244, 246, 0.8)',
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ChevronRight size={18} color={colors.secondaryText} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="items-center py-10">
                  <View
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Medal
                      size={28}
                      color={isDarkMode ? "#8B5CF6" : "#6366F1"}
                    />
                  </View>
                  <Text
                    style={{ color: colors.text }}
                    className="font-semibold text-base mb-2"
                  >
                    No Achievements Yet
                  </Text>
                  <Text
                    style={{ color: colors.secondaryText }}
                    className="text-xs text-center max-w-[250px]"
                  >
                    Complete workouts and fitness goals to earn achievements
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <BottomNavigation activeTab="progress" />
      </View>
    </SafeAreaView>
  );
}
