import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  ChevronLeft,
  User,
  Mail,
  Calendar,
  Ruler,
  Weight,
  MapPin,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ThemeModule from "../utils/theme";
import { getUser, getUserProfile } from "../utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
const { useTheme } = ThemeModule;

interface UserProfile {
  userId?: string;
  id?: string;
  username: string;
  fullName: string;
  email: string;
  birthday: string;
  gender: string;
  height: string;
  weight: string;
  stats: {
    totalWorkouts: number;
    totalHours: number;
    totalCalories: number;
  };
  avatarUrl: string;
  memberSince: string;
}

// Helper function to process optimized avatar URLs
const processAvatarUrl = (
  avatarUrl: string | undefined,
  userId: string
): string => {
  if (!avatarUrl)
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

  // Handle seed reference format
  if (avatarUrl.startsWith("seed:")) {
    const seed = avatarUrl.replace("seed:", "");
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }

  // Handle storage reference format
  if (avatarUrl.startsWith("storage:")) {
    const filename = avatarUrl.replace("storage:", "");
    // Determine URL structure based on filename pattern
    if (filename.startsWith("profile-")) {
      return `${
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        "https://vvvlpxqmbmxkwxmcfxyd.supabase.co"
      }/storage/v1/object/public/profile-images/users/${userId}/${filename}`;
    } else {
      return `${
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        "https://vvvlpxqmbmxkwxmcfxyd.supabase.co"
      }/storage/v1/object/public/profile-images/public/${userId}-${filename}`;
    }
  }

  // Return the avatar URL as is if it's already a full URL
  return avatarUrl;
};

