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
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { logout, deleteUserAccount } from "../utils/auth";
import { getUser, getUserProfile, updateUserProfile } from "../utils/supabase";
import BottomNavigation from "../components/BottomNavigation";
import Toast from "../components/Toast";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

	const iconSize = isSmallDevice ? 20 : 24;
	const avatarSize = isSmallDevice ? 48 : isLargeDevice ? 80 : 56;
	const textSizeClass = isSmallDevice ? "text-sm" : "text-base";
	const headerTextClass = isSmallDevice ? "text-lg" : "text-xl";
	const sectionPadding = isSmallDevice ? "p-3" : "p-4";
	const containerPadding = isSmallDevice ? "px-3" : "px-4";

	const [userProfile, setUserProfile] = React.useState<UserProfile>({
		username: "Alex Parker",
		fullName: "Alex Parker",
		email: "alex.parker@email.com",
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
		avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=alex.parker@email.com`,
	});
	const [editModalVisible, setEditModalVisible] = React.useState(false);
	const [editedProfile, setEditedProfile] = React.useState<
		Partial<UserProfile>
	>({});
	const [isLoading, setIsLoading] = React.useState(false);
	const [errorMessage, setErrorMessage] = React.useState("");
	const [showError, setShowError] = React.useState(false);
	const [uploadingImage, setUploadingImage] = React.useState(false);

	React.useEffect(() => {
		console.log("Settings screen mounted");
		const loadUserProfile = async () => {
			try {
				const user = await getUser();
				if (user) {
					const profile = await getUserProfile(user.id);
					if (profile) {
						const updatedProfile: UserProfile = {
							...userProfile,
							username: profile.username || user.email?.split("@")[0] || "",
							email: user.email || "",
							height: profile.height ? `${profile.height} cm` : "175 cm",
							weight: profile.weight ? `${profile.weight} kg` : "68 kg",
							avatarUrl:
								profile.avatar_url ||
								`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
						};
						setUserProfile(updatedProfile);
					}
				}
			} catch (error) {
				console.error("Error loading user profile:", error);
				showErrorToast("Failed to load profile data");
			}
		};

		loadUserProfile();
	}, []);

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
				mediaTypes: "images",
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

				// Update both the edited profile and visible profile immediately
				const newAvatarUrl = result.assets[0].uri;
				setEditedProfile((prev) => ({
					...prev,
					avatarUrl: newAvatarUrl,
				}));

				setUserProfile((prev) => ({
					...prev,
					avatarUrl: newAvatarUrl,
				}));

				setUploadingImage(false);
			}
		} catch (error) {
			console.error("Error picking image:", error);
			showErrorToast("Error selecting image");
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

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (editedProfile.email && !emailRegex.test(editedProfile.email)) {
				throw new Error("Please enter a valid email address");
			}

			// Update the profile in the database - only sending fields that exist in the database
			await updateUserProfile(user.id, {
				username: editedProfile.username,
				email: editedProfile.email,
				avatar_url: editedProfile.avatarUrl,
			});

			// Update the local state
			const updatedProfile = {
				...userProfile,
				username: editedProfile.username || userProfile.username,
				fullName: editedProfile.fullName || userProfile.fullName,
				email: editedProfile.email || userProfile.email,
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

			// Cache the updated profile for persistence
			await AsyncStorage.setItem("userProfile", JSON.stringify(updatedProfile));

			Alert.alert("Success", "Profile updated successfully");
			setEditModalVisible(false);
		} catch (error) {
			console.error("Error updating profile:", error);
			// Create a user-friendly error message
			const errorMsg = (error as Error).message;
			showErrorToast(errorMsg || "Failed to update profile");
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
			<View className="h-2 bg-[#F3F4F6] rounded-full w-full mt-2">
				<LinearGradient
					colors={["#8B5CF6", "#6366F1"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					className="h-full rounded-full"
					style={{ width: `${progress}%` }}
				/>
			</View>
		);
	};

	return (
		<SafeAreaView className="flex-1 bg-[#F9FAFB]">
			<Stack.Screen
				options={{
					headerShown: false,
				}}
			/>
			<ScrollView className="flex-1 px-4 pb-16">
				{/* Profile Header */}
				<View className="pt-4">
					<View className="flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm">
						<View className="flex-row items-center">
							<Image
								source={{
									uri: userProfile.avatarUrl,
								}}
								className="w-12 h-12 rounded-full"
							/>
							<View className="ml-3">
								<Text className="text-base font-medium">
									{userProfile.username}
								</Text>
								<Text className="text-xs text-gray-500">
									{userProfile.email}
								</Text>
							</View>
						</View>
						<TouchableOpacity onPress={handleEditProfile}>
							<SettingsIcon size={18} color="#6B7280" />
						</TouchableOpacity>
					</View>

					{/* Stats */}
					<View className="mt-4">
						<View className="flex-row justify-between">
							<View className="flex-1 items-center mr-2">
								<View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mb-2">
									<Activity size={18} color="#8B5CF6" />
								</View>
								<Text className="text-xl font-bold">
									{userProfile.stats.workouts}
								</Text>
								<Text className="text-xs text-gray-400 mt-1">Workouts</Text>
							</View>
							<View className="flex-1 items-center mx-2">
								<View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mb-2">
									<Clock size={18} color="#3B82F6" />
								</View>
								<Text className="text-xl font-bold">
									{userProfile.stats.hours}h
								</Text>
								<Text className="text-xs text-gray-400 mt-1">Hours</Text>
							</View>
							<View className="flex-1 items-center ml-2">
								<View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mb-2">
									<Flame size={18} color="#F97316" />
								</View>
								<Text className="text-xl font-bold">
									{(userProfile.stats.calories / 1000).toFixed(1)}k
								</Text>
								<Text className="text-xs text-gray-400 mt-1">Calories</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Achievements */}
				<View className="mt-6">
					<View className="flex-row justify-between items-center mb-3">
						<Text className="text-base font-bold">My Achievements</Text>
						<TouchableOpacity>
							<Text className="text-[#8B5CF6] text-sm">View All</Text>
						</TouchableOpacity>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className="pb-1"
					>
						<TouchableOpacity className="mr-3 w-36 h-24 overflow-hidden rounded-xl shadow-sm">
							<LinearGradient
								colors={["#8B5CF6", "#6366F1"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								className="p-3 w-full h-full justify-between"
							>
								<View className="items-center bg-white/20 self-start p-1 rounded-full">
									<Trophy size={14} color="#FFF" />
								</View>
								<View>
									<Text className="text-white font-medium">30 Days Streak</Text>
									<Text className="text-white opacity-70 text-xs mt-1">
										Jan 15
									</Text>
								</View>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity className="mr-3 w-36 h-24 overflow-hidden rounded-xl shadow-sm">
							<LinearGradient
								colors={["#6366F1", "#8B5CF6"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								className="p-3 w-full h-full justify-between"
							>
								<View className="items-center bg-white/20 self-start p-1 rounded-full">
									<Award size={14} color="#FFF" />
								</View>
								<View>
									<Text className="text-white font-medium">First 5K</Text>
									<Text className="text-white opacity-70 text-xs mt-1">
										Dec 28
									</Text>
								</View>
							</LinearGradient>
						</TouchableOpacity>
					</ScrollView>
				</View>

				{/* Goals */}
				<View className="mt-6 bg-white p-4 rounded-xl shadow-sm">
					<Text className="text-base font-bold mb-4">Current Goals</Text>
					<View className="space-y-5">
						<View>
							<View className="flex-row justify-between mb-1">
								<Text className="text-sm">Weekly Workouts</Text>
								<Text className="text-sm">
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
								<Text className="text-sm">Monthly Distance</Text>
								<Text className="text-sm">
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
								<Text className="text-sm">Weight Goal</Text>
								<Text className="text-sm">
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
				<View className="mt-6 space-y-6">
					<TouchableOpacity
						className="flex-row items-center justify-between"
						onPress={() => handleSettingsNavigation("Account Settings")}
					>
						<View className="flex-row items-center">
							<SettingsIcon size={18} color="#6B7280" />
							<Text className="ml-3 text-sm">Account Settings</Text>
						</View>
						<ChevronRight size={18} color="#C4C4C4" />
					</TouchableOpacity>

					<TouchableOpacity
						className="flex-row items-center justify-between"
						onPress={() => handleSettingsNavigation("Notification Preferences")}
					>
						<View className="flex-row items-center">
							<Bell size={18} color="#6B7280" />
							<Text className="ml-3 text-sm">Notification Preferences</Text>
						</View>
						<ChevronRight size={18} color="#C4C4C4" />
					</TouchableOpacity>

					<TouchableOpacity
						className="flex-row items-center justify-between"
						onPress={() => handleSettingsNavigation("Connected Devices")}
					>
						<View className="flex-row items-center">
							<Smartphone size={18} color="#6B7280" />
							<Text className="ml-3 text-sm">Connected Devices</Text>
						</View>
						<ChevronRight size={18} color="#C4C4C4" />
					</TouchableOpacity>

					<TouchableOpacity
						className="flex-row items-center justify-between"
						onPress={() => handleSettingsNavigation("Privacy Settings")}
					>
						<View className="flex-row items-center">
							<Lock size={18} color="#6B7280" />
							<Text className="ml-3 text-sm">Privacy Settings</Text>
						</View>
						<ChevronRight size={18} color="#C4C4C4" />
					</TouchableOpacity>

					<TouchableOpacity
						className="flex-row items-center justify-between"
						onPress={() => handleSettingsNavigation("Help & Support")}
					>
						<View className="flex-row items-center">
							<HelpCircle size={18} color="#6B7280" />
							<Text className="ml-3 text-sm">Help & Support</Text>
						</View>
						<ChevronRight size={18} color="#C4C4C4" />
					</TouchableOpacity>

					<TouchableOpacity
						className="flex-row items-center"
						onPress={handleLogout}
					>
						<LogOut size={18} color="#EF4444" />
						<Text className="ml-3 text-sm text-red-500">Log Out</Text>
					</TouchableOpacity>
				</View>

				<View className="py-6">
					<Text className="text-center text-xs text-gray-400">
						Version 2.1.0
					</Text>
					<View className="flex-row justify-center space-x-6 mt-2">
						<Text className="text-[#8B5CF6] text-xs">Terms of Service</Text>
						<Text className="text-[#8B5CF6] text-xs">Privacy Policy</Text>
					</View>
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
						className={`bg-white rounded-t-3xl ${
							isLargeDevice ? "w-3/4 self-center rounded-3xl" : ""
						}`}
					>
						{/* Header */}
						<View className="flex-row justify-between items-center p-4 border-b border-gray-100">
							<TouchableOpacity onPress={handleCancel}>
								<Text className="text-gray-500 font-medium">Cancel</Text>
							</TouchableOpacity>
							<Text className="text-lg font-bold">Edit Profile</Text>
							<TouchableOpacity
								onPress={handleSaveProfile}
								disabled={isLoading}
							>
								{isLoading ? (
									<ActivityIndicator size="small" color="#8B5CF6" />
								) : (
									<Text className="text-indigo-600 font-medium">Save</Text>
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
							<View className="space-y-4">
								{/* Full Name */}
								<View>
									<Text className="text-gray-600 mb-1">Full Name</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<User size={20} color="#6B7280" />
										</View>
										<TextInput
											className="flex-1 p-3 text-gray-800"
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
									<Text className="text-gray-600 mb-1">Username</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<User size={20} color="#6B7280" />
										</View>
										<TextInput
											className="flex-1 p-3 text-gray-800"
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
									<Text className="text-gray-600 mb-1">Email</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<Mail size={20} color="#6B7280" />
										</View>
										<TextInput
											className="flex-1 p-3 text-gray-800"
											placeholder="Your email address"
											keyboardType="email-address"
											autoCapitalize="none"
											value={editedProfile.email}
											onChangeText={(text) =>
												setEditedProfile({ ...editedProfile, email: text })
											}
										/>
									</View>
								</View>

								{/* Birthday */}
								<View>
									<Text className="text-gray-600 mb-1">Birthday</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<CalendarIcon size={20} color="#6B7280" />
										</View>
										<TextInput
											className="flex-1 p-3 text-gray-800"
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
									<Text className="text-gray-600 mb-1">Gender</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<Users size={20} color="#6B7280" />
										</View>
										<TextInput
											className="flex-1 p-3 text-gray-800"
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
									<Text className="text-gray-600 mb-1">Height (cm)</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<Ruler size={20} color="#6B7280" />
										</View>
										<TextInput
											className="flex-1 p-3 text-gray-800"
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
									<Text className="text-gray-600 mb-1">Weight (kg)</Text>
									<View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
										<View className="pl-3 pr-2">
											<Weight size={20} color="#6B7280" />
										</View>
										<TextInput
											className="flex-1 p-3 text-gray-800"
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
