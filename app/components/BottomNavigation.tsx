import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  useColorScheme,
} from "react-native";
import { router, usePathname } from "expo-router";
import { Home, Dumbbell, BarChart2, Settings } from "lucide-react-native";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

interface BottomNavigationProps {
  activeTab: string;
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 380;
  const { colors, theme } = useTheme();

  // Adjust sizes based on device width
  const iconSize = isSmallDevice ? 22 : 24;
  const textSize = isSmallDevice ? "text-[10px]" : "text-xs";
  const containerPadding = isSmallDevice ? "py-2" : "py-3";

  // Define tabs with icons and routes
  const tabs = [
    { name: "home", icon: Home, label: "Home", route: "/" as const },
    {
      name: "plan",
      icon: Dumbbell,
      label: "Workouts",
      route: "/plan" as const,
    },
    {
      name: "progress",
      icon: BarChart2,
      label: "Progress",
      route: "/progress" as const,
    },
    {
      name: "settings",
      icon: Settings,
      label: "Settings",
      route: "/settings" as const,
    },
  ];

  // Handle tab press
  const handleTabPress = useCallback(
    (tabName: string, route: string) => {
      // Only navigate if we're changing routes
      if (pathname !== route) {
        // Using switch case to ensure proper type safety with the router
        switch (route) {
          case "/":
            router.push("/");
            break;
          case "/plan":
            router.push("/plan");
            break;
          case "/progress":
            router.push("/progress");
            break;
          case "/settings":
            router.push("/settings");
            break;
        }
      }
    },
    [pathname]
  );

  // Get device theme to determine if we're in dark mode
  const deviceTheme = useColorScheme() || "light";
  const isDarkMode = theme === "dark";

  return (
    <View
      style={{
        backgroundColor: isDarkMode ? "#000000" : colors.card,
        borderTopColor: isDarkMode ? "#2A2A2A" : colors.border,
      }}
      className={`border-t ${isDarkMode ? "shadow-none" : "shadow-sm"}`}
    >
      <View className={`flex-row justify-evenly ${containerPadding}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          const TabIcon = tab.icon;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              key={tab.name}
              className="items-center flex-1"
              onPress={() => handleTabPress(tab.name, tab.route)}
            >
              <TabIcon
                size={iconSize}
                color={
                  isActive ? "#8B5CF6" : isDarkMode ? "#FFFFFF" : "#6B7280"
                }
                strokeWidth={isActive ? 2 : 1.5}
              />
              <Text
                style={{
                  color: isActive
                    ? "#8B5CF6"
                    : isDarkMode
                    ? "#FFFFFF"
                    : "#6B7280",
                }}
                className={`${textSize} mt-1 ${isActive ? "font-medium" : ""}`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
