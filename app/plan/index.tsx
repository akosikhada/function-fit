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
	Alert,
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
	Trash2,
	CheckCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import BottomNavigation from "../components/BottomNavigation";
import ThemeModule from "../utils/theme";
import { supabase } from "../utils/supabase";

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

// Helper function to format a date for display in the calendar modal
const formatDisplayDate = (date: Date) => {
	const options: Intl.DateTimeFormatOptions = {
		weekday: "long",
		month: "long",
		day: "numeric",
	};
	return new Intl.DateTimeFormat("en-US", options).format(date);
};

// Helper function to get the month name
const getMonthName = (date: Date) => {
	const options: Intl.DateTimeFormatOptions = { month: "long" };
	return new Intl.DateTimeFormat("en-US", options).format(date);
};

// Get today's date and current day of week
const today = new Date();
const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

// Define the types needed for our workout data
type Exercise = {
	name: string;
	sets: number;
	reps: string;
	muscle: string;
};

// Define Workout type
type Workout = {
	id: string;
	planId: string;
	title: string;
	time?: string;
	duration: string;
	intensity: string;
	calories: string;
	completed: boolean;
	imageUrl: string;
	exercises?: Exercise[];
};

// Define the type for our schedule
type WorkoutScheduleDay = {
	day: number;
	workouts: Workout[];
};

// Define the WorkoutPlan type as returned from the database
type WorkoutPlan = {
	id: string;
	scheduled_date: string;
	scheduled_time?: string;
	workouts: {
		id: string;
		title: string;
		duration: number;
		calories: number;
		difficulty: string;
		image_url?: string;
	};
};

// Define type for weekly progress data
type WeeklyProgressItem = {
	day: string;
	value: number;
	target: number;
	date: string;
};

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

// Helper function to get user from Supabase
const getUser = async () => {
	const { data: { user } } = await supabase.auth.getUser();
	return user;
};

// Helper function to get workout plans for a specific date
const getWorkoutPlans = async (userId: string, date: string): Promise<WorkoutPlan[]> => {
	const { data, error } = await supabase
		.from("workout_plans")
		.select(
			`
      id,
      scheduled_date,
      scheduled_time,
      workouts:workout_id (id, title, duration, calories, difficulty, image_url)
    `
		)
		.eq("user_id", userId)
		.eq("scheduled_date", date);

	if (error) throw error;
	return data as unknown as WorkoutPlan[];
};

// Helper function to generate week dates
const getWeekDates = () => {
	const dates = [];
	const today = new Date();
	const dayOfWeek = today.getDay();

	// Calculate the start of the week (Sunday)
	const startDate = new Date(today);
	startDate.setDate(today.getDate() - dayOfWeek);

	// Generate dates for the week
	for (let i = 0; i < 7; i++) {
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + i);
		dates.push({
			date: date.getDate(),
			day: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][i],
			isToday: i === dayOfWeek,
			fullDate: date.toISOString().split('T')[0] // format: YYYY-MM-DD
		});
	}
	return dates;
};

