import React from "react";
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Switch } from "react-native";
import { Stack, router } from "expo-router";
import { ChevronLeft, Bell } from "lucide-react-native";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

export default function NotificationSettings() {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === "dark";
  
  // Mock state for notification toggles
  const [workoutReminders, setWorkoutReminders] = React.useState(true);
  const [progressUpdates, setProgressUpdates] = React.useState(true);
  const [appUpdates, setAppUpdates] = React.useState(false);

  return (
    <SafeAreaView 
      style={{ backgroundColor: colors.background }} 
      className="flex-1"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Notifications",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              className="ml-2"
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView 
        style={{ backgroundColor: colors.background }}
        className="flex-1 px-4 py-6"
      >
        <View 
          style={{ backgroundColor: colors.card }}
          className="rounded-xl p-4 mb-4"
        >
          <View className="flex-row items-center mb-2">
            <Bell size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} className="mr-2" />
            <Text style={{ color: colors.text }} className="text-lg font-medium">
              Notification Preferences
            </Text>
          </View>
          <Text style={{ color: colors.secondaryText }} className="mb-4">
            Manage which notifications you receive from Function Fit.
          </Text>
        </View>
        
        {/* Example notification toggles */}
        <View 
          style={{ backgroundColor: colors.card }}
          className="rounded-xl overflow-hidden mb-4"
        >
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
            <Text style={{ color: colors.text }} className="font-medium">Workout Reminders</Text>
            <Switch
              value={workoutReminders}
              onValueChange={setWorkoutReminders}
              trackColor={{ false: '#767577', true: isDarkMode ? '#8B5CF6' : '#6366F1' }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
            <Text style={{ color: colors.text }} className="font-medium">Progress Updates</Text>
            <Switch
              value={progressUpdates}
              onValueChange={setProgressUpdates}
              trackColor={{ false: '#767577', true: isDarkMode ? '#8B5CF6' : '#6366F1' }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View className="flex-row justify-between items-center p-4">
            <Text style={{ color: colors.text }} className="font-medium">App Updates</Text>
            <Switch
              value={appUpdates}
              onValueChange={setAppUpdates}
              trackColor={{ false: '#767577', true: isDarkMode ? '#8B5CF6' : '#6366F1' }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>
        
        <Text style={{ color: colors.secondaryText }} className="text-xs text-center mt-6">
          Note: You may need to enable notifications in your device settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
} 