export default function ProfileSettings() {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: "",
    fullName: "",
    email: "",
    birthday: "",
    gender: "",
    height: "",
    weight: "",
    stats: {
      totalWorkouts: 0,
      totalHours: 0,
      totalCalories: 0,
    },
    avatarUrl: "",
    memberSince: "",
  });
  const [loading, setLoading] = useState(true);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        // Get the authenticated user
        const user = await getUser();
        if (!user) {
          router.replace("/welcome");
          return;
        }

        // Try to get cached profile first for quick load
        const cachedProfileKey = `userProfile-${user.id}`;
        try {
          // Check if we've seen this error before
          const hasRowError = await AsyncStorage.getItem("PROFILE_ROW_ERROR");
          if (hasRowError === "true") {
            console.log(
              "Known Row too big error, skipping cache and using backend data"
            );
            // Continue without loading from cache
          } else {
            // Try to load from cache
            try {
              const cachedProfile = await AsyncStorage.getItem(
                cachedProfileKey
              );

              if (cachedProfile) {
                try {
                  const cachedData = JSON.parse(cachedProfile);
                  if (cachedData) {
                    // Apply only essential properties individually
                    setUserProfile((prev) => ({
                      ...prev,
                      username: cachedData.username || prev.username,
                      fullName: cachedData.fullName || prev.fullName,
                      email: cachedData.email || prev.email,
                      // Handle optimized avatar URLs
                      avatarUrl:
                        processAvatarUrl(cachedData.avatarUrl, user.id) ||
                        prev.avatarUrl,
                      birthday: cachedData.birthday || prev.birthday,
                      gender: cachedData.gender || prev.gender,
                      height: cachedData.height || prev.height,
                      weight: cachedData.weight || prev.weight,
                    }));
                  }
                } catch (parseError) {
                  console.error("Error parsing cached profile:", parseError);
                  // Mark the profile as corrupted if Row too big error
                  if (
                    parseError instanceof Error &&
                    parseError.message.includes("Row too big")
                  ) {
                    await AsyncStorage.setItem("PROFILE_ROW_ERROR", "true");
                  }
                }
              }
            } catch (loadError) {
              console.error("Error accessing AsyncStorage:", loadError);
              // Mark the profile as corrupted if Row too big error
              if (
                loadError instanceof Error &&
                loadError.message.includes("Row too big")
              ) {
                await AsyncStorage.setItem("PROFILE_ROW_ERROR", "true");
              }
            }
          }
        } catch (storageError) {
          console.error("Error checking AsyncStorage flags:", storageError);
          // Continue loading profile from backend
        }

        // Get profile from Supabase
        const profile = await getUserProfile(user.id);

        // Format member since date (registration date)
        const createdAt =
          user.created_at ||
          user.user_metadata?.created_at ||
          new Date().toISOString();
        const memberSinceDate = new Date(createdAt);
        const memberSince = memberSinceDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

        setUserProfile({
          userId: user.id,
          username: profile?.username || user.email?.split("@")[0] || "User",
          fullName: profile?.full_name || "",
          email: user.email || "",
          birthday: profile?.birthday || "",
          gender: profile?.gender || "",
          height: profile?.height ? `${profile.height} cm` : "",
          weight: profile?.weight ? `${profile.weight} kg` : "",
          stats: {
            totalWorkouts: 0,
            totalHours: 0,
            totalCalories: 0,
          },
          avatarUrl:
            profile?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          memberSince: memberSince,
        });

        setLoading(false);

        // Start animations after data is loaded
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        console.error("Error loading profile:", error);
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const InfoItem = ({
    icon,
    label,
    value,
  }: {
    icon: JSX.Element;
    label: string;
    value: string;
  }) => {
    return value ? (
      <View
        style={{
          backgroundColor: isDarkMode
            ? "rgba(31, 41, 55, 0.5)"
            : "rgba(249, 250, 251, 0.9)",
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.25 : 0.08,
          shadowRadius: 4,
          elevation: isDarkMode ? 3 : 2,
          borderWidth: 1,
          borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(229, 231, 235, 0.8)",
        }}
        className="p-4 mb-4 flex-row items-center"
      >
        <View
          style={{
            backgroundColor: isDarkMode
              ? "rgba(139, 92, 246, 0.15)"
              : "rgba(99, 102, 241, 0.08)",
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDarkMode ? 0.2 : 0.1,
            shadowRadius: 2,
            elevation: isDarkMode ? 2 : 1,
          }}
          className="w-11 h-11 items-center justify-center mr-4"
        >
          {icon}
        </View>
        <View className="flex-1">
          <Text
            style={{
              color: colors.secondaryText,
              fontSize: 13,
              fontWeight: "500",
              marginBottom: 3,
            }}
          >
            {label}
          </Text>
          <Text
            numberOfLines={label === "Email" ? 1 : undefined}
            ellipsizeMode={label === "Email" ? "tail" : undefined}
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: "600",
              letterSpacing: -0.3,
            }}
          >
            {value}
          </Text>
        </View>
      </View>
    ) : null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

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
          title: "Profile Settings",
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
        {loading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator
              size="large"
              color={isDarkMode ? "#8B5CF6" : "#6366F1"}
            />
          </View>
        ) : (
          <>
            {/* Profile Header */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
              className="items-center mb-8"
            >
              <View
                style={{
                  shadowColor: isDarkMode ? "#8B5CF6" : "#6366F1",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 10,
                  borderRadius: 55,
                }}
              >
                <LinearGradient
                  colors={
                    isDarkMode ? ["#8B5CF6", "#6D28D9"] : ["#818CF8", "#6366F1"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 3,
                    borderRadius: 55,
                  }}
                >
                  <Image
                    source={{ uri: userProfile.avatarUrl }}
                    style={{
                      width: 104,
                      height: 104,
                      borderRadius: 52,
                      borderWidth: 3,
                      borderColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                    }}
                  />
                </LinearGradient>
              </View>

              <Text
                style={{
                  color: colors.text,
                  fontSize: 24,
                  fontWeight: "700",
                  marginTop: 16,
                  letterSpacing: -0.5,
                }}
              >
                {userProfile.fullName || userProfile.username}
              </Text>

              <View
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(55, 65, 81, 0.5)"
                    : "rgba(243, 244, 246, 0.9)",
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginTop: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDarkMode ? 0.2 : 0.1,
                  shadowRadius: 2,
                  elevation: isDarkMode ? 2 : 1,
                }}
              >
                <User
                  size={14}
                  color={isDarkMode ? "#A78BFA" : "#6366F1"}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={{
                    color: isDarkMode ? "#A78BFA" : "#6366F1",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  @{userProfile.username}
                </Text>
              </View>
            </Animated.View>

            {/* Profile Information */}
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
              <View className="flex-row items-center mb-5">
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
                  <User size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} />
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
                  Personal Information
                </Text>
              </View>

              <InfoItem
                icon={
                  <Mail size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                }
                label="Email"
                value={userProfile.email}
              />

              <InfoItem
                icon={
                  <Calendar
                    size={18}
                    color={isDarkMode ? "#8B5CF6" : "#6366F1"}
                  />
                }
                label="Birthday"
                value={formatDate(userProfile.birthday)}
              />

              <InfoItem
                icon={
                  <User size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                }
                label="Gender"
                value={userProfile.gender}
              />

              <InfoItem
                icon={
                  <Ruler size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                }
                label="Height"
                value={userProfile.height}
              />

              <InfoItem
                icon={
                  <Weight
                    size={18}
                    color={isDarkMode ? "#8B5CF6" : "#6366F1"}
                  />
                }
                label="Weight"
                value={userProfile.weight}
              />
            </Animated.View>

            {/* Membership Info */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 20,
                marginBottom: 32,
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
              <View className="flex-row items-center mb-5">
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
                  <Clock size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} />
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
                  Membership Information
                </Text>
              </View>

              <InfoItem
                icon={
                  <Clock size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                }
                label="Member Since"
                value={userProfile.memberSince}
              />
            </Animated.View>

            {/* Delete Account Button */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                marginBottom: 10,
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "#DC2626",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  shadowColor: "#DC2626",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 5,
                  opacity: 0.6,
                }}
                activeOpacity={0.4}
                disabled={true}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Trash2
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Delete Account
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Note */}
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
                Note: Account deletion functionality is currently in
                development. This feature will be fully implemented in an
                upcoming update.
              </Text>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
