import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  ChevronLeft,
  Lock,
  Eye,
  Bell,
  Shield,
  Database,
  Share2,
  ExternalLink,
  Trash2,
  MapPin,
} from "lucide-react-native";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

interface PrivacySettingsState {
  profilePublic: boolean;
  showWorkoutActivity: boolean;
  shareProgressStats: boolean;
  enableNotifications: boolean;
  enableLocationServices: boolean;
  twoFactorAuth: boolean;
  dataSharingForAnalytics: boolean;
}

interface SettingItemProps {
  icon: JSX.Element;
  title: string;
  description: string;
  switchKey: keyof PrivacySettingsState;
  delay?: number;
}

interface ActionItemProps {
  icon: JSX.Element;
  title: string;
  description: string;
  onPress: () => void;
  isDestructive?: boolean;
  delay?: number;
}

interface SectionHeaderProps {
  icon: JSX.Element;
  title: string;
  delay?: number;
}

export default function PrivacySettings() {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState<PrivacySettingsState>({
    profilePublic: false,
    showWorkoutActivity: true,
    shareProgressStats: false,
    enableNotifications: true,
    enableLocationServices: false,
    twoFactorAuth: false,
    dataSharingForAnalytics: true,
  });

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

  const toggleSwitch = (setting: keyof PrivacySettingsState) => {
    if (setting === "twoFactorAuth" && !privacySettings.twoFactorAuth) {
      Alert.alert(
        "Enable Two-Factor Authentication",
        "This will redirect you to set up two-factor authentication to enhance your account security.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: () =>
              setPrivacySettings({
                ...privacySettings,
                [setting]: !privacySettings[setting],
              }),
          },
        ]
      );
      return;
    }

    setPrivacySettings({
      ...privacySettings,
      [setting]: !privacySettings[setting],
    });
  };

  const SectionHeader = ({ icon, title, delay = 0 }: SectionHeaderProps) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
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
        {icon}
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
        {title}
      </Text>
    </Animated.View>
  );

  const SettingItem = ({
    icon,
    title,
    description,
    switchKey,
    delay = 0,
  }: SettingItemProps) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.06)",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          flex: 1,
          paddingRight: 16,
        }}
      >
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
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 4,
              letterSpacing: -0.3,
            }}
          >
            {title}
          </Text>
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
        </View>
      </View>
      <Switch
        trackColor={{
          false: isDarkMode ? "#3F3F46" : "#E5E7EB",
          true: isDarkMode ? "#7C3AED" : "#6366F1",
        }}
        thumbColor={isDarkMode ? "#F3F4F6" : "#FFFFFF"}
        ios_backgroundColor={isDarkMode ? "#3F3F46" : "#E5E7EB"}
        onValueChange={() => toggleSwitch(switchKey)}
        value={privacySettings[switchKey]}
        style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
      />
    </Animated.View>
  );

  const ActionItem = ({
    icon,
    title,
    description,
    onPress,
    isDestructive = false,
    delay = 0,
  }: ActionItemProps) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.06)",
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", flex: 1 }}
        >
          <View
            style={{
              backgroundColor: isDestructive
                ? isDarkMode
                  ? "rgba(248, 113, 113, 0.15)"
                  : "rgba(248, 113, 113, 0.08)"
                : isDarkMode
                ? "rgba(139, 92, 246, 0.15)"
                : "rgba(99, 102, 241, 0.08)",
              borderRadius: 12,
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
              shadowColor: isDestructive ? "#EF4444" : "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDarkMode ? 0.2 : 0.1,
              shadowRadius: 2,
              elevation: isDarkMode ? 2 : 1,
            }}
          >
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: isDestructive ? "#EF4444" : colors.text,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 4,
                letterSpacing: -0.3,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                color: isDestructive
                  ? isDarkMode
                    ? "rgba(248, 113, 113, 0.8)"
                    : "rgba(248, 113, 113, 0.8)"
                  : colors.secondaryText,
                fontSize: 14,
                lineHeight: 20,
                letterSpacing: -0.2,
              }}
            >
              {description}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
          title: "Privacy & Security",
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
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Privacy Section */}
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
          <SectionHeader
            icon={<Eye size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} />}
            title="Privacy"
          />

          <SettingItem
            icon={
              <Share2 size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
            }
            title="Public Profile"
            description="Allow others to view your profile information"
            switchKey="profilePublic"
          />

          <SettingItem
            icon={<Eye size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />}
            title="Workout Activity"
            description="Show your workout activity on the platform"
            switchKey="showWorkoutActivity"
          />

          <SettingItem
            icon={
              <Database size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
            }
            title="Progress Statistics"
            description="Share your progress statistics with friends"
            switchKey="shareProgressStats"
          />
        </Animated.View>

        {/* Security Section */}
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
          <SectionHeader
            icon={<Lock size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} />}
            title="Security"
          />

          <ActionItem
            icon={<Lock size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />}
            title="Change Password"
            description="Update your account password"
            onPress={() =>
              Alert.alert(
                "Change Password",
                "This feature will allow you to update your password"
              )
            }
          />

          <SettingItem
            icon={
              <Shield size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
            }
            title="Two-Factor Authentication"
            description="Secure your account with 2FA"
            switchKey="twoFactorAuth"
          />

          <ActionItem
            icon={
              <ExternalLink
                size={18}
                color={isDarkMode ? "#8B5CF6" : "#6366F1"}
              />
            }
            title="Manage Connected Apps"
            description="Review apps with access to your account"
            onPress={() =>
              Alert.alert(
                "Manage Apps",
                "This feature will allow you to view and manage connected applications"
              )
            }
            delay={150}
          />
        </Animated.View>

        {/* Data Management Section */}
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
          <SectionHeader
            icon={
              <Database size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} />
            }
            title="Data Management"
          />

          <ActionItem
            icon={
              <Database size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
            }
            title="Download Your Data"
            description="Get a copy of all your fitness data"
            onPress={() =>
              Alert.alert(
                "Download Data",
                "This feature will allow you to download all your fitness data"
              )
            }
          />

          <SettingItem
            icon={
              <Database size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
            }
            title="Data Sharing for Analytics"
            description="Help us improve with anonymous usage data"
            switchKey="dataSharingForAnalytics"
          />

          <ActionItem
            icon={<Trash2 size={18} color="#EF4444" />}
            title="Delete Account"
            description="Permanently delete your account and data"
            isDestructive={true}
            onPress={() => {
              Alert.alert(
                "Delete Account",
                "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => console.log("Delete account pressed"),
                  },
                ]
              );
            }}
            delay={150}
          />
        </Animated.View>

        {/* Additional Permissions */}
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
          <SectionHeader
            icon={<Bell size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} />}
            title="Permissions"
          />

          <SettingItem
            icon={<Bell size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />}
            title="Notifications"
            description="Enable push notifications"
            switchKey="enableNotifications"
          />

          <SettingItem
            icon={
              <MapPin size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
            }
            title="Location Services"
            description="Allow access to your location for nearby gyms"
            switchKey="enableLocationServices"
            delay={150}
          />
        </Animated.View>

        {/* Note about functionality */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: isDarkMode
              ? "rgba(139, 92, 246, 0.1)"
              : "rgba(99, 102, 241, 0.05)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
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
            Note: This page currently displays a static interface for
            demonstration purposes. The settings shown here do not affect any
            actual functionality at this time. Future updates will implement
            these features.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
