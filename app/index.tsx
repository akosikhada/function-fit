import React, { useEffect, useState, useCallback, useRef } from "react";
import {
	View,
	ScrollView,
	SafeAreaView,
	StatusBar,
	ActivityIndicator,
	Text,
	RefreshControl,
	Image,
	TouchableOpacity,
	Dimensions,
	Animated,
	useColorScheme,
} from "react-native";
import { Stack, router } from "expo-router";
import {
	Footprints,
	Flame,
	Clock,
	PlayCircle,
	Activity,
	CalendarDays,
	Apple,
	Bell,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./utils/supabase";
import ThemeModule from "./utils/theme";
const { useTheme } = ThemeModule;

import Header from "./components/Header";
import DailyProgressSummary from "./components/DailyProgressSummary";
import TodaysWorkoutCard from "./components/TodaysWorkoutCard";
import MotivationalElements from "./components/MotivationalElements";
import QuickActionButtons from "./components/QuickActionButtons";
import BottomNavigation from "./components/BottomNavigation";
import Toast from "./components/Toast";
import {
	getUser,
	getUserDashboardData,
	getUserProfile,
} from "./utils/supabase";

// Default data structure to use while loading or if there's an error
const defaultUserData = {
	username: "Alex Parker",
	stepsProgress: 84,
	caloriesProgress: 70,
	workoutProgress: 75,
	stepsValue: "8,432",
	caloriesValue: "420",
	workoutValue: "45m",
	streakCount: 0,
	achievements: [],
	todaysWorkout: {
		id: "1",
		title: "Full Body Strength",
		duration: "45 mins",
		level: "Intermediate",
		imageUrl:
			"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
	},
	recentActivities: [
		{
			id: "1",
			title: "Upper Body Workout",
			type: "workout",
			duration: "45 min",
			calories: "350",
			time: "Today, 8:30 AM",
		},
		{
			id: "2",
			title: "Morning Run",
			type: "run",
			distance: "5.2 km",
			duration: "32 min",
			time: "Yesterday, 6:15 AM",
		},
		{
			id: "3",
			title: "Cardio Session",
			type: "cardio",
			duration: "45 min",
			calories: "420",
			time: "Yesterday, 5:30 PM",
		},
	],
};

const screenWidth = Dimensions.get("window").width;
const isSmallScreen = screenWidth < 360;
const horizontalPadding = isSmallScreen ? 16 : 24;
const buttonWidth = isSmallScreen ? "47%" : "48%";
const iconSpacing = isSmallScreen ? 8 : 12;

export default function HomeScreen() {
	const [userData, setUserData] = useState(defaultUserData);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [toast, setToast] = useState({
		visible: false,
		message: "",
		type: "success" as "success" | "error" | "info",
	});

	// Get theme colors
	const { theme: currentTheme, colors } = useTheme();
	const deviceTheme = useColorScheme() || "light";
	const isDarkMode = currentTheme === "dark";

	// Animation values
	const headerAnim = useRef(new Animated.Value(0)).current;
	const progressAnim = useRef(new Animated.Value(0)).current;
	const actionsAnim = useRef(new Animated.Value(0)).current;
	const workoutAnim = useRef(new Animated.Value(0)).current;
	const activitiesAnim = useRef(new Animated.Value(0)).current;
	const fadeAnim = useRef(new Animated.Value(1)).current;

	// Load cached profile picture
	useEffect(() => {
		const loadProfilePicture = async () => {
			try {
				// Get the current user ID first
				const user = await getUser();
				if (!user) return;

				// Use user-specific key for cached profile
				const cachedProfileKey = `userProfile-${user.id}`;
				const cachedProfile = await AsyncStorage.getItem(cachedProfileKey);

				if (cachedProfile) {
					const { avatarUrl } = JSON.parse(cachedProfile);
					if (avatarUrl) {
						setAvatarUrl(avatarUrl);
					}
				}
			} catch (error) {
				console.error("Error loading cached profile:", error);
			}
		};

		loadProfilePicture();
	}, []);

	const handleStartWorkout = async () => {
		try {
			// Get the current authenticated user
			const user = await getUser();

			if (user) {
				// Get today's date in YYYY-MM-DD format
				const today = new Date().toISOString().split("T")[0];

				// Get current stats for today
				const { data: existingStats } = await supabase
					.from("user_stats")
					.select("*")
					.eq("user_id", user.id)
					.eq("date", today)
					.single();

				if (existingStats) {
					// Update existing stats - increment workouts_completed
					await supabase
						.from("user_stats")
						.update({
							workouts_completed: existingStats.workouts_completed + 1,
							updated_at: new Date().toISOString(),
						})
						.eq("id", existingStats.id);

					// Update local state to reflect changes immediately
					setUserData((prev) => ({
						...prev,
						workoutValue: `${existingStats.workouts_completed + 1}/5`,
						workoutProgress: Math.min(
							Math.round(((existingStats.workouts_completed + 1) / 5) * 100),
							100
						),
					}));
				} else {
					// Create new stats for today
					await supabase.from("user_stats").insert({
						user_id: user.id,
						date: today,
						workouts_completed: 1,
						calories: 0,
						steps: 0,
					});

					// Update local state
					setUserData((prev) => ({
						...prev,
						workoutValue: "1/5",
						workoutProgress: 20, // 1/5 = 20%
					}));
				}
			}
		} catch (error) {
			console.error("Error updating workout stats:", error);
		} finally {
			// Navigate to workout screen
			router.push("/workout/index");
		}
	};

	const fetchUserData = async () => {
		try {
			setError(null);

			// Get the current authenticated user
			const user = await getUser();

			if (!user) {
				console.log("No authenticated user, using mock data");
				setLoading(false);
				return;
			}

			// Get dashboard data for the user
			const dashboardData = await getUserDashboardData(user.id);
			const profile = await getUserProfile(user.id);

			// Get today's date in YYYY-MM-DD format
			const today = new Date().toISOString().split("T")[0];

			// Get the latest stats for today to ensure we have the most up-to-date workout count
			const { data: latestStats } = await supabase
				.from("user_stats")
				.select("*")
				.eq("user_id", user.id)
				.eq("date", today)
				.maybeSingle();

			// Calculate accurate workout progress if we have latest stats
			let workoutValue = dashboardData.workoutValue;
			let workoutProgress = dashboardData.workoutProgress;

			if (latestStats) {
				workoutValue = `${latestStats.workouts_completed}/5`;
				workoutProgress = Math.min(
					Math.round((latestStats.workouts_completed / 5) * 100),
					100
				);
			}

			// Update avatar URL if available from profile
			if (profile?.avatar_url) {
				setAvatarUrl(profile.avatar_url);

				// Update the user's cached profile
				try {
					const cachedProfileKey = `userProfile-${user.id}`;
					const cachedProfile = await AsyncStorage.getItem(cachedProfileKey);
					const parsedCache = cachedProfile ? JSON.parse(cachedProfile) : {};

					await AsyncStorage.setItem(
						cachedProfileKey,
						JSON.stringify({
							...parsedCache,
							userId: user.id,
							avatarUrl: profile.avatar_url,
						})
					);
				} catch (cacheError) {
					console.error("Error updating profile cache:", cacheError);
				}
			}

			// Ensure all fields match the expected types
			setUserData({
				username: String(dashboardData.username),
				stepsProgress: dashboardData.stepsProgress,
				caloriesProgress: dashboardData.caloriesProgress,
				workoutProgress: workoutProgress,
				stepsValue: String(dashboardData.stepsValue),
				caloriesValue: String(dashboardData.caloriesValue),
				workoutValue: workoutValue,
				streakCount: dashboardData.streakCount,
				achievements: [], // Reset to empty array to match type
				todaysWorkout: {
					...dashboardData.todaysWorkout,
					level: "beginner", // Add required level field
				},
				recentActivities: defaultUserData.recentActivities, // Use mock data for now
			});
		} catch (err) {
			console.error("Error fetching user data:", err);
			setError("Failed to load your data. Please try again later.");
			return false;
		}
		return true;
	};

	const onRefresh = useCallback(async () => {
		setRefreshing(true);

		// Reset animations with more subtle offsets for a professional look
		headerAnim.setValue(-20);
		progressAnim.setValue(-25);
		actionsAnim.setValue(-30);
		workoutAnim.setValue(-35);
		activitiesAnim.setValue(-40);

		try {
			// Show a short delay for better UX even if data loads quickly
			await Promise.all([
				fetchUserData(),
				new Promise((resolve) => setTimeout(resolve, 1200)), // Slightly shorter animation time
			]);
		} catch (error) {
			console.error("Error refreshing data:", error);
		} finally {
			setRefreshing(false);

			// More professional staggered animation with tighter timing
			Animated.stagger(120, [
				Animated.timing(headerAnim, {
					toValue: 0,
					duration: 350,
					useNativeDriver: true,
				}),
				Animated.timing(progressAnim, {
					toValue: 0,
					duration: 350,
					useNativeDriver: true,
				}),
				Animated.timing(actionsAnim, {
					toValue: 0,
					duration: 350,
					useNativeDriver: true,
				}),
				Animated.timing(workoutAnim, {
					toValue: 0,
					duration: 350,
					useNativeDriver: true,
				}),
				Animated.timing(activitiesAnim, {
					toValue: 0,
					duration: 350,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [headerAnim, progressAnim, actionsAnim, workoutAnim, activitiesAnim]);

	// Initial data fetch
	useEffect(() => {
		setLoading(true);
		// Load actual user data instead of simulating with mock data
		fetchUserData().finally(() => setLoading(false));
	}, []);

	const getActivityIcon = (type: "workout" | "run" | "cardio" | string) => {
		switch (type) {
			case "workout":
				return (
					<View
						style={{ backgroundColor: isDarkMode ? "#312E81" : "#E0E7FF" }}
						className="p-3 rounded-xl"
					>
						<Activity size={22} color={isDarkMode ? "#818CF8" : "#8B5CF6"} />
					</View>
				);
			case "run":
				return (
					<View
						style={{ backgroundColor: isDarkMode ? "#1E3A8A" : "#DBEAFE" }}
						className="p-3 rounded-xl"
					>
						<Footprints size={22} color={isDarkMode ? "#60A5FA" : "#3B82F6"} />
					</View>
				);
			case "cardio":
				return (
					<View
						style={{ backgroundColor: isDarkMode ? "#831843" : "#FCE7F3" }}
						className="p-3 rounded-xl"
					>
						<Flame size={22} color={isDarkMode ? "#F472B6" : "#EC4899"} />
					</View>
				);
			default:
				return (
					<View
						style={{ backgroundColor: isDarkMode ? "#111827" : "#F3F4F6" }}
						className="p-3 rounded-xl"
					>
						<Activity size={22} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
					</View>
				);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<Stack.Screen
				options={{
					headerShown: false,
				}}
			/>
			<StatusBar
				barStyle={isDarkMode ? "light-content" : "dark-content"}
				backgroundColor={colors.background}
			/>

			{/* Background Elements - Removed */}

			<View className="flex-1">
				{loading ? (
					<View className="flex-1 justify-center items-center">
						<ActivityIndicator
							size="large"
							color={isDarkMode ? "#8B5CF6" : "#4F46E5"}
						/>
						<Text style={{ color: colors.secondaryText }} className="mt-4">
							Loading your fitness data...
						</Text>
					</View>
				) : error ? (
					<View className="flex-1 justify-center items-center px-4">
						<Text className="text-red-500 text-center mb-4">{error}</Text>
						<QuickActionButtons />
					</View>
				) : (
					<>
						{/* Top spacer */}
						<View className="h-6" />

						{/* Header with Welcome Back message */}
						<Animated.View
							style={{
								paddingHorizontal: horizontalPadding,
								paddingTop: 32,
								paddingBottom: 12,
								transform: [{ translateY: headerAnim }],
							}}
							className="flex-row justify-between items-center"
						>
							<View className="flex-row items-center">
								<Image
									source={{
										uri:
											avatarUrl ||
											"https://randomuser.me/api/portraits/men/32.jpg",
									}}
									className="w-10 h-10 rounded-full mr-3"
								/>
								<View>
									<Text
										style={{ color: colors.secondaryText }}
										className="text-sm"
									>
										Welcome back
									</Text>
									<Text
										style={{ color: colors.text }}
										className="text-xl font-bold mb-1"
									>
										{userData.username}
									</Text>
								</View>
							</View>
							<TouchableOpacity className="p-2">
								<View
									style={{ backgroundColor: colors.card }}
									className="rounded-full p-2 shadow-sm"
								>
									<Bell size={20} color={colors.secondaryText} />
								</View>
							</TouchableOpacity>
						</Animated.View>

						<ScrollView
							className="flex-1 pb-20"
							style={{ paddingHorizontal: horizontalPadding }}
							showsVerticalScrollIndicator={false}
							refreshControl={
								<RefreshControl
									refreshing={refreshing}
									onRefresh={onRefresh}
									tintColor={isDarkMode ? "#8B5CF6" : "#4F46E5"}
									colors={[isDarkMode ? "#8B5CF6" : "#4F46E5"]}
									progressBackgroundColor={isDarkMode ? "#1E1E1E" : "#F3F4F6"}
									title="Updating your fitness data..."
									titleColor={colors.secondaryText}
								/>
							}
						>
							{/* Daily Progress Card */}
							<Animated.View
								style={{
									backgroundColor: colors.card,
									transform: [{ translateY: progressAnim }],
									borderRadius: 24,
									shadowOpacity: 0.1,
									shadowRadius: 10,
									marginBottom: 24,
									padding: 24,
								}}
							>
								<Text
									style={{ color: colors.text }}
									className="font-bold text-lg mb-4"
								>
									Today's Progress
								</Text>
								<View className="flex-row justify-between px-2 items-center">
									<View className="items-center">
										<View
											style={{
												backgroundColor: isDarkMode ? "#312E81" : "#E0E7FF",
											}}
											className="w-12 h-12 rounded-full items-center justify-center mb-2"
										>
											<Footprints
												size={22}
												color={isDarkMode ? "#818CF8" : "#4F46E5"}
											/>
										</View>
										<Text
											style={{ color: isDarkMode ? "#818CF8" : "#4F46E5" }}
											className="font-bold text-base"
										>
											{userData.stepsValue}
										</Text>
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs"
										>
											Steps
										</Text>
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs"
										>
											Goal: 10,000
										</Text>
									</View>

									<View className="items-center">
										<View
											style={{
												backgroundColor: isDarkMode ? "#7F1D1D" : "#FEE2E2",
											}}
											className="w-12 h-12 rounded-full items-center justify-center mb-2"
										>
											<Flame
												size={22}
												color={isDarkMode ? "#F87171" : "#EF4444"}
											/>
										</View>
										<Text
											style={{ color: isDarkMode ? "#F87171" : "#EF4444" }}
											className="font-bold text-base"
										>
											{userData.caloriesValue}
										</Text>
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs"
										>
											Calories
										</Text>
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs"
										>
											Goal: 600
										</Text>
									</View>

									<View className="items-center">
										<View
											style={{
												backgroundColor: isDarkMode ? "#1E3A8A" : "#DBEAFE",
											}}
											className="w-12 h-12 rounded-full items-center justify-center mb-2"
										>
											<Clock
												size={22}
												color={isDarkMode ? "#60A5FA" : "#3B82F6"}
											/>
										</View>
										<Text
											style={{ color: isDarkMode ? "#60A5FA" : "#3B82F6" }}
											className="font-bold text-base"
										>
											{userData.workoutValue}
										</Text>
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs"
										>
											Active Time
										</Text>
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs"
										>
											Goal: 60m
										</Text>
									</View>
								</View>
							</Animated.View>

							{/* Quick Action Buttons */}
							<Animated.View
								className="flex-row justify-between mb-6"
								style={{
									transform: [{ translateY: actionsAnim }],
								}}
							>
								<TouchableOpacity
									style={{ width: buttonWidth }}
									className="bg-indigo-500 rounded-2xl shadow-sm h-20 flex-row items-center justify-center"
									onPress={handleStartWorkout}
								>
									<PlayCircle
										size={24}
										color="#FFFFFF"
										style={{ marginRight: iconSpacing }}
									/>
									<Text className="text-white font-semibold text-base">
										Start Workout
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={{
										width: buttonWidth,
										backgroundColor: colors.card,
										borderRadius: 16,
										height: 80,
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										shadowOpacity: 0.1,
										shadowRadius: 10,
									}}
								>
									<Footprints
										size={24}
										color={colors.accent}
										style={{ marginRight: iconSpacing }}
									/>
									<Text
										style={{ color: colors.accent }}
										className="font-semibold text-base"
									>
										Track Run
									</Text>
								</TouchableOpacity>
							</Animated.View>

							{/* Programs and Nutrition Buttons */}
							<Animated.View
								className="flex-row justify-between mb-6"
								style={{
									transform: [{ translateY: actionsAnim }],
								}}
							>
								<TouchableOpacity
									style={{
										width: buttonWidth,
										backgroundColor: colors.card,
										borderRadius: 16,
										height: 80,
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										shadowOpacity: 0.1,
										shadowRadius: 10,
									}}
								>
									<CalendarDays
										size={24}
										color={colors.accent}
										style={{ marginRight: iconSpacing }}
									/>
									<Text
										style={{ color: colors.accent }}
										className="font-semibold text-base"
									>
										Programs
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={{
										width: buttonWidth,
										backgroundColor: colors.card,
										borderRadius: 16,
										height: 80,
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										shadowOpacity: 0.1,
										shadowRadius: 10,
									}}
								>
									<Apple
										size={24}
										color={isDarkMode ? "#34D399" : "#10B981"}
										style={{ marginRight: iconSpacing }}
									/>
									<Text
										style={{ color: isDarkMode ? "#34D399" : "#10B981" }}
										className="font-semibold text-base"
									>
										Nutrition
									</Text>
								</TouchableOpacity>
							</Animated.View>

							{/* Today's Workout Section */}
							<Animated.View
								style={{
									transform: [{ translateY: workoutAnim }],
									marginBottom: 24,
								}}
							>
								<Text
									style={{ color: colors.text }}
									className="font-bold text-lg mb-4"
								>
									Today's Workout
								</Text>
								<TodaysWorkoutCard
									id={userData.todaysWorkout.id}
									title={userData.todaysWorkout.title}
									duration={userData.todaysWorkout.duration}
									imageUrl={userData.todaysWorkout.imageUrl}
									onStart={async () => {
										// After starting workout and updating stats, refresh the UI
										await fetchUserData();
										router.push(`/workout/${userData.todaysWorkout.id}`);
									}}
								/>
							</Animated.View>

							{/* Recent Activities Section */}
							<Animated.View
								className="mb-5"
								style={{
									transform: [{ translateY: activitiesAnim }],
								}}
							>
								<Text
									style={{ color: colors.text }}
									className="font-bold text-lg mb-4"
								>
									Recent Activities
								</Text>
								<View
									style={{ backgroundColor: colors.card }}
									className="rounded-2xl shadow-sm p-4"
								>
									{userData.recentActivities.map((activity, index) => (
										<View
											key={activity.id}
											style={{
												flexDirection: "row",
												paddingVertical: 12,
												borderBottomWidth:
													index < userData.recentActivities.length - 1 ? 1 : 0,
												borderBottomColor: isDarkMode
													? colors.border
													: "#F3F4F6",
											}}
										>
											{getActivityIcon(activity.type)}
											<View className="ml-3 flex-1">
												<Text
													style={{ color: colors.text }}
													className="font-bold"
												>
													{activity.title}
												</Text>
												<View className="flex-row mt-1">
													{activity.duration && (
														<Text
															style={{ color: colors.secondaryText }}
															className="text-xs mr-3"
														>
															{activity.duration}
														</Text>
													)}
													{activity.distance && (
														<Text
															style={{ color: colors.secondaryText }}
															className="text-xs mr-3"
														>
															{activity.distance}
														</Text>
													)}
													{activity.calories && (
														<Text
															style={{ color: colors.secondaryText }}
															className="text-xs"
														>
															{activity.calories} kcal
														</Text>
													)}
												</View>
												<Text
													style={{ color: colors.secondaryText }}
													className="text-xs mt-1"
												>
													{activity.time}
												</Text>
											</View>
										</View>
									))}
								</View>
							</Animated.View>

							{/* Extra spacer to ensure scrollability and account for navbar */}
							<View style={{ height: 80 }} />
						</ScrollView>
					</>
				)}

				<View className="absolute bottom-0 left-0 right-0">
					<BottomNavigation activeTab="home" />
				</View>

				{/* Toast notification */}
				<Toast
					message={toast.message}
					type={toast.type}
					visible={toast.visible}
					onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
					duration={3000}
				/>
			</View>
		</SafeAreaView>
	);
}
