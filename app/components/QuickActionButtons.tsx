import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { PlusCircle, BarChart2, Dumbbell } from "lucide-react-native";
import { router } from "expo-router";

interface QuickActionButtonsProps {
  onLogWorkout?: () => void;
  onViewProgress?: () => void;
  onWorkoutLibrary?: () => void;
}

const QuickActionButtons = ({
  onLogWorkout,
  onViewProgress,
  onWorkoutLibrary,
}: QuickActionButtonsProps) => {
  const handleLogWorkout = () => {
    if (onLogWorkout) {
      onLogWorkout();
    } else {
      // Default implementation
      router.push("/plan");
    }
  };

  const handleViewProgress = () => {
    if (onViewProgress) {
      onViewProgress();
    } else {
      // Default implementation
      router.push("/progress");
    }
  };

  const handleWorkoutLibrary = () => {
    if (onWorkoutLibrary) {
      onWorkoutLibrary();
    } else {
      // Default implementation
      router.push("/library");
    }
  };

  return (
    <View className="w-full bg-white rounded-xl p-4 shadow-sm">
      <Text className="text-base font-semibold text-gray-800 mb-3">
        Quick Actions
      </Text>
      <View className="flex-row justify-between">
        <TouchableOpacity
          onPress={handleLogWorkout}
          className="items-center bg-indigo-50 p-3 rounded-lg flex-1 mr-2"
        >
          <PlusCircle size={24} color="#4F46E5" />
          <Text className="mt-1 text-xs text-indigo-900 font-medium">
            Log Workout
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleViewProgress}
          className="items-center bg-indigo-50 p-3 rounded-lg flex-1 mr-2"
        >
          <BarChart2 size={24} color="#4F46E5" />
          <Text className="mt-1 text-xs text-indigo-900 font-medium">
            Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleWorkoutLibrary}
          className="items-center bg-indigo-50 p-3 rounded-lg flex-1"
        >
          <Dumbbell size={24} color="#4F46E5" />
          <Text className="mt-1 text-xs text-indigo-900 font-medium">
            Library
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QuickActionButtons;
