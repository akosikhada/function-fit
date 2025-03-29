import React, { useState, useCallback, useEffect } from "react";
import {
	View,
	Text,
	ScrollView,
	SafeAreaView,
	TouchableOpacity,
	RefreshControl,
	Dimensions,
	useWindowDimensions,
	Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import {
	Activity,
	Clock,
	Flame,
	Medal,
	Route,
	ChevronRight,
} from "lucide-react-native";
import BottomNavigation from "../components/BottomNavigation";
import { useColorScheme } from "react-native";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

// Mock data for the week progress
const thisWeekData = {
	workoutsCompleted: 24,
	daysActive: 5,
};

// Mock data for monthly tab
const monthlyData = {
	workoutsCompleted: 78,
	daysActive: 18,
};

// Mock data for statistics
const statisticsData = {
	totalWorkouts: {
		value: 156,
		change: "+12%",
	},
	totalMinutes: {
		value: 1248,
		change: "+8%",
	},
	caloriesBurned: {
		value: 12450,
		change: "+15%",
	},
	distance: {
		value: 48.2,
		change: "+6%",
	},
};

// Mock data for activity trends
const activityTrendsData = [
	{ day: "Mon", value: 55 },
	{ day: "Tue", value: 25 },
	{ day: "Wed", value: 70 },
	{ day: "Thu", value: 50 },
	{ day: "Fri", value: 87 },
	{ day: "Sat", value: 65 },
	{ day: "Sun", value: 40 },
];

// Mock data for achievements
const achievementsData = [
	{
		id: "1",
		title: "7 Day Streak",
		date: "Jan 15, 2024",
		icon: "🏅",
	},
	{
		id: "2",
		title: "50 Workouts",
		date: "Jan 10, 2024",
		icon: "🏅",
	},
];

export default function ProgressScreen() {
	const router = useRouter();
	const [refreshing, setRefreshing] = useState(false);
	const [activeTab, setActiveTab] = useState("week"); // 'week' or 'month'

	// Add theme support
	const { theme: currentTheme, colors } = useTheme();
	const deviceTheme = useColorScheme() || "light";
	const isDarkMode = currentTheme === "dark";

	// Use window dimensions for responsive layout
	const { width, height } = useWindowDimensions();
	const [barChartWidth, setBarChartWidth] = useState((width - 64) / 7); // Initial calculation
	const [horizontalPadding, setHorizontalPadding] = useState(16);
	const [cardWidth, setCardWidth] = useState(width * 0.48); // 48% of screen width
	const [isSmallDevice, setIsSmallDevice] = useState(false);

	// Functions to handle card navigation
	const handleWorkoutsPress = () => {
		// Navigate to workout details
		console.log("Workouts pressed");
		// Uncomment when routes exist:
		// router.push("/workout-history" as any);
	};

	const handleMinutesPress = () => {
		// Navigate to workout minutes details
		console.log("Minutes pressed");
		// Uncomment when routes exist:
		// router.push("/workout-time" as any);
	};

	const handleCaloriesPress = () => {
		// Navigate to calories details
		console.log("Calories pressed");
		// Uncomment when routes exist:
		// router.push("/calorie-history" as any);
	};

	const handleDistancePress = () => {
		// Navigate to distance details
		console.log("Distance pressed");
		// Uncomment when routes exist:
		// router.push("/distance-history" as any);
	};

	// Function to handle achievement item press
	const handleAchievementPress = (achievementId: string) => {
		// Navigate to achievement details
		console.log("Achievement pressed:", achievementId);
		// Uncomment when routes exist:
		// router.push(`/achievement/${achievementId}` as any);
	};

	// Calculate responsive dimensions based on screen size
	useEffect(() => {
		const smallDevice = width < 360;
		setIsSmallDevice(smallDevice);

		// Adjust horizontal padding based on screen width
		const padding = width < 360 ? 12 : width > 768 ? 24 : 16;
		setHorizontalPadding(padding);

		// Calculate bar width for activity chart (7 days)
		setBarChartWidth((width - padding * 2 * 2) / 7); // Double padding for container and inner padding

		// Calculate card width for 2-column grid
		// For larger screens add more breathing room between cards
		const cardWidthValue = width > 768 ? width * 0.47 : width * 0.48;
		setCardWidth(cardWidthValue);
	}, [width]);

	// Function to fetch progress data
	const fetchProgressData = async () => {
		try {
			// In a real implementation, this would fetch data from your API/Supabase
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch (error) {
			console.error("Error fetching progress data:", error);
		}
	};

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchProgressData();
		setRefreshing(false);
	}, []);

	// Get active progress data based on selected tab
	const progressData = activeTab === "week" ? thisWeekData : monthlyData;

	// Calculate maximum value for bar chart scaling
	const maxValue = Math.max(...activityTrendsData.map((day) => day.value));

	// Responsive text sizes
	const titleSize = isSmallDevice ? "text-lg" : "text-xl";
	const subtitleSize = isSmallDevice ? "text-base" : "text-lg";
	const statValueSize = isSmallDevice ? "text-lg" : "text-xl";
	const tabNumberSize = isSmallDevice ? "text-2xl" : "text-3xl";

	// Update the bar color in the renderBar function to handle dark mode
	const renderBar = (value: number) => {
		const maxVal = Math.max(...activityTrendsData.map((day) => day.value), 1);
		const height = Math.max((value / maxVal) * 120, 4);
		return (
			<View
				className="w-7 rounded-t-md"
				style={{
					height,
					backgroundColor: isDarkMode ? "#8B5CF6" : "#6366F1",
				}}
			/>
		);
	};

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: colors.background }}
		>
			<Stack.Screen
				options={{
					headerShown: false,
				}}
			/>

			<View className="flex-1">
				{/* Remove header section completely */}

				<ScrollView
					className="flex-1 pt-16"
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 100 }}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor={isDarkMode ? "#8B5CF6" : "#6366F1"}
							colors={[isDarkMode ? "#8B5CF6" : "#6366F1"]}
							progressBackgroundColor={isDarkMode ? "#1E1E1E" : "#F3F4F6"}
						/>
					}
				>
					{/* Weekly/Monthly Tabs */}
					<View
						style={{ paddingHorizontal: horizontalPadding }}
						className="mb-8 flex-row justify-between"
					>
						<TouchableOpacity
							className={`w-[48%] rounded-2xl p-4`}
							style={{
								backgroundColor:
									activeTab === "week"
										? "#8B5CF6"
										: isDarkMode
										? "#333333"
										: "#F3F4F6",
							}}
							onPress={() => {
								setActiveTab("week");
								console.log("Weekly tab selected");
							}}
							activeOpacity={0.7}
						>
							<Text
								style={{
									color:
										activeTab === "week"
											? "#FFFFFF"
											: isDarkMode
											? colors.text
											: "#374151",
								}}
								className="text-sm font-medium"
							>
								This Week
							</Text>
							<Text
								style={{
									color:
										activeTab === "week"
											? "#FFFFFF"
											: isDarkMode
											? colors.text
											: "#1F2937",
								}}
								className="text-4xl font-bold mt-1"
							>
								{thisWeekData.workoutsCompleted}
							</Text>
							<Text
								style={{
									color:
										activeTab === "week"
											? "#FFFFFF"
											: isDarkMode
											? colors.secondaryText
											: "#6B7280",
								}}
								className="text-xs mt-1"
							>
								Workouts Completed
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							className={`w-[48%] rounded-2xl p-4`}
							style={{
								backgroundColor:
									activeTab === "month"
										? "#8B5CF6"
										: isDarkMode
										? "#333333"
										: "#F3F4F6",
							}}
							onPress={() => {
								setActiveTab("month");
								console.log("Monthly tab selected");
							}}
							activeOpacity={0.7}
						>
							<Text
								style={{
									color:
										activeTab === "month"
											? "#FFFFFF"
											: isDarkMode
											? colors.text
											: "#374151",
								}}
								className="text-sm font-medium"
							>
								Monthly
							</Text>
							<Text
								style={{
									color:
										activeTab === "month"
											? "#FFFFFF"
											: isDarkMode
											? colors.text
											: "#1F2937",
								}}
								className="text-4xl font-bold mt-1"
							>
								{monthlyData.workoutsCompleted}
							</Text>
							<Text
								style={{
									color:
										activeTab === "month"
											? "#FFFFFF"
											: isDarkMode
											? colors.secondaryText
											: "#6B7280",
								}}
								className="text-xs mt-1"
							>
								Workouts Completed
							</Text>
						</TouchableOpacity>
					</View>

					{/* Your Statistics */}
					<View
						style={{ paddingHorizontal: horizontalPadding }}
						className="mb-8"
					>
						<Text
							style={{ color: colors.text }}
							className="text-lg font-semibold mb-4"
						>
							Your Statistics
						</Text>

						<View className="flex-row flex-wrap">
							{/* Row 1 */}
							<View className="flex-row w-full mb-4">
								{/* Total Workouts */}
								<TouchableOpacity
									className="w-[48%] mr-[4%]"
									onPress={handleWorkoutsPress}
									activeOpacity={0.8}
								>
									<View
										style={{ backgroundColor: colors.card }}
										className="rounded-2xl p-4 shadow-sm"
									>
										<View
											style={{
												backgroundColor: isDarkMode ? "#312E81" : "#E0E7FF",
											}}
											className="w-10 h-10 rounded-full items-center justify-center mb-2"
										>
											<Activity
												size={18}
												color={isDarkMode ? "#8B5CF6" : "#6366F1"}
											/>
										</View>
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs"
										>
											Total Workouts
										</Text>
										<View className="flex-row items-baseline mt-1">
											<Text
												style={{ color: colors.text }}
												className="text-2xl font-bold"
											>
												{statisticsData.totalWorkouts.value}
											</Text>
											<Text
												style={{ color: colors.secondaryText }}
												className="text-sm"
											>
												{statisticsData.totalWorkouts.change}
											</Text>
										</View>
									</View>
								</TouchableOpacity>

								{/* Total Minutes */}
								<TouchableOpacity
									className="w-[48%]"
									onPress={handleMinutesPress}
									activeOpacity={0.8}
								>
									<View
										style={{ backgroundColor: colors.card }}
										className="rounded-2xl p-4 shadow-sm"
									>
										<View
											style={{
												backgroundColor: isDarkMode ? "#1E3A8A" : "#DBEAFE",
											}}
											className="w-10 h-10 rounded-full items-center justify-center mb-2"
										>
											<Clock
												size={18}
												color={isDarkMode ? "#60A5FA" : "#3B82F6"}
											/>
										</View>
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs"
										>
											Total Minutes
										</Text>
										<View className="flex-row items-baseline mt-1">
											<Text
												style={{ color: colors.text }}
												className="text-2xl font-bold"
											>
												{statisticsData.totalMinutes.value}
											</Text>
											<Text
												style={{ color: colors.secondaryText }}
												className="text-sm"
											>
												{statisticsData.totalMinutes.change}
											</Text>
										</View>
									</View>
								</TouchableOpacity>
							</View>

							{/* Row 2 */}
							<View className="flex-row w-full">
								{/* Calories Burned */}
								<TouchableOpacity
									className="w-[48%] mr-[4%]"
									onPress={handleCaloriesPress}
									activeOpacity={0.8}
								>
									<View
										style={{ backgroundColor: colors.card }}
										className="rounded-2xl p-4 shadow-sm"
									>
										<View
											style={{
												backgroundColor: isDarkMode ? "#7F1D1D" : "#FEE2E2",
											}}
											className="w-10 h-10 rounded-full items-center justify-center mb-2"
										>
											<Flame
												size={18}
												color={isDarkMode ? "#F87171" : "#EF4444"}
											/>
										</View>
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs"
										>
											Calories Burned
										</Text>
										<View className="flex-row items-baseline mt-1">
											<Text
												style={{ color: colors.text }}
												className="text-2xl font-bold"
											>
												{statisticsData.caloriesBurned.value}
											</Text>
											<Text
												style={{ color: colors.secondaryText }}
												className="text-sm"
											>
												{statisticsData.caloriesBurned.change}
											</Text>
										</View>
									</View>
								</TouchableOpacity>

								{/* Distance */}
								<TouchableOpacity
									className="w-[48%]"
									onPress={handleDistancePress}
									activeOpacity={0.8}
								>
									<View
										style={{ backgroundColor: colors.card }}
										className="rounded-2xl p-4 shadow-sm"
									>
										<View
											style={{
												backgroundColor: isDarkMode ? "#064E3B" : "#D1FAE5",
											}}
											className="w-10 h-10 rounded-full items-center justify-center mb-2"
										>
											<Route
												size={18}
												color={isDarkMode ? "#34D399" : "#10B981"}
											/>
										</View>
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs"
										>
											Distance
										</Text>
										<View className="flex-row items-baseline mt-1">
											<Text
												style={{ color: colors.text }}
												className="text-2xl font-bold"
											>
												{statisticsData.distance.value} km
											</Text>
											<Text
												style={{ color: colors.secondaryText }}
												className="text-sm"
											>
												{statisticsData.distance.change}
											</Text>
										</View>
									</View>
								</TouchableOpacity>
							</View>
						</View>
					</View>

					{/* Activity Trends */}
					<View
						style={{ paddingHorizontal: horizontalPadding }}
						className="mb-8"
					>
						<Text
							style={{ color: colors.text }}
							className="text-lg font-semibold mb-4"
						>
							Activity Trends
						</Text>

						<View
							style={{ backgroundColor: colors.card }}
							className="rounded-2xl p-4 shadow-sm"
						>
							<View className="flex-row justify-between items-end h-36 mb-2">
								{activityTrendsData.map((day, index) => (
									<View key={index} className="items-center">
										{renderBar(day.value)}
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs"
										>
											{day.day}
										</Text>
									</View>
								))}
							</View>
						</View>
					</View>

					{/* Recent Achievements */}
					<View
						style={{ paddingHorizontal: horizontalPadding }}
						className="mb-20"
					>
						<Text
							style={{ color: colors.text }}
							className="text-lg font-semibold mb-4"
						>
							Recent Achievements
						</Text>

						{achievementsData.map((achievement) => (
							<TouchableOpacity
								key={achievement.id}
								onPress={() => handleAchievementPress(achievement.id)}
								activeOpacity={0.8}
							>
								<View
									style={{ backgroundColor: colors.card }}
									className="rounded-2xl p-4 shadow-sm mb-3 flex-row items-center"
								>
									<View
										style={{
											backgroundColor: isDarkMode ? "#312E81" : "#E0E7FF",
										}}
										className="w-10 h-10 rounded-full items-center justify-center mr-3"
									>
										<Medal
											size={18}
											color={isDarkMode ? "#8B5CF6" : "#6366F1"}
										/>
									</View>
									<View className="flex-1">
										<Text
											style={{ color: colors.text }}
											className="font-semibold"
										>
											{achievement.title}
										</Text>
										<Text
											style={{ color: colors.secondaryText }}
											className="text-xs mt-1"
										>
											{achievement.date}
										</Text>
									</View>
									<ChevronRight size={18} color={colors.secondaryText} />
								</View>
							</TouchableOpacity>
						))}
					</View>
				</ScrollView>

				<BottomNavigation activeTab="progress" />
			</View>
		</SafeAreaView>
	);
}
