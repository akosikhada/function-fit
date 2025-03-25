import React from "react";
import {
	View,
	Text,
	ScrollView,
	SafeAreaView,
	TouchableOpacity,
} from "react-native";
import { Stack, router } from "expo-router";
import {
	ArrowLeft,
	BarChart2,
	Calendar,
	TrendingUp,
} from "lucide-react-native";
import CircularProgressIndicator from "../components/CircularProgressIndicator";
import BottomNavigation from "../components/BottomNavigation";

// Mock data - would come from Supabase in a real implementation
const weeklyData = [
	{ day: "Mon", workouts: 1, steps: 8500, calories: 2100 },
	{ day: "Tue", workouts: 1, steps: 10200, calories: 2300 },
	{ day: "Wed", workouts: 0, steps: 7800, calories: 1950 },
	{ day: "Thu", workouts: 1, steps: 9300, calories: 2250 },
	{ day: "Fri", workouts: 1, steps: 11500, calories: 2400 },
	{ day: "Sat", workouts: 0, steps: 6500, calories: 1800 },
	{ day: "Sun", workouts: 1, steps: 9000, calories: 2200 },
];

const recentWorkouts = [
	{
		id: "1",
		title: "Full Body HIIT",
		date: "Today, 9:30 AM",
		duration: "30 mins",
		calories: 320,
	},
	{
		id: "2",
		title: "Core Crusher",
		date: "Yesterday, 6:15 PM",
		duration: "20 mins",
		calories: 220,
	},
	{
		id: "1",
		title: "Full Body HIIT",
		date: "Jun 13, 8:00 AM",
		duration: "30 mins",
		calories: 320,
	},
];

export default function ProgressScreen() {
	// Calculate weekly totals
	const totalWorkouts = weeklyData.reduce((sum, day) => sum + day.workouts, 0);
	const totalSteps = weeklyData.reduce((sum, day) => sum + day.steps, 0);
	const totalCalories = weeklyData.reduce((sum, day) => sum + day.calories, 0);

	// Calculate max values for chart scaling
	const maxSteps = Math.max(...weeklyData.map((day) => day.steps));

	return (
		<SafeAreaView className="flex-1 bg-white">
			<Stack.Screen
				options={{
					headerShown: false,
				}}
			/>

			<View className="flex-1">
				{/* Header */}
				<View className="bg-white p-4 flex-row items-center border-b border-gray-200">
					<TouchableOpacity onPress={() => router.back()} className="mr-4">
						<ArrowLeft size={24} color="#4F46E5" />
					</TouchableOpacity>
					<Text className="text-xl font-bold text-gray-800">Your Progress</Text>
				</View>

				<ScrollView className="flex-1 p-4">
					{/* Weekly Summary */}
					<View className="bg-white rounded-xl p-4 shadow-sm mb-4">
						<View className="flex-row justify-between items-center mb-4">
							<Text className="text-base font-semibold text-gray-800">
								Weekly Summary
							</Text>
							<TouchableOpacity>
								<Calendar size={20} color="#4F46E5" />
							</TouchableOpacity>
						</View>

						<View className="flex-row justify-between items-center">
							<CircularProgressIndicator
								progress={Math.round((totalWorkouts / 7) * 100)}
								label="Workouts"
								value={`${totalWorkouts}`}
								color="#10B981"
								size={70}
							/>
							<CircularProgressIndicator
								progress={Math.round((totalSteps / 70000) * 100)}
								label="Steps"
								value={`${Math.round(totalSteps / 1000)}k`}
								color="#4F46E5"
								size={70}
							/>
							<CircularProgressIndicator
								progress={Math.round((totalCalories / 15000) * 100)}
								label="Calories"
								value={`${Math.round(totalCalories / 1000)}k`}
								color="#EC4899"
								size={70}
							/>
						</View>
					</View>

					{/* Steps Chart */}
					<View className="bg-white rounded-xl p-4 shadow-sm mb-4">
						<View className="flex-row justify-between items-center mb-4">
							<Text className="text-base font-semibold text-gray-800">
								Steps
							</Text>
							<TouchableOpacity>
								<TrendingUp size={20} color="#4F46E5" />
							</TouchableOpacity>
						</View>

						<View className="flex-row justify-between items-end h-40">
							{weeklyData.map((day, index) => (
								<View key={index} className="items-center">
									<View
										style={{ height: `${(day.steps / maxSteps) * 100}%` }}
										className="w-8 bg-indigo-500 rounded-t-md"
									/>
									<Text className="text-xs text-gray-500 mt-1">{day.day}</Text>
								</View>
							))}
						</View>
					</View>

					{/* Recent Workouts */}
					<View className="bg-white rounded-xl p-4 shadow-sm mb-10">
						<View className="flex-row justify-between items-center mb-4">
							<Text className="text-base font-semibold text-gray-800">
								Recent Workouts
							</Text>
							<TouchableOpacity>
								<BarChart2 size={20} color="#4F46E5" />
							</TouchableOpacity>
						</View>

						{recentWorkouts.map((workout, index) => (
							<TouchableOpacity
								key={index}
								className="flex-row items-center py-3 border-b border-gray-200 last:border-b-0"
								onPress={() => router.push(`/workout/${workout.id}`)}
							>
								<View className="bg-indigo-100 rounded-full w-10 h-10 items-center justify-center mr-3">
									<BarChart2 size={20} color="#4F46E5" />
								</View>
								<View className="flex-1">
									<Text className="text-gray-800 font-medium">
										{workout.title}
									</Text>
									<Text className="text-gray-500 text-sm">{workout.date}</Text>
								</View>
								<View className="items-end">
									<Text className="text-gray-800">{workout.duration}</Text>
									<Text className="text-gray-500 text-sm">
										{workout.calories} cal
									</Text>
								</View>
							</TouchableOpacity>
						))}
					</View>
				</ScrollView>
			</View>

			{/* Add Bottom Navigation */}
			<View className="absolute bottom-0 left-0 right-0">
				<BottomNavigation activeTab="progress" />
			</View>
		</SafeAreaView>
	);
}
