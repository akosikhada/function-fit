import React from "react";
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
const { useTheme } = ThemeModule;

interface UserProfile {
	userId?: string;
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

	const [userProfile, setUserProfile] = React.useState<UserProfile>({
		username: "",
		fullName: "",
		email: "",
		birthday: "March 15, 1990",
		gender: "Male",
		height: "175 cm",
		weight: "65 kg",
		stats: {
			totalWorkouts: 0,
			totalHours: 0,
			totalCalories: 0,
		},
		goals: {
			weeklyWorkouts: { current: 0, target: 5 },
				monthlyDistance: { current: 0, target: 50 },
				weightGoal: { current: 65, target: 65 },
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
			// Load user profile without syncing email
			try {
				setIsLoading(true);
				const userData = await getUser();

				if (!userData) {
					throw new Error("User not authenticated");
				}

				// Get cached profile data from AsyncStorage
				let cachedProfileData = null;
				try {
					const profileKey = `userProfile-${userData.id}`;
					const cachedData = await AsyncStorage.getItem(profileKey);
					if (cachedData) {
						cachedProfileData = JSON.parse(cachedData);
					}
				} catch (error) {
					console.log("Error loading cached profile:", error);
				}

				// Get profile from Supabase
				const profileData = await getUserProfile(userData.id);

				// Get the authenticated user to get the current verified email
				const { data: authData } = await supabase.auth.getUser();
				const verifiedEmail = authData?.user?.email || "";

				// Check if a pending email has been verified
				let hasPendingEmailVerification = false;
				if (cachedProfileData?.pendingEmail) {
					// If the current verified email matches what was pending, it means verification is complete
					if (cachedProfileData.pendingEmail === verifiedEmail) {
						// Email has been verified, clear the pending status
						cachedProfileData.pendingEmail = null;
						cachedProfileData.emailVerificationSent = null;
						
						// Update AsyncStorage to clear pending status
						try {
							const profileKey = `userProfile-${userData.id}`;
							await AsyncStorage.setItem(profileKey, JSON.stringify(cachedProfileData));
						} catch (error) {
							console.log("Error updating cached profile:", error);
						}
					} else {
						// Email is still pending verification
						hasPendingEmailVerification = cachedProfileData.pendingEmail !== verifiedEmail;
					}
				}

				// 1. First fetch accurate workout statistics from the database
				console.log("Fetching workout stats for user:", userData.id);
				const workoutStats = await fetchWorkoutStats(userData.id);
				console.log("Fetched workout stats:", workoutStats);
				
				// 2. Fetch user goals and achievements
				const userGoals = await fetchUserGoals(userData.id);
				const achievements = await fetchUserAchievements(userData.id);

				// 3. Merge profile data with updated stats, prioritizing Supabase data
				const mergedProfile: UserProfile = {
					userId: userData.id as string,
					username: profileData?.username || cachedProfileData?.username || "",
					email: verifiedEmail, // Always use the verified email from auth
					fullName: profileData?.fullName || cachedProfileData?.fullName || "",
					birthday: profileData?.birthday || cachedProfileData?.birthday || "",
					gender: profileData?.gender || cachedProfileData?.gender || "",
					height: `${
						profileData?.height ||
						(cachedProfileData?.height || "").replace(" cm", "")
					} cm`,
					weight: `${
						profileData?.weight ||
						(cachedProfileData?.weight || "").replace(" kg", "")
					} kg`,
					avatarUrl: profileData?.avatar_url || cachedProfileData?.avatarUrl || "",
					pendingEmail: hasPendingEmailVerification ? cachedProfileData.pendingEmail : null,
					emailVerificationSent: hasPendingEmailVerification ? cachedProfileData.emailVerificationSent : null,
					// Very important: Use the accurate stats from the database
					stats: workoutStats,
					goals: userGoals,
					achievements: achievements
				};

				// 4. Update state with merged profile
				console.log("Setting user profile with stats:", mergedProfile.stats);
				setUserProfile(mergedProfile);

				// If we got new data from Supabase, cache it
				if (profileData) {
					try {
						const profileKey = `userProfile-${userData.id}`;
						await AsyncStorage.setItem(
							profileKey,
							JSON.stringify({
								...cachedProfileData, // Preserve any fields not returned by Supabase
								userId: userData.id,
								username: profileData.username || "",
								email: verifiedEmail, // Always use the verified email from auth
								fullName: profileData.fullName || "",
								birthday: profileData.birthday || "",
								gender: profileData.gender || "",
								height: profileData.height ? `${profileData.height} cm` : "",
								weight: profileData.weight ? `${profileData.weight} kg` : "",
								avatarUrl: profileData.avatar_url || "",
								// Preserve pending email information if still relevant
								...(hasPendingEmailVerification
									? {
											pendingEmail: cachedProfileData.pendingEmail,
											emailVerificationSent:
												cachedProfileData.emailVerificationSent,
									  }
									: {}),
								// Cache the stats as well
								stats: workoutStats,
								goals: userGoals,
								achievements: achievements
							})
						);
					} catch (error) {
						console.log("Error caching profile:", error);
					}
				}

				// Also load edit progress if it exists
				try {
					const editProgressKey = `editProfile-${userData.id}`;
					const editProgressData = await AsyncStorage.getItem(editProgressKey);
					if (editProgressData) {
						const parsedEditProgress = JSON.parse(editProgressData);
						setEditedProfile(parsedEditProgress);
					}
				} catch (error) {
					console.log("Error loading edit progress:", error);
				}
			} catch (error) {
				console.error("Error loading user profile:", error);
				showErrorToast("Failed to load profile");
			} finally {
				setProfileLoading(false);
				setIsLoading(false);
			}
		};

		loadUserProfile();
	}, []);

