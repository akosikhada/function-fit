import React from "react";
import { View, Text } from "react-native";
import CircularProgressIndicator from "./CircularProgressIndicator";

interface DailyProgressSummaryProps {
  date?: string;
  stepsProgress?: number;
  caloriesProgress?: number;
  workoutProgress?: number;
  stepsValue?: string;
  caloriesValue?: string;
  workoutValue?: string;
}

const DailyProgressSummary = ({
  date = "Today, June 15",
  stepsProgress = 75,
  caloriesProgress = 60,
  workoutProgress = 40,
  stepsValue = "7,500",
  caloriesValue = "1,200",
  workoutValue = "2/5",
}: DailyProgressSummaryProps) => {
  return (
    <View className="w-full bg-white rounded-xl p-4 shadow-sm">
      <Text className="text-base font-semibold text-gray-800 mb-4">{date}</Text>
      <View className="flex-row justify-between items-center">
        <CircularProgressIndicator
          progress={stepsProgress}
          label="Steps"
          value={stepsValue}
          color="#4F46E5"
        />
        <CircularProgressIndicator
          progress={caloriesProgress}
          label="Calories"
          value={caloriesValue}
          color="#EC4899"
        />
        <CircularProgressIndicator
          progress={workoutProgress}
          label="Workouts"
          value={workoutValue}
          color="#10B981"
        />
      </View>
    </View>
  );
};

export default DailyProgressSummary;
