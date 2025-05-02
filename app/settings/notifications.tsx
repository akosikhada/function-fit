import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Animated,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  ChevronLeft,
  Bell,
  Smartphone,
  Clock,
  Gift,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

interface NotificationToggleProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon: JSX.Element;
  isLast?: boolean;
  delay?: number;
}

export default function NotificationSettings() {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  // Mock state for notification toggles
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [progressUpdates, setProgressUpdates] = useState(true);
  const [appUpdates, setAppUpdates] = useState(false);
  const [goalCompletion, setGoalCompletion] = useState(true);

  useEffect(() => {
    // Start animations after component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const NotificationToggle = ({
    title,
    description,
    value,
    onValueChange,
    icon,
    isLast = false,
    delay = 0,
  }: NotificationToggleProps) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: isDarkMode
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.06)",
      }}
    >
      <View className="flex-row items-start justify-between py-4">
        <View className="flex-row items-start flex-1 pr-4">
          <View
            style={{
              backgroundColor: isDarkMode
                ? "rgba(139, 92, 246, 0.15)"
                : "rgba(99, 102, 241, 0.08)",
              borderRadius: 12,
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDarkMode ? 0.2 : 0.1,
              shadowRadius: 2,
              elevation: isDarkMode ? 2 : 1,
            }}
          >
            {icon}
          </View>
          <View className="flex-1">
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: description ? 4 : 0,
                letterSpacing: -0.3,
              }}
            >
              {title}
            </Text>
            {description && (
              <Text
                style={{
                  color: colors.secondaryText,
                  fontSize: 14,
                  lineHeight: 20,
                  letterSpacing: -0.2,
                }}
              >
                {description}
              </Text>
            )}
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: isDarkMode ? "#3F3F46" : "#E5E7EB",
            true: isDarkMode ? "#7C3AED" : "#6366F1",
          }}
          thumbColor={isDarkMode ? "#F3F4F6" : "#FFFFFF"}
          ios_backgroundColor={isDarkMode ? "#3F3F46" : "#E5E7EB"}
          style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
        />
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.background,
        paddingTop: Platform.OS === "android" ? 25 : 10,
      }}
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
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 18,
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="mr-3"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDarkMode
                  ? "rgba(55, 65, 81, 0.5)"
                  : "rgba(249, 250, 251, 0.9)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDarkMode ? 0.2 : 0.08,
                shadowRadius: 2,
                elevation: isDarkMode ? 2 : 1,
              }}
            >
              <ChevronLeft size={20} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={{ backgroundColor: colors.background }}
        className="flex-1 px-5 py-3"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: 5,
            borderWidth: 1,
            borderColor: isDarkMode
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.03)",
          }}
        >
          <View className="flex-row items-center mb-4">
            <View
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(139, 92, 246, 0.15)"
                  : "rgba(99, 102, 241, 0.08)",
                padding: 12,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkMode ? 0.15 : 0.05,
                shadowRadius: 3,
                elevation: isDarkMode ? 2 : 1,
              }}
            >
              <Bell size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} />
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "700",
                marginLeft: 12,
                letterSpacing: -0.3,
              }}
            >
              Notification Preferences
            </Text>
          </View>

          <Text
            style={{
              color: colors.secondaryText,
              fontSize: 15,
              lineHeight: 22,
              letterSpacing: -0.2,
            }}
          >
            Manage which notifications you receive from Function Fit. Enable or
            disable specific alerts to customize your experience.
          </Text>
        </Animated.View>

        {/* Notification Toggles */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: 5,
            borderWidth: 1,
            borderColor: isDarkMode
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.03)",
          }}
        >
          <NotificationToggle
            title="Workout Reminders"
            description="Get reminded about your scheduled workouts"
            value={workoutReminders}
            onValueChange={setWorkoutReminders}
            icon={
              <Clock size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
            }
          />

          <NotificationToggle
            title="Progress Updates"
            description="Weekly summaries of your fitness progress"
            value={progressUpdates}
            onValueChange={setProgressUpdates}
            icon={<Bell size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />}
          />

          <NotificationToggle
            title="App Updates"
            description="Be notified when new features are released"
            value={appUpdates}
            onValueChange={setAppUpdates}
            icon={
              <Smartphone
                size={18}
                color={isDarkMode ? "#8B5CF6" : "#6366F1"}
              />
            }
          />
          <NotificationToggle
            title="Goal Achievements"
            description="Celebrate when you reach fitness milestones"
            value={goalCompletion}
            onValueChange={setGoalCompletion}
            icon={<Gift size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />}
            isLast={true}
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: isDarkMode
              ? "rgba(139, 92, 246, 0.1)"
              : "rgba(99, 102, 241, 0.05)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 40,
            borderWidth: 1,
            borderColor: isDarkMode
              ? "rgba(139, 92, 246, 0.2)"
              : "rgba(99, 102, 241, 0.1)",
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 14,
              lineHeight: 20,
              letterSpacing: -0.2,
            }}
          >
            Note: This page is currently a static mockup with no actual
            functionality. The notification toggles do not affect real
            notifications yet. This feature will be fully implemented in an
            upcoming update.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
