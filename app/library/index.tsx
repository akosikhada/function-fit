import React, { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	SafeAreaView,
	TouchableOpacity,
	Image,
	useWindowDimensions,
	TextInput,
	useColorScheme,
	Platform,
	Modal,
	Alert,
} from "react-native";
import { Stack, router } from "expo-router";
import {
	ArrowLeft,
	Search,
	Clock,
	Flame,
	Filter,
	X,
	Star,
	MoreVertical,
	Plus,
	Calendar,
	Share2,
	Bookmark,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import BottomNavigation from "../components/BottomNavigation";
import ThemeModule from "../utils/theme";
import { scheduleWorkout } from "../utils/fitness";
import { getUser } from "../utils/supabase";
const { useTheme } = ThemeModule;

// Mock workout data - would come from Supabase in a real implementation
const workoutCategories = [
	{ id: "all", name: "All" },
	{ id: "hiit", name: "HIIT" },
	{ id: "strength", name: "Strength" },
	{ id: "cardio", name: "Cardio" },
	{ id: "yoga", name: "Yoga" },
	{ id: "pilates", name: "Pilates" },
];

const workouts = [
	{
		id: "1",
		title: "Full Body HIIT Challenge",
		duration: "30 mins",
		calories: "320",
		difficulty: "Intermediate",
		category: "hiit",
		rating: 4.8,
		reviews: 124,
		imageUrl:
			"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
		trainer: "Alex Morgan",
		isFeatured: true,
	},
	{
		id: "2",
		title: "Core Crusher",
		duration: "20 mins",
		calories: "220",
		difficulty: "Beginner",
		category: "strength",
		rating: 4.6,
		reviews: 98,
		imageUrl:
			"https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
		trainer: "Mike Chen",
	},
	{
		id: "3",
		title: "Upper Body Blast",
		duration: "25 mins",
		calories: "280",
		difficulty: "Intermediate",
		category: "strength",
		rating: 4.7,
		reviews: 112,
		imageUrl:
			"https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",
		trainer: "Emma Smith",
	},
	{
		id: "4",
		title: "Cardio Kickboxing Pro",
		duration: "35 mins",
		calories: "400",
		difficulty: "Advanced",
		category: "cardio",
		rating: 4.9,
		reviews: 89,
		imageUrl:
			"https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800&q=80",
		trainer: "Sarah Johnson",
		isFeatured: true,
	},
	{
		id: "5",
		title: "Gentle Yoga Flow",
		duration: "45 mins",
		calories: "180",
		difficulty: "Beginner",
		category: "yoga",
		rating: 4.8,
		reviews: 156,
		imageUrl:
			"https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&q=80",
		trainer: "Maya Patel",
		description: "A calming yoga sequence designed to increase flexibility, reduce stress, and improve mind-body connection. Perfect for beginners and those looking for a restorative practice.",
		exercises: [
			{
				id: "y1",
				name: "Mountain Pose (Tadasana)",
				duration: "60 sec",
				sets: 1,
				reps: "Hold for 60 seconds",
				rest: "10 sec",
				muscle: "Full Body",
				description: "Stand tall, grounding through feet, arms at sides, palms forward, gaze forward. Focus on alignment and steady breathing."
			},
			{
				id: "y2",
				name: "Standing Forward Fold",
				duration: "60 sec",
				sets: 1,
				reps: "Hold for 60 seconds",
				rest: "10 sec",
				muscle: "Hamstrings",
				description: "Fold forward from hips, lengthening spine, bringing hands beside feet. Keep slight bend in knees if needed."
			},
			{
				id: "y3",
				name: "Cat-Cow Stretch",
				duration: "90 sec",
				sets: 1,
				reps: "15 breaths",
				rest: "10 sec",
				muscle: "Spine",
				description: "Alternate between arching (cow) and rounding (cat) spine on hands and knees, moving with breath."
			},
			{
				id: "y4",
				name: "Downward-Facing Dog",
				duration: "60 sec",
				sets: 1,
				reps: "Hold for 60 seconds",
				rest: "10 sec",
				muscle: "Full Body",
				description: "Form inverted V with body, hands shoulder-width apart, feet hip-width apart, pushing heels toward floor."
			},
			{
				id: "y5",
				name: "Warrior I",
				duration: "60 sec",
				sets: 1,
				reps: "30 sec each side",
				rest: "10 sec",
				muscle: "Legs",
				description: "Lunge forward with one leg, back foot at angle, arms overhead, hips facing forward, chest proud."
			},
			{
				id: "y6",
				name: "Warrior II",
				duration: "60 sec",
				sets: 1,
				reps: "30 sec each side",
				rest: "10 sec",
				muscle: "Hips",
				description: "Stride with feet wide apart, front knee bent, arms extended parallel to floor, gaze over front hand."
			},
			{
				id: "y7",
				name: "Triangle Pose",
				duration: "60 sec",
				sets: 1,
				reps: "30 sec each side",
				rest: "10 sec",
				muscle: "Side Body",
				description: "From wide stance, extend sideways, reaching one hand to shin/ankle/block, other arm up, creating triangle shape."
			},
			{
				id: "y8",
				name: "Tree Pose",
				duration: "60 sec",
				sets: 1,
				reps: "30 sec each side",
				rest: "10 sec",
				muscle: "Balance",
				description: "Balance on one leg, other foot on inner thigh (avoid knee), hands in prayer or extended overhead."
			},
			{
				id: "y9",
				name: "Bridge Pose",
				duration: "60 sec",
				sets: 1,
				reps: "3 sets of 15-20 sec holds",
				rest: "10 sec",
				muscle: "Lower Back",
				description: "Lie on back, knees bent, lift hips, creating bridge with body, shoulders grounded, engage glutes."
			},
			{
				id: "y10",
				name: "Child's Pose",
				duration: "60 sec",
				sets: 1,
				reps: "Hold for 60 seconds",
				rest: "10 sec",
				muscle: "Relaxation",
				description: "Kneel and fold forward, arms extended or beside body, forehead to mat, gentle hip opening."
			},
			{
				id: "y11",
				name: "Corpse Pose (Savasana)",
				duration: "180 sec",
				sets: 1,
				reps: "Hold for 3 minutes",
				rest: "0 sec",
				muscle: "Relaxation",
				description: "Lie flat on back, arms and legs splayed, palms up, completely relax body and mind for deep rest."
			}
		]
	},
	{
		id: "6",
		title: "Pilates Core Essentials",
		duration: "40 mins",
		calories: "200",
		difficulty: "Intermediate",
		category: "pilates",
		rating: 4.7,
		reviews: 78,
		imageUrl:
			"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
		trainer: "Olivia Wilson",
		description: "Build core strength, improve posture and enhance flexibility with this focused Pilates workout suitable for all levels.",
		exercises: [
			{
				id: "p1",
				name: "Hundred",
				duration: "60 sec",
				sets: 1,
				reps: "100 pumps",
				rest: "15 sec",
				muscle: "Core",
				description: "Lie on back, head and shoulders lifted, legs raised and bent at 90 degrees, pump arms up and down while breathing rhythmically."
			},
			{
				id: "p2",
				name: "Roll Up",
				duration: "45 sec",
				sets: 1,
				reps: "8 reps",
				rest: "15 sec",
				muscle: "Abdominals",
				description: "Lie flat with arms extended overhead, slowly roll up vertebra by vertebra, reaching for toes, then roll back down with control."
			},
			{
				id: "p3",
				name: "Single Leg Circles",
				duration: "60 sec",
				sets: 1,
				reps: "10 circles each leg",
				rest: "15 sec",
				muscle: "Hips",
				description: "Lie on back, one leg extended to ceiling, circle leg in precise, controlled movements, 5 in each direction."
			},
			{
				id: "p4",
				name: "Rolling Like a Ball",
				duration: "45 sec",
				sets: 1,
				reps: "8-10 rolls",
				rest: "15 sec",
				muscle: "Core",
				description: "Sit in balanced C-curve, feet off floor, hands holding behind knees. Roll back to shoulders and return without momentum."
			},
			{
				id: "p5",
				name: "Single Leg Stretch",
				duration: "60 sec",
				sets: 1,
				reps: "10 reps each leg",
				rest: "15 sec",
				muscle: "Core",
				description: "Lying with head and shoulders lifted, alternate extending one leg while hugging the other to chest."
			},
			{
				id: "p6",
				name: "Double Leg Stretch",
				duration: "60 sec",
				sets: 1,
				reps: "10 reps",
				rest: "15 sec",
				muscle: "Full Core",
				description: "Curl up with knees to chest, arms hugging legs, then extend arms and legs outward in synchronized movement."
			},
			{
				id: "p7",
				name: "Spine Stretch Forward",
				duration: "45 sec",
				sets: 1,
				reps: "5 reps",
				rest: "15 sec",
				muscle: "Back",
				description: "Sit tall with legs extended, reach forward articulating through spine, creating C-curve, return to start with control."
			},
			{
				id: "p8",
				name: "Saw",
				duration: "45 sec",
				sets: 1,
				reps: "5 reps each side",
				rest: "15 sec",
				muscle: "Obliques",
				description: "Sit with legs wide apart, twist torso and reach opposite hand to outside of foot, pulsing three times."
			},
			{
				id: "p9",
				name: "Swan Dive",
				duration: "45 sec",
				sets: 1,
				reps: "5 reps",
				rest: "15 sec",
				muscle: "Back",
				description: "Lie face down, press upper body up into backbend, then rock forward and back on torso with control."
			},
			{
				id: "p10",
				name: "Side Kick Series",
				duration: "90 sec",
				sets: 1,
				reps: "10 reps each movement",
				rest: "15 sec",
				muscle: "Hips/Legs",
				description: "Lying on side with body in straight line, perform series of precise leg movements to target outer thighs and hips."
			},
			{
				id: "p11",
				name: "Teaser",
				duration: "60 sec",
				sets: 1,
				reps: "5 reps",
				rest: "15 sec",
				muscle: "Full Core",
				description: "Advanced move where body creates V-shape, balancing on sits bones with legs and torso lifted, arms parallel to legs."
			},
			{
				id: "p12",
				name: "Pilates Push-Up",
				duration: "45 sec",
				sets: 1,
				reps: "5 reps",
				rest: "15 sec",
				muscle: "Arms/Chest",
				description: "Standing roll down to plank, perform push-up with elbows close to body, then return to standing with controlled roll-up."
			}
		]
	},
];

export default function WorkoutLibrary() {
	const { width } = useWindowDimensions();
	const isSmallDevice = width < 380;
	const isMediumDevice = width >= 380 && width < 600;
	const isLargeDevice = width >= 600;
	const isExtraLargeDevice = width >= 1024;
	const { theme: currentTheme, colors } = useTheme();
	const isDarkMode = currentTheme === "dark";

	// Calculate dynamic dimensions based on screen width
	const featuredCardWidth = isExtraLargeDevice
		? width * 0.22
		: isLargeDevice
		? width * 0.38
		: isMediumDevice
		? width * 0.7
		: width * 0.8;

	const featuredCardHeight = isExtraLargeDevice
		? 220
		: isLargeDevice
		? 180
		: isMediumDevice
		? 160
		: 140;

	const workoutCardImageWidth = isExtraLargeDevice
		? "25%"
		: isLargeDevice
		? "30%"
		: "32%";

	const contentPadding = isExtraLargeDevice
		? 32
		: isLargeDevice
		? 24
		: isMediumDevice
		? 16
		: 12;

	const fontSize = {
		title: isLargeDevice ? "text-2xl" : isSmallDevice ? "text-lg" : "text-xl",
		subtitle: isLargeDevice
			? "text-xl"
			: isSmallDevice
			? "text-base"
			: "text-lg",
		body: isLargeDevice ? "text-base" : isSmallDevice ? "text-xs" : "text-sm",
		small: isLargeDevice ? "text-sm" : "text-xs",
	};

	const [selectedCategory, setSelectedCategory] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [showSearch, setShowSearch] = useState(false);
	const [menuVisible, setMenuVisible] = useState(false);
	const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
	const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
	const [successModalVisible, setSuccessModalVisible] = useState(false);
	const [successWorkout, setSuccessWorkout] = useState<any>(null);

	const featuredWorkouts = workouts.filter((workout) => workout.isFeatured);

	const filteredWorkouts = workouts.filter((workout) => {
		const matchesCategory =
			selectedCategory === "all" || workout.category === selectedCategory;
		const matchesSearch =
			searchQuery === "" ||
			workout.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(workout.trainer &&
				workout.trainer.toLowerCase().includes(searchQuery.toLowerCase()));

		return matchesCategory && matchesSearch;
	});

	const handleOpenMenu = (workout: any, e: any) => {
		e.stopPropagation();
		
		setSelectedWorkout(workout);
		
		setMenuVisible(true);
	};
	
	const handleAddToToday = async () => {
		try {
			// Get the current user
			const user = await getUser();
			if (!user) {
				setMenuVisible(false);
				Alert.alert("Error", "You need to be logged in to add workouts");
				return;
			}
			
			// Get today's date in YYYY-MM-DD format
			const today = new Date().toISOString().split('T')[0];
			
			// Schedule the workout for today
			const result = await scheduleWorkout(
				user.id,
				selectedWorkout.id,
				today
			);
			
			// Close the menu
			setMenuVisible(false);
			
			if (result.success) {
				// Show success message
				setSuccessWorkout(selectedWorkout);
				setSuccessModalVisible(true);
				
				// Auto-hide after 3 seconds
				setTimeout(() => {
					setSuccessModalVisible(false);
				}, 3000);
			}
		} catch (error) {
			console.error("Error adding workout to today:", error);
			setMenuVisible(false);
			Alert.alert("Error", "Failed to add workout. Please try again.");
		}
	};

	const renderDifficultyBadge = (difficulty: string) => {
		let bgColor = "";
		let textColor = "";

		switch (difficulty) {
			case "Beginner":
				bgColor = isDarkMode ? "#064E3B" : "#D1FAE5";
				textColor = isDarkMode ? "#10B981" : "#065F46";
				break;
			case "Intermediate":
				bgColor = isDarkMode ? "#1E3A8A" : "#DBEAFE";
				textColor = isDarkMode ? "#3B82F6" : "#1E40AF";
				break;
			case "Advanced":
				bgColor = isDarkMode ? "#7F1D1D" : "#FEE2E2";
				textColor = isDarkMode ? "#EF4444" : "#B91C1C";
				break;
			default:
				bgColor = isDarkMode ? "#1F2937" : "#F3F4F6";
				textColor = isDarkMode ? "#D1D5DB" : "#4B5563";
		}

		return (
			<View
				className="px-2 py-1 rounded-full"
				style={{ backgroundColor: bgColor }}
			>
				<Text className="text-xs font-medium" style={{ color: textColor }}>
					{difficulty}
				</Text>
			</View>
		);
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
				{!showSearch ? (
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
							Workout Library
						</Text>
						<View className="flex-row">
							<TouchableOpacity
								className="mr-3"
								onPress={() => setShowSearch(true)}
							>
								<Search
									size={isSmallDevice ? 18 : 20}
									color={isDarkMode ? "#8B5CF6" : "#6366F1"}
								/>
							</TouchableOpacity>
							<TouchableOpacity>
								<Filter
									size={isSmallDevice ? 18 : 20}
									color={isDarkMode ? "#8B5CF6" : "#6366F1"}
								/>
							</TouchableOpacity>
						</View>
					</View>
				) : (
					<View
						className="flex-row items-center border-b"
						style={{
							borderBottomColor: colors.border,
							backgroundColor: colors.card,
							paddingHorizontal: contentPadding,
							paddingVertical: contentPadding * 0.6,
							marginTop: Platform.OS === "ios" ? 20 : 10,
						}}
					>
						<View
							className="flex-1 flex-row items-center rounded-xl mr-2"
							style={{
								backgroundColor: isDarkMode ? "#1F2937" : "#F3F4F6",
								paddingHorizontal: 12,
								paddingVertical: isSmallDevice ? 6 : 8,
							}}
						>
							<Search
								size={isSmallDevice ? 16 : 18}
								color={isDarkMode ? "#9CA3AF" : "#6B7280"}
							/>
							<TextInput
								className="flex-1 ml-2"
								style={{
									color: colors.text,
									fontSize: isSmallDevice ? 14 : 16,
								}}
								placeholder="Search workouts or trainers"
								placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
								value={searchQuery}
								onChangeText={setSearchQuery}
								autoFocus
							/>
							{searchQuery !== "" && (
								<TouchableOpacity onPress={() => setSearchQuery("")}>
									<X
										size={isSmallDevice ? 14 : 16}
										color={isDarkMode ? "#9CA3AF" : "#6B7280"}
									/>
								</TouchableOpacity>
							)}
						</View>
						<TouchableOpacity
							onPress={() => {
								setShowSearch(false);
								setSearchQuery("");
							}}
						>
							<Text
								className="font-medium"
								style={{
									color: isDarkMode ? "#8B5CF6" : "#6366F1",
									fontSize: isSmallDevice ? 14 : 16,
								}}
							>
								Cancel
							</Text>
						</TouchableOpacity>
					</View>
				)}

				<ScrollView
					className="flex-1"
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{
						paddingBottom: 100,
						...(isExtraLargeDevice && {
							maxWidth: 1200,
							alignSelf: "center",
							width: "100%",
						}),
					}}
				>
					{/* Featured Workouts - Only show if not searching */}
					{!searchQuery && featuredWorkouts.length > 0 && (
						<View className="mb-6">
							<View
								className="flex-row justify-between items-center pb-3"
								style={{
									paddingTop: contentPadding + 8,
									paddingHorizontal: contentPadding,
								}}
							>
								<Text
									className={`font-bold ${fontSize.subtitle}`}
									style={{ color: colors.text }}
								>
									Featured Workouts
								</Text>
								<TouchableOpacity>
									<Text
										className={fontSize.body}
										style={{ color: isDarkMode ? "#8B5CF6" : "#6366F1" }}
									>
										See All
									</Text>
								</TouchableOpacity>
							</View>

							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{
									paddingLeft: contentPadding,
									paddingRight: contentPadding / 2,
								}}
								className="pb-2"
							>
								{featuredWorkouts.map((workout) => (
									<TouchableOpacity
										key={workout.id}
										className="mr-4 rounded-2xl overflow-hidden"
										style={{
											width: featuredCardWidth,
											height: featuredCardHeight,
											shadowColor: "#000",
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.1,
											shadowRadius: 4,
											elevation: 3,
											position: "relative",
										}}
										onPress={() => router.push(`/workout/${workout.id}`)}
									>
										<Image
											source={{ uri: workout.imageUrl }}
											style={{ width: "100%", height: "100%" }}
											resizeMode="cover"
										/>
										
										{/* Three dots menu button - absolute positioned on top-right */}
										<TouchableOpacity
											style={{
												position: "absolute",
												top: 10,
												right: 10,
												backgroundColor: "rgba(0,0,0,0.5)",
												borderRadius: 15,
												width: 30,
												height: 30,
												alignItems: "center",
												justifyContent: "center",
												zIndex: 10,
											}}
											onPress={(e) => handleOpenMenu(workout, e)}
										>
											<MoreVertical 
												size={16} 
												color="#FFFFFF"
											/>
										</TouchableOpacity>
										
										<LinearGradient
											colors={["transparent", "rgba(0,0,0,0.8)"]}
											style={{
												position: "absolute",
												left: 0,
												right: 0,
												bottom: 0,
												height: "60%",
												padding: isSmallDevice ? 12 : 16,
												justifyContent: "flex-end",
											}}
										>
											<View
												className="px-2 py-1 rounded-full self-start mb-2"
												style={{
													backgroundColor: isDarkMode
														? "rgba(139, 92, 246, 0.3)"
														: "rgba(139, 92, 246, 0.1)",
												}}
											>
												<Text
													className={`font-medium ${fontSize.small}`}
													style={{ color: isDarkMode ? "#C4B5FD" : "#7C3AED" }}
												>
													{
														workoutCategories.find(
															(cat) => cat.id === workout.category
														)?.name
													}
												</Text>
											</View>
											<Text
												className={`text-white font-bold mb-1 ${
													isSmallDevice ? "text-sm" : "text-base"
												}`}
											>
												{workout.title}
											</Text>
											<View className="flex-row items-center">
												<Text
													className={`text-white opacity-90 mr-3 ${fontSize.small}`}
												>
													{workout.trainer}
												</Text>
												<View className="flex-row items-center">
													<Star
														size={isSmallDevice ? 10 : 12}
														color="#FBBF24"
														fill="#FBBF24"
													/>
													<Text
														className={`text-white opacity-90 ml-1 ${fontSize.small}`}
													>
														{workout.rating}
													</Text>
												</View>
											</View>
										</LinearGradient>
									</TouchableOpacity>
								))}
							</ScrollView>
						</View>
					)}

					{/* Category Filter */}
					<View className="mb-6" style={{ paddingHorizontal: contentPadding }}>
						<Text
							className={`font-bold mb-3 ${fontSize.subtitle}`}
							style={{ color: colors.text }}
						>
							Categories
						</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							className="pb-2"
						>
							{workoutCategories.map((category) => {
								const isSelected = selectedCategory === category.id;

								return (
									<TouchableOpacity
										key={category.id}
										onPress={() => setSelectedCategory(category.id)}
										className="mr-3 flex-row items-center"
										style={{
											backgroundColor: isSelected
												? isDarkMode
													? "#4C1D95"
													: "#8B5CF6"
												: isDarkMode
												? "#1F2937"
												: "#F9FAFB",
											borderWidth: 1,
											borderColor: isSelected
												? isDarkMode
													? "#6D28D9"
													: "#8B5CF6"
												: isDarkMode
												? "#374151"
												: "#E5E7EB",
											borderRadius: 12,
											paddingHorizontal: isSmallDevice ? 12 : 16,
											paddingVertical: isSmallDevice ? 8 : 12,
										}}
									>
										<Text
											className="font-medium"
											style={{
												color: isSelected
													? "#FFFFFF"
													: isDarkMode
													? "#E5E7EB"
													: "#1F2937",
												fontSize: isSmallDevice ? 12 : 14,
											}}
										>
											{category.name}
										</Text>
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					</View>

					{/* Workout List */}
					<View style={{ paddingHorizontal: contentPadding }}>
						<Text
							className={`font-bold mb-4 ${fontSize.subtitle}`}
							style={{ color: colors.text }}
						>
							{searchQuery
								? "Search Results"
								: selectedCategory === "all"
								? "All Workouts"
								: `${
										workoutCategories.find((cat) => cat.id === selectedCategory)
											?.name
								  } Workouts`}
						</Text>

						{filteredWorkouts.length === 0 ? (
							<View className="items-center justify-center py-8">
								<Text
									className="text-center"
									style={{
										color: colors.secondaryText,
										fontSize: isSmallDevice ? 14 : 16,
									}}
								>
									No workouts found. Try adjusting your filters.
								</Text>
							</View>
						) : (
							<View
								className={
									isExtraLargeDevice ? "flex-row flex-wrap justify-between" : ""
								}
							>
								{filteredWorkouts.map((workout) => (
									<TouchableOpacity
										key={workout.id}
										className={`mb-4 rounded-2xl overflow-hidden`}
										style={{
											backgroundColor: colors.card,
											shadowColor: "#000",
											shadowOffset: { width: 0, height: 1 },
											shadowOpacity: 0.1,
											shadowRadius: 2,
											elevation: 2,
											...(isExtraLargeDevice && { width: "49%" }),
										}}
										onPress={() => router.push(`/workout/${workout.id}`)}
									>
										<View
											className="flex-row"
											style={{
												height: isExtraLargeDevice
													? 160
													: isLargeDevice
													? 140
													: isMediumDevice
													? 130
													: 120,
											}}
										>
											{/* Workout Image */}
											<View style={{ width: workoutCardImageWidth, position: "relative" }}>
												<Image
													source={{ uri: workout.imageUrl }}
													style={{ width: "100%", height: "100%" }}
													resizeMode="cover"
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
													<View className="flex-row items-center justify-between mb-1">
														<View className="flex-row items-center">
															{renderDifficultyBadge(workout.difficulty)}
															<View
																className="rounded-full ml-2"
																style={{
																	backgroundColor: isDarkMode
																		? "rgba(139, 92, 246, 0.2)"
																		: "rgba(139, 92, 246, 0.1)",
																	paddingHorizontal: 8,
																	paddingVertical: 4,
																}}
															>
																<Text
																	className="font-medium"
																	style={{
																		color: isDarkMode ? "#C4B5FD" : "#7C3AED",
																		fontSize: isSmallDevice ? 10 : 12,
																	}}
																>
																	{
																		workoutCategories.find(
																			(cat) => cat.id === workout.category
																		)?.name
																	}
																</Text>
															</View>
														</View>
														
														{/* Three dots menu button */}
														<TouchableOpacity
															onPress={(e) => handleOpenMenu(workout, e)}
															hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
														>
															<MoreVertical
																size={isSmallDevice ? 16 : 18}
																color={colors.secondaryText}
															/>
														</TouchableOpacity>
													</View>

													<Text
														className="font-semibold mb-1"
														style={{
															color: colors.text,
															fontSize: isSmallDevice ? 14 : 16,
														}}
													>
														{workout.title}
													</Text>

													<Text
														className="mb-2"
														style={{
															color: colors.secondaryText,
															fontSize: isSmallDevice ? 12 : 14,
														}}
													>
														{workout.trainer}
													</Text>
												</View>

												<View className="flex-row justify-between items-center">
													<View className="flex-row">
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
																{workout.duration}
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
																{workout.calories} cal
															</Text>
														</View>
													</View>

													<View className="flex-row items-center">
														<Star
															size={isSmallDevice ? 12 : 14}
															color="#FBBF24"
															fill="#FBBF24"
														/>
														<Text
															className="ml-1"
															style={{
																color: colors.secondaryText,
																fontSize: isSmallDevice ? 10 : 12,
															}}
														>
															{workout.rating} ({workout.reviews})
														</Text>
													</View>
												</View>
											</View>
										</View>
									</TouchableOpacity>
								))}
							</View>
						)}
					</View>
				</ScrollView>

				{/* Bottom Navigation */}
				<View className="absolute bottom-0 left-0 right-0">
					<BottomNavigation activeTab="plan" />
				</View>
			</View>

			{/* Popup Menu Modal */}
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
						{selectedWorkout && (
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
										{selectedWorkout.title}
									</Text>
								</View>
								
								<TouchableOpacity 
									style={{ 
										flexDirection: 'row', 
										alignItems: 'center', 
										padding: 16,
										borderBottomWidth: 1, 
										borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
									}}
									onPress={handleAddToToday}
								>
									<Calendar size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} style={{ marginRight: 12 }} />
									<Text style={{ color: colors.text, fontSize: 16 }}>Add to Today's Workout</Text>
								</TouchableOpacity>
								
								<TouchableOpacity 
									style={{ 
										flexDirection: 'row', 
										alignItems: 'center', 
										padding: 16,
										borderBottomWidth: 1, 
										borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
									}}
									onPress={() => {
										setMenuVisible(false);
										Alert.alert("Bookmark", "Workout saved to your bookmarks");
									}}
								>
									<Bookmark size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} style={{ marginRight: 12 }} />
									<Text style={{ color: colors.text, fontSize: 16 }}>Save to Bookmarks</Text>
								</TouchableOpacity>
								
								<TouchableOpacity 
									style={{ 
										flexDirection: 'row', 
										alignItems: 'center', 
										padding: 16 
									}}
									onPress={() => {
										setMenuVisible(false);
										Alert.alert("Share", "Sharing workout");
									}}
								>
									<Share2 size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} style={{ marginRight: 12 }} />
									<Text style={{ color: colors.text, fontSize: 16 }}>Share Workout</Text>
								</TouchableOpacity>
							</>
						)}
					</View>
				</TouchableOpacity>
			</Modal>

			{/* Success Modal */}
			<Modal
				visible={successModalVisible}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setSuccessModalVisible(false)}
			>
				<TouchableOpacity
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.5)',
						justifyContent: 'center',
						alignItems: 'center',
					}}
					activeOpacity={1}
					onPress={() => setSuccessModalVisible(false)}
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
						{successWorkout && (
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
										{successWorkout.title} has been added to today's workouts!
									</Text>
								</View>
								
								<TouchableOpacity 
									style={{ 
										flexDirection: 'row', 
										alignItems: 'center', 
										padding: 16,
										borderBottomWidth: 1, 
										borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
									}}
									onPress={() => {
										setSuccessModalVisible(false);
										router.push("/plan");
									}}
								>
									<Text style={{ color: colors.text, fontSize: 16 }}>View Workouts</Text>
								</TouchableOpacity>
							</>
						)}
					</View>
				</TouchableOpacity>
			</Modal>
		</SafeAreaView>
	);
}
