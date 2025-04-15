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
import { Stack, router, useFocusEffect } from "expo-router";
import {
	Footprints,
	Flame,
	Clock,
	PlayCircle,
	Activity,
	CalendarDays,
	Apple,
	Bell,
	Utensils,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./utils/supabase";
import ThemeModule from "./utils/theme";
import { resetEmergencyFlags } from "./utils/emergency";
const { useTheme } = ThemeModule;

import DailyProgressSummary from "./components/DailyProgressSummary";
import TodaysWorkoutCard from "./components/TodaysWorkoutCard";
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

// Helper function to format date consistently across the app
const formatDate = (date: Date) => {
	return date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
};

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

	// Add state for progress data
	const [progressData, setProgressData] = useState({
		stepsValue: "0",
		stepsProgress: 0,
		caloriesValue: "0",
		caloriesProgress: 0,
		workoutValue: "0/0",
		workoutProgress: 0
	});

	// Add an emergency refresh handler - this will be triggered on focus
	const performEmergencyRefresh = async () => {
		try {
			console.log('EXECUTING EMERGENCY REFRESH PROTOCOL');
			
			// Check if emergency fix is required
			const needsEmergencyFix = await AsyncStorage.getItem('EMERGENCY_FIX_REQUIRED');
			if (needsEmergencyFix !== 'true') {
				console.log('No emergency fix required');
				return false;
			}
			
			// Get emergency override values
			const workoutCountOverride = await AsyncStorage.getItem('WORKOUT_COUNT_OVERRIDE');
			const caloriesOverride = await AsyncStorage.getItem('CALORIES_OVERRIDE');
			
			console.log(`Emergency override values - Workouts: ${workoutCountOverride}, Calories: ${caloriesOverride}`);
			
			if (workoutCountOverride || caloriesOverride) {
				// Format values for display
				const formattedWorkouts = workoutCountOverride ? parseInt(workoutCountOverride, 10) : 0;
				const formattedCalories = caloriesOverride ? parseInt(caloriesOverride, 10) : 0;
				
				// Calculate progress percentages
				const workoutProgress = Math.min(Math.round((formattedWorkouts / 10) * 100), 100);
				const calorieProgress = Math.min(Math.round((formattedCalories / 600) * 100), 100);
				
				console.log(`Setting emergency values - Workouts: ${formattedWorkouts}/10 (${workoutProgress}%), Calories: ${formattedCalories} (${calorieProgress}%)`);
				
				// Directly update UI with emergency values
				setProgressData({
					...progressData,
					workoutValue: `${formattedWorkouts}/10`,
					workoutProgress: workoutProgress,
					caloriesValue: String(formattedCalories),
					caloriesProgress: calorieProgress
				});
				
				// Also update main userData for consistency
				setUserData(prevData => ({
					...prevData,
					workoutValue: `${formattedWorkouts}/10`,
					workoutProgress: workoutProgress,
					caloriesValue: String(formattedCalories),
					caloriesProgress: calorieProgress
				}));
				
				// Clear emergency flags
				await resetEmergencyFlags();
				
				console.log('EMERGENCY REFRESH COMPLETE');
				return true;
			}
			
			return false;
		} catch (error) {
			console.error('Error in emergency refresh:', error);
			return false;
		}
	};

	// Check for dashboard refresh flag when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			const checkRefreshFlag = async () => {
				try {
					console.log('Home screen focused - checking for forced refresh');
					
					// Check for emergency fix first - highest priority
					const emergencyFixDone = await performEmergencyRefresh();
					if (emergencyFixDone) {
						console.log('Emergency fix applied, skipping normal refresh');
						return;
					}
					
					// Normal refresh flow
					const forceRefresh = await AsyncStorage.getItem('FORCE_REFRESH_HOME');
					if (forceRefresh) {
						console.log('*** FORCED REFRESH DETECTED ***');
						// Clear the flag
						await AsyncStorage.setItem('FORCE_REFRESH_HOME', '');
						// Fetch latest data
						await fetchUserData();
						return;
					}
					
					// Basic refresh on focus
					await fetchUserData();
					
				} catch (error) {
					console.error('Error checking refresh flag:', error);
				}
			};
			
			// Check when screen comes into focus
			checkRefreshFlag();
			
			// No cleanup needed for useFocusEffect
			return () => {};
		}, [])
	);

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
			// Navigate to workout library without updating stats
			// Stats will only be updated when workout is actually completed
			router.push("/library");
		} catch (error) {
			console.error("Error starting workout:", error);
			router.push("/library");
		}
	};

	const fetchUserData = async () => {
		try {
			setError(null);

			// Check for emergency flags first
			const emergencyFix = await AsyncStorage.getItem('EMERGENCY_FIX_REQUIRED');
			if (emergencyFix === 'true') {
				console.log('Emergency flags detected in fetchUserData, running emergency refresh');
				await performEmergencyRefresh();
				return true;
			}

			// Get the current authenticated user
			const user = await getUser();

			if (!user) {
				console.log("No authenticated user, using mock data");
				setLoading(false);
				return false;
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

			// Check AsyncStorage for locally cached stats that might be more recent
			let workoutValue = dashboardData.workoutValue;
			let workoutProgress = dashboardData.workoutProgress;
			let caloriesValue = dashboardData.caloriesValue;
			let caloriesProgress = dashboardData.caloriesProgress;
			
			try {
				const statsKey = `user_stats_${user.id}_${today}`;
				const cachedStatsStr = await AsyncStorage.getItem(statsKey);
				
				if (cachedStatsStr) {
					const cachedStats = JSON.parse(cachedStatsStr);
					console.log('Found cached stats in AsyncStorage:', cachedStats);
					
					// Use cached calories if available and greater than DB value
					const dbCalories = latestStats?.calories || 0;
					const cachedCalories = cachedStats.calories || 0;
					
					if (cachedCalories > dbCalories) {
						console.log(`Using cached calories (${cachedCalories}) instead of DB calories (${dbCalories})`);
						caloriesValue = cachedCalories.toString();
						caloriesProgress = Math.min(Math.round((cachedCalories / 600) * 100), 100);
					}
					
					// Use cached workout count if available and greater than DB value
					const dbWorkouts = latestStats?.workouts_completed || 0;
					const cachedWorkouts = cachedStats.workouts_completed || 0;
					
					if (cachedWorkouts > dbWorkouts) {
						console.log(`Using cached workouts (${cachedWorkouts}) instead of DB workouts (${dbWorkouts})`);
						const cappedWorkoutCount = Math.min(cachedWorkouts, 10);
						workoutValue = `${cappedWorkoutCount}/10`;
						workoutProgress = Math.min(Math.round((cappedWorkoutCount / 10) * 100), 100);
					}
				}
			} catch (cacheError) {
				console.error('Error checking cached stats:', cacheError);
			}
			
			// If we have latest stats from DB and no cache override
			if (latestStats && caloriesValue === dashboardData.caloriesValue) {
				// Cap the workouts count at 10
				const cappedWorkoutCount = Math.min(latestStats.workouts_completed, 10);
				workoutValue = `${cappedWorkoutCount}/10`;
				workoutProgress = Math.min(
					Math.round((cappedWorkoutCount / 10) * 100),
					100
				);
			}

			// Get recent activities from user_workouts table
			const { data: recentWorkouts, error: workoutsError } = await supabase
				.from("user_workouts")
				.select(`
					id, 
					duration, 
					calories, 
					completed_at,
					workout:workout_id (
						id, title
					)
				`)
				.eq("user_id", user.id)
				.order("completed_at", { ascending: false })
				.limit(3);
				
			if (workoutsError) {
				console.error("Error fetching recent workouts:", workoutsError);
			}
			
			// Format recent workouts for display
			const recentActivities = recentWorkouts ? recentWorkouts.map(workout => {
				// Calculate how long ago the workout was completed
				const completedDate = workout.completed_at ? new Date(workout.completed_at) : new Date();
				const timeAgo = formatTimeAgo(completedDate);
				
				// Handle workout data with proper type checking
				const workoutTitle = workout.workout && typeof workout.workout === 'object' && 'title' in workout.workout 
					? String(workout.workout.title) 
					: "Workout";
				
				return {
					id: String(workout.id),
					title: workoutTitle,
					type: "workout",
					duration: `${workout.duration} min`,
					calories: `${workout.calories}`,
					time: timeAgo,
				};
			}) : defaultUserData.recentActivities;

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
				caloriesProgress: caloriesProgress,
				workoutProgress: workoutProgress,
				stepsValue: String(dashboardData.stepsValue),
				caloriesValue: String(caloriesValue),
				workoutValue: workoutValue,
				streakCount: dashboardData.streakCount,
				achievements: [],
				todaysWorkout: {
					...dashboardData.todaysWorkout,
					level: "beginner",
				},
				recentActivities: recentActivities.length > 0 ? recentActivities : defaultUserData.recentActivities,
			});
		} catch (err) {
			console.error("Error fetching user data:", err);
			setError("Failed to load your data. Please try again later.");
			return false;
		}
		return true;
	};

	// Helper function to format time ago
	const formatTimeAgo = (date: Date) => {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);
		
		if (diffMins < 1) {
			return "Just now";
		} else if (diffMins < 60) {
			return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
		} else if (diffHours < 24) {
			return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
		} else if (diffDays === 1) {
			return "Yesterday";
		} else if (diffDays < 7) {
			return `${diffDays} days ago`;
		} else {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		}
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
		// Check if we need to reset progress for a new day
		checkAndResetDailyProgress();
		// Load actual user data instead of simulating with mock data
		fetchUserData().finally(() => setLoading(false));
	}, []);

	// Function to check if progress needs to be reset for a new day
	const checkAndResetDailyProgress = async () => {
		try {
			const user = await getUser();
			if (!user) return;
			
			// Get the current date in YYYY-MM-DD format
			const today = new Date().toISOString().split('T')[0];
			
			// Get the last tracked date from AsyncStorage
			const lastTrackedDateKey = `last_tracked_date_${user.id}`;
			const lastTrackedDate = await AsyncStorage.getItem(lastTrackedDateKey);
			
			// If the last tracked date is different from today, reset progress
			if (lastTrackedDate !== today) {
				console.log(`Resetting daily progress. Last: ${lastTrackedDate}, Today: ${today}`);
				
				// Update the last tracked date to today
				await AsyncStorage.setItem(lastTrackedDateKey, today);
				
				// Don't modify existing records, just ensure UI is updated with latest
				// This will fetch the correct data for today
				return true;
			}
			
			return false;
		} catch (error) {
			console.error("Error checking/resetting daily progress:", error);
			return false;
		}
	};

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

	// Function to fetch accurate progress data from AsyncStorage
	const fetchAccurateProgressData = async () => {
		try {
			console.log('Fetching accurate progress data from AsyncStorage');
			
			// Get the current user ID
			const user = await getUser();
			if (!user) {
				console.log('No user found for progress data');
				return false;
			}
			
			// Format today's date for consistent key usage
			const today = formatDate(new Date());
			
			// For debugging - check when was the last workout completion
			const lastCompletion = await AsyncStorage.getItem('last_workout_completion');
			console.log('Last workout completion timestamp:', lastCompletion);
			
			// Get all workout-related keys for this user
			const allKeys = await AsyncStorage.getAllKeys();
			const relevantKeys = allKeys.filter(key => 
				key === `user_stats_${user.id}_${today}` || 
				key.startsWith('workout_backup_')
			);
			
			console.log('Found relevant stats keys:', relevantKeys);
				
			// Check AsyncStorage for locally cached stats
			const statsKey = `user_stats_${user.id}_${today}`;
			console.log('Looking for progress data with key:', statsKey);
			const cachedStatsStr = await AsyncStorage.getItem(statsKey);
			
			// Collect all possible data sources to find the most recent/complete one
			let allPossibleStats = [];
			
			// 1. Try the primary stats key
			if (cachedStatsStr) {
				console.log('Found cached stats:', cachedStatsStr);
				
				try {
					const cachedStats = JSON.parse(cachedStatsStr);
					allPossibleStats.push({
						source: 'primary',
						stats: cachedStats,
						calories: (cachedStats && cachedStats.calories) ? cachedStats.calories : 0,
						workouts: (cachedStats && cachedStats.workouts_completed) ? cachedStats.workouts_completed : 0
					});
				} catch (parseError) {
					console.error('Error parsing cached stats:', parseError);
				}
			} else {
				console.log('No cached stats found for today in primary location');
			}
			
			// 2. Try backup keys
			const backupKeys = allKeys.filter(key => key.startsWith('workout_backup_'));
			for (const key of backupKeys) {
				try {
					const backupStr = await AsyncStorage.getItem(key);
					if (backupStr) {
						const backup = JSON.parse(backupStr);
						if (backup.userId === user.id && backup.date === today && backup.stats) {
							allPossibleStats.push({
								source: key,
								stats: backup.stats,
								calories: backup.stats.calories || 0,
								workouts: backup.stats.workouts_completed || 0,
								timestamp: backup.timestamp
							});
						}
					}
				} catch (error) {
					console.error(`Error processing backup key ${key}:`, error);
				}
			}
			
			// If we found some stats, use the one with the highest workout count or calories
			if (allPossibleStats.length > 0) {
				console.log(`Found ${allPossibleStats.length} possible stats sources`);
				
				// Sort by workout count (primary) and calories (secondary)
				allPossibleStats.sort((a, b) => {
					if (a.workouts !== b.workouts) {
						return b.workouts - a.workouts; // Highest workout count first
					}
					return b.calories - a.calories; // Then highest calories
				});
				
				const bestStats = allPossibleStats[0];
				console.log(`Using stats from source: ${bestStats.source}`, bestStats.stats);
				
				// Get the formatted values
				const cachedCalories = bestStats.calories;
				const cachedWorkouts = bestStats.workouts;
				
				console.log(`Setting progress with calories: ${cachedCalories}, workouts: ${cachedWorkouts}`);
				
				// Update progress state with cached values 
				setProgressData({
					...progressData,
					caloriesValue: String(cachedCalories),
					caloriesProgress: Math.min(Math.round((cachedCalories / 600) * 100), 100),
					workoutValue: `${Math.min(cachedWorkouts, 10)}/10`,
					workoutProgress: Math.min(Math.round((cachedWorkouts / 10) * 100), 100)
				});
				
				// Also update the main userData state to keep them in sync
				setUserData(prevData => ({
					...prevData,
					caloriesValue: String(cachedCalories),
					caloriesProgress: Math.min(Math.round((cachedCalories / 600) * 100), 100),
					workoutValue: `${Math.min(cachedWorkouts, 10)}/10`,
					workoutProgress: Math.min(Math.round((cachedWorkouts / 10) * 100), 100)
				}));
				
				// Save the best stats to the primary key to consolidate data
				if (bestStats.source !== 'primary') {
					console.log('Saving best stats to primary key for future use');
					await AsyncStorage.setItem(statsKey, JSON.stringify(bestStats.stats));
				}
				
				// Clean up backup keys
				for (const key of backupKeys) {
					if (key !== bestStats.source) {
						await AsyncStorage.removeItem(key);
					}
				}
				
				return true;
			} else {
				console.log('No valid stats data found after checking all sources');
				return false;
			}
		} catch (error) {
			console.error('Error fetching accurate progress data:', error);
			return false;
		}
	};
	
	// Call the function when the component mounts
	useEffect(() => {
		fetchAccurateProgressData();
	}, []);

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
									overflow: "hidden",
								}}
							>
								<DailyProgressSummary
									date={`Today, ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
									stepsProgress={progressData.stepsProgress}
									caloriesProgress={progressData.caloriesProgress}
									workoutProgress={progressData.workoutProgress}
									stepsValue={progressData.stepsValue}
									caloriesValue={progressData.caloriesValue}
									workoutValue={progressData.workoutValue}
								/>
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
									onPress={() => router.push("/nutrition")}
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
