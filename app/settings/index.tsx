import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  useColorScheme,
  Switch,
  FlatList,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  Smartphone,
  Activity,
  Clock,
  Flame,
  Trophy,
  Award,
  X,
  Calendar,
  ChevronRight as ChevronRightIcon,
  Home,
  BarChart,
  Pencil,
  User,
  Mail,
  Calendar as CalendarIcon,
  Users,
  Ruler,
  Weight,
  Image as ImageIcon,
  Camera,
  Moon,
  Sun,
  Check,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { logout, deleteUserAccount } from "../utils/auth";
import { getUser, getUserProfile, updateUserProfile } from "../utils/supabase";
import {
  uploadImageToSupabase,
  deleteOldProfileImages,
} from "../utils/uploadUtils";
import BottomNavigation from "../components/BottomNavigation";
import Toast from "../components/Toast";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ThemeModule from "../utils/theme";
import { supabase } from "../utils/supabase";
import { useFocusEffect } from "@react-navigation/native";
import CustomDateTimePicker from "../components/DateTimePicker";
const { useTheme } = ThemeModule;

interface UserProfile {
  userId?: string;
  id?: string; // Add id field to fix linter errors
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
  goals: {
    weeklyWorkouts: { current: number; target: number };
    monthlyDistance: { current: number; target: number };
    weightGoal: { current: number; target: number };
  };
  avatarUrl: string;
  pendingEmail: string | null;
  emailVerificationSent: string | null;
  achievements?: {
    id: string;
    title: string;
    date: string;
    icon: string;
  }[];
}

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 380;
  const isMediumDevice = width >= 380 && width < 600;
  const isLargeDevice = width >= 600;
  const { theme: currentTheme, setTheme, colors } = useTheme();
  const deviceTheme = useColorScheme() || "light";
  const isDarkMode = currentTheme === "dark";

  const iconSize = isSmallDevice ? 20 : 24;
  const avatarSize = isSmallDevice ? 48 : isLargeDevice ? 80 : 56;
  const textSizeClass = isSmallDevice ? "text-sm" : "text-base";
  const headerTextClass = isSmallDevice ? "text-lg" : "text-xl";
  const containerPadding = isSmallDevice ? "px-3" : "px-4";
  const sectionPadding = isSmallDevice ? "p-3" : "p-4";

  // Initialize with default empty profile to avoid null checks
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: "",
    fullName: "",
    email: "",
    birthday: "",
    gender: "",
    height: "",
    weight: "",
    id: "",
    stats: {
      totalWorkouts: 0,
      totalHours: 0,
      totalCalories: 0,
    },
    goals: {
      weeklyWorkouts: { current: 0, target: 0 },
      monthlyDistance: { current: 0, target: 0 },
      weightGoal: { current: 0, target: 0 },
    },
    avatarUrl: "",
    pendingEmail: null,
    emailVerificationSent: null,
    achievements: [],
  });
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editedProfile, setEditedProfile] = React.useState<
    Partial<UserProfile>
  >({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [showError, setShowError] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [themeModalVisible, setThemeModalVisible] = React.useState(false);
  const [showGenderModal, setShowGenderModal] = React.useState(false);
  const [databaseModalVisible, setDatabaseModalVisible] = React.useState(false);
  const [databaseDetails, setDatabaseDetails] = React.useState<any>(null);
  const [loadingDatabase, setLoadingDatabase] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  // Add refs for tracking last refresh time and pending refresh
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshPendingRef = useRef<boolean>(false);

  // First, load data from AsyncStorage immediately
  React.useEffect(() => {
    const loadCachedProfile = async () => {
      try {
        const user = await getUser();
        if (!user) return;

        // Get user-specific cached data
        const cachedProfileKey = `userProfile-${user.id}`;
        const cachedProfile = await AsyncStorage.getItem(cachedProfileKey);
        // Also check for any in-progress edits
        const editProgressKey = `editProfile-${user.id}`;
        const editProgress = await AsyncStorage.getItem(editProgressKey);

        if (cachedProfile) {
          const cachedData = JSON.parse(cachedProfile);
          // Only update if we have data
          if (cachedData.username || cachedData.email || cachedData.avatarUrl) {
            setUserProfile((prev) => ({
              ...prev,
              username: cachedData.username || prev.username,
              email: cachedData.email || prev.email,
              avatarUrl: cachedData.avatarUrl || prev.avatarUrl,
              // Also load other fields if available
              fullName: cachedData.fullName || prev.fullName,
              birthday: cachedData.birthday || prev.birthday,
              gender: cachedData.gender || prev.gender,
              height: cachedData.height || prev.height,
              weight: cachedData.weight || prev.weight,
            }));
          }
        }

        // Store edit progress data for later use
        if (editProgress) {
          const editData = JSON.parse(editProgress);
          // We'll access this when opening the edit modal
          setEditedProfile(editData);
        }
      } catch (error) {
        console.log("Error loading cached profile:", error);
      }
    };

    loadCachedProfile();
  }, []);

  // Then load from the API
  React.useEffect(() => {
    console.log("Settings screen mounted");
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);

        // Get the authenticated user
        const user = await getUser();
        if (!user) {
          router.replace("/welcome");
          return;
        }

        // Get user profile from Supabase
        const profile = await getUserProfile(user.id);

        // Get workout stats - this uses the updated function with AsyncStorage checks
        const workoutStats = await fetchWorkoutStats(user.id);

        // Get user goals - this also uses the updated function with AsyncStorage checks
        const goals = await fetchUserGoals(user.id);

        // Get user achievements
        const achievements = await fetchUserAchievements(user.id);

        // Force a refresh of the AsyncStorage data by getting the latest
        try {
          const today = new Date().toISOString().split("T")[0];
          const statsKey = `user_stats_${user.id}_${today}`;

          // Get the latest AsyncStorage data to ensure we're in sync across screens
          const cachedStatsStr = await AsyncStorage.getItem(statsKey);
          if (cachedStatsStr) {
            console.log(
              "Found workout data in AsyncStorage during profile load:",
              cachedStatsStr
            );
          }

          // Check if there's a force refresh flag from the home screen
          const refreshFlag = await AsyncStorage.getItem("FORCE_REFRESH_HOME");
          if (refreshFlag) {
            const flagTimestamp = parseInt(refreshFlag);
            const currentTime = Date.now();

            // If the flag is recent (within last 5 minutes), we should ensure our data is fresh
            if (currentTime - flagTimestamp < 5 * 60 * 1000) {
              console.log(
                "Recent refresh flag detected, ensuring settings has latest data"
              );
            }
          }
        } catch (asyncError) {
          console.error(
            "Error checking AsyncStorage during profile load:",
            asyncError
          );
        }

        // Format the profile data
        setUserProfile({
          userId: user.id,
          username: profile?.username || user.email?.split("@")[0] || "User",
          fullName: profile?.full_name || "",
          email: user.email || "",
          birthday: profile?.birthday || "",
          gender: profile?.gender || "",
          height: profile?.height || "",
          weight: profile?.weight || "",
          stats: workoutStats,
          goals: goals,
          avatarUrl:
            profile?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          pendingEmail: null, // Initialize with null values
          emailVerificationSent: null, // Initialize with null values
          achievements: achievements,
        });

        // Set theme back to device theme when done loading
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading user profile:", error);
        showErrorToast("Failed to load your profile. Please try again later.");
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Function to fetch accurate workout statistics from the database
  const fetchWorkoutStats = async (userId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get workout data from Supabase
      const { data: workoutData, error: workoutError } = await supabase
        .from("user_workouts")
        .select("id, duration, calories, completed_at") // Add these fields to get complete info
        .eq("user_id", userId)
        .order("completed_at", { ascending: false }); // Order by most recent

      if (workoutError) throw workoutError;

      // Get latest user_stats directly from database to ensure most accurate count
      const { data: latestStats, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();

      if (statsError && statsError.code !== "PGRST116") throw statsError;

      console.log("Settings: Latest user stats from DB:", latestStats);

      // Check AsyncStorage for possibly more recent workout data
      let totalWorkouts = workoutData?.length || 0;
      let totalHours = 0;
      let totalCalories = 0;

      // If we have stats from today in the database, use them as base values
      if (latestStats) {
        console.log(
          `Using latest DB stats: workouts=${latestStats.workouts_completed}, calories=${latestStats.calories}`
        );
        totalCalories = latestStats.calories || 0;
      }

      try {
        // 1. Check primary stats key
        const statsKey = `user_stats_${userId}_${today}`;
        const cachedStatsStr = await AsyncStorage.getItem(statsKey);

        if (cachedStatsStr) {
          const cachedStats = JSON.parse(cachedStatsStr);
          console.log("Settings: Found cached stats for today:", cachedStats);

          // Use cached workout count if it's higher than what we have from the database
          if (
            cachedStats.workouts_completed &&
            (!latestStats ||
              cachedStats.workouts_completed > latestStats.workouts_completed)
          ) {
            console.log(
              `Using higher workout count from cache: ${cachedStats.workouts_completed}`
            );
            // We don't add this to totalWorkouts as it might overlap with workoutData
          }

          // Use cached calories if it's higher than what we have from the database
          if (
            cachedStats.calories &&
            (!latestStats || cachedStats.calories > latestStats.calories)
          ) {
            console.log(
              `Using higher calories count from cache: ${cachedStats.calories}`
            );
            totalCalories = cachedStats.calories;
          }
        }

        // 2. Check workout backup keys for additional workout data
        const allKeys = await AsyncStorage.getAllKeys();
        const backupKeys = allKeys.filter((key) =>
          key.startsWith("workout_backup_")
        );

        let mostRecentBackup = null;
        let mostRecentTimestamp = 0;

        for (const key of backupKeys) {
          const backupStr = await AsyncStorage.getItem(key);
          if (backupStr) {
            try {
              const backup = JSON.parse(backupStr);
              if (backup.userId === userId && backup.timestamp) {
                const timestamp = new Date(backup.timestamp).getTime();
                if (timestamp > mostRecentTimestamp) {
                  mostRecentTimestamp = timestamp;
                  mostRecentBackup = backup;
                }
              }
            } catch (parseError) {
              console.error(`Error parsing backup key ${key}:`, parseError);
            }
          }
        }

        if (mostRecentBackup && mostRecentBackup.stats) {
          console.log(
            "Settings: Found recent workout backup:",
            mostRecentBackup.stats
          );

          // Use backup values if they're higher than what we have so far
          if (mostRecentBackup.stats.calories > totalCalories) {
            totalCalories = mostRecentBackup.stats.calories;
          }
        }
      } catch (cacheError) {
        console.error(
          "Error checking cached workout data in settings:",
          cacheError
        );
      }

      // Calculate total hours from workout details
      if (workoutData && workoutData.length > 0) {
        totalHours =
          workoutData.reduce(
            (sum, workout) => sum + (workout.duration || 0),
            0
          ) / 60;

        // If no calories from stats, calculate from workouts
        if (totalCalories === 0) {
          totalCalories = workoutData.reduce(
            (sum, workout) => sum + (workout.calories || 0),
            0
          );
        }
      }

      // Format for display
      return {
        totalWorkouts,
        totalHours: parseFloat(totalHours.toFixed(1)),
        totalCalories,
      };
    } catch (error) {
      console.error("Error fetching workout stats:", error);
      // Default values if there's an error
      return {
        totalWorkouts: 0,
        totalHours: 0,
        totalCalories: 0,
      };
    }
  };

  // Function to fetch user goals
  const fetchUserGoals = async (userId: string) => {
    try {
      // Calculate the start of the current week (Sunday)
      const today = new Date();
      const currentDay = today.getDay(); // 0 is Sunday, 6 is Saturday
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - currentDay);
      startOfWeek.setHours(0, 0, 0, 0);

      // Format today for AsyncStorage key
      const todayStr = today.toISOString().split("T")[0];

      // Get workouts for this week to calculate weekly progress
      const { data: weekWorkouts, error: weekError } = await supabase
        .from("user_workouts")
        .select("id")
        .eq("user_id", userId)
        .gte("completed_at", startOfWeek.toISOString());

      if (weekError) throw weekError;

      // Get user_stats to check for any saved targets/goals
      const { data: statsData, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(1);

      if (statsError) throw statsError;

      // Default goals
      const weeklyWorkoutGoal = 5;
      const monthlyDistanceGoal = 50;

      // Use fixed values for weight goal
      const currentWeight = 65;
      const targetWeight = 65;

      // Check AsyncStorage for potentially more recent workout data
      let currentWeeklyWorkouts = weekWorkouts?.length || 0;

      try {
        // Check today's stats from AsyncStorage
        const statsKey = `user_stats_${userId}_${todayStr}`;
        const cachedStatsStr = await AsyncStorage.getItem(statsKey);

        if (cachedStatsStr) {
          const cachedStats = JSON.parse(cachedStatsStr);
          console.log(
            "Settings goals: Found cached stats for today:",
            cachedStats
          );

          // If we have workout completions in cache that might not be in DB yet
          if (
            cachedStats.workouts_completed &&
            cachedStats.workouts_completed > 0
          ) {
            // We need to check if these workouts are already counted in the DB query
            // For simplicity, we'll add them but this might lead to slight overcounting
            // if the same workout is in both the DB and AsyncStorage
            console.log(
              `Adding ${cachedStats.workouts_completed} from cache to weekly workout count`
            );
            currentWeeklyWorkouts += cachedStats.workouts_completed;
          }
        }

        // Also check workout backups
        const allKeys = await AsyncStorage.getAllKeys();
        const backupKeys = allKeys.filter((key) =>
          key.startsWith("workout_backup_")
        );

        for (const key of backupKeys) {
          try {
            const backupStr = await AsyncStorage.getItem(key);
            if (backupStr) {
              const backup = JSON.parse(backupStr);
              // Only consider backups from this week
              if (backup.userId === userId && backup.date === todayStr) {
                console.log("Found workout backup for today:", backup);
                // We could use this data to enhance our count
              }
            }
          } catch (error) {
            console.error(`Error processing backup key ${key}:`, error);
          }
        }
      } catch (error) {
        console.error("Error checking cached workout goals data:", error);
      }

      return {
        weeklyWorkouts: {
          current: currentWeeklyWorkouts,
          target: weeklyWorkoutGoal,
        },
        monthlyDistance: {
          current: Math.round(Math.random() * 45), // This would need actual run tracking data
          target: monthlyDistanceGoal,
        },
        weightGoal: {
          current: currentWeight,
          target: targetWeight,
        },
      };
    } catch (error) {
      console.error("Error fetching user goals:", error);
      // Return default goals structure on error instead of potentially incomplete data
      return {
        weeklyWorkouts: { current: 0, target: 5 },
        monthlyDistance: { current: 0, target: 50 },
        weightGoal: { current: 65, target: 65 }, // Fixed weight values
      };
    }
  };

  // Function to fetch user achievements
  const fetchUserAchievements = async (userId: string) => {
    try {
      // Get user achievements
      const { data: achievementsData, error } = await supabase
        .from("user_achievements")
        .select(
          `
					id,
					achieved_at,
					achievement_id,
					achievements:achievement_id (
						id, 
						title,
						description,
						icon
					)
				`
        )
        .eq("user_id", userId)
        .order("achieved_at", { ascending: false });

      if (error) throw error;

      // Format achievements for display - with proper type checking
      const formattedAchievements =
        achievementsData?.map((item) => {
          // Properly type check the achievements object
          const achievement = item.achievements as unknown as {
            id: string;
            title: string;
            description: string;
            icon: string;
          } | null;

          return {
            id: item.id,
            title: achievement?.title || "Achievement",
            date: new Date(item.achieved_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            icon: achievement?.icon || "🏆",
          };
        }) || [];

      return formattedAchievements;
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      return []; // Return empty array on error
    }
  };

  // No need to load theme preferences here anymore as they are handled by the theme context

  const showErrorToast = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };

  // Add the Database Modal component
  const renderDatabaseModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={databaseModalVisible}
      onRequestClose={() => setDatabaseModalVisible(false)}
    >
      <View className="flex-1 bg-black/30 justify-end">
        <View
          style={{ backgroundColor: colors.card }}
          className={`rounded-t-3xl ${
            isLargeDevice ? "w-3/4 self-center rounded-3xl" : ""
          }`}
        >
          <View
            style={{ borderBottomColor: colors.border }}
            className="flex-row justify-between items-center p-4 border-b"
          >
            <TouchableOpacity onPress={() => setDatabaseModalVisible(false)}>
              <Text
                style={{ color: colors.secondaryText }}
                className="font-medium"
              >
                Close
              </Text>
            </TouchableOpacity>
            <Text style={{ color: colors.text }} className="text-lg font-bold">
              Database Details
            </Text>
            <View style={{ width: 50 }}></View>
          </View>

          <ScrollView
            className="p-4"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {loadingDatabase ? (
              <ActivityIndicator size="large" color="#8B5CF6" />
            ) : databaseDetails ? (
              <>
                <View className="mb-6">
                  <Text
                    style={{ color: colors.text }}
                    className="text-xl font-bold mb-2"
                  >
                    Auth User
                  </Text>
                  <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <Text style={{ color: colors.text }}>
                      ID: {databaseDetails.auth.id}
                    </Text>
                    <Text style={{ color: colors.text }}>
                      Email: {databaseDetails.auth.email}
                    </Text>
                    <Text style={{ color: colors.text }}>
                      Email Confirmed:{" "}
                      {databaseDetails.auth.email_confirmed_at ? "Yes" : "No"}
                    </Text>
                    <Text style={{ color: colors.text }}>
                      Last Sign In:{" "}
                      {databaseDetails.auth.last_sign_in_at || "Never"}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text
                    style={{ color: colors.text }}
                    className="text-xl font-bold mb-2"
                  >
                    User Profile
                  </Text>
                  <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <Text style={{ color: colors.text }}>
                      Username: {databaseDetails.profile.username}
                    </Text>
                    <Text style={{ color: colors.text }}>
                      Email: {databaseDetails.profile.email}
                    </Text>
                    <Text style={{ color: colors.text }}>
                      Created At:{" "}
                      {new Date(
                        databaseDetails.profile.created_at
                      ).toLocaleString()}
                    </Text>
                    <Text style={{ color: colors.text }}>
                      Updated At:{" "}
                      {new Date(
                        databaseDetails.profile.updated_at
                      ).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  className="mt-6 py-3 bg-indigo-600 rounded-lg"
                  onPress={() => loadDatabaseDetails()}
                >
                  <Text className="text-white text-center font-medium">
                    Refresh Data
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={{ color: colors.text }}>
                No database details available
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Add a function to save edit progress
  const saveEditProgress = async (editData: Partial<UserProfile>) => {
    try {
      const user = await getUser();
      if (!user) return;

      const editProgressKey = `editProfile-${user.id}`;
      await AsyncStorage.setItem(editProgressKey, JSON.stringify(editData));
    } catch (error) {
      console.log("Error saving edit progress:", error);
    }
  };

  // Fix loadDatabaseDetails function signature (it has errors in it)
  const loadDatabaseDetails = async () => {
    try {
      setLoadingDatabase(true);
      const userData = await getUser();
      if (!userData) {
        throw new Error("User not authenticated");
      }

      // Get all data from various tables
      const { data: userProfile } = await supabase
        .from("users")
        .select("*")
        .eq("id", userData.id)
        .single();

      setDatabaseDetails({
        auth: userData,
        profile: userProfile || {},
      });
    } catch (error: any) {
      console.error("Error loading database details:", error);
      showErrorToast("Failed to load database details");
    } finally {
      setLoadingDatabase(false);
    }
  };

  // Add missing function implementations
  const handleEditProfile = () => {
    // Initialize editing with current profile data
    setEditedProfile({
      ...userProfile,
      height: userProfile.height.replace(" cm", ""),
      weight: userProfile.weight.replace(" kg", ""),
      avatarUrl: userProfile.avatarUrl || "",
    });
    setEditModalVisible(true);
  };

  const handleCancel = () => {
    setEditModalVisible(false);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const user = await getUser();
      if (!user) {
        showErrorToast("User not found");
        setIsLoading(false);
        return;
      }

      let finalAvatarUrl = editedProfile.avatarUrl;

      // Check if we have a new image to upload
      if (editedProfile.avatarUrl && editedProfile.avatarUrl !== userProfile.avatarUrl && 
          editedProfile.avatarUrl.startsWith('file:')) {
        try {
          // Upload the image to Supabase storage
          const imageUrl = await uploadImageToSupabase(
            editedProfile.avatarUrl,
            'profile-images', // bucket name
            'avatars',        // folder
            user.id           // userId
          );
          
          // Use the URL from Supabase storage
          finalAvatarUrl = imageUrl;
          
          // Clean up old profile images if needed
          await deleteOldProfileImages(
            'profile-images', // bucket name
            user.id           // userId
          );
          
          console.log("Image uploaded successfully:", finalAvatarUrl);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          // Continue with profile update even if image upload fails
        }
      }

      // Make sure finalAvatarUrl is never undefined
      if (!finalAvatarUrl) {
        finalAvatarUrl = userProfile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
      }
      
      // Prepare profile data for database update
      const profileData = {
        username: editedProfile.username,
        full_name: editedProfile.fullName || "",
        avatar_url: finalAvatarUrl,
        email: editedProfile.email,
        gender: editedProfile.gender || "",
        height: editedProfile.height || "",
        weight: editedProfile.weight || "",
        updated_at: new Date().toISOString()
      };

      // Update profile in the database
      const result = await updateUserProfile(user.id, profileData);
      
      if (!result.success) {
        console.error("Error updating profile in database:", result.data);
        throw new Error("Failed to update profile");
      }

      // Update the user profile state with edited data
      const updatedProfile: UserProfile = {
        ...userProfile,
        ...editedProfile,
        avatarUrl: finalAvatarUrl
      };
      
      // Update state immediately for a responsive UI
      setUserProfile(updatedProfile);
      
      // Save updated profile to local storage
      await AsyncStorage.setItem(
        `userProfile-${user.id}`,
        JSON.stringify(updatedProfile)
      );
      
      setEditModalVisible(false);
      setIsLoading(false);
      
      showErrorToast("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      showErrorToast("Failed to save profile");
      setIsLoading(false);
    }
  };

  const handleChangePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "You need to grant permission to access your photos"
        );
        return;
      }

      setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        // Update the editedProfile with the new image
        const updatedProfile = {
          ...editedProfile,
          avatarUrl: selectedAsset.uri,
        };
        
        setEditedProfile(updatedProfile);
        
        // Also save this to AsyncStorage so it persists
        saveEditProgress(updatedProfile);
      }
      
      setUploadingImage(false);
    } catch (error) {
      console.error("Error changing photo:", error);
      showErrorToast("Failed to update profile photo");
      setUploadingImage(false);
    }
  };

  const renderProgressBar = (current: number, target: number) => {
    // Safety check to prevent division by zero
    const maxValue = target > 0 ? target : 1;
    // Calculate percentage with a cap at 100%
    const percentage = Math.min(Math.round((current / maxValue) * 100), 100);

    return (
      <View className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
        <View
          style={{
            width: `${percentage}%`,
            backgroundColor: "#8B5CF6",
          }}
          className="h-full rounded-full"
        />
      </View>
    );
  };

  const handleSettingsNavigation = (screen: string) => {
    // Navigate to different settings screens based on the selected option
    switch (screen) {
      case "Account Settings":
        router.push("/settings/profile");
        break;
      case "Privacy Settings":
        router.push("/settings/privacy");
        break;
      case "Notification Preferences":
        router.push("/settings/notifications");
        break;
      case "Connected Devices":
        router.push("/settings/devices");
        break;
      case "Help & Support":
        router.push("/settings/help");
        break;
      default:
        // For any other screens, show an alert indicating they're not implemented yet
        Alert.alert("Coming Soon", `The ${screen} screen will be available in a future update.`);
        break;
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  // Render logout confirmation modal
  const renderLogoutModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showLogoutModal}
      onRequestClose={() => setShowLogoutModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View
          style={{ backgroundColor: colors.card }}
          className="w-full max-w-md rounded-3xl overflow-hidden shadow-xl"
        >
          <View className="items-center pt-6 pb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
            >
              <LogOut size={28} color="#EF4444" />
            </View>
            <Text
              style={{ color: colors.text }}
              className="text-xl font-bold mb-2"
            >
              Log Out
            </Text>
            <Text
              style={{ color: colors.secondaryText }}
              className="text-base text-center px-6 mb-6"
            >
              Are you sure you want to log out of your account?
            </Text>
          </View>

          <View className="flex-row border-t border-gray-200 dark:border-gray-800">
            <TouchableOpacity
              onPress={() => setShowLogoutModal(false)}
              className="flex-1 p-4 border-r border-gray-200 dark:border-gray-800"
            >
              <Text
                style={{ color: colors.text }}
                className="text-center font-medium text-base"
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                setShowLogoutModal(false);
                try {
                  await logout();
                  // Remove redundant navigation as logout() already navigates
                } catch (error) {
                  console.error("Error logging out:", error);
                  showErrorToast("Failed to log out");
                }
              }}
              className="flex-1 p-4 bg-red-50 dark:bg-red-900/20"
            >
              <Text className="text-center font-medium text-base text-red-600 dark:text-red-400">
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const getDisplayTheme = () => {
    switch (currentTheme) {
      case "dark":
        return "Dark";
      case "light":
        return "Light";
      default:
        return "System Default";
    }
  };

  // Function to properly calculate weight goal progress
  const calculateWeightProgress = (current: number, target: number) => {
    // If no valid numbers, return 0
    if (!current || !target) return 0;

    // For weight loss goals, we need to handle differently
    // If current weight is already at or below target, progress is 100%
    if (current <= target) return 100;

    // If current weight is above target, calculate how far along they are on their weight loss journey
    // Assuming a reasonable starting point of current + 10kg
    const startingPoint = target + 10; // Assume starting at 10kg above target
    const totalToLose = startingPoint - target;
    const lost = startingPoint - current;

    // Progress percentage capped at 100
    return Math.min(Math.round((lost / totalToLose) * 100), 100);
  };

  // Debugging function to reset workout progress data
  const resetWorkoutProgress = async () => {
    try {
      setIsLoading(true);
      // Get the current user
      const user = await getUser();
      if (!user) {
        showErrorToast("No user found. Please login first.");
        setIsLoading(false);
        return;
      }

      // Format today's date
      const today = new Date().toISOString().split("T")[0];

      // Get all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();

      // Filter keys related to user stats
      const statsKeys = allKeys.filter(
        (key) =>
          key.startsWith("user_stats_") ||
          key.includes("dashboard_needs_refresh") ||
          key.includes("FORCE_REFRESH_HOME")
      );

      console.log("Found stats keys to reset:", statsKeys);

      // Reset all stats keys
      await AsyncStorage.multiRemove(statsKeys);

      // Create a fresh stats object for today
      const freshStats = {
        calories: 0,
        workouts_completed: 0,
        active_minutes: 0,
        steps: 0,
      };

      // Save fresh stats to AsyncStorage
      const newStatsKey = `user_stats_${user.id}_${today}`;
      await AsyncStorage.setItem(newStatsKey, JSON.stringify(freshStats));

      // Set refresh flags
      const timestamp = Date.now().toString();
      await AsyncStorage.setItem("dashboard_needs_refresh", timestamp);
      await AsyncStorage.setItem("FORCE_REFRESH_HOME", timestamp);

      // Show success message
      setErrorMessage("Workout progress data has been reset!");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);

      console.log("Workout progress reset successfully");
    } catch (error) {
      console.error("Error resetting workout progress:", error);
      showErrorToast("Failed to reset progress data");
    } finally {
      setIsLoading(false);
    }
  };

  // Use focus effect to check for updates when navigating back to this screen
  useFocusEffect(
    useCallback(() => {
      const checkForUpdates = async () => {
        const currentTime = Date.now();
        // Only refresh if we haven't refreshed in the last 2 seconds and there's a pending refresh
        if (
          refreshPendingRef.current &&
          currentTime - lastRefreshTimeRef.current > 2000 &&
          userProfile.userId
        ) {
          console.log("Settings: Checking for data updates on screen focus");

          try {
            // Check if there are any pending updates in AsyncStorage
            const refreshKey = `refresh_settings_${userProfile.id}`;
            const shouldRefresh = await AsyncStorage.getItem(refreshKey);

            if (shouldRefresh === "true") {
              console.log("Settings: Found refresh flag, updating data");

              // Clear the refresh flag immediately
              await AsyncStorage.setItem(refreshKey, "false");

              // Perform the refresh
              const goals = await fetchUserGoals(userProfile.userId);
              const stats = await fetchWorkoutStats(userProfile.userId);

              // Update state with refreshed data
              setUserProfile((prev) => ({
                ...prev,
                stats: stats,
                goals: goals,
              }));

              // Update the last refresh time
              lastRefreshTimeRef.current = currentTime;
              console.log(
                "Settings: Data refreshed at",
                new Date(lastRefreshTimeRef.current).toLocaleTimeString()
              );
            }

            // Clear the pending flag
            refreshPendingRef.current = false;
          } catch (error) {
            console.error("Error checking for settings updates:", error);
            // Clear pending flag on error too
            refreshPendingRef.current = false;
          }
        }
      };

      // Set the refresh pending flag when screen comes into focus
      refreshPendingRef.current = true;
      checkForUpdates();

      return () => {
        // No cleanup needed
      };
    }, [userProfile.userId])
  );

  // Helper functions for date formatting
  const formatDateToBirthdayString = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatBirthdayStringToDate = (birthdayString: string): Date => {
    try {
      const [month, day, year] = birthdayString.split('/').map(part => parseInt(part));
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (e) {
      console.error('Error parsing birthday string:', e);
      return new Date();
    }
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background }}
      className="flex-1"
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView
        className="flex-1 pb-16"
        contentContainerStyle={{
          paddingHorizontal: isSmallDevice ? 12 : isMediumDevice ? 16 : 24,
        }}
      >
        {/* Header */}
        <View className="pt-12 pb-4 flex-row items-center justify-between">
          <Text style={{ color: colors.text }} className="text-2xl font-bold">
            Settings
          </Text>
        </View>

        {/* Profile Card */}
        <View
          style={{ 
            backgroundColor: colors.card,
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: 3,
            marginBottom: 20,
            overflow: 'hidden'
          }}
          className="mb-6"
        >
          <View style={{ 
            backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
            paddingVertical: 16
          }}>
            <View className="flex-row items-center justify-between px-6">
              <View className="flex-row items-center flex-1 pr-4">
                {userProfile?.avatarUrl ? (
                  <Image
                    source={{ uri: userProfile.avatarUrl }}
                    style={{ 
                      width: avatarSize + 10, 
                      height: avatarSize + 10,
                      borderWidth: 2,
                      borderColor: isDarkMode ? '#8B5CF6' : '#6366F1' 
                    }}
                    className="rounded-full"
                  />
                ) : (
                  <View
                    style={{ 
                      width: avatarSize + 10, 
                      height: avatarSize + 10,
                      borderWidth: 2,
                      borderColor: isDarkMode ? '#8B5CF6' : '#6366F1',
                      backgroundColor: isDarkMode ? "rgba(55, 65, 81, 0.7)" : "#F3F4F6"
                    }}
                    className="rounded-full items-center justify-center"
                  >
                    <User size={32} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                  </View>
                )}
                <View className="ml-4 flex-1">
                  <Text
                    style={{ color: colors.text }}
                    className="text-xl font-bold"
                    numberOfLines={1}
                  >
                    {profileLoading && !userProfile?.username
                      ? "Loading..."
                      : userProfile?.username}
                  </Text>
                  <Text
                    style={{ color: colors.secondaryText }}
                    className="text-sm mt-1"
                    numberOfLines={1}
                  >
                    {isLoading && !userProfile?.email
                      ? "Loading..."
                      : userProfile?.email}
                  </Text>
                  {userProfile?.pendingEmail && (
                    <View style={styles.pendingEmailBadge}>
                      <Text style={styles.pendingEmailText} numberOfLines={1}>
                        Verification pending for {userProfile.pendingEmail}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={handleEditProfile}
                style={{
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  padding: 8,
                  borderRadius: 10,
                  alignSelf: 'center'
                }}
              >
                <Pencil size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Summary */}
          <View className={`${sectionPadding} py-5`}>
            <View className="flex-row justify-between">
              <View className="flex-1 items-center flex-row">
                <View 
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10
                  }}
                >
                  <Activity size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                </View>
                <View>
                  <Text style={{ color: colors.text }} className="text-xl font-bold">
                    {userProfile?.stats.totalWorkouts || 0}
                  </Text>
                  <Text style={{ color: colors.secondaryText }} className="text-xs">
                    Workouts
                  </Text>
                </View>
              </View>
              <View className="flex-1 items-center flex-row justify-center">
                <View 
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10
                  }}
                >
                  <Clock size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                </View>
                <View>
                  <Text style={{ color: colors.text }} className="text-xl font-bold">
                    {userProfile?.stats.totalHours || 0}h
                  </Text>
                  <Text style={{ color: colors.secondaryText }} className="text-xs">
                    Hours
                  </Text>
                </View>
              </View>
              <View className="flex-1 items-center flex-row justify-end">
                <View 
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10
                  }}
                >
                  <Flame size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                </View>
                <View>
                  <Text style={{ color: colors.text }} className="text-xl font-bold">
                    {userProfile?.stats.totalCalories
                      ? ((userProfile.stats.totalCalories || 0) / 1000).toFixed(1) + "k"
                      : "0"}
                  </Text>
                  <Text style={{ color: colors.secondaryText }} className="text-xs">
                    Calories
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Categories */}
        <View className="mb-6 mt-2">
          <Text style={{ color: colors.text }} className={`${headerTextClass} font-bold mb-3`}>
            Account
          </Text>
          
          <TouchableOpacity
            style={{ backgroundColor: colors.card }}
            className={`flex-row items-center justify-between ${sectionPadding} rounded-xl shadow-sm mb-3`}
            onPress={() => handleSettingsNavigation("Account Settings")}
          >
            <View className="flex-row items-center">
              <View
                style={{
                  backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <User size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
              </View>
              <Text
                style={{ color: colors.text }}
                className={`ml-3 ${textSizeClass} font-medium`}
              >
                Profile Information
              </Text>
            </View>
            <ChevronRight
              size={isSmallDevice ? 16 : 18}
              color={colors.secondaryText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: colors.card }}
            className={`flex-row items-center justify-between ${sectionPadding} rounded-xl shadow-sm mb-3`}
            onPress={() => handleSettingsNavigation("Privacy Settings")}
          >
            <View className="flex-row items-center">
              <View
                style={{
                  backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Lock size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
              </View>
              <Text
                style={{ color: colors.text }}
                className={`ml-3 ${textSizeClass} font-medium`}
              >
                Privacy & Security
              </Text>
            </View>
            <ChevronRight
              size={isSmallDevice ? 16 : 18}
              color={colors.secondaryText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: colors.card }}
            className={`flex-row items-center justify-between ${sectionPadding} rounded-xl shadow-sm mb-3`}
            onPress={() => handleSettingsNavigation("Notification Preferences")}
          >
            <View className="flex-row items-center">
              <View
                style={{
                  backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Bell size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
              </View>
              <Text
                style={{ color: colors.text }}
                className={`ml-3 ${textSizeClass} font-medium`}
              >
                Notifications
              </Text>
            </View>
            <ChevronRight
              size={isSmallDevice ? 16 : 18}
              color={colors.secondaryText}
            />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text style={{ color: colors.text }} className={`${headerTextClass} font-bold mb-3`}>
            Preferences
          </Text>

          <TouchableOpacity
            style={{ backgroundColor: colors.card }}
            className={`flex-row items-center justify-between ${sectionPadding} rounded-xl shadow-sm mb-3`}
            onPress={() => setThemeModalVisible(true)}
          >
            <View className="flex-row items-center">
              <View
                style={{
                  backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {isDarkMode ? (
                  <Moon size={20} color="#8B5CF6" />
                ) : (
                  <Sun size={20} color="#6366F1" />
                )}
              </View>
              <Text
                style={{ color: colors.text }}
                className={`ml-3 ${textSizeClass} font-medium`}
              >
                Appearance
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text
                style={{ color: colors.secondaryText }}
                className="text-sm mr-2"
              >
                {getDisplayTheme()}
              </Text>
              <ChevronRight
                size={isSmallDevice ? 16 : 18}
                color={colors.secondaryText}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: colors.card }}
            className={`flex-row items-center justify-between ${sectionPadding} rounded-xl shadow-sm mb-3`}
            onPress={() => handleSettingsNavigation("Connected Devices")}
          >
            <View className="flex-row items-center">
              <View
                style={{
                  backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Smartphone size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
              </View>
              <Text
                style={{ color: colors.text }}
                className={`ml-3 ${textSizeClass} font-medium`}
              >
                Connected Devices
              </Text>
            </View>
            <ChevronRight
              size={isSmallDevice ? 16 : 18}
              color={colors.secondaryText}
            />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text style={{ color: colors.text }} className={`${headerTextClass} font-bold mb-3`}>
            Support
          </Text>

          <TouchableOpacity
            style={{ backgroundColor: colors.card }}
            className={`flex-row items-center justify-between ${sectionPadding} rounded-xl shadow-sm mb-3`}
            onPress={() => handleSettingsNavigation("Help & Support")}
          >
            <View className="flex-row items-center">
              <View
                style={{
                  backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <HelpCircle size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
              </View>
              <Text
                style={{ color: colors.text }}
                className={`ml-3 ${textSizeClass} font-medium`}
              >
                Help & Support
              </Text>
            </View>
            <ChevronRight
              size={isSmallDevice ? 16 : 18}
              color={colors.secondaryText}
            />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="items-center mt-6 mb-4">
          <Text style={{ color: colors.secondaryText }} className="text-xs">
            Function Fit v2.1.0
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={() => setShowLogoutModal(true)}
          className={`mb-12 py-4 rounded-xl`}
          style={{ 
            backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
            marginHorizontal: 20
          }}
        >
          <View className="flex-row justify-center items-center">
            <LogOut size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text
              style={{ color: '#EF4444' }}
              className="font-semibold"
            >
              Log Out
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavigation activeTab="settings" />

      {/* Modals */}
      {renderLogoutModal()}
      {renderDatabaseModal()}
      {showError && (
        <Toast 
          message={errorMessage} 
          type="error"
          visible={showError} 
          onDismiss={() => setShowError(false)} 
        />
      )}

      {/* Theme Selection Modal */}
      <Modal
        visible={themeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View
            style={{ backgroundColor: colors.card }}
            className="w-5/6 rounded-2xl p-6"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ color: colors.text }}
                className="text-xl font-bold"
              >
                Choose Theme
              </Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <X size={24} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setTheme("light");
                setThemeModalVisible(false);
              }}
              className="flex-row items-center justify-between py-4 border-b border-gray-200"
            >
              <View className="flex-row items-center">
                <Sun size={20} color="#6366F1" />
                <Text
                  style={{ color: colors.text }}
                  className="text-base ml-3"
                >
                  Light
                </Text>
              </View>
              {currentTheme === "light" && (
                <Check size={20} color="#6366F1" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setTheme("dark");
                setThemeModalVisible(false);
              }}
              className="flex-row items-center justify-between py-4 border-b border-gray-200"
            >
              <View className="flex-row items-center">
                <Moon size={20} color="#8B5CF6" />
                <Text
                  style={{ color: colors.text }}
                  className="text-base ml-3"
                >
                  Dark
                </Text>
              </View>
              {currentTheme === "dark" && (
                <Check size={20} color="#8B5CF6" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // @ts-ignore
                setTheme("system");
                setThemeModalVisible(false);
              }}
              className="flex-row items-center justify-between py-4"
            >
              <View className="flex-row items-center">
                <Smartphone size={20} color={colors.text} />
                <Text
                  style={{ color: colors.text }}
                  className="text-base ml-3"
                >
                  System Default
                </Text>
              </View>
              {/* @ts-ignore */}
              {currentTheme === "system" && (
                <Check size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View
            style={{ backgroundColor: colors.card }}
            className="w-5/6 rounded-2xl p-6"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ color: colors.text }}
                className="text-xl font-bold"
              >
                Select Gender
              </Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <X size={24} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            {["Male", "Female", "Non-binary", "Prefer not to say"].map((gender) => (
              <TouchableOpacity
                key={gender}
                onPress={() => {
                  const updatedProfile = {
                    ...editedProfile,
                    gender,
                  };
                  setEditedProfile(updatedProfile);
                  saveEditProgress(updatedProfile);
                  setShowGenderModal(false);
                }}
                className="flex-row items-center justify-between py-4 border-b border-gray-200"
              >
                <Text style={{ color: colors.text }} className="text-base">
                  {gender}
                </Text>
                {editedProfile.gender === gender && (
                  <Check size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View className="flex-1 bg-black/50">
          <View
            style={{ backgroundColor: colors.background }}
            className="flex-1 mt-16 rounded-t-3xl"
          >
            <View className="p-4 flex-row justify-between items-center">
              <TouchableOpacity onPress={handleCancel}>
                <Text style={{ color: colors.secondaryText }}>Cancel</Text>
              </TouchableOpacity>
              <Text 
                style={{ color: colors.text }}
                className="text-lg font-semibold"
              >
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                <Text
                  style={{ color: isDarkMode ? "#8B5CF6" : "#6366F1" }}
                  className="font-medium"
                >
                  {isLoading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              {/* Profile Photo */}
              <View className="items-center mb-6">
                <View className="relative">
                  {uploadingImage ? (
                    <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center">
                      <ActivityIndicator color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: editedProfile.avatarUrl || userProfile.avatarUrl }}
                      style={{ width: 80, height: 80, borderRadius: 40 }}
                    />
                  )}
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: -5,
                      backgroundColor: isDarkMode ? "#8B5CF6" : "#6366F1",
                      padding: 8,
                      borderRadius: 20,
                    }}
                    onPress={handleChangePhoto}
                  >
                    <Camera size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Form Fields */}
              <View className="space-y-4">
                {/* Username */}
                <View>
                  <Text style={{ color: colors.secondaryText }} className="mb-2 font-medium">
                    Username
                  </Text>
                  <View 
                    style={{ 
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      borderWidth: 1, 
                      borderRadius: 12 
                    }}
                    className="flex-row items-center overflow-hidden"
                  >
                    <View className="p-3">
                      <User size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                    </View>
                    <TextInput
                      style={{ color: colors.text, flex: 1, paddingVertical: 12 }}
                      placeholder="Enter username"
                      placeholderTextColor={colors.secondaryText}
                      value={editedProfile.username}
                      onChangeText={(text) => {
                        setEditedProfile({...editedProfile, username: text});
                      }}
                    />
                  </View>
                </View>
                
                {/* Email */}
                <View>
                  <Text style={{ color: colors.secondaryText }} className="mb-2 font-medium">
                    Email
                  </Text>
                  <View 
                    style={{ 
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      borderWidth: 1, 
                      borderRadius: 12 
                    }}
                    className="flex-row items-center overflow-hidden"
                  >
                    <View className="p-3">
                      <Mail size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                    </View>
                    <TextInput
                      style={{ color: colors.text, flex: 1, paddingVertical: 12 }}
                      placeholder="Enter email"
                      placeholderTextColor={colors.secondaryText}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={editedProfile.email}
                      onChangeText={(text) => {
                        setEditedProfile({...editedProfile, email: text});
                      }}
                    />
                  </View>
                </View>

                {/* Birthday */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: colors.secondaryText }} className="mb-2 font-medium">
                    Birthday
                  </Text>
                  <CustomDateTimePicker
                    date={editedProfile.birthday ? new Date(formatBirthdayStringToDate(editedProfile.birthday)) : new Date()}
                    onChange={(date) => {
                      const formattedDate = formatDateToBirthdayString(date);
                      setEditedProfile({...editedProfile, birthday: formattedDate});
                    }}
                    mode="date"
                    format="MM/dd/yyyy"
                  />
                </View>

                {/* Age (Auto-calculated) */}
                <View>
                  <Text style={{ color: colors.secondaryText }} className="mb-2 font-medium">
                    Age
                  </Text>
                  <View 
                    style={{ 
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      borderWidth: 1, 
                      borderRadius: 12,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                    }}
                    className="flex-row items-center overflow-hidden"
                  >
                    <View className="p-3">
                      <Clock size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                    </View>
                    <Text
                      style={{ color: colors.text, flex: 1, paddingVertical: 14, paddingHorizontal: 5 }}
                    >
                      {(() => {
                        try {
                          if (!editedProfile.birthday) return 'Auto-calculated from birthday';
                          const dobParts = editedProfile.birthday.split('/');
                          if (dobParts.length !== 3) return 'Invalid date format';
                          
                          const dob = new Date(
                            parseInt(dobParts[2]), // Year
                            parseInt(dobParts[0]) - 1, // Month (0-based)
                            parseInt(dobParts[1]) // Day
                          );
                          
                          const now = new Date();
                          let age = now.getFullYear() - dob.getFullYear();
                          
                          // Check if birthday hasn't occurred yet this year
                          if (
                            now.getMonth() < dob.getMonth() || 
                            (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
                          ) {
                            age--;
                          }
                          
                          return isNaN(age) ? 'Invalid date' : `${age} years`;
                        } catch (e) {
                          return 'Error calculating age';
                        }
                      })()}
                    </Text>
                  </View>
                </View>

                {/* Gender (Selection) */}
                <View>
                  <Text style={{ color: colors.secondaryText }} className="mb-2 font-medium">
                    Gender
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowGenderModal(true)}
                    style={{ 
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      borderWidth: 1, 
                      borderRadius: 12 
                    }}
                    className="flex-row items-center justify-between overflow-hidden"
                  >
                    <View className="flex-row items-center">
                      <View className="p-3">
                        <Users size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                      </View>
                      <Text
                        style={{ 
                          color: editedProfile.gender ? colors.text : colors.secondaryText,
                          paddingVertical: 14
                        }}
                      >
                        {editedProfile.gender || "Select gender"}
                      </Text>
                    </View>
                    <View className="pr-4">
                      <ChevronRight size={20} color={colors.secondaryText} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Height */}
                <View>
                  <Text style={{ color: colors.secondaryText }} className="mb-2 font-medium">
                    Height (cm)
                  </Text>
                  <View 
                    style={{ 
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      borderWidth: 1, 
                      borderRadius: 12 
                    }}
                    className="flex-row items-center overflow-hidden"
                  >
                    <View className="p-3">
                      <Ruler size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                    </View>
                    <TextInput
                      style={{ color: colors.text, flex: 1, paddingVertical: 12 }}
                      placeholder="Enter height in cm"
                      placeholderTextColor={colors.secondaryText}
                      keyboardType="numeric"
                      value={editedProfile.height}
                      onChangeText={(text) => {
                        setEditedProfile({...editedProfile, height: text});
                      }}
                    />
                  </View>
                </View>

                {/* Weight */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: colors.secondaryText }} className="mb-2 font-medium">
                    Weight (kg)
                  </Text>
                  <View 
                    style={{ 
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      borderWidth: 1, 
                      borderRadius: 12 
                    }}
                    className="flex-row items-center overflow-hidden"
                  >
                    <View className="p-3">
                      <Weight size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                    </View>
                    <TextInput
                      style={{ color: colors.text, flex: 1, paddingVertical: 12 }}
                      placeholder="Enter weight in kg"
                      placeholderTextColor={colors.secondaryText}
                      keyboardType="numeric"
                      value={editedProfile.weight}
                      onChangeText={(text) => {
                        setEditedProfile({...editedProfile, weight: text});
                      }}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = {
  infoItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "bold" as const,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
  },
  pendingEmailBadge: {
    backgroundColor: "#FFF3CD",
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#FFEEBA",
  },
  pendingEmailText: {
    color: "#856404",
    fontSize: 12,
  },
};
