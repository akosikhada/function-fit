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
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import BottomNavigation from "../components/BottomNavigation";
import ThemeModule from "../utils/theme";
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
										}}
										onPress={() => router.push(`/workout/${workout.id}`)}
									>
										<Image
											source={{ uri: workout.imageUrl }}
											style={{ width: "100%", height: "100%" }}
											resizeMode="cover"
										/>
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
											<View style={{ width: workoutCardImageWidth }}>
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
													<View className="flex-row items-center mb-1">
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
		</SafeAreaView>
	);
}