const weekDates = getWeekDates();

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
	
	// Success modal animation values
	const successScaleAnim = useRef(new Animated.Value(0.3)).current;
	const successOpacityAnim = useRef(new Animated.Value(0)).current;
	const checkmarkScaleAnim = useRef(new Animated.Value(0)).current;

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
	const [workoutSchedule, setWorkoutSchedule] = useState<WorkoutScheduleDay[]>([
		{ day: 0, workouts: [] },
		{ day: 1, workouts: [] },
		{ day: 2, workouts: [] },
		{ day: 3, workouts: [] },
		{ day: 4, workouts: [] },
		{ day: 5, workouts: [] },
		{ day: 6, workouts: [] },
	]);
	const [isLoading, setIsLoading] = useState(true);
	const [menuVisible, setMenuVisible] = useState(false);
	const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState<{id: string, title: string} | null>(null);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [deletedWorkoutTitle, setDeletedWorkoutTitle] = useState("");
	const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressItem[]>([]);
	const [weeklyProgressPercent, setWeeklyProgressPercent] = useState(0);

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

	// Function to delete a workout from the plan
	const deleteWorkout = async (planId: string) => {
		try {
			// Close the menu
			setMenuVisible(false);
			
			// Store the workout title before deleting
			const workoutTitle = selectedWorkoutPlan?.title || "Workout";
			setDeletedWorkoutTitle(workoutTitle);
			
			// Get the current user
			const user = await getUser();
			if (!user) return;
			
			// Delete from database
			const { error } = await supabase
				.from("workout_plans")
				.delete()
				.eq("id", planId);
				
			if (error) throw error;
			
			// Refresh the data
			fetchWorkoutSchedule();
			
			// Show success modal instead of Alert
			setShowSuccessModal(true);
			
			// Animate the success modal elements
			Animated.sequence([
				Animated.parallel([
					Animated.timing(successScaleAnim, {
						toValue: 1,
						duration: 300,
						useNativeDriver: true,
					}),
					Animated.timing(successOpacityAnim, {
						toValue: 1,
						duration: 300,
						useNativeDriver: true,
					}),
				]),
				Animated.timing(checkmarkScaleAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start();
			
			// Auto-hide the success modal after 2.5 seconds
			setTimeout(() => {
				setShowSuccessModal(false);
				// Reset animation values
				successScaleAnim.setValue(0.3);
				successOpacityAnim.setValue(0);
				checkmarkScaleAnim.setValue(0);
			}, 2500);
			
		} catch (error) {
			console.error("Error deleting workout:", error);
			Alert.alert("Error", "Failed to remove workout. Please try again.");
		}
	};
	
	// Function to handle opening the menu
	const handleOpenMenu = (workout: Workout, planId: string) => {
		setSelectedWorkoutPlan({
			id: planId,
			title: workout.title
		});
		setMenuVisible(true);
	};

	// Function to fetch workout schedule data
	const fetchWorkoutSchedule = async () => {
		try {
			setIsLoading(true);
			
			// Get the current user
			const user = await getUser();
			if (!user) {
				setIsLoading(false);
				return;
			}
			
			// Prepare an empty schedule structure
			const newSchedule: WorkoutScheduleDay[] = Array(7).fill(0).map((_, i) => ({
				day: i,
				workouts: []
			}));
			
			// Get today's date and create dates for the entire week
			const today = new Date();
			
			// Fetch workout plans for each day of the week
			for (let i = 0; i < 7; i++) {
				try {
					const plans = await getWorkoutPlans(user.id, weekDates[i].fullDate);
					
					if (plans && plans.length > 0) {
						// Convert to our Workout format
						const workoutsForDay = plans.map(plan => ({
							id: plan.workouts.id,
							planId: plan.id,
							title: plan.workouts.title,
							duration: `${plan.workouts.duration || 30} mins`,
							intensity: plan.workouts.difficulty || "Medium",
							calories: `${plan.workouts.calories || 0}`,
							completed: false, // We could check if it's completed in a real app
							imageUrl: plan.workouts.image_url || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
							time: plan.scheduled_time || "Any time",
							exercises: [] // Could be fetched in a real app
						}));
						
						// Add to schedule
						newSchedule[i].workouts = workoutsForDay;
					}
				} catch (error) {
					console.error(`Error fetching workouts for day ${i}:`, error);
				}
			}
			
			// Update the workout schedule state
			setWorkoutSchedule(newSchedule);
			setIsLoading(false);
		} catch (error) {
			console.error("Error fetching workout schedule:", error);
			setIsLoading(false);
		}
	};

	// Function to fetch weekly progress data
	const fetchWeeklyProgress = async () => {
		try {
			// Get the current user
			const user = await getUser();
			if (!user) return;
			
			// Get the start and end dates of the current week
			const today = new Date();
			const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
			
			// Calculate the start date (Sunday) of the current week
			const startDate = new Date(today);
			startDate.setDate(today.getDate() - dayOfWeek);
			startDate.setHours(0, 0, 0, 0);
			
			// Calculate the end date (Saturday) of the current week
			const endDate = new Date(startDate);
			endDate.setDate(startDate.getDate() + 6);
			endDate.setHours(23, 59, 59, 999);
			
			// Format dates for query
			const startDateStr = startDate.toISOString().split("T")[0];
			const endDateStr = endDate.toISOString().split("T")[0];
			
			// Query for all scheduled workouts in the date range
			const { data: scheduledWorkouts, error: scheduleError } = await supabase
				.from("workout_plans")
				.select(`
					id,
					scheduled_date,
					workout_id
				`)
				.eq("user_id", user.id)
				.gte("scheduled_date", startDateStr)
				.lte("scheduled_date", endDateStr)
				.order("scheduled_date", { ascending: true });
				
			if (scheduleError) throw scheduleError;
			
			// Query for completed workouts in the user_workouts table
			const { data: completedWorkouts, error: completedError } = await supabase
				.from("user_workouts")
				.select(`
					id,
					workout_id,
					completed_at
				`)
				.eq("user_id", user.id)
				.gte("completed_at", startDate.toISOString())
				.lte("completed_at", endDate.toISOString());
				
			if (completedError) throw completedError;
			
			// Organize data by day of week
			const progressByDay: Record<number, {completed: number, total: number, date: string}> = {};
			
			// Initialize with empty counts for all days
			for (let i = 0; i < 7; i++) {
				const dayDate = new Date(startDate);
				dayDate.setDate(startDate.getDate() + i);
				progressByDay[i] = {
					completed: 0,
					total: 0,
					date: dayDate.toISOString().split('T')[0]
				};
			}
			
			// Count scheduled workouts by day
			scheduledWorkouts?.forEach(workout => {
				const workoutDate = new Date(workout.scheduled_date);
				const dayIndex = workoutDate.getDay();
				progressByDay[dayIndex].total += 1;
			});
			
			// Get completed workout IDs
			const completedWorkoutIds = new Set(completedWorkouts?.map(workout => workout.workout_id) || []);
			
			// Count completed workouts based on completed workout IDs
			scheduledWorkouts?.forEach(workout => {
				if (completedWorkoutIds.has(workout.workout_id)) {
					const workoutDate = new Date(workout.scheduled_date);
					const dayIndex = workoutDate.getDay();
					progressByDay[dayIndex].completed += 1;
				}
			});
			
			// Convert to array format for display
			const progressData: WeeklyProgressItem[] = Object.entries(progressByDay).map(([dayIndex, data]) => ({
				day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][parseInt(dayIndex)],
				value: data.completed,
				target: data.total,
				date: data.date
			}));
			
			setWeeklyProgress(progressData);
			
			// Calculate overall weekly progress percentage
			const totalCompleted = progressData.reduce((sum, day) => sum + day.value, 0);
			const totalTarget = progressData.reduce((sum, day) => sum + day.target, 0);
			const progressPercent = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
			
			setWeeklyProgressPercent(progressPercent);
			
		} catch (error) {
			console.error("Error fetching weekly progress:", error);
		}
	};

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await Promise.all([fetchWorkoutSchedule(), fetchWeeklyProgress()]);
		setRefreshing(false);
	}, []);

	// Fetch data on mount
	useEffect(() => {
		fetchWorkoutSchedule();
		fetchWeeklyProgress();
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

	// Get weekly workout stats - Use actual data instead of static completedWorkouts
	const totalWeeklyWorkouts = weeklyProgress.reduce(
		(acc, curr) => acc + curr.value,
		0
	);
	const totalWeeklyTargets = weeklyProgress.reduce(
		(acc, curr) => acc + curr.target,
		0
	);
	// Use the calculated percentage directly
	// const weeklyProgress =
	//	totalWeeklyTargets > 0
	//		? Math.round((totalWeeklyWorkouts / totalWeeklyTargets) * 100)
	//		: 0;

	// Add function to generate years for selector
	const generateYearOptions = () => {
		const startYear = 1950;
		const endYear = 2050;
		const years = [];

		// Show years from 1950 to 2050
		for (let year = startYear; year <= endYear; year++) {
			years.push(year);
		}
		return years;
	};

	// Add function to handle year selection
	const selectYear = (year: number) => {
		// Update the calendar month with the new year
		const newDate = new Date(calendarMonth);
		newDate.setFullYear(year);
		setCalendarMonth(newDate);

		// Update the selected date with the new year
		const newSelectedDate = new Date(selectedCalendarDate);
		newSelectedDate.setFullYear(year);
		setSelectedCalendarDate(newSelectedDate);

		// Update the month display with the new year
		setMonthDisplay(formatDate(newSelectedDate));

		// Close the year selector
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
										{weeklyProgressPercent}% Complete
									</Text>
								</View>
							</View>
							
							{/* Weekly progress visualization */}
							<View className="flex-row justify-between items-end mt-2 mb-2">
								{weeklyProgress.map((dayProgress, index) => {
									const height = dayProgress.target > 0 
										? (dayProgress.value / dayProgress.target) * 100 
										: 0;
									
									return (
										<View key={index} className="items-center">
											<View className="mb-2">
												<Text
													style={{
														color: colors.secondaryText,
														fontSize: 12,
														marginBottom: 6,
													}}
												>
													{dayProgress.day}
												</Text>
												
												<View
													style={{
														width: isSmallDevice ? 24 : 28,
														height: 100,
														borderRadius: 14,
														backgroundColor: isDarkMode ? "#1F2937" : "#F3F4F6",
														overflow: "hidden",
														justifyContent: "flex-end",
													}}
												>
													{dayProgress.value > 0 && (
														<View
															style={{
																width: "100%",
																height: `${height}%`,
																backgroundColor: isDarkMode ? "#8B5CF6" : "#6366F1",
																borderTopLeftRadius: 12,
																borderTopRightRadius: 12,
															}}
														/>
													)}
												</View>
											</View>
											
											<Text
												style={{
													color: isDarkMode 
														? dayProgress.value > 0 ? "#C4B5FD" : colors.secondaryText
														: dayProgress.value > 0 ? "#4F46E5" : colors.secondaryText,
													fontSize: 12,
													fontWeight: dayProgress.value > 0 ? "600" : "400",
													marginTop: 4,
												}}
											>
												{dayProgress.value}/{dayProgress.target}
											</Text>
										</View>
									);
								})}
							</View>
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
														onPress={() => router.push(`/workout-player/${workout.id}` as any)}
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

													<TouchableOpacity onPress={(e) => {
														e.stopPropagation();
														handleOpenMenu(workout, workout.planId);
													}}>
														<MoreVertical
															size={isSmallDevice ? 14 : 16}
															color={colors.secondaryText}
														/>
													</TouchableOpacity>
												</View>
											</View>
										</View>
									</View>

									{/* Exercise details section - only show if we have exercises */}
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

			{/* Success Modal */}
			<Modal
				visible={showSuccessModal}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setShowSuccessModal(false)}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.5)',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<Animated.View
						style={{
							backgroundColor: colors.card,
							borderRadius: 24,
							width: '80%',
							maxWidth: 300,
							padding: 24,
							alignItems: 'center',
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 10 },
							shadowOpacity: 0.25,
							shadowRadius: 15,
							elevation: 8,
							transform: [{ scale: successScaleAnim }],
							opacity: successOpacityAnim,
						}}
					>
						<View
							style={{
								width: 80,
								height: 80,
								borderRadius: 40,
								backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)',
								justifyContent: 'center',
								alignItems: 'center',
								marginBottom: 20,
							}}
						>
							<Animated.View
								style={{
									transform: [{ scale: checkmarkScaleAnim }],
								}}
							>
								<CheckCircle
									size={48}
									color={isDarkMode ? '#A78BFA' : '#6366F1'}
									fill={isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.2)'}
									strokeWidth={1.5}
								/>
							</Animated.View>
						</View>
						
						<Text
							style={{
								fontSize: 20,
								fontWeight: '700',
								color: colors.text,
								marginBottom: 8,
								textAlign: 'center',
							}}
						>
							Workout Removed
						</Text>
						
						<Text
							style={{
								fontSize: 15,
								color: colors.secondaryText,
								textAlign: 'center',
								marginBottom: 20,
								lineHeight: 20,
							}}
						>
							"{deletedWorkoutTitle}" has been removed from your workout plan.
						</Text>
						
						<TouchableOpacity
							style={{
								paddingVertical: 12,
								paddingHorizontal: 24,
								backgroundColor: isDarkMode ? '#7C3AED' : '#6366F1',
								borderRadius: 12,
								width: '100%',
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 3 },
								shadowOpacity: isDarkMode ? 0.3 : 0.1,
								shadowRadius: 6,
								elevation: 3,
							}}
							onPress={() => setShowSuccessModal(false)}
						>
							<Text
								style={{
									color: '#FFFFFF',
									fontWeight: '600',
									fontSize: 16,
									textAlign: 'center',
								}}
							>
								Got it
							</Text>
						</TouchableOpacity>
					</Animated.View>
				</View>
			</Modal>

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
							overflow: "hidden",
						}}
					>
						<ScrollView
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingBottom: 10 }}
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
										<View className="flex-row items-center">
											<TouchableOpacity
												onPress={() => setShowYearSelector(!showYearSelector)}
											>
												<Text
													style={{
														color: colors.secondaryText,
														fontSize: 16,
														fontWeight: "600",
														textDecorationLine: "underline",
													}}
												>
													{selectedCalendarDate.getFullYear()}
												</Text>
											</TouchableOpacity>
											<ChevronRight
												size={12}
												color={colors.secondaryText}
												style={{ marginLeft: 3, marginTop: 2 }}
											/>
										</View>
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

							{/* Year selector dropdown */}
							{showYearSelector && (
								<View
									style={{
										maxHeight: 220,
										backgroundColor: colors.card,
										borderRadius: 12,
										marginBottom: 16,
										borderWidth: 1,
										borderColor: isDarkMode
											? "rgba(255,255,255,0.1)"
											: "rgba(0,0,0,0.05)",
										shadowColor: "#000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: isDarkMode ? 0.3 : 0.1,
										shadowRadius: 4,
										elevation: 3,
									}}
								>
									<View
										style={{
											flexDirection: "row",
											justifyContent: "space-between",
											alignItems: "center",
											paddingHorizontal: 16,
											paddingVertical: 10,
											borderBottomWidth: 1,
											borderBottomColor: isDarkMode
												? "rgba(255,255,255,0.1)"
												: "rgba(0,0,0,0.05)",
										}}
									>
										<Text
											style={{
												fontSize: 17,
												fontWeight: "700",
												color: colors.text,
											}}
										>
											Select Year
										</Text>
										<TouchableOpacity
											onPress={() => setShowYearSelector(false)}
											style={{
												width: 30,
												height: 30,
												alignItems: "center",
												justifyContent: "center",
												borderRadius: 15,
												backgroundColor: isDarkMode
													? "rgba(255,255,255,0.1)"
													: "rgba(0,0,0,0.05)",
											}}
										>
											<Text style={{ color: colors.text, fontSize: 18 }}>
												×
											</Text>
										</TouchableOpacity>
									</View>

									<ScrollView
										style={{ maxHeight: 160 }}
										showsVerticalScrollIndicator={true}
										indicatorStyle={isDarkMode ? "white" : "black"}
										contentContainerStyle={{ padding: 4 }}
									>
										<View style={{ flexDirection: "row", flexWrap: "wrap" }}>
											{generateYearOptions().map((year) => (
												<TouchableOpacity
													key={year}
													onPress={() => selectYear(year)}
													style={{
														width: "25%",
														padding: 2,
													}}
												>
													<View
														style={{
															padding: 4,
															borderRadius: 6,
															alignItems: "center",
															justifyContent: "center",
															height: 32,
															backgroundColor:
																year === calendarMonth.getFullYear()
																	? isDarkMode
																		? "rgba(139, 92, 246, 0.2)"
																		: "rgba(99, 102, 241, 0.1)"
																	: "transparent",
															borderWidth:
																year === new Date().getFullYear() ? 1 : 0,
															borderColor: isDarkMode ? "#A78BFA" : "#6366F1",
														}}
													>
														<Text
															style={{
																fontSize: 14,
																fontWeight:
																	year === calendarMonth.getFullYear()
																		? "700"
																		: year === new Date().getFullYear()
																		? "600"
																		: "400",
																color:
																	year === calendarMonth.getFullYear()
																		? isDarkMode
																			? "#A78BFA"
																			: "#6366F1"
																		: year === new Date().getFullYear()
																		? isDarkMode
																			? "#C4B5FD"
																			: "#4F46E5"
																		: colors.text,
															}}
														>
															{year}
														</Text>
													</View>
												</TouchableOpacity>
											))}
										</View>
									</ScrollView>
								</View>
							)}

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

								<View
									className="flex-row items-center justify-center"
									style={{ minWidth: 140 }}
								>
									<Text
										style={{
											color: colors.text,
											fontSize: 18,
											fontWeight: "700",
											textAlign: "center",
										}}
									>
										{getMonthName(calendarMonth)}
									</Text>
									<TouchableOpacity
										onPress={() => setShowYearSelector(!showYearSelector)}
										style={{ marginLeft: 5 }}
									>
										<Text
											style={{
												color: isDarkMode ? "#A78BFA" : "#6366F1",
												fontSize: 18,
												fontWeight: "700",
												textDecorationLine: "underline",
											}}
										>
											{calendarMonth.getFullYear()}
										</Text>
									</TouchableOpacity>
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
						</ScrollView>

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

			{/* Menu Modal */}
			<Modal
				visible={menuVisible}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setMenuVisible(false)}
			>
				<TouchableOpacity
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.5)',
						justifyContent: 'center',
						alignItems: 'center',
					}}
					activeOpacity={1}
					onPress={() => setMenuVisible(false)}
				>
					<View
						style={{
							backgroundColor: colors.card,
							borderRadius: 12,
							width: '80%',
							maxWidth: 320,
							overflow: 'hidden',
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.25,
							shadowRadius: 3.84,
							elevation: 5,
						}}
					>
						{selectedWorkoutPlan && (
							<>
								<View style={{
									padding: 16,
									borderBottomWidth: 1, 
									borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
								}}>
									<Text style={{
										color: colors.text,
										fontSize: 18,
										fontWeight: '600',
										textAlign: 'center'
									}}>
										{selectedWorkoutPlan.title}
									</Text>
								</View>

								<TouchableOpacity
									style={{ 
										flexDirection: 'row',
										alignItems: 'center',
										padding: 16,
									}}
									onPress={() => deleteWorkout(selectedWorkoutPlan.id)}
								>
									<Trash2 size={20} color="#EF4444" style={{ marginRight: 12 }} />
									<Text style={{ color: "#EF4444", fontSize: 16 }}>Remove from Plan</Text>
								</TouchableOpacity>
							</>
						)}
					</View>
				</TouchableOpacity>
			</Modal>
		</SafeAreaView>
	);
}
