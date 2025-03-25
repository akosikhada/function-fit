import React, { useState } from "react";
import {
	View,
	Text,
	Image,
	ScrollView,
	TouchableOpacity,
	SafeAreaView,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { ArrowLeft, Clock, Flame, Zap, Play, Pause } from "lucide-react-native";
import { getWorkoutById, completeWorkout, getUser } from "../utils/supabase";
import WorkoutTimer from "../components/WorkoutTimer";

// Define types for the workout
interface Exercise {
	name: string;
	duration: number;
	rest: number;
}

interface WorkoutData {
	id: string;
	title: string;
	description: string;
	duration: number;
	calories: number;
	difficulty: string;
	imageUrl: string;
	exercises: Exercise[];
}

// Fallback workout data if API fails
const fallbackWorkouts: Record<string, WorkoutData> = {
	"1": {
		id: "1",
		title: "Full Body HIIT",
		description:
			"A high-intensity interval training workout that targets your entire body, designed to burn calories and build strength.",
		duration: 30,
		calories: 320,
		difficulty: "Intermediate",
		imageUrl:
			"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
		exercises: [
			{ name: "Jumping Jacks", duration: 45, rest: 15 },
			{ name: "Push-ups", duration: 45, rest: 15 },
			{ name: "Mountain Climbers", duration: 45, rest: 15 },
			{ name: "Squats", duration: 45, rest: 15 },
			{ name: "Burpees", duration: 45, rest: 15 },
			{ name: "Plank", duration: 45, rest: 15 },
			{ name: "Lunges", duration: 45, rest: 15 },
			{ name: "High Knees", duration: 45, rest: 15 },
		],
	},
	"2": {
		id: "2",
		title: "Core Crusher",
		description:
			"Focus on strengthening your core with this targeted ab workout that will help build definition and stability.",
		duration: 20,
		calories: 220,
		difficulty: "Beginner",
		imageUrl:
			"https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80",
		exercises: [
			{ name: "Crunches", duration: 45, rest: 15 },
			{ name: "Plank", duration: 45, rest: 15 },
			{ name: "Russian Twists", duration: 45, rest: 15 },
			{ name: "Leg Raises", duration: 45, rest: 15 },
			{ name: "Mountain Climbers", duration: 45, rest: 15 },
			{ name: "Bicycle Crunches", duration: 45, rest: 15 },
		],
	},
};

export default function WorkoutDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const [workout, setWorkout] = useState<WorkoutData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [isStarted, setIsStarted] = useState<boolean>(false);
	const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
	const [workoutCompleted, setWorkoutCompleted] = useState<boolean>(false);

	// Fetch workout data from Supabase
	React.useEffect(() => {
		const fetchWorkout = async () => {
			try {
				setLoading(true);
				setError(null);

				// Map numeric IDs to proper UUID format
				let workoutId = id || "1";

				// Check if ID is just a number without UUID format
				if (/^\d+$/.test(workoutId)) {
					// Convert simple numeric IDs to proper UUID format
					workoutId = `00000000-0000-0000-0000-00000000000${workoutId}`;
				}

				// Get workout data from Supabase
				const workoutData = await getWorkoutById(workoutId);

				// Format the workout data
				const formattedWorkout: WorkoutData = {
					id: workoutData.id,
					title: workoutData.title,
					description: workoutData.description || "",
					duration: workoutData.duration,
					calories: workoutData.calories || 0,
					difficulty: workoutData.difficulty || "Beginner",
					imageUrl:
						workoutData.image_url ||
						"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
					exercises:
						workoutData.exercises?.map((ex: any) => ({
							name: ex.name,
							duration: ex.duration,
							rest: ex.rest || 15,
						})) || [],
				};

				setWorkout(formattedWorkout);
			} catch (err) {
				console.error("Error fetching workout:", err);
				// Use fallback data if API fails
				setWorkout(fallbackWorkouts[id || "1"] || fallbackWorkouts["1"]);
				setError(
					"Could not load workout data from server. Using offline data."
				);
			} finally {
				setLoading(false);
			}
		};

		fetchWorkout();
	}, [id]);

	// Use fallback data while loading
	const currentWorkout: WorkoutData =
		workout || fallbackWorkouts[id || "1"] || fallbackWorkouts["1"];

	const handleStartWorkout = () => {
		setIsStarted(!isStarted);
	};

	const handleNextExercise = async () => {
		if (currentExerciseIndex < currentWorkout.exercises.length - 1) {
			setCurrentExerciseIndex(currentExerciseIndex + 1);
		} else {
			// Workout complete
			setIsStarted(false);
			setWorkoutCompleted(true);

			try {
				// Get the current user
				const user = await getUser();
				if (user) {
					// Get the workout ID in the correct format
					let workoutId = currentWorkout.id;

					// If it's just a number, convert to proper UUID format
					if (/^\d+$/.test(workoutId)) {
						workoutId = `00000000-0000-0000-0000-00000000000${workoutId}`;
					}

					// Log the completed workout to Supabase
					await completeWorkout(
						user.id,
						workoutId,
						currentWorkout.duration,
						currentWorkout.calories
					);
				}
			} catch (error) {
				console.error("Error logging completed workout:", error);
			}

			// Reset and navigate back after a delay
			setTimeout(() => {
				setCurrentExerciseIndex(0);
				setWorkoutCompleted(false);
				router.push("/");
			}, 2000);
		}
	};

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
				<Text className="text-gray-600">Loading workout...</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-gray-50">
			<Stack.Screen
				options={{
					headerShown: false,
				}}
			/>

			<View className="flex-1">
				{/* Header */}
				<View className="relative">
					<Image
						source={{ uri: currentWorkout.imageUrl }}
						className="w-full h-56"
						resizeMode="cover"
					/>
					<View className="absolute top-0 left-0 right-0 p-4">
						<TouchableOpacity
							onPress={() => router.back()}
							className="bg-white/80 rounded-full p-2 w-10 h-10 items-center justify-center"
						>
							<ArrowLeft size={24} color="#4F46E5" />
						</TouchableOpacity>
					</View>
					<View className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
						<Text className="text-white text-2xl font-bold">
							{currentWorkout.title}
						</Text>
						<View className="flex-row mt-2">
							<View className="flex-row items-center mr-4">
								<Clock size={16} color="#FFFFFF" />
								<Text className="text-white ml-1">
									{currentWorkout.duration} mins
								</Text>
							</View>
							<View className="flex-row items-center mr-4">
								<Flame size={16} color="#FFFFFF" />
								<Text className="text-white ml-1">
									{currentWorkout.calories} cal
								</Text>
							</View>
							<View className="flex-row items-center">
								<Zap size={16} color="#FFFFFF" />
								<Text className="text-white ml-1">
									{currentWorkout.difficulty}
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Workout Content */}
				{!isStarted ? (
					<ScrollView className="flex-1 p-4">
						{error && (
							<View className="bg-yellow-50 p-3 rounded-lg mb-4">
								<Text className="text-yellow-700">{error}</Text>
							</View>
						)}

						<Text className="text-gray-800 text-base mb-4">
							{currentWorkout.description}
						</Text>

						<Text className="text-lg font-semibold text-gray-800 mb-2">
							Exercises
						</Text>
						{currentWorkout.exercises.map((exercise, index) => (
							<View
								key={index}
								className="flex-row items-center py-3 border-b border-gray-200"
							>
								<View className="bg-indigo-100 rounded-full w-8 h-8 items-center justify-center mr-3">
									<Text className="text-indigo-600 font-semibold">
										{index + 1}
									</Text>
								</View>
								<View className="flex-1">
									<Text className="text-gray-800 font-medium">
										{exercise.name}
									</Text>
									<Text className="text-gray-500 text-sm">
										{exercise.duration} sec • {exercise.rest} sec rest
									</Text>
								</View>
							</View>
						))}

						<TouchableOpacity
							onPress={handleStartWorkout}
							className="bg-indigo-600 rounded-lg py-4 items-center justify-center mt-6 mb-10"
						>
							<Text className="text-white font-semibold text-lg">
								Start Workout
							</Text>
						</TouchableOpacity>
					</ScrollView>
				) : workoutCompleted ? (
					<View className="flex-1 p-4 items-center justify-center">
						<View className="bg-green-100 rounded-full w-20 h-20 items-center justify-center mb-4">
							<Flame size={32} color="#10B981" />
						</View>
						<Text className="text-2xl font-bold text-gray-800 mb-2">
							Workout Complete!
						</Text>
						<Text className="text-gray-600 text-center mb-6">
							Great job! You've completed your workout.
						</Text>
					</View>
				) : (
					<View className="flex-1 p-4 justify-between">
						<View className="items-center">
							<Text className="text-gray-500 mb-2">
								Exercise {currentExerciseIndex + 1} of{" "}
								{currentWorkout.exercises.length}
							</Text>
							<Text className="text-2xl font-bold text-gray-800 mb-6">
								{currentWorkout.exercises[currentExerciseIndex].name}
							</Text>

							<WorkoutTimer
								duration={
									currentWorkout.exercises[currentExerciseIndex].duration
								}
								onComplete={handleNextExercise}
								isActive={isStarted}
								onToggle={handleStartWorkout}
							/>

							<Text className="text-gray-500 mt-6">
								Next:{" "}
								{currentExerciseIndex < currentWorkout.exercises.length - 1
									? currentWorkout.exercises[currentExerciseIndex + 1].name
									: "Workout Complete"}
							</Text>
						</View>

						<View className="flex-row justify-between mb-10">
							<TouchableOpacity
								onPress={handleStartWorkout}
								className="bg-gray-200 rounded-full w-16 h-16 items-center justify-center"
							>
								{isStarted ? (
									<Pause size={32} color="#4F46E5" />
								) : (
									<Play size={32} color="#4F46E5" />
								)}
							</TouchableOpacity>

							<TouchableOpacity
								onPress={handleNextExercise}
								className="bg-indigo-600 rounded-full w-16 h-16 items-center justify-center"
							>
								<ArrowLeft
									size={32}
									color="#FFFFFF"
									style={{ transform: [{ rotate: "180deg" }] }}
								/>
							</TouchableOpacity>
						</View>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}
