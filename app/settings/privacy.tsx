import React from "react";
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from "react-native";
import { Stack, router } from "expo-router";
import { ChevronLeft, Lock } from "lucide-react-native";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

export default function PrivacySettings() {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <SafeAreaView 
      style={{ backgroundColor: colors.background }} 
      className="flex-1"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Privacy & Security",
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
            <Lock size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} className="mr-2" />
            <Text style={{ color: colors.text }} className="text-lg font-medium">
              Privacy & Security Settings
            </Text>
          </View>
          <Text style={{ color: colors.secondaryText }} className="mb-4">
            Manage your privacy preferences and account security.
          </Text>
        </View>
        
        {/* Placeholder for privacy settings options */}
        <Text style={{ color: colors.secondaryText }} className="text-center mt-6">
          Privacy settings content will be implemented in a future update.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
} 