import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Stack, router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

export default function ProfileSettings() {
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
          title: "Profile Settings",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
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
          <Text
            style={{ color: colors.text }}
            className="text-lg font-medium mb-2"
          >
            Profile Information
          </Text>
          <Text style={{ color: colors.secondaryText }} className="mb-4">
            Manage your profile details and personal information.
          </Text>
        </View>

        {/* Placeholder for profile settings options */}
        <Text
          style={{ color: colors.secondaryText }}
          className="text-center mt-6"
        >
          Profile settings content will be implemented in a future update.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
