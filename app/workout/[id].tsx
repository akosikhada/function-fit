import React, { useState } from "react";
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
		title: "Full Body HIIT",
		description:
			"A high-intensity interval training workout that targets your entire body, designed to burn calories and build strength.",
		duration: "30 mins",
		calories: "320 cal",
		level: "Intermediate",
		imageUrl:
			"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
		exercises: [
			{
				id: "1",
				name: "Jumping Jacks",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
			},
			{
				id: "2",
				name: "Push-ups",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
			},
			{
				id: "3",
				name: "Mountain Climbers",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
			},
			{
				id: "4",
				name: "Squats",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
			},
			{
				id: "5",
				name: "Burpees",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
			},
			{
				id: "6",
				name: "Plank",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
			},
			{
				id: "7",
				name: "Lunges",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
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
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
			},
			{
				id: "9",
				name: "Plank",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
			},
			{
				id: "10",
				name: "Russian Twists",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
			},
			{
				id: "11",
				name: "Leg Raises",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
			},
			{
				id: "12",
				name: "Mountain Climbers",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
			},
			{
				id: "13",
				name: "Bicycle Crunches",
				duration: "45 sec",
				sets: 1,
				reps: "45 sec",
				rest: "15 sec rest",
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
					exercises:
						workoutData.exercises?.map((ex: any) => ({
							id: ex.id,
							name: ex.name,
							duration: ex.duration || "Unknown",
							sets: ex.sets || 1,
							reps: ex.reps || "Unknown",
							rest: ex.rest || "Unknown",
						})) || [],
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
				<View style={{ position: "relative", height: 240 }}>
					<Image
						source={{ uri: currentWorkout.imageUrl }}
						style={{
							width: "100%",
							height: "100%",
						}}
						resizeMode="cover"
					/>

					<LinearGradient
						colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.8)"]}
						locations={[0, 0.4, 1]}
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
							top: 12,
							left: 16,
							backgroundColor: "rgba(0,0,0,0.3)",
							borderRadius: 20,
							width: 40,
							height: 40,
							alignItems: "center",
							justifyContent: "center",
						}}
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
							padding: 16,
						}}
					>
						<Text
							style={{
								color: "#FFFFFF",
								fontSize: 28,
								fontWeight: "700",
								marginBottom: 8,
								textShadowColor: "rgba(0,0,0,0.5)",
								textShadowOffset: { width: 0, height: 1 },
								textShadowRadius: 2,
							}}
						>
							{currentWorkout.title}
						</Text>

						<View style={{ flexDirection: "row", alignItems: "center" }}>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									marginRight: 16,
								}}
							>
								<Clock size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
								<Text style={{ color: "#FFFFFF", fontSize: 14 }}>
									{currentWorkout.duration}
								</Text>
							</View>

							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									marginRight: 16,
								}}
							>
								<Flame size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
								<Text style={{ color: "#FFFFFF", fontSize: 14 }}>
									{currentWorkout.calories}
								</Text>
							</View>

							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									marginRight: 16,
								}}
							>
								<BarChart3
									size={14}
									color="#FFFFFF"
									style={{ marginRight: 4 }}
								/>
								<Text style={{ color: "#FFFFFF", fontSize: 14 }}>
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
				<View style={{ padding: 16 }}>
					<Text
						style={{
							color: colors.text,
							fontSize: 15,
							lineHeight: 22,
							marginBottom: 20,
						}}
					>
						{currentWorkout.description}
					</Text>
				</View>

				{/* Exercises Section */}
				<View style={{ paddingHorizontal: 16 }}>
					<Text
						style={{
							color: colors.text,
							fontSize: 18,
							fontWeight: "700",
							marginBottom: 16,
						}}
					>
						Exercises
					</Text>

					{/* Exercise list */}
					{currentWorkout.exercises.map((exercise, index) => (
						<View
							key={exercise.id}
							style={{
								marginBottom: 16,
								padding: 16,
								backgroundColor: isDarkMode ? colors.card : "#FFFFFF",
								borderRadius: 16,
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: isDarkMode ? 0.2 : 0.1,
								shadowRadius: 3,
								elevation: 2,
								borderWidth: isDarkMode ? 1 : 0,
								borderColor: isDarkMode
									? "rgba(255,255,255,0.1)"
									: "transparent",
							}}
						>
							<View style={{ flexDirection: "row", alignItems: "center" }}>
								{/* Exercise number circle */}
								<View
									style={{
										width: 40,
										height: 40,
										borderRadius: 20,
										backgroundColor: isDarkMode ? "#4B5563" : "#E5E7EB",
										alignItems: "center",
										justifyContent: "center",
										marginRight: 16,
									}}
								>
									<Text
										style={{
											color: isDarkMode ? "#FFFFFF" : "#374151",
											fontSize: 16,
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
											fontSize: 16,
											fontWeight: "600",
											marginBottom: 4,
										}}
									>
										{exercise.name}
									</Text>
									<Text
										style={{
											color: colors.secondaryText,
											fontSize: 14,
										}}
									>
										{exercise.reps} • {exercise.rest}
									</Text>
								</View>
							</View>
						</View>
					))}
				</View>

				{/* Start workout button - with extra padding for safe area */}
				<View style={{ padding: 16, paddingBottom: 32 }}>
					<TouchableOpacity
						style={{
							backgroundColor: isDarkMode ? "#7C3AED" : "#6366F1",
							borderRadius: 12,
							paddingVertical: 16,
							alignItems: "center",
							flexDirection: "row",
							justifyContent: "center",
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: isDarkMode ? 0.4 : 0.2,
							shadowRadius: 4,
							elevation: 4,
						}}
						onPress={() =>
							router.push(`/workout-player/${currentWorkout.id}` as any)
						}
					>
						<Play size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
						<Text
							style={{
								color: "#FFFFFF",
								fontSize: 16,
								fontWeight: "700",
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
				}}
			>
				<TouchableOpacity
					style={{
						flex: 1,
						alignItems: "center",
						flexDirection: "row",
						justifyContent: "center",
					}}
				>
					<Download
						size={20}
						color={isDarkMode ? "#A78BFA" : "#6366F1"}
						style={{ marginRight: 6 }}
					/>
					<Text
						style={{
							color: isDarkMode ? "#A78BFA" : "#6366F1",
							fontWeight: "600",
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
					}}
				>
					<Share2
						size={20}
						color={isDarkMode ? "#A78BFA" : "#6366F1"}
						style={{ marginRight: 6 }}
					/>
					<Text
						style={{
							color: isDarkMode ? "#A78BFA" : "#6366F1",
							fontWeight: "600",
						}}
					>
						Share
					</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}
