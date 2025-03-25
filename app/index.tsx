import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Text,
} from "react-native";
import { Stack } from "expo-router";

import Header from "./components/Header";
import DailyProgressSummary from "./components/DailyProgressSummary";
import TodaysWorkoutCard from "./components/TodaysWorkoutCard";
import MotivationalElements from "./components/MotivationalElements";
import QuickActionButtons from "./components/QuickActionButtons";
import BottomNavigation from "./components/BottomNavigation";
import { getUser, getUserDashboardData } from "./utils/supabase";

// Default data structure to use while loading or if there's an error
const defaultUserData = {
  username: "User",
  stepsProgress: 0,
  caloriesProgress: 0,
  workoutProgress: 0,
  stepsValue: "0",
  caloriesValue: "0",
  workoutValue: "0/5",
  streakCount: 0,
  achievements: [],
  todaysWorkout: {
    id: "1",
    title: "No workout available",
    duration: "0 mins",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
  },
};

export default function HomeScreen() {
  const [userData, setUserData] = useState(defaultUserData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the current authenticated user
        const user = await getUser();

        if (!user) {
          // For development/testing, use mock data if no authenticated user
          // In production, you would redirect to login
          console.log("No authenticated user, using mock data");
          setLoading(false);
          // Keep using the default user data
          return;
        }

        // Get dashboard data for the user
        const dashboardData = await getUserDashboardData(user.id);
        // Ensure all fields match the expected types
        setUserData({
          username: String(dashboardData.username),
          stepsProgress: dashboardData.stepsProgress,
          caloriesProgress: dashboardData.caloriesProgress, 
          workoutProgress: dashboardData.workoutProgress,
          stepsValue: String(dashboardData.stepsValue),
          caloriesValue: String(dashboardData.caloriesValue),
          workoutValue: dashboardData.workoutValue,
          streakCount: dashboardData.streakCount,
          achievements: [], // Reset to empty array to match type
          todaysWorkout: dashboardData.todaysWorkout
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load your data. Please try again later.");
        // Keep using default data in case of error
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View className="flex-1">
        <Header username={userData.username} />

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="mt-4 text-gray-600">
              Loading your fitness data...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center px-4">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <QuickActionButtons />
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4 pb-20">
            <View className="space-y-4">
              <DailyProgressSummary
                stepsProgress={userData.stepsProgress}
                caloriesProgress={userData.caloriesProgress}
                workoutProgress={userData.workoutProgress}
                stepsValue={userData.stepsValue}
                caloriesValue={userData.caloriesValue}
                workoutValue={userData.workoutValue}
              />

              <TodaysWorkoutCard
                id={userData.todaysWorkout.id}
                title={userData.todaysWorkout.title}
                duration={userData.todaysWorkout.duration}
                imageUrl={userData.todaysWorkout.imageUrl}
              />

              <MotivationalElements
                streakCount={userData.streakCount}
                achievements={userData.achievements}
              />

              <QuickActionButtons />
            </View>
          </ScrollView>
        )}

        <View className="absolute bottom-0 left-0 right-0">
          <BottomNavigation activeTab="home" />
        </View>
      </View>
    </SafeAreaView>
  );
}
