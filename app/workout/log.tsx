import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Stack, router } from "expo-router";
import { ArrowLeft, Clock, Flame, Save, X } from "lucide-react-native";
import { completeWorkout } from "../utils/supabase";
import { getUser } from "../utils/supabase";

export default function LogWorkout() {
  const [workoutName, setWorkoutName] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      if (!workoutName.trim()) {
        throw new Error("Please enter a workout name");
      }

      if (!duration.trim() || isNaN(Number(duration))) {
        throw new Error("Please enter a valid duration in minutes");
      }

      if (!calories.trim() || isNaN(Number(calories))) {
        throw new Error("Please enter a valid calorie count");
      }

      // Get the current user
      const user = await getUser();
      if (!user) {
        // If no authenticated user, show an error
        throw new Error("You need to be logged in to log a workout");
      }

      // Log the workout for the authenticated user
      await completeWorkout(
        user.id,
        "00000000-0000-0000-0000-000000000001", // Default workout ID
        Number(duration),
        Number(calories),
      );

      setSuccess(true);

      // Reset form after successful submission
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error("Error logging workout:", err);
      setError(err instanceof Error ? err.message : "Failed to log workout");
    } finally {
      setLoading(false);
    }
  };

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
            <Text className="text-xl font-bold text-gray-800">Log Workout</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {success ? (
            <View className="items-center justify-center py-8">
              <View className="bg-green-100 rounded-full w-16 h-16 items-center justify-center mb-4">
                <Save size={32} color="#10B981" />
              </View>
              <Text className="text-lg font-semibold text-green-700 mb-2">
                Workout Logged!
              </Text>
              <Text className="text-gray-600 text-center">
                Your workout has been successfully recorded.
              </Text>
            </View>
          ) : (
            <View className="space-y-6">
              {error && (
                <View className="bg-red-50 p-3 rounded-lg">
                  <Text className="text-red-600">{error}</Text>
                </View>
              )}

              <View>
                <Text className="text-gray-700 font-medium mb-2">
                  Workout Name
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg p-3"
                  placeholder="e.g., Morning Run"
                  value={workoutName}
                  onChangeText={setWorkoutName}
                />
              </View>

              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium mb-2">
                    Duration (mins)
                  </Text>
                  <View className="flex-row items-center bg-white border border-gray-300 rounded-lg p-3">
                    <Clock size={18} color="#6B7280" className="mr-2" />
                    <TextInput
                      className="flex-1"
                      placeholder="30"
                      keyboardType="number-pad"
                      value={duration}
                      onChangeText={setDuration}
                    />
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-gray-700 font-medium mb-2">
                    Calories
                  </Text>
                  <View className="flex-row items-center bg-white border border-gray-300 rounded-lg p-3">
                    <Flame size={18} color="#6B7280" className="mr-2" />
                    <TextInput
                      className="flex-1"
                      placeholder="250"
                      keyboardType="number-pad"
                      value={calories}
                      onChangeText={setCalories}
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-gray-700 font-medium mb-2">
                  Notes (Optional)
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg p-3 h-32"
                  placeholder="How did your workout feel? Any achievements?"
                  multiline
                  textAlignVertical="top"
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                className={`bg-indigo-600 rounded-lg py-4 items-center mt-6 ${loading ? "opacity-70" : ""}`}
              >
                <Text className="text-white font-semibold text-lg">
                  {loading ? "Saving..." : "Save Workout"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
