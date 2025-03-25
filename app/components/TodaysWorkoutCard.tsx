import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Clock, Play } from "lucide-react-native";
import { router } from "expo-router";

interface TodaysWorkoutCardProps {
  id?: string;
  title?: string;
  duration?: string;
  imageUrl?: string;
  onStart?: () => void;
}

const TodaysWorkoutCard = ({
  id = "1",
  title = "Full Body HIIT",
  duration = "30 mins",
  imageUrl = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
  onStart,
}: TodaysWorkoutCardProps) => {
  const handleStart = () => {
    if (onStart) {
      onStart();
    } else {
      router.push(`/workout/${id}`);
    }
  };

  return (
    <View className="w-full bg-white rounded-xl overflow-hidden shadow-sm">
      <View className="flex-row h-36">
        <Image
          source={{ uri: imageUrl }}
          className="w-1/3 h-full"
          resizeMode="cover"
        />
        <View className="w-2/3 p-4 justify-between">
          <View>
            <Text className="text-lg font-bold text-gray-800">{title}</Text>
            <View className="flex-row items-center mt-1">
              <Clock size={16} color="#6B7280" />
              <Text className="ml-1 text-sm text-gray-500">{duration}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleStart}
            className="bg-indigo-600 rounded-lg py-2 px-4 flex-row items-center justify-center mt-2"
          >
            <Play size={16} color="#FFFFFF" />
            <Text className="ml-2 text-white font-semibold">Start Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TodaysWorkoutCard;
