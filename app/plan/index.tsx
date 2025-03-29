import React, { useState, useCallback, useEffect, useRef } from "react";
import {
	View,
	Text,
	ScrollView,
	SafeAreaView,
	TouchableOpacity,
	RefreshControl,
	useWindowDimensions,
	useColorScheme,
	Image,
	Platform,
	Animated,
	Modal,
} from "react-native";
import { Stack, router } from "expo-router";
import {
	Calendar as CalendarIcon,
	Clock,
	Dumbbell,
	ChevronRight,
	Plus,
	Check,
	ArrowRight,
	Calendar,
	MoreVertical,
	Flame,
	ChevronLeft,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import BottomNavigation from "../components/BottomNavigation";
import ThemeModule from "../utils/theme";

const { useTheme } = ThemeModule;

// Helper function to format date for display
const formatDate = (date: Date) => {
	const options: Intl.DateTimeFormatOptions = { month: "long" };
	return (
		new Intl.DateTimeFormat("en-US", options).format(date) +
		" " +
		date.getFullYear()
	);
};

// Mock data - would come from Supabase in a real implementation
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today = new Date();
const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

const weekDates = daysOfWeek.map((day, index) => {
	const date = new Date(today);
	date.setDate(today.getDate() - currentDay + index);
	return {
		day,
		date: date.getDate(),
		full: date,
		isToday: date.getDate() === today.getDate(),
	};
});

// Define Exercise type
type Exercise = {
	name: string;
	sets: number;
	reps: string;
	muscle: string;
};

// Define Workout type
type Workout = {
	id: string;
	title: string;
	time: string;
	duration: string;
	intensity: string;
	calories: string;
	completed: boolean;
	imageUrl: string;
	exercises?: Exercise[];
};

const workoutSchedule = [
	{
		day: 0,
		workouts: [
			{
				id: "1",
				title: "Full Body HIIT",
				time: "9:00 AM",
				duration: "30 mins",
				intensity: "High",
				calories: "320",
				completed: false,
				imageUrl:
					"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
				exercises: [
					{ name: "Push-ups", sets: 3, reps: "12 reps", muscle: "Chest" },
					{ name: "Jump Squats", sets: 3, reps: "15 reps", muscle: "Legs" },
					{ name: "Plank", sets: 3, reps: "30 sec", muscle: "Core" },
					{ name: "Burpees", sets: 3, reps: "10 reps", muscle: "Full Body" },
				],
			},
		],
	},
	{ day: 1, workouts: [] },
	{
		day: 2,
		workouts: [
			{
				id: "2",
				title: "Core Crusher",
				time: "6:30 PM",
				duration: "20 mins",
				intensity: "Medium",
				calories: "220",
				completed: true,
				imageUrl:
					"https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80",
				exercises: [
					{ name: "Crunches", sets: 3, reps: "15 reps", muscle: "Abs" },
					{
						name: "Russian Twists",
						sets: 3,
						reps: "20 reps",
						muscle: "Obliques",
					},
					{ name: "Leg Raises", sets: 3, reps: "12 reps", muscle: "Lower Abs" },
					{
						name: "Mountain Climbers",
						sets: 3,
						reps: "30 sec",
						muscle: "Core",
					},
				],
			},
		],
	},
	{ day: 3, workouts: [] },
	{
		day: 4,
		workouts: [
			{
				id: "3",
				title: "Upper Body Blast",
				time: "7:00 AM",
				duration: "25 mins",
				intensity: "Medium",
				calories: "280",
				completed: false,
				imageUrl:
					"https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80",
				exercises: [
					{
						name: "Shoulder Press",
						sets: 3,
						reps: "12 reps",
						muscle: "Shoulders",
					},
					{ name: "Tricep Dips", sets: 3, reps: "15 reps", muscle: "Triceps" },
					{ name: "Pull-ups", sets: 3, reps: "8 reps", muscle: "Back" },
					{ name: "Push-ups", sets: 3, reps: "12 reps", muscle: "Chest" },
				],
			},
		],
	},
	{ day: 5, workouts: [] },
	{
		day: 6,
		workouts: [
			{
				id: "4",
				title: "Cardio Kickboxing",
				time: "10:00 AM",
				duration: "35 mins",
				intensity: "High",
				calories: "400",
				completed: false,
				imageUrl:
					"https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=500&q=80",
				exercises: [
					{ name: "Jabs", sets: 3, reps: "20 reps", muscle: "Arms" },
					{ name: "High Knees", sets: 3, reps: "30 sec", muscle: "Cardio" },
					{
						name: "Roundhouse Kicks",
						sets: 3,
						reps: "10 each leg",
						muscle: "Legs",
					},
					{ name: "Burpees", sets: 3, reps: "12 reps", muscle: "Full Body" },
				],
			},
		],
	},
];

// Sample completed workouts for weekly summary
const completedWorkouts = [
	{ day: "Mon", value: 1, target: 1 },
	{ day: "Tue", value: 0, target: 0 },
	{ day: "Wed", value: 1, target: 1 },
	{ day: "Thu", value: 0, target: 0 },
	{ day: "Fri", value: 0, target: 1 },
	{ day: "Sat", value: 0, target: 1 },
	{ day: "Sun", value: 0, target: 1 },
];

// Add function to format date in a readable format like "Mon, Aug 22"
const formatDisplayDate = (date: Date) => {
	const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	const dayOfWeek = days[date.getDay()];
	const month = months[date.getMonth()];
	const dayOfMonth = date.getDate();

	return `${dayOfWeek}, ${month} ${dayOfMonth}`;
};

// Function to get current month name
const getMonthName = (date: Date) => {
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	return months[date.getMonth()];
};

export default function PlanScreen() {
	const { width } = useWindowDimensions();
	const isSmallDevice = width < 380;
	const isMediumDevice = width >= 380 && width < 600;
	const isLargeDevice = width >= 600;
	const isExtraLargeDevice = width >= 1024;
	const { theme: currentTheme, colors } = useTheme();
	const isDarkMode = currentTheme === "dark";

	// Animation values
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(20)).current;

	// Calculate responsive sizes
	const contentPadding = isExtraLargeDevice
		? 32
		: isLargeDevice
		? 24
		: isMediumDevice
		? 16
		: 12;

	const [selectedDay, setSelectedDay] = useState(currentDay);
	const [refreshing, setRefreshing] = useState(false);
	const [monthDisplay, setMonthDisplay] = useState(formatDate(new Date()));
	const [showCalendarModal, setShowCalendarModal] = useState(false);
	const [calendarMonth, setCalendarMonth] = useState(new Date());
	const [showYearSelector, setShowYearSelector] = useState(false);
	const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());

	// Handle calendar icon press in header
	const handleCalendarPress = () => {
		setShowCalendarModal(true);
		// Reset the calendar month to current month when opening
		const currentDate = new Date();
		setCalendarMonth(currentDate);
		setSelectedCalendarDate(currentDate);
	};

	// Function to handle month navigation
	const navigateMonth = (direction: number) => {
		const newMonth = new Date(calendarMonth);
		newMonth.setMonth(newMonth.getMonth() + direction);
		setCalendarMonth(newMonth);

		// Keep the day the same if possible in the new month
		const newSelectedDate = new Date(selectedCalendarDate);
		newSelectedDate.setMonth(newSelectedDate.getMonth() + direction);
		// Check if the day exists in the new month
		const daysInMonth = new Date(
			newSelectedDate.getFullYear(),
			newSelectedDate.getMonth() + 1,
			0
		).getDate();
		if (newSelectedDate.getDate() > daysInMonth) {
			newSelectedDate.setDate(daysInMonth);
		}
		setSelectedCalendarDate(newSelectedDate);
	};

	// Function to generate days for the calendar
	const getDaysInMonth = (year: number, month: number) => {
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const firstDayOfMonth = new Date(year, month, 1).getDay();

		let days: (number | null)[] = [];

		// Add empty slots for days before the first day of the month
		for (let i = 0; i < firstDayOfMonth; i++) {
			days.push(null);
		}

		// Add days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(day);
		}

		return days;
	};

	// Function to select a date from the calendar
	const selectDate = (day: number | null) => {
		if (!day) return; // Skip empty slots

		const newDate = new Date(calendarMonth);
		newDate.setDate(day);

		// Update the selected calendar date
		setSelectedCalendarDate(newDate);

		// Update the month display
		setMonthDisplay(formatDate(newDate));

		// Find the day of week
		const dayOfWeek = newDate.getDay();
		setSelectedDay(dayOfWeek);

		// Close the modal
		setShowCalendarModal(false);
	};

	// Function to fetch workout schedule data
	const fetchWorkoutSchedule = async () => {
		try {
			// In a real implementation, this would fetch data from your API/Supabase
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch (error) {
			console.error("Error fetching workout schedule:", error);
		}
	};

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchWorkoutSchedule();
		setRefreshing(false);
	}, []);

	const selectedDayWorkouts =
		workoutSchedule.find((schedule) => schedule.day === selectedDay)
			?.workouts || [];

	// Animate in the content on mount
	useEffect(() => {
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
	}, []);

	// Get weekly workout stats
	const totalWeeklyWorkouts = completedWorkouts.reduce(
		(acc, curr) => acc + curr.value,
		0
	);
	const totalWeeklyTargets = completedWorkouts.reduce(
		(acc, curr) => acc + curr.target,
		0
	);
	const weeklyProgress =
		totalWeeklyTargets > 0
			? Math.round((totalWeeklyWorkouts / totalWeeklyTargets) * 100)
			: 0;

	// Add function to generate years for selector
	const generateYearOptions = () => {
		const currentYear = new Date().getFullYear();
		const years = [];
		// Show 5 years before and 10 years after current year
		for (let year = currentYear - 5; year <= currentYear + 10; year++) {
			years.push(year);
		}
		return years;
	};

	// Add function to handle year selection
	const selectYear = (year: number) => {
		const newDate = new Date(calendarMonth);
		newDate.setFullYear(year);
		setCalendarMonth(newDate);

		// Update the selected date with the new year
		const newSelectedDate = new Date(selectedCalendarDate);
		newSelectedDate.setFullYear(year);
		setSelectedCalendarDate(newSelectedDate);

		setShowYearSelector(false);
	};

	// Update the handleYearSelector function
	const handleYearSelector = () => {
		// Toggle the year selector visibility
		setShowYearSelector(!showYearSelector);
	};

	// Add this helper function before the return statement
	const getMuscleColor = (muscle: string, isDarkMode: boolean) => {
		switch (muscle.toLowerCase()) {
			case "chest":
				return isDarkMode ? "#EC4899" : "#BE185D";
			case "back":
				return isDarkMode ? "#8B5CF6" : "#5B21B6";
			case "arms":
			case "triceps":
			case "biceps":
			case "shoulders":
				return isDarkMode ? "#60A5FA" : "#1D4ED8";
			case "legs":
			case "quads":
			case "hamstrings":
			case "calves":
				return isDarkMode ? "#34D399" : "#047857";
			case "core":
			case "abs":
			case "obliques":
			case "lower abs":
				return isDarkMode ? "#FBBF24" : "#B45309";
			case "cardio":
			case "full body":
				return isDarkMode ? "#F87171" : "#B91C1C";
			default:
				return isDarkMode ? "#A78BFA" : "#6D28D9";
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
					headerShown: false,
				}}
			/>

			<View className="flex-1">
				{/* Header */}
				<View
					className="flex-row items-center justify-between border-b"
					style={{
						borderBottomColor: colors.border,
						backgroundColor: colors.card,
						paddingHorizontal: contentPadding,
						paddingVertical: contentPadding * 0.7,
						marginTop: Platform.OS === "ios" ? 20 : 10,
					}}
				>
					<Text
						className="font-bold"
						style={{
							color: colors.text,
							fontSize: isSmallDevice ? 16 : 18,
						}}
					>
						Workout Plan
					</Text>
					<TouchableOpacity
						onPress={handleCalendarPress}
						className="p-2 rounded-full"
						style={{
							backgroundColor: isDarkMode
								? "rgba(139, 92, 246, 0.15)"
								: "rgba(99, 102, 241, 0.08)",
						}}
					>
						<CalendarIcon
							size={isSmallDevice ? 18 : 20}
							color={isDarkMode ? "#8B5CF6" : "#6366F1"}
						/>
					</TouchableOpacity>
				</View>

				<ScrollView
					className="flex-1"
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor={isDarkMode ? "#8B5CF6" : "#6366F1"}
							colors={[isDarkMode ? "#8B5CF6" : "#6366F1"]}
							progressBackgroundColor={isDarkMode ? "#1E1E1E" : "#F3F4F6"}
						/>
					}
					contentContainerStyle={{
						paddingBottom: 100,
						...(isExtraLargeDevice && {
							maxWidth: 1200,
							alignSelf: "center",
							width: "100%",
						}),
					}}
				>
					{/* Weekly Progress */}
					<Animated.View
						style={{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
							backgroundColor: colors.card,
							marginHorizontal: contentPadding,
							marginTop: contentPadding + 6,
							marginBottom: contentPadding + 8,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: isDarkMode ? 0.3 : 0.15,
							shadowRadius: 8,
							elevation: 5,
						}}
						className="mx-4 mt-6 mb-6 rounded-3xl overflow-hidden"
					>
						<LinearGradient
							colors={
								isDarkMode ? ["#8B5CF6", "#6D28D9"] : ["#818CF8", "#4F46E5"]
							}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								right: 0,
								height: 4,
							}}
						/>
						<View className="p-5">
							<View className="flex-row justify-between items-center mb-4">
								<Text
									className="font-bold"
									style={{
										color: colors.text,
										fontSize: isSmallDevice ? 15 : 17,
									}}
								>
									Weekly Progress
								</Text>
								<View
									className="flex-row items-center px-3 py-1 rounded-full"
									style={{
										backgroundColor: isDarkMode
											? "rgba(139, 92, 246, 0.15)"
											: "rgba(99, 102, 241, 0.08)",
									}}
								>
									<Text
										style={{
											color: isDarkMode ? "#A78BFA" : "#4F46E5",
											fontSize: isSmallDevice ? 12 : 14,
											fontWeight: "600",
										}}
									>
										{totalWeeklyWorkouts}/{totalWeeklyTargets} completed
									</Text>
								</View>
							</View>

							{/* Progress visualization */}
							<View className="flex-row justify-between items-end mb-2">
								{completedWorkouts.map((day, index) => (
									<View key={index} className="items-center">
										<View
											className="relative"
											style={{ width: isSmallDevice ? 25 : 30 }}
										>
											<View
												className="rounded-t-md mb-2"
												style={{
													width: isSmallDevice ? 8 : 10,
													height: day.target
														? isSmallDevice
															? 70 * (day.target / 1)
															: 90 * (day.target / 1)
														: 4,
													backgroundColor: isDarkMode ? "#374151" : "#E5E7EB",
													alignSelf: "center",
												}}
											>
												{day.value > 0 && (
													<View
														className="absolute bottom-0 rounded-t-md"
														style={{
															width: isSmallDevice ? 8 : 10,
															height: day.value
																? isSmallDevice
																	? 70 * (day.value / 1)
																	: 90 * (day.value / 1)
																: 0,
															backgroundColor: isDarkMode
																? "#8B5CF6"
																: "#6366F1",
														}}
													/>
												)}
											</View>
											<Text
												style={{
													color: colors.secondaryText,
													fontSize: isSmallDevice ? 10 : 12,
													textAlign: "center",
												}}
											>
												{day.day}
											</Text>
										</View>
									</View>
								))}
							</View>

							{/* Progress bar */}
							<View
								className="h-2 rounded-full overflow-hidden mt-3"
								style={{
									backgroundColor: isDarkMode ? "#374151" : "#E5E7EB",
									marginTop: 10,
									flexDirection: "row",
								}}
							>
								<View
									style={{
										flex: weeklyProgress,
										height: "100%",
										backgroundColor: isDarkMode ? "#8B5CF6" : "#6366F1",
									}}
								/>
								<View style={{ flex: 100 - weeklyProgress }} />
							</View>

							<Text
								style={{
									color: colors.secondaryText,
									fontSize: 12,
									marginTop: 8,
									textAlign: "right",
									fontWeight: "500",
								}}
							>
								{weeklyProgress + "% of weekly goal"}
							</Text>
						</View>
					</Animated.View>

					{/* Calendar Strip */}
					<Animated.View
						style={{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
							marginHorizontal: contentPadding,
						}}
						className="mb-8"
					>
						<View className="flex-row justify-between items-center mb-5">
							<View className="flex-row items-center">
								<Calendar
									size={isSmallDevice ? 16 : 18}
									color={isDarkMode ? "#8B5CF6" : "#6366F1"}
									style={{ marginRight: 8 }}
								/>
								<Text
									className="font-bold"
									style={{
										color: colors.text,
										fontSize: isSmallDevice ? 15 : 17,
									}}
								>
									{monthDisplay}
								</Text>
							</View>
							<TouchableOpacity
								className="flex-row items-center"
								onPress={() => router.push("/calendar" as any)}
								style={{
									backgroundColor: isDarkMode
										? "rgba(139, 92, 246, 0.15)"
										: "rgba(99, 102, 241, 0.08)",
									paddingHorizontal: 12,
									paddingVertical: 6,
									borderRadius: 16,
								}}
							>
								<Text
									style={{
										color: isDarkMode ? "#8B5CF6" : "#6366F1",
										fontSize: isSmallDevice ? 12 : 14,
										marginRight: 6,
										fontWeight: "500",
									}}
								>
									View Calendar
								</Text>
								<ArrowRight
									size={isSmallDevice ? 14 : 16}
									color={isDarkMode ? "#8B5CF6" : "#6366F1"}
								/>
							</TouchableOpacity>
						</View>

						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{
								paddingVertical: 4,
							}}
							className="mb-2"
						>
							{weekDates.map((date, index) => {
								const isSelected = selectedDay === index;
								const hasWorkout =
									(workoutSchedule.find((schedule) => schedule.day === index)
										?.workouts?.length ?? 0) > 0;

								return (
									<TouchableOpacity
										key={index}
										onPress={() => setSelectedDay(index)}
										className="items-center mr-3"
										style={{
											width: isSmallDevice ? 50 : 60,
										}}
									>
										<View
											className="w-12 h-12 rounded-full items-center justify-center mb-1"
											style={{
												backgroundColor: isSelected
													? isDarkMode
														? "#8B5CF6"
														: "#6366F1"
													: date.isToday
													? isDarkMode
														? "rgba(139, 92, 246, 0.2)"
														: "rgba(99, 102, 241, 0.1)"
													: isDarkMode
													? "#1F2937"
													: "#F9FAFB",
												borderWidth: 1,
												borderColor: isSelected
													? isDarkMode
														? "#9333EA"
														: "#4F46E5"
													: date.isToday
													? isDarkMode
														? "#9333EA"
														: "#4F46E5"
													: isDarkMode
													? "#374151"
													: "#E5E7EB",
												shadowColor: "#000",
												shadowOffset: { width: 0, height: 2 },
												shadowOpacity: isSelected ? 0.3 : 0.1,
												shadowRadius: 3,
												elevation: isSelected ? 3 : 1,
											}}
										>
											<Text
												style={{
													color: isSelected
														? "#FFFFFF"
														: date.isToday
														? isDarkMode
															? "#C4B5FD"
															: "#4F46E5"
														: colors.text,
													fontWeight: "600",
													fontSize: isSmallDevice ? 14 : 16,
												}}
											>
												{date.date}
											</Text>
										</View>
										<Text
											style={{
												color: colors.secondaryText,
												fontSize: isSmallDevice ? 10 : 12,
											}}
										>
											{date.day}
										</Text>
										{hasWorkout && (
											<View
												className="mt-1 h-1 rounded-full"
												style={{
													width: isSmallDevice ? 12 : 16,
													backgroundColor: isSelected
														? isDarkMode
															? "#8B5CF6"
															: "#6366F1"
														: isDarkMode
														? "#6D28D9"
														: "#818CF8",
												}}
											/>
										)}
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					</Animated.View>

					{/* Workouts for Selected Day */}
					<Animated.View
						style={{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
							marginHorizontal: contentPadding,
						}}
					>
						<View className="flex-row justify-between items-center mb-5">
							<View className="flex-row items-center">
								<Dumbbell
									size={isSmallDevice ? 16 : 18}
									color={isDarkMode ? "#8B5CF6" : "#6366F1"}
									style={{ marginRight: 8 }}
								/>
								<Text
									className="font-bold"
									style={{
										color: colors.text,
										fontSize: isSmallDevice ? 15 : 17,
									}}
								>
									{selectedDayWorkouts.length > 0
										? "Today's Workouts"
										: "No Workouts Scheduled"}
								</Text>
							</View>
							<TouchableOpacity
								className="flex-row items-center"
								onPress={() => router.push("/library" as any)}
								style={{
									backgroundColor: isDarkMode
										? "rgba(139, 92, 246, 0.2)"
										: "rgba(99, 102, 241, 0.1)",
									paddingHorizontal: 12,
									paddingVertical: 8,
									borderRadius: 16,
									shadowColor: "#000",
									shadowOffset: { width: 0, height: 1 },
									shadowOpacity: isDarkMode ? 0.3 : 0.1,
									shadowRadius: 2,
									elevation: 2,
								}}
							>
								<Plus
									size={isSmallDevice ? 14 : 16}
									color={isDarkMode ? "#8B5CF6" : "#6366F1"}
								/>
								<Text
									style={{
										color: isDarkMode ? "#8B5CF6" : "#6366F1",
										fontSize: isSmallDevice ? 12 : 14,
										marginLeft: 4,
										fontWeight: "600",
									}}
								>
									Add Workout
								</Text>
							</TouchableOpacity>
						</View>

						{selectedDayWorkouts.length > 0 ? (
							selectedDayWorkouts.map((workout, index) => (
								<TouchableOpacity
									key={index}
									className="mb-5 rounded-3xl overflow-hidden"
									style={{
										backgroundColor: colors.card,
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 3 },
										shadowOpacity: isDarkMode ? 0.25 : 0.12,
										shadowRadius: 5,
										elevation: 4,
									}}
									onPress={() => router.push(`/workout/${workout.id}` as any)}
								>
									{/* Header section with image */}
									<View
										style={{
											height: isExtraLargeDevice
												? 140
												: isLargeDevice
												? 130
												: isMediumDevice
												? 120
												: 110,
										}}
									>
										<View className="flex-row h-full">
											{/* Workout Image */}
											<View
												style={{
													width: "35%",
													position: "relative",
												}}
											>
												<Image
													source={{ uri: workout.imageUrl }}
													style={{
														width: "100%",
														height: "100%",
													}}
													resizeMode="cover"
												/>
												{workout.completed && (
													<View
														className="absolute top-3 left-3 rounded-full p-1"
														style={{
															backgroundColor: "rgba(16, 185, 129, 0.9)",
															shadowColor: "#000",
															shadowOffset: { width: 0, height: 1 },
															shadowOpacity: 0.3,
															shadowRadius: 2,
														}}
													>
														<Check size={16} color="#FFFFFF" />
													</View>
												)}
												<LinearGradient
													colors={["transparent", "rgba(0,0,0,0.4)"]}
													start={{ x: 0.5, y: 0 }}
													end={{ x: 0.5, y: 1 }}
													style={{
														position: "absolute",
														left: 0,
														right: 0,
														bottom: 0,
														height: "40%",
													}}
												/>
											</View>

											{/* Workout Details */}
											<View
												className="flex-1 justify-between"
												style={{
													padding: isSmallDevice ? 10 : 12,
												}}
											>
												<View>
													<View className="flex-row items-center mb-2">
														<View
															className="rounded-full px-3 py-1 mr-3"
															style={{
																backgroundColor:
																	workout.intensity === "High"
																		? isDarkMode
																			? "rgba(239, 68, 68, 0.2)"
																			: "rgba(254, 226, 226, 1)"
																		: workout.intensity === "Medium"
																		? isDarkMode
																			? "rgba(59, 130, 246, 0.2)"
																			: "rgba(219, 234, 254, 1)"
																		: isDarkMode
																		? "rgba(16, 185, 129, 0.2)"
																		: "rgba(209, 250, 229, 1)",
															}}
														>
															<Text
																className="font-medium"
																style={{
																	color:
																		workout.intensity === "High"
																			? isDarkMode
																				? "#F87171"
																				: "#B91C1C"
																			: workout.intensity === "Medium"
																			? isDarkMode
																				? "#60A5FA"
																				: "#1E40AF"
																			: isDarkMode
																			? "#34D399"
																			: "#065F46",
																	fontSize: 10,
																	fontWeight: "600",
																}}
															>
																{workout.intensity}
															</Text>
														</View>
														<Text
															style={{
																color: isDarkMode ? "#C4B5FD" : "#6366F1",
																fontSize: isSmallDevice ? 11 : 13,
																fontWeight: "500",
															}}
														>
															{workout.time}
														</Text>
													</View>

													<Text
														className="font-bold mb-1"
														style={{
															color: colors.text,
															fontSize: isSmallDevice ? 15 : 17,
														}}
													>
														{workout.title}
													</Text>

													<View className="flex-row items-center">
														<View className="flex-row items-center mr-3">
															<Clock
																size={isSmallDevice ? 12 : 14}
																color={isDarkMode ? "#9CA3AF" : "#6B7280"}
															/>
															<Text
																className="ml-1"
																style={{
																	color: colors.secondaryText,
																	fontSize: isSmallDevice ? 10 : 12,
																}}
															>
																{workout.duration || ""}
															</Text>
														</View>
														<View className="flex-row items-center">
															<Flame
																size={isSmallDevice ? 12 : 14}
																color={isDarkMode ? "#9CA3AF" : "#6B7280"}
															/>
															<Text
																className="ml-1"
																style={{
																	color: colors.secondaryText,
																	fontSize: isSmallDevice ? 10 : 12,
																}}
															>
																{workout.calories
																	? workout.calories + " cal"
																	: ""}
															</Text>
														</View>
													</View>
												</View>

												<View className="flex-row justify-between items-center">
													<TouchableOpacity
														className="flex-row items-center"
														style={{
															backgroundColor: isDarkMode
																? "rgba(139, 92, 246, 0.15)"
																: "rgba(99, 102, 241, 0.1)",
															paddingHorizontal: 12,
															paddingVertical: 6,
															borderRadius: 12,
														}}
													>
														<Text
															style={{
																color: isDarkMode ? "#A78BFA" : "#7C3AED",
																fontSize: isSmallDevice ? 11 : 13,
																fontWeight: "600",
															}}
														>
															Start Workout
														</Text>
													</TouchableOpacity>

													<TouchableOpacity>
														<MoreVertical
															size={isSmallDevice ? 14 : 16}
															color={colors.secondaryText}
														/>
													</TouchableOpacity>
												</View>
											</View>
										</View>
									</View>

									{/* Exercise details section */}
									{workout.exercises && workout.exercises.length > 0 && (
										<View
											style={{
												paddingHorizontal: 16,
												paddingBottom: 16,
												borderTopWidth: 1,
												borderTopColor: isDarkMode
													? "rgba(255,255,255,0.05)"
													: "rgba(0,0,0,0.05)",
												marginTop: 6,
												paddingTop: 12,
											}}
										>
											<Text
												style={{
													fontSize: 14,
													fontWeight: "600",
													marginBottom: 10,
													color: colors.secondaryText,
												}}
											>
												EXERCISES
											</Text>

											<View style={{ flexDirection: "row", flexWrap: "wrap" }}>
												{workout.exercises.map((exercise, idx) => (
													<View
														key={idx}
														style={{
															width: "50%",
															paddingRight: idx % 2 === 0 ? 4 : 0,
															paddingLeft: idx % 2 === 1 ? 4 : 0,
															marginBottom: 8,
														}}
													>
														<View
															style={{
																backgroundColor: isDarkMode
																	? "rgba(75, 85, 99, 0.3)"
																	: "rgba(243, 244, 246, 1)",
																borderRadius: 10,
																padding: 10,
																borderLeftWidth: 3,
																borderLeftColor: getMuscleColor(
																	exercise.muscle,
																	isDarkMode
																),
															}}
														>
															<Text
																style={{
																	fontSize: 13,
																	fontWeight: "600",
																	color: colors.text,
																	marginBottom: 2,
																}}
															>
																{exercise.name}
															</Text>
															<View
																style={{
																	flexDirection: "row",
																	alignItems: "center",
																}}
															>
																<Text
																	style={{
																		fontSize: 11,
																		color: getMuscleColor(
																			exercise.muscle,
																			isDarkMode
																		),
																	}}
																>
																	{exercise.muscle}
																</Text>
																<Text
																	style={{
																		fontSize: 11,
																		color: colors.secondaryText,
																		marginLeft: "auto",
																	}}
																>
																	{exercise.sets} × {exercise.reps}
																</Text>
															</View>
														</View>
													</View>
												))}
											</View>
										</View>
									)}
								</TouchableOpacity>
							))
						) : (
							<View
								className="items-center py-10 rounded-3xl"
								style={{
									backgroundColor: colors.card,
									padding: 20,
									shadowColor: "#000",
									shadowOffset: { width: 0, height: 3 },
									shadowOpacity: isDarkMode ? 0.25 : 0.12,
									shadowRadius: 5,
									elevation: 4,
								}}
							>
								<View
									className="w-20 h-20 rounded-full items-center justify-center mb-6"
									style={{
										backgroundColor: isDarkMode
											? "rgba(139, 92, 246, 0.15)"
											: "rgba(99, 102, 241, 0.08)",
										shadowColor: isDarkMode ? "#8B5CF6" : "#6366F1",
										shadowOffset: { width: 0, height: 0 },
										shadowOpacity: 0.2,
										shadowRadius: 8,
										elevation: 3,
									}}
								>
									<Dumbbell
										size={32}
										color={isDarkMode ? "#8B5CF6" : "#6366F1"}
									/>
								</View>
								<Text
									className="font-bold mb-3 text-center"
									style={{
										color: colors.text,
										fontSize: 18,
									}}
								>
									Rest Day
								</Text>
								<Text
									className="text-center mb-6"
									style={{
										color: colors.secondaryText,
										fontSize: 14,
										lineHeight: 20,
										maxWidth: 270,
									}}
								>
									No workouts scheduled for this day. Take a rest or add a
									workout to your plan.
								</Text>
								<TouchableOpacity
									className="rounded-xl px-6 py-3 items-center"
									style={{
										backgroundColor: isDarkMode ? "#7C3AED" : "#6366F1",
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 2 },
										shadowOpacity: isDarkMode ? 0.4 : 0.2,
										shadowRadius: 4,
										elevation: 3,
									}}
									onPress={() => router.push("/library" as any)}
								>
									<Text
										className="font-semibold"
										style={{
											color: "#FFFFFF",
											fontSize: 15,
										}}
									>
										Browse Workouts
									</Text>
								</TouchableOpacity>
							</View>
						)}
					</Animated.View>
				</ScrollView>

				{/* Bottom Navigation */}
				<View className="absolute bottom-0 left-0 right-0">
					<BottomNavigation activeTab="plan" />
				</View>
			</View>

			{/* Calendar Modal */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={showCalendarModal}
				onRequestClose={() => setShowCalendarModal(false)}
			>
				<View
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						backgroundColor: "rgba(0,0,0,0.5)",
					}}
				>
					<View
						style={{
							width: "90%",
							maxHeight: "80%",
							backgroundColor: colors.card,
							borderRadius: 20,
							padding: 20,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.25,
							shadowRadius: 4,
							elevation: 5,
						}}
					>
						{/* Date header with simple layout */}
						<View
							style={{
								borderBottomWidth: 1,
								borderBottomColor: isDarkMode
									? "rgba(255,255,255,0.1)"
									: "rgba(0,0,0,0.05)",
								paddingBottom: 16,
								marginBottom: 16,
							}}
						>
							{/* Year and date display */}
							<View className="flex flex-row justify-between items-center">
								<View>
									<Text
										style={{
											color: colors.secondaryText,
											fontSize: 16,
											fontWeight: "600",
										}}
									>
										{selectedCalendarDate.getFullYear()}
									</Text>
									<Text
										style={{
											color: colors.text,
											fontSize: 20,
											fontWeight: "700",
											marginTop: 4,
										}}
									>
										{formatDisplayDate(selectedCalendarDate)}
									</Text>
								</View>

								{/* Time display */}
								<Text
									style={{
										color: colors.secondaryText,
										fontSize: 16,
										fontWeight: "500",
									}}
								>
									{new Date().toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</Text>
							</View>
						</View>

						{/* Month navigation header */}
						<View className="flex-row justify-between items-center mb-6">
							<TouchableOpacity
								onPress={() => navigateMonth(-1)}
								style={{
									width: 36,
									height: 36,
									alignItems: "center",
									justifyContent: "center",
									borderRadius: 18,
									backgroundColor: isDarkMode
										? "rgba(139, 92, 246, 0.15)"
										: "rgba(99, 102, 241, 0.08)",
								}}
							>
								<ChevronLeft
									size={18}
									color={isDarkMode ? "#8B5CF6" : "#6366F1"}
									strokeWidth={2.5}
								/>
							</TouchableOpacity>

							<View className="flex-row items-center">
								<Text
									style={{
										color: colors.text,
										fontSize: 16,
										fontWeight: "600",
									}}
								>
									{getMonthName(calendarMonth)} {calendarMonth.getFullYear()}
								</Text>
							</View>

							<TouchableOpacity
								onPress={() => navigateMonth(1)}
								style={{
									width: 36,
									height: 36,
									alignItems: "center",
									justifyContent: "center",
									borderRadius: 18,
									backgroundColor: isDarkMode
										? "rgba(139, 92, 246, 0.15)"
										: "rgba(99, 102, 241, 0.08)",
								}}
							>
								<ChevronRight
									size={18}
									color={isDarkMode ? "#8B5CF6" : "#6366F1"}
									strokeWidth={2.5}
								/>
							</TouchableOpacity>
						</View>

						{/* Calendar days of week header */}
						<View className="flex-row justify-between mb-4">
							{["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
								(day, index) => (
									<Text
										key={index}
										style={{
											color: colors.secondaryText,
											width: "14.28%",
											textAlign: "center",
											fontSize: 10,
											fontWeight: "600",
										}}
									>
										{day}
									</Text>
								)
							)}
						</View>

						{/* Calendar dates grid */}
						<View className="flex-wrap flex-row mb-5">
							{getDaysInMonth(
								calendarMonth.getFullYear(),
								calendarMonth.getMonth()
							).map((day, index) => {
								// Check if this day is today
								const isToday =
									day === new Date().getDate() &&
									calendarMonth.getMonth() === new Date().getMonth() &&
									calendarMonth.getFullYear() === new Date().getFullYear();

								// Get selected date properties
								const isSelected =
									day === selectedCalendarDate.getDate() &&
									calendarMonth.getMonth() ===
										selectedCalendarDate.getMonth() &&
									calendarMonth.getFullYear() ===
										selectedCalendarDate.getFullYear();

								// Check if this day has a scheduled workout
								const hasWorkout =
									day &&
									workoutSchedule.some((schedule) => {
										const scheduleDate = new Date(today);
										scheduleDate.setDate(day as number);
										return (
											schedule.day === scheduleDate.getDay() &&
											schedule.workouts.length > 0
										);
									});

								return (
									<View
										key={index}
										style={{
											width: "14.28%",
											height: 46,
											padding: 2,
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										{day ? (
											<TouchableOpacity
												className="items-center justify-center"
												style={{
													width: 36,
													height: 36,
													borderRadius: 36,
													backgroundColor: isSelected
														? isDarkMode
															? "#6D28D9"
															: "#4F46E5"
														: isToday
														? isDarkMode
															? "rgba(139, 92, 246, 0.2)"
															: "rgba(99, 102, 241, 0.1)"
														: "transparent",
												}}
												onPress={() => selectDate(day)}
											>
												<Text
													style={{
														color: isSelected
															? "#FFFFFF"
															: isToday
															? isDarkMode
																? "#C4B5FD"
																: "#4F46E5"
															: colors.text,
														fontWeight: isSelected || isToday ? "600" : "400",
														fontSize: 15,
													}}
												>
													{day < 10 ? `0${day}` : day}
												</Text>
												{hasWorkout && !isSelected && (
													<View
														className="h-1 w-1 rounded-full mt-1"
														style={{
															backgroundColor: isDarkMode
																? "#8B5CF6"
																: "#6366F1",
														}}
													/>
												)}
											</TouchableOpacity>
										) : (
											<View style={{ width: 36, height: 36 }} />
										)}
									</View>
								);
							})}
						</View>

						{/* Action button */}
						<TouchableOpacity
							className="py-3 rounded-lg items-center mt-3"
							style={{
								backgroundColor: isDarkMode ? "#7C3AED" : "#6366F1",
							}}
							onPress={() => setShowCalendarModal(false)}
						>
							<Text
								style={{
									color: "#FFFFFF",
									fontWeight: "600",
									fontSize: 16,
								}}
							>
								Done
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
