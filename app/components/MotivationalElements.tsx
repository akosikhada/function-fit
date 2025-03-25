import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Flame, Award } from "lucide-react-native";

interface MotivationalElementsProps {
  streakCount?: number;
  achievements?: { title: string; isNew: boolean }[];
}

const MotivationalElements = ({
  streakCount = 5,
  achievements = [
    { title: "Early Bird", isNew: true },
    { title: "Workout Warrior", isNew: false },
    { title: "Perfect Week", isNew: false },
  ],
}: MotivationalElementsProps) => {
  return (
    <View className="w-full bg-white rounded-xl p-4 shadow-sm">
      <Text className="text-base font-semibold text-gray-800 mb-3">
        Your Progress
      </Text>
      <View className="flex-row justify-between">
        <View className="flex-row items-center bg-amber-50 p-3 rounded-lg flex-1 mr-2">
          <View className="bg-amber-500 p-2 rounded-full">
            <Flame size={20} color="#FFFFFF" />
          </View>
          <View className="ml-3">
            <Text className="text-xs text-amber-800">Current Streak</Text>
            <Text className="text-lg font-bold text-amber-900">
              {streakCount} days
            </Text>
          </View>
        </View>

        <TouchableOpacity className="flex-row items-center bg-indigo-50 p-3 rounded-lg flex-1">
          <View className="bg-indigo-500 p-2 rounded-full">
            <Award size={20} color="#FFFFFF" />
          </View>
          <View className="ml-3">
            <Text className="text-xs text-indigo-800">Achievements</Text>
            <View className="flex-row">
              {achievements.some((a) => a.isNew) && (
                <View className="bg-red-500 rounded-full w-2 h-2 mt-1 mr-1" />
              )}
              <Text className="text-lg font-bold text-indigo-900">
                {achievements.length}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MotivationalElements;
