import React from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Stack, router } from "expo-router";
import { ArrowLeft, Search, Clock, Flame } from "lucide-react-native";

// Mock workout data - would come from Supabase in a real implementation
const workoutCategories = [
  { id: "hiit", name: "HIIT" },
  { id: "strength", name: "Strength" },
  { id: "cardio", name: "Cardio" },
  { id: "yoga", name: "Yoga" },
  { id: "pilates", name: "Pilates" },
];

const workouts = [
  {
    id: "1",
    title: "Full Body HIIT",
    duration: "30 mins",
    calories: "320",
    difficulty: "Intermediate",
    category: "hiit",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
  },
  {
    id: "2",
    title: "Core Crusher",
    duration: "20 mins",
    calories: "220",
    difficulty: "Beginner",
    category: "strength",
    imageUrl:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80",
  },
  {
    id: "3",
    title: "Upper Body Blast",
    duration: "25 mins",
    calories: "280",
    difficulty: "Intermediate",
    category: "strength",
    imageUrl:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80",
  },
  {
    id: "4",
    title: "Cardio Kickboxing",
    duration: "35 mins",
    calories: "400",
    difficulty: "Advanced",
    category: "cardio",
    imageUrl:
      "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=500&q=80",
  },
];

export default function WorkoutLibrary() {
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  const filteredWorkouts =
    selectedCategory === "all"
      ? workouts
      : workouts.filter((workout) => workout.category === selectedCategory);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View className="flex-1">
        {/* Header */}
        <View className="bg-white p-4 flex-row items-center justify-between border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#4F46E5" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">
              Workout Library
            </Text>
          </View>
          <TouchableOpacity>
            <Search size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="py-3 px-2 bg-white border-b border-gray-200"
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full mr-2 ${selectedCategory === "all" ? "bg-indigo-600" : "bg-gray-200"}`}
          >
            <Text
              className={`${selectedCategory === "all" ? "text-white" : "text-gray-800"}`}
            >
              All
            </Text>
          </TouchableOpacity>

          {workoutCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full mr-2 ${selectedCategory === category.id ? "bg-indigo-600" : "bg-gray-200"}`}
            >
              <Text
                className={`${selectedCategory === category.id ? "text-white" : "text-gray-800"}`}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Workout List */}
        <ScrollView className="flex-1 p-4">
          <View className="flex-row flex-wrap justify-between">
            {filteredWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm mb-4 w-[48%]"
                onPress={() => router.push(`/workout/${workout.id}`)}
              >
                <Image
                  source={{ uri: workout.imageUrl }}
                  className="w-full h-24"
                  resizeMode="cover"
                />
                <View className="p-3">
                  <Text className="text-gray-800 font-semibold mb-1">
                    {workout.title}
                  </Text>
                  <View className="flex-row justify-between">
                    <View className="flex-row items-center">
                      <Clock size={12} color="#6B7280" />
                      <Text className="text-xs text-gray-500 ml-1">
                        {workout.duration}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Flame size={12} color="#6B7280" />
                      <Text className="text-xs text-gray-500 ml-1">
                        {workout.calories}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
