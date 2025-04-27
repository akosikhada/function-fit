import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import {
  ChevronLeft,
  Clock,
  Flame,
  BarChart3,
  Play,
  Download,
  Share2,
  MoreVertical,
  AlertCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ThemeModule from "../utils/theme";
import { getWorkoutById } from "../utils/supabase";

const { useTheme } = ThemeModule;

// Define types for the workout
interface Exercise {
  id: string;
  name: string;
  duration: string;
  sets: number;
  reps: string;
  rest: string;
  description?: string;
}

interface WorkoutData {
  id: string;
  title: string;
  description: string;
  duration: string;
  calories: string;
  level: string;
  imageUrl: string;
  exercises: Exercise[];
}

// Fallback workout data if API fails
const fallbackWorkouts: Record<string, WorkoutData> = {
  "1": {
    id: "1",
    title: "Full Body Strength",
    description:
      "A comprehensive strength training workout that targets all major muscle groups, designed to build muscle and improve overall fitness.",
    duration: "45 mins",
    calories: "350 cal",
    level: "Intermediate",
    imageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80",
    exercises: [
      {
        id: "1",
        name: "Bodyweight Squats",
        duration: "60 sec",
        description:
          "Stand with feet shoulder-width apart, lower your body until thighs are parallel to the floor, then push back up.",
        sets: 3,
        reps: "15 reps",
        rest: "30 sec rest",
      },
      {
        id: "2",
        name: "Push-ups",
        duration: "60 sec",
        description:
          "Start in plank position, lower your body until your chest nearly touches the floor, then push back up.",
        sets: 3,
        reps: "12 reps",
        rest: "30 sec rest",
      },
      {
        id: "3",
        name: "Dumbbell Rows",
        duration: "60 sec",
        description:
          "Bend at waist with dumbbell in one hand, pull weight up to side of body while keeping back straight.",
        sets: 3,
        reps: "10 reps each arm",
        rest: "30 sec rest",
      },
      {
        id: "4",
        name: "Glute Bridges",
        duration: "60 sec",
        description:
          "Lie on back with knees bent, lift hips toward ceiling by squeezing glutes, then lower back down.",
        sets: 3,
        reps: "15 reps",
        rest: "30 sec rest",
      },
      {
        id: "5",
        name: "Plank",
        duration: "45 sec",
        description:
          "Hold your body in a straight line from head to heels, engaging your core throughout.",
        sets: 3,
        reps: "45 sec hold",
        rest: "30 sec rest",
      },
      {
        id: "6",
        name: "Lateral Lunges",
        duration: "60 sec",
        description:
          "Step to the side into a lunge position, keeping the other leg straight, then return to starting position.",
        sets: 3,
        reps: "10 reps each side",
        rest: "30 sec rest",
      },
      {
        id: "7",
        name: "Tricep Dips",
        duration: "60 sec",
        description:
          "Using a chair or bench, lower your body by bending your elbows, then push back up.",
        sets: 3,
        reps: "12 reps",
        rest: "30 sec rest",
      },
    ],
  },

  "2": {
    id: "2",
    title: "Core Crusher",
    description:
      "Focus on strengthening your core with this targeted ab workout that will help build definition and stability.",
    duration: "20 mins",
    calories: "220 cal",
    level: "Beginner",
    imageUrl:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80",
    exercises: [
      {
        id: "8",
        name: "Crunches",
        duration: "45 sec",
        description:
          "Sit up with your back straight, then lower back down to the starting position.",
        sets: 1,
        reps: "45 sec",
        rest: "15 sec rest",
      },
      {
        id: "9",
        name: "Plank",
        duration: "45 sec",
        description:
          "Hold your body in a straight line from head to heels, then rest.",
        sets: 1,
        reps: "45 sec",
        rest: "15 sec rest",
      },
      {
        id: "10",
        name: "Russian Twists",
        duration: "45 sec",
        description:
          "Sit up with your back straight, then lower back down to the starting position.",
        sets: 1,
        reps: "45 sec",
        rest: "15 sec rest",
      },
      {
        id: "11",
        name: "Leg Raises",
        duration: "45 sec",
        description:
          "Sit up with your back straight, then lower back down to the starting position.",
        sets: 1,
        reps: "45 sec",
        rest: "15 sec rest",
      },
      {
        id: "12",
        name: "Mountain Climbers",
        duration: "45 sec",
        description:
          "Simulate climbing a mountain by driving your knees into your chest, then switching legs.",
        sets: 1,
        reps: "45 sec",
        rest: "15 sec rest",
      },
      {
        id: "13",
        name: "Bicycle Crunches",
        duration: "45 sec",
        description:
          "Sit up with your back straight, then lower back down to the starting position.",
        sets: 1,
        reps: "45 sec",
        rest: "15 sec rest",
      },
    ],
  },

  "5": {
    id: "5",
    title: "Gentle Yoga Flow",
    description:
      "A calming yoga sequence designed to increase flexibility, reduce stress, and improve mind-body connection. Perfect for beginners and those looking for a restorative practice.",
    duration: "45 mins",
    calories: "180 cal",
    level: "Beginner",
    imageUrl:
      "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&q=80",
    exercises: [
      {
        id: "y1",
        name: "Mountain Pose (Tadasana)",
        duration: "60 sec",
        sets: 1,
        reps: "Hold for 60 seconds",
        rest: "10 sec rest",
        description:
          "Stand tall, grounding through feet, arms at sides, palms forward, gaze forward. Focus on alignment and steady breathing.",
      },
      {
        id: "y2",
        name: "Standing Forward Fold",
        duration: "60 sec",
        sets: 1,
        reps: "Hold for 60 seconds",
        rest: "10 sec rest",
        description:
          "Fold forward from hips, lengthening spine, bringing hands beside feet. Keep slight bend in knees if needed.",
      },
      {
        id: "y3",
        name: "Cat-Cow Stretch",
        duration: "90 sec",
        sets: 1,
        reps: "15 breaths",
        rest: "10 sec rest",
        description:
          "Alternate between arching (cow) and rounding (cat) spine on hands and knees, moving with breath.",
      },
      {
        id: "y4",
        name: "Downward-Facing Dog",
        duration: "60 sec",
        sets: 1,
        reps: "Hold for 60 seconds",
        rest: "10 sec rest",
        description:
          "Form inverted V with body, hands shoulder-width apart, feet hip-width apart, pushing heels toward floor.",
      },
      {
        id: "y5",
        name: "Warrior I",
        duration: "60 sec",
        sets: 1,
        reps: "30 sec each side",
        rest: "10 sec rest",
        description:
          "Lunge forward with one leg, back foot at angle, arms overhead, hips facing forward, chest proud.",
      },
      {
        id: "y6",
        name: "Warrior II",
        duration: "60 sec",
        sets: 1,
        reps: "30 sec each side",
        rest: "10 sec rest",
        description:
          "Stride with feet wide apart, front knee bent, arms extended parallel to floor, gaze over front hand.",
      },
      {
        id: "y7",
        name: "Triangle Pose",
        duration: "60 sec",
        sets: 1,
        reps: "30 sec each side",
        rest: "10 sec rest",
        description:
          "From wide stance, extend sideways, reaching one hand to shin/ankle/block, other arm up, creating triangle shape.",
      },
      {
        id: "y8",
        name: "Tree Pose",
        duration: "60 sec",
        sets: 1,
        reps: "30 sec each side",
        rest: "10 sec rest",
        description:
          "Balance on one leg, other foot on inner thigh (avoid knee), hands in prayer or extended overhead.",
      },
      {
        id: "y9",
        name: "Bridge Pose",
        duration: "60 sec",
        sets: 1,
        reps: "3 sets of 15-20 sec holds",
        rest: "10 sec rest",
        description:
          "Lie on back, knees bent, lift hips, creating bridge with body, shoulders grounded, engage glutes.",
      },
      {
        id: "y10",
        name: "Child's Pose",
        duration: "60 sec",
        sets: 1,
        reps: "Hold for 60 seconds",
        rest: "10 sec rest",
        description:
          "Kneel and fold forward, arms extended or beside body, forehead to mat, gentle hip opening.",
      },
      {
        id: "y11",
        name: "Corpse Pose (Savasana)",
        duration: "180 sec",
        sets: 1,
        reps: "Hold for 3 minutes",
        rest: "0 sec rest",
        description:
          "Lie flat on back, arms and legs splayed, palms up, completely relax body and mind for deep rest.",
      },
    ],
  },

  "6": {
    id: "6",
    title: "Pilates Core Essentials",
    description:
      "Build core strength, improve posture and enhance flexibility with this focused Pilates workout suitable for all levels.",
    duration: "40 mins",
    calories: "200 cal",
    level: "Intermediate",
    imageUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
    exercises: [
      {
        id: "p1",
        name: "Hundred",
        duration: "60 sec",
        sets: 1,
        reps: "100 pumps",
        rest: "15 sec rest",
        description:
          "Lie on back, head and shoulders lifted, legs raised and bent at 90 degrees, pump arms up and down while breathing rhythmically.",
      },
      {
        id: "p2",
        name: "Roll Up",
        duration: "45 sec",
        sets: 1,
        reps: "8 reps",
        rest: "15 sec rest",
        description:
          "Lie flat with arms extended overhead, slowly roll up vertebra by vertebra, reaching for toes, then roll back down with control.",
      },
      {
        id: "p3",
        name: "Single Leg Circles",
        duration: "60 sec",
        sets: 1,
        reps: "10 circles each leg",
        rest: "15 sec rest",
        description:
          "Lie on back, one leg extended to ceiling, circle leg in precise, controlled movements, 5 in each direction.",
      },
      {
        id: "p4",
        name: "Rolling Like a Ball",
        duration: "45 sec",
        sets: 1,
        reps: "8-10 rolls",
        rest: "15 sec rest",
        description:
          "Sit in balanced C-curve, feet off floor, hands holding behind knees. Roll back to shoulders and return without momentum.",
      },
      {
        id: "p5",
        name: "Single Leg Stretch",
        duration: "60 sec",
        sets: 1,
        reps: "10 reps each leg",
        rest: "15 sec rest",
        description:
          "Lying with head and shoulders lifted, alternate extending one leg while hugging the other to chest.",
      },
      {
        id: "p6",
        name: "Double Leg Stretch",
        duration: "60 sec",
        sets: 1,
        reps: "10 reps",
        rest: "15 sec rest",
        description:
          "Curl up with knees to chest, arms hugging legs, then extend arms and legs outward in synchronized movement.",
      },
      {
        id: "p7",
        name: "Spine Stretch Forward",
        duration: "45 sec",
        sets: 1,
        reps: "5 reps",
        rest: "15 sec rest",
        description:
          "Sit tall with legs extended, reach forward articulating through spine, creating C-curve, return to start with control.",
      },
      {
        id: "p8",
        name: "Saw",
        duration: "45 sec",
        sets: 1,
        reps: "5 reps each side",
        rest: "15 sec rest",
        description:
          "Sit with legs wide apart, twist torso and reach opposite hand to outside of foot, pulsing three times.",
      },
      {
        id: "p9",
        name: "Swan Dive",
        duration: "45 sec",
        sets: 1,
        reps: "5 reps",
        rest: "15 sec rest",
        description:
          "Lie face down, press upper body up into backbend, then rock forward and back on torso with control.",
      },
      {
        id: "p10",
        name: "Side Kick Series",
        duration: "90 sec",
        sets: 1,
        reps: "10 reps each movement",
        rest: "15 sec rest",
        description:
          "Lying on side with body in straight line, perform series of precise leg movements to target outer thighs and hips.",
      },
      {
        id: "p11",
        name: "Teaser",
        duration: "60 sec",
        sets: 1,
        reps: "5 reps",
        rest: "15 sec rest",
        description:
          "Advanced move where body creates V-shape, balancing on sits bones with legs and torso lifted, arms parallel to legs.",
      },
      {
        id: "p12",
        name: "Pilates Push-Up",
        duration: "45 sec",
        sets: 1,
        reps: "5 reps",
        rest: "15 sec rest",
        description:
          "Standing roll down to plank, perform push-up with elbows close to body, then return to standing with controlled roll-up.",
      },
    ],
  },
};

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme: currentTheme, colors } = useTheme();
  const isDarkMode = currentTheme === "dark";
  const [isOffline, setIsOffline] = useState(true);
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Fetch workout data from Supabase
  React.useEffect(() => {
    const fetchWorkout = async () => {
      try {
        setIsOffline(false);

        // Map numeric IDs to proper UUID format
        let workoutId = id || "1";

        // Check if ID is just a number without UUID format
        if (/^\d+$/.test(workoutId)) {
          // Convert simple numeric IDs to proper UUID format
          workoutId = `00000000-0000-0000-0000-00000000000${workoutId}`;
        }

        // Get workout data from Supabase
        const workoutData = await getWorkoutById(workoutId);

        // Log the exercise data structure to understand the issue
        console.log(
          "Raw workout exercises:",
          workoutData?.exercises?.length || 0
        );

        let cleanedExercises: Exercise[] = [];

        // Create a more robust deduplication system
        if (workoutData && workoutData.exercises) {
          // Create a Map to deduplicate by exercise ID
          const uniqueExercises = new Map();

          // Directly check the structure in case it's nested
          if (Array.isArray(workoutData.exercises)) {
            for (const exercise of workoutData.exercises) {
              // Skip if we already have this exercise ID
              if (uniqueExercises.has(exercise.id)) continue;

              // Map the exercise properties directly to ensure clean data
              uniqueExercises.set(exercise.id, {
                id: exercise.id,
                name: exercise.name,
                duration: exercise.duration || "45 sec",
                description: exercise.description || "",
                sets: exercise.sets || 1,
                reps: exercise.reps || exercise.duration || "45 sec",
                rest: exercise.rest || "15 sec rest",
              });
            }
          }

          cleanedExercises = Array.from(uniqueExercises.values());
          console.log("After deduplication: " + cleanedExercises.length);
        }

        // Use fallback data for specific workouts if needed
        if (
          cleanedExercises.length === 0 &&
          fallbackWorkouts[workoutId] &&
          fallbackWorkouts[workoutId].exercises
        ) {
          console.log("Using fallback exercises from matching workout ID");
          cleanedExercises = fallbackWorkouts[workoutId].exercises;
        } else if (
          cleanedExercises.length === 0 &&
          fallbackWorkouts[id || "1"]
        ) {
          console.log("Using generic fallback exercises");
          cleanedExercises = fallbackWorkouts[id || "1"].exercises;
        }

        console.log("Final exercise count:", cleanedExercises.length);

        // Format the workout data
        const formattedWorkout: WorkoutData = {
          id: workoutData.id,
          title: workoutData.title,
          description: workoutData.description || "",
          duration: workoutData.duration || "Unknown",
          calories: workoutData.calories || "Unknown",
          level: workoutData.difficulty || "Beginner",
          imageUrl:
            workoutData.image_url ||
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
          exercises: cleanedExercises,
        };

        // Set the workout data
        setWorkout(formattedWorkout);
      } catch (err) {
        console.error("Error fetching workout:", err);
        // Use fallback data if API fails
        setWorkout(fallbackWorkouts[id || "1"] || fallbackWorkouts["1"]);
        setIsOffline(true);
      }
    };

    fetchWorkout();
  }, [id]);

  // Use fallback data while loading
  const currentWorkout: WorkoutData =
    workout || fallbackWorkouts[id || "1"] || fallbackWorkouts["1"];

  // Use only the unique exercises
  const uniqueExercises = useMemo(() => {
    if (!currentWorkout.exercises) return [];

    // Use a Set to keep track of exercise IDs we've seen
    const seenIds = new Set<string>();
    const unique: Exercise[] = [];

    // Only add exercises if we haven't seen their ID before
    for (const exercise of currentWorkout.exercises) {
      if (!seenIds.has(exercise.id)) {
        seenIds.add(exercise.id);
        unique.push(exercise);
      }
    }

    return unique;
  }, [currentWorkout.exercises]);

  // Function to toggle exercise description visibility
  const toggleExerciseDescription = (exerciseId: string) => {
    if (expandedExercise === exerciseId) {
      setExpandedExercise(null);
    } else {
      setExpandedExercise(exerciseId);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Main content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={{ position: "relative", height: 280 }}>
          <Image
            source={{ uri: currentWorkout.imageUrl }}
            style={{
              width: "100%",
              height: "100%",
            }}
            resizeMode="cover"
          />

          <LinearGradient
            colors={["rgba(0,0,0,0.7)", "transparent", "rgba(0,0,0,0.85)"]}
            locations={[0, 0.3, 1]}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
          />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 22,
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>

          {/* Title and details overlay */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 20,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 30,
                fontWeight: "700",
                marginBottom: 12,
                textShadowColor: "rgba(0,0,0,0.5)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
                letterSpacing: -0.5,
              }}
            >
              {currentWorkout.title}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 18,
                  backgroundColor: "rgba(0,0,0,0.4)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <Clock size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text
                  style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500" }}
                >
                  {currentWorkout.duration}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 18,
                  backgroundColor: "rgba(0,0,0,0.4)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <Flame size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text
                  style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500" }}
                >
                  {currentWorkout.calories}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(0,0,0,0.4)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <BarChart3
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500" }}
                >
                  {currentWorkout.level}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Warning banner for offline mode */}
        {isOffline && (
          <View
            style={{
              backgroundColor: isDarkMode
                ? "rgba(253, 186, 116, 0.2)"
                : "rgba(255, 237, 213, 1)",
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 0,
              marginBottom: 4,
            }}
          >
            <AlertCircle
              size={18}
              color={isDarkMode ? "#FCD34D" : "#D97706"}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                color: isDarkMode ? "#FCD34D" : "#D97706",
                flex: 1,
                fontSize: 13,
              }}
            >
              Could not load workout data from server. Using offline data.
            </Text>
          </View>
        )}

        {/* Workout description */}
        <View style={{ padding: 20 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              lineHeight: 24,
              marginBottom: 24,
              opacity: 0.9,
            }}
          >
            {currentWorkout.description}
          </Text>
        </View>

        {/* Exercises Section */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 22,
              fontWeight: "700",
              marginBottom: 16,
              letterSpacing: -0.5,
            }}
          >
            Exercises
          </Text>

          {/* Exercise list - USING the uniqueExercises from useMemo */}
          {uniqueExercises.map((exercise, index) => (
            <TouchableOpacity
              key={exercise.id}
              style={{
                marginBottom: 16,
                padding: 16,
                backgroundColor: isDarkMode ? colors.card : "#FFFFFF",
                borderRadius: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkMode ? 0.2 : 0.1,
                shadowRadius: 4,
                elevation: 3,
                borderWidth: 1,
                borderColor: isDarkMode
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              }}
              onPress={() => toggleExerciseDescription(exercise.id)}
              activeOpacity={0.9}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Exercise number circle */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isDarkMode ? "#4338CA" : "#8B5CF6",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 18,
                      fontWeight: "600",
                    }}
                  >
                    {index + 1}
                  </Text>
                </View>

                {/* Exercise details */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 17,
                      fontWeight: "600",
                      marginBottom: 4,
                      letterSpacing: -0.3,
                    }}
                  >
                    {exercise.name}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <View
                      style={{
                        backgroundColor: isDarkMode
                          ? "rgba(139, 92, 246, 0.15)"
                          : "rgba(139, 92, 246, 0.1)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginRight: 8,
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: isDarkMode ? "#C4B5FD" : "#7C3AED",
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                      >
                        {exercise.sets > 1 ? `${exercise.sets} sets` : `1 set`}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: isDarkMode
                          ? "rgba(139, 92, 246, 0.15)"
                          : "rgba(139, 92, 246, 0.1)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginRight: 8,
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: isDarkMode ? "#C4B5FD" : "#7C3AED",
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                      >
                        {exercise.reps}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: isDarkMode
                          ? "rgba(139, 92, 246, 0.15)"
                          : "rgba(139, 92, 246, 0.1)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: isDarkMode ? "#C4B5FD" : "#7C3AED",
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                      >
                        {exercise.rest}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Exercise description (expandable) */}
              {expandedExercise === exercise.id && exercise.description && (
                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: isDarkMode
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  }}
                >
                  <Text
                    style={{
                      color: colors.secondaryText,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {exercise.description}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Start workout button - with extra padding for safe area */}
        <View style={{ padding: 20, paddingBottom: 32 }}>
          <TouchableOpacity
            style={{
              backgroundColor: isDarkMode ? "#7C3AED" : "#6366F1",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDarkMode ? 0.4 : 0.2,
              shadowRadius: 6,
              elevation: 5,
            }}
            onPress={() =>
              router.push(`/workout-player/${currentWorkout.id}` as any)
            }
            activeOpacity={0.8}
          >
            <Play size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "700",
                letterSpacing: -0.3,
              }}
            >
              Start Workout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action bar at bottom */}
      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: isDarkMode
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.05)",
          padding: 16,
          backgroundColor: colors.card,
          paddingBottom: Platform.OS === "ios" ? 24 : 16,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            paddingVertical: 8,
          }}
          activeOpacity={0.7}
        >
          <Download
            size={20}
            color={isDarkMode ? "#A78BFA" : "#6366F1"}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              color: isDarkMode ? "#A78BFA" : "#6366F1",
              fontWeight: "600",
              fontSize: 15,
            }}
          >
            Save Offline
          </Text>
        </TouchableOpacity>

        <View
          style={{
            width: 1,
            height: "100%",
            backgroundColor: isDarkMode
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.05)",
          }}
        />

        <TouchableOpacity
          style={{
            flex: 1,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            paddingVertical: 8,
          }}
          activeOpacity={0.7}
        >
          <Share2
            size={20}
            color={isDarkMode ? "#A78BFA" : "#6366F1"}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              color: isDarkMode ? "#A78BFA" : "#6366F1",
              fontWeight: "600",
              fontSize: 15,
            }}
          >
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