	// Function to fetch accurate workout statistics from the database
	const fetchWorkoutStats = async (userId: string) => {
		try {
			// Get completed workouts stats
			const { data: workoutsData, error: workoutsError } = await supabase
				.from('user_workouts')
				.select('workout_id, duration, calories, completed_at')
				.eq('user_id', userId);
				
			if (workoutsError) throw workoutsError;
			
			// Calculate total workouts
			const totalWorkouts = workoutsData?.length || 0;
			
			// Calculate total hours (convert minutes to hours)
			const totalMinutes = workoutsData?.reduce((sum, workout) => sum + (workout.duration || 0), 0) || 0;
			const totalHours = Math.round(totalMinutes / 60);
			
			// Calculate total calories
			const totalCalories = workoutsData?.reduce((sum, workout) => sum + (workout.calories || 0), 0) || 0;
			
			console.log("Fetched workout stats:", { totalWorkouts, totalHours, totalCalories });
			
			return {
				totalWorkouts,
				totalHours,
				totalCalories
			};
		} catch (error) {
			console.error("Error fetching workout stats:", error);
			return {
				totalWorkouts: 0,
				totalHours: 0,
				totalCalories: 0
			};
		}
	};

	// Function to fetch user goals
	const fetchUserGoals = async (userId: string) => {
		try {
			// Get current date info for weekly calculations
			const today = new Date();
			const currentDay = today.getDay(); // 0 is Sunday, 6 is Saturday
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - currentDay);
			startOfWeek.setHours(0, 0, 0, 0);
			
			// Calculate start of month
			const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
			
			// Get workouts for this week to calculate weekly progress
			const { data: weekWorkouts, error: weekError } = await supabase
				.from('user_workouts')
				.select('id')
				.eq('user_id', userId)
				.gte('completed_at', startOfWeek.toISOString());
				
			if (weekError) throw weekError;
			
			// Get user_stats to check for any saved targets/goals
			const { data: statsData, error: statsError } = await supabase
				.from('user_stats')
				.select('*')
				.eq('user_id', userId)
				.order('date', { ascending: false })
				.limit(1);
				
			if (statsError) throw statsError;
			
			// Default goals
			const weeklyWorkoutGoal = 5;
			const monthlyDistanceGoal = 50;
			
			// Use fixed values for weight goal
			const currentWeight = 65;
			const targetWeight = 65;
			
			return {
				weeklyWorkouts: { 
					current: weekWorkouts?.length || 0, 
					target: weeklyWorkoutGoal 
				},
					monthlyDistance: { 
					current: Math.round(Math.random() * 45), // This would need actual run tracking data
					target: monthlyDistanceGoal 
				},
				weightGoal: { 
					current: currentWeight, 
					target: targetWeight 
				}
			};
		} catch (error) {
			console.error("Error fetching user goals:", error);
			// Return default goals structure on error instead of potentially incomplete data
			return {
				weeklyWorkouts: { current: 0, target: 5 },
				monthlyDistance: { current: 0, target: 50 },
				weightGoal: { current: 65, target: 65 } // Fixed weight values
			};
		}
	};

	// Function to fetch user achievements
	const fetchUserAchievements = async (userId: string) => {
		try {
			// Get user achievements
			const { data: achievementsData, error } = await supabase
				.from('user_achievements')
				.select(`
					id,
					achieved_at,
					achievement_id,
					achievements:achievement_id (
						id, 
						title,
						description,
						icon
					)
				`)
				.eq('user_id', userId)
				.order('achieved_at', { ascending: false });
				
			if (error) throw error;
			
			// Format achievements for display - with proper type checking
			const formattedAchievements = achievementsData?.map(item => {
				// Properly type check the achievements object
				const achievement = item.achievements as unknown as { 
					id: string; 
					title: string; 
					description: string; 
					icon: string;
				} | null;
				
				return {
					id: item.id,
					title: achievement?.title || 'Achievement',
					date: new Date(item.achieved_at).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric'
					}),
					icon: achievement?.icon || '🏆'
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
			height: userProfile.height.replace(' cm', ''),
			weight: userProfile.weight.replace(' kg', ''),
			avatarUrl: userProfile.avatarUrl || '',
		});
		setEditModalVisible(true);
	};

	const handleCancel = () => {
		setEditModalVisible(false);
	};

	const handleSaveProfile = async () => {
		// Implementation for saving profile
		setIsLoading(true);
		try {
			// Logic to save profile would go here
			setEditModalVisible(false);
			// Update the user profile with edited data
			setUserProfile({
				...userProfile,
				...editedProfile,
				height: `${editedProfile.height?.replace(' cm', '')} cm`,
				weight: `${editedProfile.weight?.replace(' kg', '')} kg`,
			});
		} catch (error) {
			console.error("Error saving profile:", error);
			showErrorToast("Failed to save profile");
		} finally {
			setIsLoading(false);
		}
	};

	const handleChangePhoto = async () => {
		try {
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (!permissionResult.granted) {
				Alert.alert("Permission Required", "You need to grant permission to access your photos");
				return;
			}
			
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			});
			
			if (!result.canceled && result.assets && result.assets.length > 0) {
				const selectedAsset = result.assets[0];
				setUploadingImage(true);
				
				// Update the profile with the new image URI
				setEditedProfile({
					...editedProfile,
					avatarUrl: selectedAsset.uri,
				});
				
				setUploadingImage(false);
			}
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
		// Navigate to different settings screens
		Alert.alert("Navigation", `Navigate to ${screen}`);
		// This would typically use router.push to a specific route
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
							<Text 
								className="text-center font-medium text-base text-red-600 dark:text-red-400"
							>
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
			const today = new Date().toISOString().split('T')[0];
			
			// Get all AsyncStorage keys
			const allKeys = await AsyncStorage.getAllKeys();
			
			// Filter keys related to user stats
			const statsKeys = allKeys.filter(key => 
				key.startsWith('user_stats_') || 
				key.includes('dashboard_needs_refresh') || 
				key.includes('FORCE_REFRESH_HOME')
			);
			
			console.log('Found stats keys to reset:', statsKeys);
			
			// Reset all stats keys
			await AsyncStorage.multiRemove(statsKeys);
			
			// Create a fresh stats object for today
			const freshStats = {
				calories: 0,
				workouts_completed: 0,
				active_minutes: 0,
				steps: 0
			};
			
			// Save fresh stats to AsyncStorage
			const newStatsKey = `user_stats_${user.id}_${today}`;
			await AsyncStorage.setItem(newStatsKey, JSON.stringify(freshStats));
			
			// Set refresh flags
			const timestamp = Date.now().toString();
			await AsyncStorage.setItem('dashboard_needs_refresh', timestamp);
			await AsyncStorage.setItem('FORCE_REFRESH_HOME', timestamp);
			
			// Show success message
			setErrorMessage("Workout progress data has been reset!");
			setShowError(true);
			setTimeout(() => setShowError(false), 3000);
			
			console.log('Workout progress reset successfully');
		} catch (error) {
			console.error('Error resetting workout progress:', error);
			showErrorToast("Failed to reset progress data");
		} finally {
			setIsLoading(false);
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
				{/* Profile Header */}
				<View className="pt-16">
					<View
						style={{ backgroundColor: colors.card }}
						className={`flex-row items-center justify-between ${sectionPadding} rounded-xl shadow-sm`}
					>
						<View className="flex-row items-center">
							{userProfile.avatarUrl ? (
								<Image
									source={{
										uri: userProfile.avatarUrl,
									}}
									style={{ width: avatarSize, height: avatarSize }}
									className="rounded-full"
								/>
							) : (
								<View
									style={{ width: avatarSize, height: avatarSize }}
									className="rounded-full bg-gray-200 items-center justify-center"
								>
									<User size={isSmallDevice ? 20 : 24} color="#9CA3AF" />
								</View>
							)}
							<View className={`ml-${isSmallDevice ? "2" : "3"}`}>
								<Text
									style={{ color: colors.text }}
									className={`${
										isSmallDevice ? "text-sm" : "text-base"
									} font-medium`}
								>
									{profileLoading && !userProfile.username
										? "Loading..."
										: userProfile.username}
								</Text>
								<View style={{ marginTop: 4 }}>
									<Text
										style={{ color: colors.secondaryText }}
										className="text-xs mt-1"
									>
										{isLoading && !userProfile.email
											? "Loading..."
											: userProfile.email}
									</Text>
									{userProfile.pendingEmail && (
										<View style={styles.pendingEmailBadge}>
											<Text style={styles.pendingEmailText}>
												Verification pending for {userProfile.pendingEmail}
											</Text>
										</View>
									)}
								</View>
							</View>
						</View>
						<TouchableOpacity
							onPress={handleEditProfile}
							className="p-1.5 rounded-full"
						>
							<Pencil size={isSmallDevice ? 16 : 18} color="#6366F1" />
						</TouchableOpacity>
					</View>

					{/* Stats */}
					<View className="mt-4">
						<View
							className={`flex-row justify-between ${
								isLargeDevice ? "px-8" : ""
							}`}
						>
							<View
								className={`flex-1 items-center ${
									isSmallDevice ? "mr-1" : "mr-2"
								}`}
							>
								<View
									className={`${
										isSmallDevice ? "w-8 h-8" : "w-10 h-10"
									} bg-purple-100 rounded-full items-center justify-center mb-2`}
								>
									<Activity size={isSmallDevice ? 16 : 18} color="#8B5CF6" />
								</View>
								<Text
									style={{ color: colors.text }}
									className={`${
										isSmallDevice ? "text-lg" : "text-xl"
									} font-bold`}
								>
									{userProfile.stats.totalWorkouts || 0}
								</Text>
								<Text
									style={{ color: colors.secondaryText }}
									className="text-xs mt-1"
								>
									Workouts
								</Text>
							</View>
							<View
								className={`flex-1 items-center ${
									isSmallDevice ? "mx-1" : "mx-2"
								}`}
							>
								<View
									className={`${
										isSmallDevice ? "w-8 h-8" : "w-10 h-10"
									} bg-blue-100 rounded-full items-center justify-center mb-2`}
								>
									<Clock size={isSmallDevice ? 16 : 18} color="#3B82F6" />
								</View>
								<Text
									style={{ color: colors.text }}
									className={`${
										isSmallDevice ? "text-lg" : "text-xl"
									} font-bold`}
								>
									{userProfile.stats.totalHours || 0}h
								</Text>
								<Text
									style={{ color: colors.secondaryText }}
									className="text-xs mt-1"
								>
									Hours
								</Text>
							</View>
							<View
								className={`flex-1 items-center ${
									isSmallDevice ? "ml-1" : "ml-2"
								}`}
							>
								<View
									className={`${
										isSmallDevice ? "w-8 h-8" : "w-10 h-10"
									} bg-orange-100 rounded-full items-center justify-center mb-2`}
								>
									<Flame size={isSmallDevice ? 16 : 18} color="#F97316" />
								</View>
								<Text
									style={{ color: colors.text }}
									className={`${
										isSmallDevice ? "text-lg" : "text-xl"
									} font-bold`}
								>
									{userProfile.stats.totalCalories ? ((userProfile.stats.totalCalories || 0) / 1000).toFixed(1) + 'k' : '0'}
								</Text>
								<Text
									style={{ color: colors.secondaryText }}
									className="text-xs mt-1"
								>
									Calories
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Achievements */}
				<View className="mt-6">
					<View className="flex-row justify-between items-center mb-3">
						<Text
							style={{ color: colors.text }}
							className={`${headerTextClass} font-bold`}
						>
							My Achievements
						</Text>
						<TouchableOpacity>
							<Text className="text-[#8B5CF6] text-sm">View All</Text>
						</TouchableOpacity>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className="pb-1"
					>
						<TouchableOpacity
							className={`mr-3 ${
								isSmallDevice
									? "w-32 h-20"
									: isLargeDevice
									? "w-44 h-28"
									: "w-36 h-24"
							} overflow-hidden rounded-xl shadow-sm`}
						>
							<LinearGradient
								colors={["#8B5CF6", "#6366F1"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								className="p-3 w-full h-full justify-between"
							>
								<View className="items-center bg-white/20 self-start p-1 rounded-full">
									<Trophy size={isSmallDevice ? 12 : 14} color="#FFF" />
								</View>
								<View>
									<Text
										className={`text-white font-medium ${
											isSmallDevice ? "text-xs" : "text-sm"
										}`}
									>
										30 Days Streak
									</Text>
									<Text className="text-white opacity-70 text-xs mt-1">
										Jan 15
									</Text>
								</View>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity
							className={`mr-3 ${
								isSmallDevice
									? "w-32 h-20"
									: isLargeDevice
									? "w-44 h-28"
									: "w-36 h-24"
							} overflow-hidden rounded-xl shadow-sm`}
						>
							<LinearGradient
								colors={["#6366F1", "#8B5CF6"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								className="p-3 w-full h-full justify-between"
							>
								<View className="items-center bg-white/20 self-start p-1 rounded-full">
									<Award size={isSmallDevice ? 12 : 14} color="#FFF" />
								</View>
								<View>
									<Text
										className={`text-white font-medium ${
											isSmallDevice ? "text-xs" : "text-sm"
										}`}
									>
										First 5K
									</Text>
									<Text className="text-white opacity-70 text-xs mt-1">
										Dec 28
									</Text>
								</View>
							</LinearGradient>
						</TouchableOpacity>
					</ScrollView>
				</View>

				{/* Goals */}
				<View
					style={{ backgroundColor: colors.card }}
					className={`mt-6 ${sectionPadding} rounded-xl shadow-sm`}
				>
					<Text
						style={{ color: colors.text }}
						className={`${headerTextClass} font-bold mb-4`}
					>
						Current Goals
					</Text>
					{/* Only render goals if all data is properly initialized */}
					{userProfile.goals && userProfile.goals.weeklyWorkouts && userProfile.goals.monthlyDistance && userProfile.goals.weightGoal ? (
						<View className="space-y-5">
							<View>
								<View className="flex-row justify-between mb-1">
									<Text style={{ color: colors.text }} className={textSizeClass}>
										Weekly Workouts
									</Text>
									<Text style={{ color: colors.text }} className={textSizeClass} numberOfLines={1}>
										{Math.min(userProfile.goals.weeklyWorkouts.current, userProfile.goals.weeklyWorkouts.target)} /{" "}
										{userProfile.goals.weeklyWorkouts.target}
									</Text>
								</View>
								{renderProgressBar(
									Math.min(userProfile.goals.weeklyWorkouts.current, userProfile.goals.weeklyWorkouts.target),
									userProfile.goals.weeklyWorkouts.target
								)}
							</View>
							<View>
								<View className="flex-row justify-between mb-1">
									<Text style={{ color: colors.text }} className={textSizeClass}>
										Monthly Distance
									</Text>
									<Text style={{ color: colors.text }} className={textSizeClass} numberOfLines={1}>
										{Math.min(userProfile.goals.monthlyDistance.current, userProfile.goals.monthlyDistance.target)} /{" "}
										{userProfile.goals.monthlyDistance.target} km
									</Text>
								</View>
								{renderProgressBar(
									Math.min(userProfile.goals.monthlyDistance.current, userProfile.goals.monthlyDistance.target),
									userProfile.goals.monthlyDistance.target
								)}
							</View>
							<View>
								<View className="flex-row justify-between mb-1">
									<Text style={{ color: colors.text }} className={textSizeClass}>
										Weight Goal
									</Text>
									<Text 
										style={{ color: colors.text }} 
										className={`${textSizeClass} text-right`} 
										numberOfLines={1} 
										ellipsizeMode="tail"
									>
										{typeof userProfile.goals.weightGoal.current === 'number' 
											? userProfile.goals.weightGoal.current.toFixed(1) 
											: '0.0'} /{" "}
										{typeof userProfile.goals.weightGoal.target === 'number' 
											? userProfile.goals.weightGoal.target.toFixed(1) 
											: '0.0'} kg
									</Text>
								</View>
								{renderProgressBar(
									typeof userProfile.goals.weightGoal.current === 'number' && 
									typeof userProfile.goals.weightGoal.target === 'number' 
										? calculateWeightProgress(
												userProfile.goals.weightGoal.current,
												userProfile.goals.weightGoal.target
											)
										: 0,
									100
								)}
							</View>
						</View>
					) : (
						<ActivityIndicator size="small" color={colors.accent} />
					)}
				</View>

				{/* Settings List */}
				<View className="mt-6">
					<Text
						style={{ color: colors.text }}
						className={`${headerTextClass} font-bold mb-4`}
					>
						Account &amp; Preferences
					</Text>

					<TouchableOpacity
						style={{ backgroundColor: colors.card }}
						className={`flex-row items-center justify-between ${sectionPadding} rounded-xl shadow-sm mb-3`}
						onPress={() => handleSettingsNavigation("Account Settings")}
					>
						<View className="flex-row items-center">
							<View
								className={`${
									isSmallDevice ? "w-7 h-7" : "w-8 h-8"
								} bg-indigo-100 rounded-full items-center justify-center`}
							>
								<SettingsIcon size={isSmallDevice ? 16 : 18} color="#6366F1" />
							</View>
							<Text
								style={{ color: colors.text }}
								className={`ml-3 ${textSizeClass} font-medium`}
							>
								Account Settings
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
								className={`${
									isSmallDevice ? "w-7 h-7" : "w-8 h-8"
								} bg-blue-100 rounded-full items-center justify-center`}
							>
								<Bell size={isSmallDevice ? 16 : 18} color="#3B82F6" />
							</View>
							<Text
								style={{ color: colors.text }}
								className={`ml-3 ${textSizeClass} font-medium`}
							>
								Notification Preferences
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
						onPress={() => handleSettingsNavigation("Connected Devices")}
					>
						<View className="flex-row items-center">
							<View
								className={`${
									isSmallDevice ? "w-7 h-7" : "w-8 h-8"
								} bg-green-100 rounded-full items-center justify-center`}
							>
								<Smartphone size={isSmallDevice ? 16 : 18} color="#10B981" />
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

					<TouchableOpacity
						style={{ backgroundColor: colors.card }}
						className={`flex-row items-center justify-between ${sectionPadding} rounded-xl shadow-sm mb-3`}
						onPress={() => setThemeModalVisible(true)}
					>
						<View className="flex-row items-center">
							<View
								className={`${
									isSmallDevice ? "w-7 h-7" : "w-8 h-8"
								} bg-indigo-100 rounded-full items-center justify-center`}
							>
								<Moon size={isSmallDevice ? 16 : 18} color="#6366F1" />
							</View>
							<Text
								style={{ color: colors.text }}
								className={`ml-3 ${textSizeClass} font-medium`}
							>
								Theme Preferences
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
						onPress={() => handleSettingsNavigation("Privacy Settings")}
					>
						<View className="flex-row items-center">
							<View
								className={`${
									isSmallDevice ? "w-7 h-7" : "w-8 h-8"
								} bg-purple-100 rounded-full items-center justify-center`}
							>
								<Lock size={isSmallDevice ? 16 : 18} color="#8B5CF6" />
							</View>
							<Text
								style={{ color: colors.text }}
								className={`ml-3 ${textSizeClass} font-medium`}
							>
								Privacy Settings
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
						onPress={() => handleSettingsNavigation("Help & Support")}
					>
						<View className="flex-row items-center">
							<View
								className={`${
									isSmallDevice ? "w-7 h-7" : "w-8 h-8"
								} bg-yellow-100 rounded-full items-center justify-center`}
							>
								<HelpCircle size={isSmallDevice ? 16 : 18} color="#F59E0B" />
							</View>
							<Text
								style={{ color: colors.text }}
								className={`ml-3 ${textSizeClass} font-medium`}
							>
								Help &amp; Support
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
						onPress={() => {
							loadDatabaseDetails();
							setDatabaseModalVisible(true);
						}}
					>
						<View className="flex-row items-center">
							<View
								className={`${
									isSmallDevice ? "w-7 h-7" : "w-8 h-8"
								} bg-purple-100 rounded-full items-center justify-center`}
							>
								<BarChart size={isSmallDevice ? 16 : 18} color="#8B5CF6" />
							</View>
							<Text
								style={{ color: colors.text }}
								className={`ml-3 ${textSizeClass} font-medium`}
							>
								View Database Details
							</Text>
						</View>
						<ChevronRight
							size={isSmallDevice ? 16 : 18}
							color={colors.secondaryText}
						/>
					</TouchableOpacity>

					{/* Debug: Reset Workout Progress */}
					<TouchableOpacity
						style={{ backgroundColor: colors.card }}
						className={`flex-row items-center justify-between ${sectionPadding} rounded-xl shadow-sm mb-3`}
						onPress={resetWorkoutProgress}
					>
						<View className="flex-row items-center">
							<View
								className={`${
									isSmallDevice ? "w-7 h-7" : "w-8 h-8"
								} bg-red-100 rounded-full items-center justify-center`}
							>
								<Activity size={isSmallDevice ? 16 : 18} color="#EF4444" />
							</View>
							<View>
								<Text
									style={{ color: colors.text }}
									className={`ml-3 ${textSizeClass} font-medium text-red-500`}
								>
									Reset Workout Progress
								</Text>
								<Text
									style={{ color: colors.secondaryText }}
									className="ml-3 text-xs"
								>
									Debug: Reset today's workout data
								</Text>
							</View>
						</View>
						<ChevronRight
							size={isSmallDevice ? 16 : 18}
							color={colors.secondaryText}
						/>
					</TouchableOpacity>

					<TouchableOpacity
						style={{ backgroundColor: colors.card }}
						className={`flex-row items-center justify-between ${sectionPadding} rounded-xl shadow-sm mt-10`}
						onPress={handleLogout}
					>
						<View className="flex-row items-center">
							<View
								className={`${
									isSmallDevice ? "w-7 h-7" : "w-8 h-8"
								} bg-red-100 rounded-full items-center justify-center`}
							>
								<LogOut size={isSmallDevice ? 16 : 18} color="#EF4444" />
							</View>
							<Text
								style={{ color: colors.text }}
								className={`ml-3 ${textSizeClass} font-medium text-red-500`}
							>
								Log Out
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				<View className={`py-${isSmallDevice ? "8" : "10"} mt-4`}>
					<Text
						style={{ color: colors.secondaryText }}
						className="text-center text-xs"
					>
						Version 2.1.0
					</Text>
					<View
						className={`flex-row justify-center space-x-${
							isSmallDevice ? "6" : "8"
						} mt-3`}
					>
						<TouchableOpacity>
							<Text className="text-[#8B5CF6] text-xs font-medium">
								Terms of Service
							</Text>
						</TouchableOpacity>
						<TouchableOpacity>
							<Text className="text-[#8B5CF6] text-xs font-medium">
								Privacy Policy
							</Text>
						</TouchableOpacity>
					</View>

					{/* Additional bottom padding for navbar */}
					<View style={{ height: isSmallDevice ? 80 : 100 }} />
				</View>
			</ScrollView>

			{/* Add Bottom Navigation */}
			<View className="absolute bottom-0 left-0 right-0">
				<BottomNavigation activeTab="settings" />
			</View>

			{/* Edit Profile Modal */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={editModalVisible}
				onRequestClose={handleCancel}
			>
				<View className="flex-1 bg-black/30 justify-end">
					<View
						style={{ backgroundColor: colors.card }}
						className={`rounded-t-3xl ${
							isLargeDevice ? "w-3/4 self-center rounded-3xl" : ""
						}`}
					>
						{/* Header */}
						<View
							style={{ borderBottomColor: colors.border }}
							className="flex-row justify-between items-center p-4 border-b"
						>
							<TouchableOpacity onPress={handleCancel}>
								<Text
									style={{ color: colors.secondaryText }}
									className="font-medium"
								>
									Cancel
								</Text>
							</TouchableOpacity>
							<Text
								style={{ color: colors.text }}
								className="text-lg font-bold"
							>
								Edit Profile
							</Text>
							<TouchableOpacity
								onPress={handleSaveProfile}
								disabled={isLoading}
							>
								{isLoading ? (
									<ActivityIndicator size="small" color="#8B5CF6" />
								) : (
									<Text style={{ color: "#8B5CF6" }} className="font-medium">
										Save
									</Text>
								)}
							</TouchableOpacity>
						</View>

						<ScrollView
							className="p-4"
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingBottom: 40 }}
						>
							{/* Profile Photo Section */}
							<View className="items-center mb-6">
								<View className="relative">
									{uploadingImage ? (
										<View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center">
											<ActivityIndicator color="#8B5CF6" />
										</View>
									) : (
										<Image
											source={{
												uri: editedProfile.avatarUrl,
											}}
											className="w-20 h-20 rounded-full"
										/>
									)}
									<TouchableOpacity
										className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full"
										style={{ right: -3 }}
										onPress={handleChangePhoto}
										disabled={uploadingImage}
									>
										<Camera size={16} color="#FFFFFF" />
									</TouchableOpacity>
								</View>
								<TouchableOpacity
									className="mt-2"
									onPress={handleChangePhoto}
									disabled={uploadingImage}
								>
									<Text className="text-indigo-600 text-sm">Change Photo</Text>
								</TouchableOpacity>
							</View>

							{/* Form Fields */}
							<View className="space-y-6">
								{/* Full Name */}
								<View>
									<Text
										style={{ color: colors.secondaryText }}
										className="mb-2"
									>
										Full Name
									</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<User size={20} color="#8B5CF6" />
										</View>
										<TextInput
											style={{ color: colors.text }}
											className="flex-1 p-4"
											placeholder="Enter your full name"
											value={editedProfile.fullName}
											onChangeText={(text) => {
												const updatedProfile = {
													...editedProfile,
													fullName: text,
												};
												setEditedProfile(updatedProfile);
												saveEditProgress(updatedProfile);
											}}
										/>
									</View>
								</View>

								{/* Username */}
								<View>
									<Text
										style={{ color: colors.secondaryText }}
										className="mb-2"
									>
										Username
									</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<User size={20} color="#8B5CF6" />
										</View>
										<TextInput
											style={{ color: colors.text }}
											className="flex-1 p-4"
											placeholder="Choose a username"
											value={editedProfile.username}
											onChangeText={(text) => {
												const updatedProfile = {
													...editedProfile,
													username: text,
												};
												setEditedProfile(updatedProfile);
												saveEditProgress(updatedProfile);
											}}
										/>
									</View>
								</View>

								{/* Email */}
								<View>
									<Text
										style={{ color: colors.secondaryText }}
										className="mb-2"
									>
										Email
									</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<Mail size={20} color="#8B5CF6" />
										</View>
										<TextInput
											style={{ color: colors.text }}
											className="flex-1 p-4"
											placeholder="Your email address"
											keyboardType="email-address"
											autoCapitalize="none"
											autoCorrect={false}
											autoComplete="email"
											value={editedProfile.email}
											onChangeText={(text) => {
												// Remove spaces from email as the user types
												const formattedEmail = text.replace(/\s+/g, "");
												const updatedProfile = {
													...editedProfile,
													email: formattedEmail,
												};
												setEditedProfile(updatedProfile);
												saveEditProgress(updatedProfile);
											}}
										/>
									</View>
									{editedProfile.email &&
										!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
											editedProfile.email
										) && (
											<Text className="text-red-500 text-xs mt-1">
												Please enter a valid email address
											</Text>
										)}
								</View>

								{/* Birthday */}
								<View>
									<Text
										style={{ color: colors.secondaryText }}
										className="mb-2"
									>
										Birthday
									</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<CalendarIcon size={20} color="#8B5CF6" />
										</View>
										<TextInput
											style={{ color: colors.text }}
											className="flex-1 p-4"
											placeholder="MM/DD/YYYY"
											value={editedProfile.birthday}
											onChangeText={(text) => {
												const updatedProfile = {
													...editedProfile,
													birthday: text,
												};
												setEditedProfile(updatedProfile);
												saveEditProgress(updatedProfile);
											}}
										/>
									</View>
								</View>

								{/* Gender */}
								<View>
									<Text
										style={{ color: colors.secondaryText }}
										className="mb-2"
									>
										Gender
									</Text>
									<View
										className="border border-gray-300 rounded-lg overflow-hidden"
										style={{ borderColor: colors.border }}
									>
										<View className="flex-row items-center">
											<View className="pl-3 pr-2">
												<Users size={20} color="#8B5CF6" />
											</View>
											<TouchableOpacity
												onPress={() => {
													setShowGenderModal(true);
												}}
												className="flex-1 p-4"
											>
												<Text
													style={{
														color: editedProfile.gender
															? colors.text
															: colors.secondaryText,
														fontWeight: editedProfile.gender ? "500" : "400",
													}}
												>
													{editedProfile.gender || "Select gender"}
												</Text>
											</TouchableOpacity>
											<TouchableOpacity
												onPress={() => {
													setShowGenderModal(true);
												}}
												className="pr-4 pl-2 py-4"
												style={{
													backgroundColor: isDarkMode
														? "rgba(139, 92, 246, 0.1)"
														: "rgba(99, 102, 241, 0.05)",
													borderRadius: 8,
													marginRight: 8,
												}}
											>
												<ChevronRightIcon
													size={18}
													color={isDarkMode ? "#8B5CF6" : "#6366F1"}
												/>
											</TouchableOpacity>
										</View>
									</View>
								</View>

								{/* Height */}
								<View>
									<Text
										style={{ color: colors.secondaryText }}
										className="mb-2"
									>
										Height (cm)
									</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<Ruler size={20} color="#8B5CF6" />
										</View>
										<TextInput
											style={{ color: colors.text }}
											className="flex-1 p-4"
											placeholder="Height in cm"
											keyboardType="numeric"
											value={editedProfile.height}
											onChangeText={(text) => {
												const updatedProfile = {
													...editedProfile,
													height: text,
												};
												setEditedProfile(updatedProfile);
												saveEditProgress(updatedProfile);
											}}
										/>
									</View>
								</View>

								{/* Weight */}
								<View>
									<Text
										style={{ color: colors.secondaryText }}
										className="mb-2"
									>
										Weight (kg)
									</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<Weight size={20} color="#8B5CF6" />
										</View>
										<TextInput
											style={{ color: colors.text }}
											className="flex-1 p-4"
											placeholder="Weight in kg"
											keyboardType="numeric"
											value={editedProfile.weight}
											onChangeText={(text) => {
												const updatedProfile = {
													...editedProfile,
													weight: text,
												};
												setEditedProfile(updatedProfile);
												saveEditProgress(updatedProfile);
											}}
										/>
									</View>
								</View>
							</View>
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Theme Preferences Modal */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={themeModalVisible}
				onRequestClose={() => setThemeModalVisible(false)}
			>
				<View className="flex-1 bg-black/50 justify-center items-center">
					<View
						style={{ backgroundColor: isDarkMode ? "#000000" : colors.card }}
						className="rounded-3xl w-[85%] overflow-hidden shadow-lg"
					>
						{/* Header */}
						<View
							style={{ borderBottomColor: colors.border }}
							className="flex-row justify-between items-center p-4 border-b"
						>
							<TouchableOpacity onPress={() => setThemeModalVisible(false)}>
								<X
									size={20}
									color={isDarkMode ? "#AAAAAA" : colors.secondaryText}
								/>
							</TouchableOpacity>
							<Text
								style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
								className="text-lg font-bold"
							>
								Theme Preferences
							</Text>
							<View style={{ width: 20 }} />
						</View>

						<View
							className="p-4 pb-8"
							style={{ backgroundColor: isDarkMode ? "#000000" : colors.card }}
						>
							<Text
								style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
								className="font-bold text-base mb-4"
							>
								Choose Theme
							</Text>

							{/* Light Theme Option */}
							<TouchableOpacity
								style={{
									backgroundColor: isDarkMode ? "#000000" : "#F9FAFB",
									borderColor:
										currentTheme === "light"
											? "#8B5CF6"
											: isDarkMode
											? "#555555"
											: "#E5E7EB",
									borderWidth: 1,
								}}
								className="flex-row items-center justify-between p-4 rounded-xl mb-4"
								onPress={() => setTheme("light")}
							>
								<View className="flex-row items-center">
									<View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center">
										<Sun size={22} color="#F59E0B" />
									</View>
									<View className="ml-3">
										<Text
											style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
											className="font-medium"
										>
											Light
										</Text>
										<Text
											style={{
												color: isDarkMode ? "#CCCCCC" : colors.secondaryText,
											}}
											className="text-sm"
										>
											Default light appearance
										</Text>
									</View>
								</View>
								{currentTheme === "light" && (
									<Check color="#8B5CF6" size={20} />
								)}
							</TouchableOpacity>

							{/* Dark Theme Option */}
							<TouchableOpacity
								style={{
									backgroundColor: isDarkMode ? "#000000" : "#F9FAFB",
									borderColor:
										currentTheme === "dark"
											? "#8B5CF6"
											: isDarkMode
											? "#555555"
											: "#E5E7EB",
									borderWidth: 1,
								}}
								className="flex-row items-center justify-between p-4 rounded-xl"
								onPress={() => setTheme("dark")}
							>
								<View className="flex-row items-center">
									<View className="w-10 h-10 bg-[#222222] rounded-full items-center justify-center">
										<Moon size={22} color="#6366F1" />
									</View>
									<View className="ml-3">
										<Text
											style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
											className="font-medium"
										>
											Dark
										</Text>
										<Text
											style={{
												color: isDarkMode ? "#CCCCCC" : colors.secondaryText,
											}}
											className="text-sm"
										>
											Easier on the eyes in low light
										</Text>
									</View>
								</View>
								{currentTheme === "dark" && <Check color="#8B5CF6" size={20} />}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Gender Selection Modal */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={showGenderModal}
				onRequestClose={() => setShowGenderModal(false)}
			>
				<View className="flex-1 bg-black/50 justify-center items-center">
					<View
						style={{ backgroundColor: isDarkMode ? "#121212" : colors.card }}
						className="rounded-3xl w-[85%] overflow-hidden shadow-lg"
					>
						{/* Header */}
						<View
							style={{ borderBottomColor: colors.border }}
							className="flex-row justify-between items-center p-4 border-b"
						>
							<TouchableOpacity onPress={() => setShowGenderModal(false)}>
								<X
									size={20}
									color={isDarkMode ? "#AAAAAA" : colors.secondaryText}
								/>
							</TouchableOpacity>
							<Text
								style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
								className="text-lg font-bold"
							>
								Select Gender
							</Text>
							<View style={{ width: 20 }} />
						</View>

						<View className="p-4 pb-8">
							<TouchableOpacity
								className="mb-3"
								onPress={() => {
									const updatedProfile = { ...editedProfile, gender: "Male" };
									setEditedProfile(updatedProfile);
									saveEditProgress(updatedProfile);
									setShowGenderModal(false);
								}}
							>
								<View
									className="p-4 rounded-xl flex-row items-center justify-between"
									style={{
										backgroundColor: isDarkMode ? "#1E1E1E" : "#F3F4F6",
										borderWidth: editedProfile.gender === "Male" ? 2 : 0,
										borderColor: isDarkMode ? "#8B5CF6" : "#6366F1",
									}}
								>
									<View className="flex-row items-center">
										<View
											className="w-10 h-10 rounded-full items-center justify-center"
											style={{
												backgroundColor: isDarkMode ? "#312E81" : "#E0E7FF",
											}}
										>
											<User
												size={20}
												color={isDarkMode ? "#818CF8" : "#4F46E5"}
											/>
										</View>
										<Text
											className="ml-3 font-medium text-base"
											style={{ color: colors.text }}
										>
											Male
										</Text>
									</View>
									{editedProfile.gender === "Male" && (
										<Check
											size={20}
											color={isDarkMode ? "#8B5CF6" : "#6366F1"}
										/>
									)}
								</View>
							</TouchableOpacity>

							<TouchableOpacity
								className="mb-3"
								onPress={() => {
									const updatedProfile = { ...editedProfile, gender: "Female" };
									setEditedProfile(updatedProfile);
									saveEditProgress(updatedProfile);
									setShowGenderModal(false);
								}}
							>
								<View
									className="p-4 rounded-xl flex-row items-center justify-between"
									style={{
										backgroundColor: isDarkMode ? "#1E1E1E" : "#F3F4F6",
										borderWidth: editedProfile.gender === "Female" ? 2 : 0,
										borderColor: isDarkMode ? "#8B5CF6" : "#6366F1",
									}}
								>
									<View className="flex-row items-center">
										<View
											className="w-10 h-10 rounded-full items-center justify-center"
											style={{
												backgroundColor: isDarkMode ? "#831843" : "#FCE7F3",
											}}
										>
											<User
												size={20}
												color={isDarkMode ? "#F472B6" : "#EC4899"}
											/>
										</View>
										<Text
											className="ml-3 font-medium text-base"
											style={{ color: colors.text }}
										>
											Female
										</Text>
									</View>
									{editedProfile.gender === "Female" && (
										<Check
											size={20}
											color={isDarkMode ? "#8B5CF6" : "#6366F1"}
										/>
									)}
								</View>
							</TouchableOpacity>

							<TouchableOpacity
								className="mb-3"
								onPress={() => {
									const updatedProfile = {
										...editedProfile,
										gender: "Non-binary",
									};
									setEditedProfile(updatedProfile);
									saveEditProgress(updatedProfile);
									setShowGenderModal(false);
								}}
							>
								<View
									className="p-4 rounded-xl flex-row items-center justify-between"
									style={{
										backgroundColor: isDarkMode ? "#1E1E1E" : "#F3F4F6",
										borderWidth: editedProfile.gender === "Non-binary" ? 2 : 0,
										borderColor: isDarkMode ? "#8B5CF6" : "#6366F1",
									}}
								>
									<View className="flex-row items-center">
										<View
											className="w-10 h-10 rounded-full items-center justify-center"
											style={{
												backgroundColor: isDarkMode ? "#065F46" : "#D1FAE5",
											}}
										>
											<Users
												size={20}
												color={isDarkMode ? "#34D399" : "#10B981"}
											/>
										</View>
										<Text
											className="ml-3 font-medium text-base"
											style={{ color: colors.text }}
										>
											Non-binary
										</Text>
									</View>
									{editedProfile.gender === "Non-binary" && (
										<Check
											size={20}
											color={isDarkMode ? "#8B5CF6" : "#6366F1"}
										/>
									)}
								</View>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={() => {
									const updatedProfile = {
										...editedProfile,
										gender: "Prefer not to say",
									};
									setEditedProfile(updatedProfile);
									saveEditProgress(updatedProfile);
									setShowGenderModal(false);
								}}
							>
								<View
									className="p-4 rounded-xl flex-row items-center justify-between"
									style={{
										backgroundColor: isDarkMode ? "#1E1E1E" : "#F3F4F6",
										borderWidth:
											editedProfile.gender === "Prefer not to say" ? 2 : 0,
										borderColor: isDarkMode ? "#8B5CF6" : "#6366F1",
									}}
								>
									<View className="flex-row items-center">
										<View
											className="w-10 h-10 rounded-full items-center justify-center"
											style={{
												backgroundColor: isDarkMode ? "#1F2937" : "#F3F4F6",
											}}
										>
											<Users
												size={20}
												color={isDarkMode ? "#9CA3AF" : "#6B7280"}
											/>
										</View>
										<Text
											className="ml-3 font-medium text-base"
											style={{ color: colors.text }}
										>
											Prefer not to say
										</Text>
									</View>
									{editedProfile.gender === "Prefer not to say" && (
										<Check
											size={20}
											color={isDarkMode ? "#8B5CF6" : "#6366F1"}
										/>
									)}
								</View>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Toast for error messages */}
			<Toast
				message={errorMessage}
				type="error"
				visible={showError}
				onDismiss={() => setShowError(false)}
			/>

			{/* Render the database modal */}
			{renderDatabaseModal()}

			{/* Render logout confirmation modal */}
			{renderLogoutModal()}
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
