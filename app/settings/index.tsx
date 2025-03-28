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
const { useTheme } = ThemeModule;

interface UserProfile {
	username: string;
	fullName: string;
	email: string;
	birthday: string;
	gender: string;
	height: string;
	weight: string;
	stats: {
		workouts: number;
		hours: number;
		calories: number;
	};
	goals: {
		weeklyWorkouts: { current: number; target: number };
		monthlyDistance: { current: number; target: number };
		weightGoal: { current: number; target: number };
	};
	avatarUrl: string;
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
		weight: "68 kg",
		stats: {
			workouts: 124,
			hours: 85,
			calories: 12400,
		},
		goals: {
			weeklyWorkouts: { current: 4, target: 5 },
			monthlyDistance: { current: 45, target: 50 },
			weightGoal: { current: 68, target: 65 },
		},
		avatarUrl: "",
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

	// First, load data from AsyncStorage immediately
	React.useEffect(() => {
		const loadCachedProfile = async () => {
			try {
				const user = await getUser();
				if (!user) return;

				// Get user-specific cached data
				const cachedProfileKey = `userProfile-${user.id}`;
				const cachedProfile = await AsyncStorage.getItem(cachedProfileKey);

				if (cachedProfile) {
					const cachedData = JSON.parse(cachedProfile);
					// Only update if we have data
					if (cachedData.username || cachedData.email || cachedData.avatarUrl) {
						setUserProfile((prev) => ({
							...prev,
							username: cachedData.username || prev.username,
							email: cachedData.email || prev.email,
							avatarUrl: cachedData.avatarUrl || prev.avatarUrl,
						}));
					}
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
			setProfileLoading(true);
			try {
				const user = await getUser();
				if (user) {
					// Load authenticated user data first to get email
					setUserProfile((prev) => ({
						...prev,
						email: user.email || prev.email,
						username: prev.username || user.email?.split("@")[0] || "",
					}));

					const profile = await getUserProfile(user.id);
					if (profile) {
						// Load from AsyncStorage with user-specific key
						const cachedProfileKey = `userProfile-${user.id}`;
						const cachedProfile = await AsyncStorage.getItem(cachedProfileKey);
						let cachedData = null;

						if (cachedProfile) {
							cachedData = JSON.parse(cachedProfile);
						}

						const updatedProfile: UserProfile = {
							...userProfile,
							username: profile.username || user.email?.split("@")[0] || "",
							email: user.email || "",
							height: profile.height ? `${profile.height} cm` : "175 cm",
							weight: profile.weight ? `${profile.weight} kg` : "68 kg",
							// Prioritize Supabase data, then cached data
							avatarUrl:
								profile.avatar_url ||
								cachedData?.avatarUrl ||
								`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
						};
						setUserProfile(updatedProfile);

						// Update cache with the latest data
						await AsyncStorage.setItem(
							cachedProfileKey,
							JSON.stringify({
								userId: user.id,
								username: updatedProfile.username,
								email: updatedProfile.email,
								avatarUrl: updatedProfile.avatarUrl,
							})
						);
					}
				}
			} catch (error) {
				console.error("Error loading user profile:", error);
				showErrorToast("Failed to load profile data");
			} finally {
				setProfileLoading(false);
			}
		};

		loadUserProfile();
	}, []);

	// No need to load theme preferences here anymore as they are handled by the theme context

	const showErrorToast = (message: string) => {
		setErrorMessage(message);
		setShowError(true);
	};

	const handleLogout = async () => {
		try {
			Alert.alert("Logout", "Are you sure you want to logout?", [
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Logout",
					style: "destructive",
					onPress: async () => {
						await logout();
					},
				},
			]);
		} catch (error) {
			console.error("Error logging out:", error);
			showErrorToast("Failed to logout. Please try again.");
		}
	};

	const handleEditProfile = () => {
		setEditedProfile({
			username: userProfile.username,
			fullName: userProfile.fullName,
			email: userProfile.email,
			birthday: userProfile.birthday,
			gender: userProfile.gender,
			height: userProfile.height.replace(" cm", ""),
			weight: userProfile.weight.replace(" kg", ""),
			avatarUrl: userProfile.avatarUrl,
		});
		setEditModalVisible(true);
	};

	const handleCancel = () => {
		setEditModalVisible(false);
	};

	const handleChangePhoto = async () => {
		try {
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (status !== "granted") {
				showErrorToast("Gallery permission is required to change your photo");
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: "images", // This will be automatically handled
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.5,
			});

			if (!result.canceled) {
				setUploadingImage(true);

				const user = await getUser();
				if (!user) {
					throw new Error("User not authenticated");
				}

				// Get local URI
				const imageUri = result.assets[0].uri;

				// Upload to Supabase using user-specific path
				const avatarUrl = await uploadImageToSupabase(
					imageUri,
					"avatars",
					"public",
					user.id
				);

				// Always update the profile with whatever URL we got back
				try {
					await updateUserProfile(user.id, {
						avatar_url: avatarUrl,
					});
				} catch (profileError) {
					console.log("Profile update error (non-critical):", profileError);
					// Continue even if profile update fails
				}

				// Always update local state
				setEditedProfile((prev) => ({
					...prev,
					avatarUrl: avatarUrl,
				}));

				setUserProfile((prev) => ({
					...prev,
					avatarUrl: avatarUrl,
				}));

				// Cache the updated avatar URL with user-specific key
				try {
					const userKey = `userProfile-${user.id}`;
					const cachedProfile = await AsyncStorage.getItem(userKey);
					if (cachedProfile) {
						const parsed = JSON.parse(cachedProfile);
						await AsyncStorage.setItem(
							userKey,
							JSON.stringify({
								...parsed,
								avatarUrl: avatarUrl,
							})
						);
					} else {
						// Create new cache entry if none exists
						await AsyncStorage.setItem(
							userKey,
							JSON.stringify({
								userId: user.id,
								avatarUrl: avatarUrl,
							})
						);
					}
				} catch (cacheError) {
					console.error("Error caching profile:", cacheError);
				}

				// Try to clean up old images (non-critical)
				try {
					await deleteOldProfileImages("avatars", user.id);
				} catch (cleanupError) {
					console.log("Cleanup error (non-critical):", cleanupError);
				}
			}
		} catch (error) {
			console.error("Error picking/uploading image:", error);
			showErrorToast("Error updating profile picture");
		} finally {
			setUploadingImage(false);
		}
	};

	const handleSaveProfile = async () => {
		try {
			setIsLoading(true);
			const user = await getUser();

			if (!user) {
				throw new Error("User not authenticated");
			}

			// Validate email format with a more strict regex
			const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
			if (editedProfile.email && !emailRegex.test(editedProfile.email)) {
				throw new Error("Please enter a valid email address");
			}

			// Create a copy of the profile to update
			const profileToUpdate: any = {
				username: editedProfile.username,
			};

			// Only include email if it changed and is valid
			if (
				editedProfile.email &&
				editedProfile.email !== userProfile.email &&
				emailRegex.test(editedProfile.email)
			) {
				profileToUpdate.email = editedProfile.email;
			}

			// Include avatar if available
			if (editedProfile.avatarUrl) {
				profileToUpdate.avatar_url = editedProfile.avatarUrl;
			}

			// Update the profile in the database - only sending fields that exist in the database
			await updateUserProfile(user.id, profileToUpdate);

			// Update the local state
			const updatedProfile = {
				...userProfile,
				username: editedProfile.username || userProfile.username,
				fullName: editedProfile.fullName || userProfile.fullName,
				// Don't update email locally if it wasn't included in the update
				email: profileToUpdate.email || userProfile.email,
				birthday: editedProfile.birthday || userProfile.birthday,
				gender: editedProfile.gender || userProfile.gender,
				height: `${
					editedProfile.height || userProfile.height.replace(" cm", "")
				} cm`,
				weight: `${
					editedProfile.weight || userProfile.weight.replace(" kg", "")
				} kg`,
				avatarUrl: editedProfile.avatarUrl || userProfile.avatarUrl,
			};

			setUserProfile(updatedProfile);

			// Cache the updated profile for persistence with user-specific key
			await AsyncStorage.setItem(
				`userProfile-${user.id}`,
				JSON.stringify(updatedProfile)
			);

			Alert.alert("Success", "Profile updated successfully");
			setEditModalVisible(false);
		} catch (error) {
			console.error("Error updating profile:", error);
			// Create a user-friendly error message
			let errorMsg = "Failed to update profile";

			if (error instanceof Error) {
				// Check for auth API errors
				if (
					error.message.includes("Email address") &&
					error.message.includes("invalid")
				) {
					errorMsg =
						"The email address format is invalid. Please check and try again.";
				} else if (error.message.includes("Email address")) {
					errorMsg =
						"There was a problem with the email address. Please try a different one.";
				} else {
					errorMsg = error.message;
				}
			}

			showErrorToast(errorMsg);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSettingsNavigation = (settingType: string) => {
		// This function can be expanded to navigate to different settings screens
		Alert.alert("Navigate", `Navigating to ${settingType}...`);
		// router.push(`/settings/${settingType.toLowerCase().replace(/\s+/g, '-')}`);
	};

	const renderProgressBar = (current: number, target: number) => {
		const progress = Math.min((current / target) * 100, 100);
		return (
			<View
				className="h-2 rounded-full w-full mt-2"
				style={{ backgroundColor: isDarkMode ? "#333333" : "#F3F4F6" }}
			>
				<View
					className="h-full rounded-full"
					style={{
						width: `${progress}%`,
						backgroundColor: isDarkMode ? "#8B5CF6" : "#6366F1",
					}}
				/>
			</View>
		);
	};

	const getDisplayTheme = () => {
		return currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
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
								<Text
									style={{ color: colors.secondaryText }}
									className="text-xs mt-1"
								>
									{profileLoading && !userProfile.email
										? "Loading..."
										: userProfile.email}
								</Text>
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
									{userProfile.stats.workouts}
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
									{userProfile.stats.hours}h
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
									{(userProfile.stats.calories / 1000).toFixed(1)}k
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
					<View className="space-y-5">
						<View>
							<View className="flex-row justify-between mb-1">
								<Text style={{ color: colors.text }} className={textSizeClass}>
									Weekly Workouts
								</Text>
								<Text style={{ color: colors.text }} className={textSizeClass}>
									{userProfile.goals.weeklyWorkouts.current} /{" "}
									{userProfile.goals.weeklyWorkouts.target}
								</Text>
							</View>
							{renderProgressBar(
								userProfile.goals.weeklyWorkouts.current,
								userProfile.goals.weeklyWorkouts.target
							)}
						</View>
						<View>
							<View className="flex-row justify-between mb-1">
								<Text style={{ color: colors.text }} className={textSizeClass}>
									Monthly Distance
								</Text>
								<Text style={{ color: colors.text }} className={textSizeClass}>
									{userProfile.goals.monthlyDistance.current} /{" "}
									{userProfile.goals.monthlyDistance.target} km
								</Text>
							</View>
							{renderProgressBar(
								userProfile.goals.monthlyDistance.current,
								userProfile.goals.monthlyDistance.target
							)}
						</View>
						<View>
							<View className="flex-row justify-between mb-1">
								<Text style={{ color: colors.text }} className={textSizeClass}>
									Weight Goal
								</Text>
								<Text style={{ color: colors.text }} className={textSizeClass}>
									{userProfile.goals.weightGoal.current} /{" "}
									{userProfile.goals.weightGoal.target} kg
								</Text>
							</View>
							{renderProgressBar(
								userProfile.goals.weightGoal.current,
								userProfile.goals.weightGoal.target
							)}
						</View>
					</View>
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
											onChangeText={(text) =>
												setEditedProfile({ ...editedProfile, fullName: text })
											}
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
											onChangeText={(text) =>
												setEditedProfile({ ...editedProfile, username: text })
											}
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
												setEditedProfile({
													...editedProfile,
													email: formattedEmail,
												});
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
											onChangeText={(text) =>
												setEditedProfile({ ...editedProfile, birthday: text })
											}
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
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<Users size={20} color="#8B5CF6" />
										</View>
										<TextInput
											style={{ color: colors.text }}
											className="flex-1 p-4"
											placeholder="Male/Female/Other"
											value={editedProfile.gender}
											onChangeText={(text) =>
												setEditedProfile({ ...editedProfile, gender: text })
											}
										/>
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
											onChangeText={(text) =>
												setEditedProfile({ ...editedProfile, height: text })
											}
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
											onChangeText={(text) =>
												setEditedProfile({ ...editedProfile, weight: text })
											}
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

			{/* Toast for error messages */}
			<Toast
				message={errorMessage}
				type="error"
				visible={showError}
				onDismiss={() => setShowError(false)}
			/>
		</SafeAreaView>
	);
}
