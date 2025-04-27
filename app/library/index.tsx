import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  TextInput,
  useColorScheme,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  ArrowLeft,
  Search,
  Clock,
  Flame,
  Filter,
  X,
  Star,
  MoreVertical,
  Plus,
  Calendar,
  Share2,
  Bookmark,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import BottomNavigation from "../components/BottomNavigation";
import ThemeModule from "../utils/theme";
import { scheduleWorkout } from "../utils/fitness";
import { getUser, getWorkouts } from "../utils/supabase";
const { useTheme } = ThemeModule;

// Define the workout type to avoid TypeScript errors
interface Workout {
  id: string;
  title: string;
  duration: string;
  calories: string;
  difficulty: string;
  category: string;
  rating: number;
  reviews: number;
  imageUrl: string;
  trainer: string;
  description?: string;
  isFeatured?: boolean;
  exercises?: any[];
}

// Categories for filtering
const workoutCategories = [
  { id: "all", name: "All" },
  { id: "hiit", name: "HIIT" },
  { id: "strength", name: "Strength" },
  { id: "cardio", name: "Cardio" },
  { id: "yoga", name: "Yoga" },
  { id: "pilates", name: "Pilates" },
];

export default function WorkoutLibrary() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workouts from Supabase
  useEffect(() => {
    const fetchWorkoutsFromDB = async () => {
      try {
        setIsLoading(true);
        const workoutsData = await getWorkouts();

        // Convert Supabase workout format to the expected format in the UI
        const formattedWorkouts: Workout[] = workoutsData.map((workout) => ({
          id: workout.id,
          title: workout.title,
          duration: `${workout.duration} mins`,
          calories: workout.calories.toString(),
          difficulty: workout.difficulty,
          category: workout.category || "other",
          rating: 4.8, // Default rating since it's not in the DB
          reviews: 100, // Default reviews count since it's not in the DB
          imageUrl: workout.image_url,
          trainer: "Fitness Coach", // Default trainer name
          description: workout.description,
          isFeatured: Math.random() > 0.7, // Randomly feature some workouts
        }));

        setWorkouts(formattedWorkouts);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching workouts:", err);
        setError("Failed to load workouts. Please try again.");
        setIsLoading(false);
      }
    };

    fetchWorkoutsFromDB();
  }, []);

  const { width } = useWindowDimensions();
  const isSmallDevice = width < 380;
  const isMediumDevice = width >= 380 && width < 600;
  const isLargeDevice = width >= 600;
  const isExtraLargeDevice = width >= 1024;
  const { theme: currentTheme, colors } = useTheme();
  const isDarkMode = currentTheme === "dark";

  // Calculate dynamic dimensions based on screen width
  const featuredCardWidth = isExtraLargeDevice
    ? width * 0.22
    : isLargeDevice
    ? width * 0.38
    : isMediumDevice
    ? width * 0.7
    : width * 0.8;

  const featuredCardHeight = isExtraLargeDevice
    ? 260
    : isLargeDevice
    ? 220
    : isMediumDevice
    ? 200
    : 180;

  const workoutCardImageWidth = isExtraLargeDevice
    ? "30%"
    : isLargeDevice
    ? "35%"
    : "38%";

  const contentPadding = isExtraLargeDevice
    ? 32
    : isLargeDevice
    ? 24
    : isMediumDevice
    ? 18
    : 16;

  const fontSize = {
    title: isLargeDevice ? "text-2xl" : isSmallDevice ? "text-lg" : "text-xl",
    subtitle: isLargeDevice
      ? "text-xl"
      : isSmallDevice
      ? "text-base"
      : "text-lg",
    body: isLargeDevice ? "text-base" : isSmallDevice ? "text-xs" : "text-sm",
    small: isLargeDevice ? "text-sm" : "text-xs",
  };

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successWorkout, setSuccessWorkout] = useState<any>(null);

  const featuredWorkouts = workouts.filter((workout) => workout.isFeatured);

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesCategory =
      selectedCategory === "all" || workout.category === selectedCategory;
    return matchesCategory;
  });

  const handleOpenMenu = (workout: any, e: any) => {
    e.stopPropagation();
    setSelectedWorkout(workout);
    setMenuVisible(true);
  };

  const handleAddToToday = async () => {
    try {
      // Get the current user
      const user = await getUser();
      if (!user) {
        setMenuVisible(false);
        Alert.alert("Error", "You need to be logged in to add workouts");
        return;
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Schedule the workout for today
      const result = await scheduleWorkout(user.id, selectedWorkout.id, today);

      // Close the menu
      setMenuVisible(false);

      if (result.success) {
        // Show success message
        setSuccessWorkout(selectedWorkout);
        setSuccessModalVisible(true);

        // Auto-hide after 3 seconds
        setTimeout(() => {
          setSuccessModalVisible(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error adding workout to today:", error);
      setMenuVisible(false);
      Alert.alert("Error", "Failed to add workout. Please try again.");
    }
  };

  const renderDifficultyBadge = (difficulty: string) => {
    let bgColor = "";
    let textColor = "";

    switch (difficulty) {
      case "Beginner":
        bgColor = isDarkMode ? "#064E3B" : "#D1FAE5";
        textColor = isDarkMode ? "#10B981" : "#065F46";
        break;
      case "Intermediate":
        bgColor = isDarkMode ? "#1E3A8A" : "#DBEAFE";
        textColor = isDarkMode ? "#3B82F6" : "#1E40AF";
        break;
      case "Advanced":
        bgColor = isDarkMode ? "#7F1D1D" : "#FEE2E2";
        textColor = isDarkMode ? "#EF4444" : "#B91C1C";
        break;
      default:
        bgColor = isDarkMode ? "#1F2937" : "#F3F4F6";
        textColor = isDarkMode ? "#D1D5DB" : "#4B5563";
    }

    return (
      <View
        className="px-2 py-1 rounded-full"
        style={{ backgroundColor: bgColor }}
      >
        <Text className="text-xs font-semibold" style={{ color: textColor }}>
          {difficulty}
        </Text>
      </View>
    );
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
          headerShown: false,
        }}
      />

      <View className="flex-1">
        {/* Header */}
        <View
          className="flex-row items-center justify-between border-b"
          style={{
            borderBottomColor: isDarkMode
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.05)",
            backgroundColor: colors.card,
            paddingHorizontal: contentPadding,
            paddingVertical: contentPadding * 0.8,
            marginTop: Platform.OS === "ios" ? 20 : 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.push("/plan")}
              className="p-2 mr-3 rounded-full"
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(139, 92, 246, 0.15)"
                  : "rgba(99, 102, 241, 0.08)",
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.8}
            >
              <ArrowLeft
                size={isSmallDevice ? 20 : 22}
                color={isDarkMode ? "#8B5CF6" : "#6366F1"}
              />
            </TouchableOpacity>
            <Text
              className="font-bold"
              style={{
                color: colors.text,
                fontSize: isSmallDevice ? 22 : 24,
                letterSpacing: -0.7,
              }}
            >
              Workout Library
            </Text>
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ color: colors.text, marginTop: 10 }}>
              Loading workouts...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View className="flex-1 justify-center items-center p-4">
            <Text
              style={{ color: "red", marginBottom: 10, textAlign: "center" }}
            >
              {error}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.accent,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
              onPress={() => {
                setIsLoading(true);
                setError(null);
                // Refetch the workouts
                getWorkouts()
                  .then((workoutsData) => {
                    const formattedWorkouts: Workout[] = workoutsData.map(
                      (workout) => ({
                        id: workout.id,
                        title: workout.title,
                        duration: `${workout.duration} mins`,
                        calories: workout.calories.toString(),
                        difficulty: workout.difficulty,
                        category: workout.category || "other",
                        rating: 4.8,
                        reviews: 100,
                        imageUrl: workout.image_url,
                        trainer: "Fitness Coach",
                        description: workout.description,
                        isFeatured: Math.random() > 0.7,
                      })
                    );
                    setWorkouts(formattedWorkouts);
                    setIsLoading(false);
                  })
                  .catch((err) => {
                    console.error("Error fetching workouts:", err);
                    setError("Failed to load workouts. Please try again.");
                    setIsLoading(false);
                  });
              }}
            >
              <Text style={{ color: "#fff" }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content when loaded successfully */}
        {!isLoading && !error && (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 100,
              ...(isExtraLargeDevice && {
                maxWidth: 1200,
                alignSelf: "center",
                width: "100%",
              }),
            }}
          >
            {/* Featured Workouts */}
            {featuredWorkouts.length > 0 && (
              <View className="mb-8">
                <View
                  className="flex-row justify-between items-center pb-3"
                  style={{
                    paddingTop: contentPadding + 10,
                    paddingHorizontal: contentPadding,
                  }}
                >
                  <Text
                    className={`font-bold ${fontSize.subtitle}`}
                    style={{
                      color: colors.text,
                      letterSpacing: -0.7,
                      fontSize: isSmallDevice ? 20 : 22,
                    }}
                  >
                    Featured Workouts
                  </Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDarkMode
                        ? "rgba(139, 92, 246, 0.15)"
                        : "rgba(139, 92, 246, 0.1)",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 14,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={fontSize.body}
                      style={{
                        color: isDarkMode ? "#A78BFA" : "#7C3AED",
                        fontWeight: "600",
                      }}
                    >
                      See All
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingLeft: contentPadding,
                    paddingRight: contentPadding / 2,
                    paddingTop: 4,
                  }}
                  className="pb-2"
                >
                  {featuredWorkouts.map((workout) => (
                    <TouchableOpacity
                      key={workout.id}
                      className="mr-4 rounded-3xl overflow-hidden"
                      style={{
                        width: featuredCardWidth,
                        height: featuredCardHeight,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 6,
                        position: "relative",
                      }}
                      onPress={() => router.push(`/workout/${workout.id}`)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: workout.imageUrl }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 24,
                        }}
                        resizeMode="cover"
                      />

                      {/* Three dots menu button - absolute positioned on top-right */}
                      <TouchableOpacity
                        style={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          backgroundColor: "rgba(0,0,0,0.6)",
                          borderRadius: 20,
                          width: 40,
                          height: 40,
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 10,
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.15)",
                        }}
                        onPress={(e) => handleOpenMenu(workout, e)}
                        activeOpacity={0.7}
                      >
                        <MoreVertical size={18} color="#FFFFFF" />
                      </TouchableOpacity>

                      <LinearGradient
                        colors={[
                          "transparent",
                          "rgba(0,0,0,0.85)",
                          "rgba(0,0,0,0.95)",
                        ]}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: "70%",
                          padding: isSmallDevice ? 18 : 24,
                          justifyContent: "flex-end",
                          borderRadius: 24,
                        }}
                      >
                        <View
                          className="px-3 py-1.5 rounded-full self-start mb-3"
                          style={{
                            backgroundColor: isDarkMode
                              ? "rgba(139, 92, 246, 0.3)"
                              : "rgba(139, 92, 246, 0.2)",
                            borderWidth: 1,
                            borderColor: isDarkMode
                              ? "rgba(139, 92, 246, 0.5)"
                              : "rgba(139, 92, 246, 0.3)",
                          }}
                        >
                          <Text
                            className={`font-semibold ${fontSize.small}`}
                            style={{
                              color: isDarkMode ? "#D8B4FE" : "#7C3AED",
                            }}
                          >
                            {
                              workoutCategories.find(
                                (cat) => cat.id === workout.category
                              )?.name
                            }
                          </Text>
                        </View>
                        <Text
                          className={`text-white font-bold mb-2 ${
                            isSmallDevice ? "text-base" : "text-xl"
                          }`}
                          style={{ letterSpacing: -0.5 }}
                        >
                          {workout.title}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <Text
                            className={`text-white opacity-90 ${fontSize.small}`}
                          >
                            {workout.trainer}
                          </Text>
                          <View className="flex-row items-center bg-black bg-opacity-40 px-3 py-1.5 rounded-full border border-gray-800">
                            <Text
                              className={`text-white font-medium ${fontSize.small}`}
                            >
                              {workout.duration}
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Category Filter */}
            <View
              className="mb-8"
              style={{ paddingHorizontal: contentPadding }}
            >
              <Text
                className={`font-bold mb-5`}
                style={{
                  color: colors.text,
                  letterSpacing: -0.7,
                  fontSize: isSmallDevice ? 20 : 22,
                }}
              >
                Categories
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="pb-2"
                contentContainerStyle={{
                  paddingVertical: 4,
                }}
              >
                {workoutCategories.map((category) => {
                  const isSelected = selectedCategory === category.id;

                  return (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => setSelectedCategory(category.id)}
                      className="mr-3 flex-row items-center"
                      style={{
                        backgroundColor: isSelected
                          ? isDarkMode
                            ? "#5B21B6"
                            : "#8B5CF6"
                          : isDarkMode
                          ? "#1F2937"
                          : "#F9FAFB",
                        borderWidth: 1,
                        borderColor: isSelected
                          ? isDarkMode
                            ? "#7C3AED"
                            : "#8B5CF6"
                          : isDarkMode
                          ? "#374151"
                          : "#E5E7EB",
                        borderRadius: 18,
                        paddingHorizontal: isSmallDevice ? 16 : 20,
                        paddingVertical: isSmallDevice ? 10 : 14,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: isSelected ? 3 : 1 },
                        shadowOpacity: isSelected ? 0.2 : 0.1,
                        shadowRadius: isSelected ? 4 : 2,
                        elevation: isSelected ? 3 : 1,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        className="font-semibold"
                        style={{
                          color: isSelected
                            ? "#FFFFFF"
                            : isDarkMode
                            ? "#E5E7EB"
                            : "#1F2937",
                          fontSize: isSmallDevice ? 13 : 15,
                        }}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Workout List */}
            <View style={{ paddingHorizontal: contentPadding }}>
              <Text
                className={`font-bold mb-6`}
                style={{
                  color: colors.text,
                  letterSpacing: -0.7,
                  fontSize: isSmallDevice ? 20 : 22,
                }}
              >
                {selectedCategory === "all"
                  ? "All Workouts"
                  : `${
                      workoutCategories.find(
                        (cat) => cat.id === selectedCategory
                      )?.name
                    } Workouts`}
              </Text>

              {filteredWorkouts.length === 0 ? (
                <View className="items-center justify-center py-10">
                  <Text
                    className="text-center"
                    style={{
                      color: colors.secondaryText,
                      fontSize: isSmallDevice ? 14 : 16,
                    }}
                  >
                    No workouts found. Try adjusting your filters.
                  </Text>
                </View>
              ) : (
                <View
                  className={
                    isExtraLargeDevice
                      ? "flex-row flex-wrap justify-between"
                      : ""
                  }
                >
                  {filteredWorkouts.map((workout) => (
                    <TouchableOpacity
                      key={workout.id}
                      className={`mb-6 rounded-3xl overflow-hidden`}
                      style={{
                        backgroundColor: colors.card,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 5,
                        ...(isExtraLargeDevice && { width: "49%" }),
                        borderWidth: 1,
                        borderColor: isDarkMode
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.03)",
                      }}
                      onPress={() => router.push(`/workout/${workout.id}`)}
                      activeOpacity={0.85}
                    >
                      <View
                        className="flex-row"
                        style={{
                          height: isExtraLargeDevice
                            ? 180
                            : isLargeDevice
                            ? 160
                            : isMediumDevice
                            ? 150
                            : 140,
                        }}
                      >
                        {/* Workout Image */}
                        <View
                          style={{
                            width: workoutCardImageWidth,
                            position: "relative",
                          }}
                        >
                          <Image
                            source={{ uri: workout.imageUrl }}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderTopLeftRadius: 24,
                              borderBottomLeftRadius: 24,
                            }}
                            resizeMode="cover"
                          />
                        </View>

                        {/* Workout Details */}
                        <View
                          className="flex-1 justify-between"
                          style={{
                            padding: isSmallDevice ? 16 : 20,
                          }}
                        >
                          <View>
                            <View className="flex-row items-center justify-between mb-3">
                              <View className="flex-row items-center">
                                {renderDifficultyBadge(workout.difficulty)}
                                <View
                                  className="rounded-full ml-2"
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? "rgba(139, 92, 246, 0.2)"
                                      : "rgba(139, 92, 246, 0.1)",
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderWidth: 1,
                                    borderColor: isDarkMode
                                      ? "rgba(139, 92, 246, 0.3)"
                                      : "rgba(139, 92, 246, 0.15)",
                                  }}
                                >
                                  <Text
                                    className="font-medium"
                                    style={{
                                      color: isDarkMode ? "#C4B5FD" : "#7C3AED",
                                      fontSize: isSmallDevice ? 10 : 12,
                                    }}
                                  >
                                    {
                                      workoutCategories.find(
                                        (cat) => cat.id === workout.category
                                      )?.name
                                    }
                                  </Text>
                                </View>
                              </View>

                              {/* Three dots menu button */}
                              <TouchableOpacity
                                onPress={(e) => handleOpenMenu(workout, e)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 16,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: isDarkMode
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.03)",
                                }}
                                activeOpacity={0.7}
                                hitSlop={{
                                  top: 10,
                                  right: 10,
                                  bottom: 10,
                                  left: 10,
                                }}
                              >
                                <MoreVertical
                                  size={isSmallDevice ? 16 : 18}
                                  color={colors.secondaryText}
                                />
                              </TouchableOpacity>
                            </View>

                            <Text
                              className="font-bold mb-1"
                              style={{
                                color: colors.text,
                                fontSize: isSmallDevice ? 15 : 17,
                                letterSpacing: -0.5,
                              }}
                            >
                              {workout.title}
                            </Text>

                            <Text
                              className="mb-2"
                              style={{
                                color: colors.secondaryText,
                                fontSize: isSmallDevice ? 12 : 14,
                              }}
                            >
                              {workout.trainer}
                            </Text>
                          </View>

                          <View className="flex-row justify-between items-center mt-1">
                            <View className="flex-row">
                              <View
                                className="flex-row items-center mr-3 bg-opacity-5"
                                style={{
                                  backgroundColor: isDarkMode
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.05)",
                                  paddingHorizontal: 8,
                                  paddingVertical: 5,
                                  borderRadius: 12,
                                  borderWidth: 1,
                                  borderColor: isDarkMode
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.03)",
                                }}
                              >
                                <Clock
                                  size={isSmallDevice ? 12 : 14}
                                  color={isDarkMode ? "#A1A1AA" : "#71717A"}
                                />
                                <Text
                                  className="ml-1 font-medium"
                                  style={{
                                    color: isDarkMode ? "#D4D4D8" : "#52525B",
                                    fontSize: isSmallDevice ? 10 : 12,
                                  }}
                                >
                                  {workout.duration}
                                </Text>
                              </View>
                              <View
                                className="flex-row items-center bg-opacity-5"
                                style={{
                                  backgroundColor: isDarkMode
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.05)",
                                  paddingHorizontal: 8,
                                  paddingVertical: 5,
                                  borderRadius: 12,
                                  borderWidth: 1,
                                  borderColor: isDarkMode
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.03)",
                                }}
                              >
                                <Flame
                                  size={isSmallDevice ? 12 : 14}
                                  color={isDarkMode ? "#A1A1AA" : "#71717A"}
                                />
                                <Text
                                  className="ml-1 font-medium"
                                  style={{
                                    color: isDarkMode ? "#D4D4D8" : "#52525B",
                                    fontSize: isSmallDevice ? 10 : 12,
                                  }}
                                >
                                  {workout.calories} cal
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Bottom Navigation */}
        <View className="absolute bottom-0 left-0 right-0">
          <BottomNavigation activeTab="plan" />
        </View>
      </View>

      {/* Popup Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              width: "80%",
              maxWidth: 320,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 10,
              borderWidth: 1,
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.03)",
            }}
          >
            {selectedWorkout && (
              <>
                <View
                  style={{
                    padding: 24,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 20,
                      fontWeight: "700",
                      textAlign: "center",
                      letterSpacing: -0.5,
                    }}
                  >
                    {selectedWorkout.title}
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 18,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  }}
                  onPress={handleAddToToday}
                  activeOpacity={0.7}
                >
                  <Calendar
                    size={22}
                    color={isDarkMode ? "#A78BFA" : "#6366F1"}
                    style={{ marginRight: 14 }}
                  />
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "500",
                    }}
                  >
                    Add to Today's Workout
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 18,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  }}
                  onPress={() => {
                    setMenuVisible(false);
                    Alert.alert("Bookmark", "Workout saved to your bookmarks");
                  }}
                  activeOpacity={0.7}
                >
                  <Bookmark
                    size={22}
                    color={isDarkMode ? "#A78BFA" : "#6366F1"}
                    style={{ marginRight: 14 }}
                  />
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "500",
                    }}
                  >
                    Save to Bookmarks
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 18,
                  }}
                  onPress={() => {
                    setMenuVisible(false);
                    Alert.alert("Share", "Sharing workout");
                  }}
                  activeOpacity={0.7}
                >
                  <Share2
                    size={22}
                    color={isDarkMode ? "#A78BFA" : "#6366F1"}
                    style={{ marginRight: 14 }}
                  />
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "500",
                    }}
                  >
                    Share Workout
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setSuccessModalVisible(false)}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              width: "80%",
              maxWidth: 320,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 10,
              borderWidth: 1,
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.03)",
            }}
          >
            {successWorkout && (
              <>
                <View
                  style={{
                    padding: 24,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: "600",
                      textAlign: "center",
                      letterSpacing: -0.5,
                    }}
                  >
                    {successWorkout.title} has been added to today's workouts!
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 18,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  }}
                  onPress={() => {
                    setSuccessModalVisible(false);
                    router.push("/plan");
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: isDarkMode ? "#A78BFA" : "#6366F1",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    View Workouts
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
