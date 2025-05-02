import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Clock, Flame, Activity } from "lucide-react-native";
import ThemeModule from "../utils/theme";

interface DailyProgressSummaryProps {
  date?: string;
  stepsProgress?: number;
  caloriesProgress?: number;
  workoutProgress?: number;
  stepsValue?: string;
  caloriesValue?: string;
  workoutValue?: string;
  activeMinutesValue?: string;
}

const DailyProgressSummary = ({
  date = "",
  stepsProgress = 0,
  caloriesProgress = 0,
  workoutProgress = 0,
  stepsValue = "0",
  caloriesValue = "0",
  workoutValue = "0/0", // Format can be "X/Y" for workout count or "XXm/YYm" for minutes
  activeMinutesValue = "0",
}: DailyProgressSummaryProps) => {
  const { theme: currentTheme, colors } = ThemeModule.useTheme();
  const isDarkMode = currentTheme === "dark";

  // Add effect to log when props change
  useEffect(() => {
    console.log("🔄 DailyProgressSummary updated with:", {
      caloriesValue,
      workoutValue,
      workoutProgress,
      activeMinutesValue,
    });
  }, [caloriesValue, workoutValue, workoutProgress, activeMinutesValue]);

  // Parse and format the workout value for proper display
  const formatWorkoutValue = () => {
    // Log the incoming value for debugging
    console.log(
      `DailyProgressSummary received workoutValue: "${workoutValue}"`
    );

    // If it's already in minutes format (contains 'm'), keep as is
    if (workoutValue.includes("m")) {
      return workoutValue;
    }

    // If it's in count format (e.g., "2/10"), keep as is
    if (workoutValue.includes("/")) {
      return workoutValue;
    }

    // Otherwise assume it's minutes and format accordingly
    return `${workoutValue}m`;
  };

  // Format the display of the goal text based on the value type
  const getWorkoutGoalText = () => {
    if (workoutValue.includes("/")) {
      // If it shows workouts count, get the goal from the denominator
      return "Completed";
    }
    return "Active Time";
  };

  // Format the goal value text
  const getWorkoutGoalValue = () => {
    if (workoutValue.includes("/")) {
      // If it shows workouts count, get the goal from the denominator
      const parts = workoutValue.split("/");
      if (parts.length > 1) {
        return `${parts[1]}`;
      }
      // Default goal if not properly formatted
      return "";
    }
    // For active time, use a fixed goal
    return "";
  };

  // Get current value for display with proper highlighting
  const getCurrentWorkoutValue = () => {
    if (workoutValue.includes("/")) {
      const parts = workoutValue.split("/");
      if (parts.length > 1) {
        return parts[0];
      }
    }
    return workoutValue;
  };

  // Format time value with active minutes
  const formatTimeValue = () => {
    // First check if we have actual active minutes data
    if (activeMinutesValue && parseInt(activeMinutesValue) > 0) {
      return `${activeMinutesValue}m`;
    }

    // Fall back to estimating from steps if no active minutes
    const numericSteps = parseInt(stepsValue.replace(/,/g, ""), 10) || 0;
    const timeInMinutes = Math.round(numericSteps / 100);
    return `${timeInMinutes}m`;
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        padding: 24,
      }}
      className="w-full rounded-xl shadow-sm"
    >
      <Text style={{ color: colors.text }} className="font-bold text-lg mb-4">
        {date}
      </Text>
      <View className="flex-row justify-between px-2 items-center">
        <View className="items-center">
          <View
            style={{
              backgroundColor: isDarkMode
                ? "rgba(30, 58, 138, 0.5)"
                : "#DBEAFE",
            }}
            className="w-12 h-12 rounded-full items-center justify-center mb-2"
          >
            <Clock size={22} color={isDarkMode ? "#60A5FA" : "#3B82F6"} />
          </View>
          <Text
            style={{ color: isDarkMode ? "#60A5FA" : "#3B82F6" }}
            className="font-bold text-base"
          >
            {formatTimeValue()}
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-bold">
            Active Time
          </Text>
        </View>

        <View className="items-center">
          <View
            style={{
              backgroundColor: isDarkMode
                ? "rgba(127, 29, 29, 0.5)"
                : "#FEE2E2",
            }}
            className="w-12 h-12 rounded-full items-center justify-center mb-2"
          >
            <Flame size={22} color={isDarkMode ? "#F87171" : "#EF4444"} />
          </View>
          <Text
            style={{ color: isDarkMode ? "#F87171" : "#EF4444" }}
            className="font-bold text-base"
          >
            {caloriesValue}
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-bold">
            Burned
          </Text>
        </View>

        <View className="items-center">
          <View
            style={{
              backgroundColor: isDarkMode
                ? "rgba(49, 46, 129, 0.5)"
                : "#E0E7FF",
            }}
            className="w-12 h-12 rounded-full items-center justify-center mb-2"
          >
            <Activity size={22} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
          </View>
          {workoutValue.includes("/") ? (
            <View className="flex-row items-baseline">
              <Text
                style={{ color: isDarkMode ? "#8B5CF6" : "#6366F1" }}
                className="font-bold text-base"
              >
                {getCurrentWorkoutValue()}
              </Text>
            </View>
          ) : (
            <Text
              style={{ color: isDarkMode ? "#60A5FA" : "#3B82F6" }}
              className="font-bold text-base"
            >
              {formatWorkoutValue()}
            </Text>
          )}
          <Text style={{ color: colors.secondaryText }} className="font-bold">
            {getWorkoutGoalText()}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Export memoized version for better performance
export default React.memo(DailyProgressSummary);
