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
	Calendar,
	Clock,
	Dumbbell,
	ChevronRight,
} from "lucide-react-native";
import BottomNavigation from "../components/BottomNavigation";

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

const workoutSchedule = [
	{
		day: 0,
		workouts: [
			{
				id: "1",
				title: "Full Body HIIT",
				time: "9:00 AM",
				duration: "30 mins",
			},
		],
	},
	{ day: 1, workouts: [] },
	{
		day: 2,
		workouts: [
			{ id: "2", title: "Core Crusher", time: "6:30 PM", duration: "20 mins" },
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
			},
		],
	},
];

export default function PlanScreen() {
	const [selectedDay, setSelectedDay] = React.useState(currentDay);

	const selectedDayWorkouts =
		workoutSchedule.find((schedule) => schedule.day === selectedDay)
			?.workouts || [];

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
					<Text className="text-xl font-bold text-gray-800">Workout Plan</Text>
				</View>

				{/* Calendar Strip */}
				<View className="bg-white py-4 border-b border-gray-200">
					<View className="flex-row justify-between px-4 mb-2">
						<Text className="text-base font-semibold text-gray-800">
							June 2023
						</Text>
						<TouchableOpacity>
							<Calendar size={20} color="#4F46E5" />
						</TouchableOpacity>
					</View>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className="px-2"
					>
						{weekDates.map((date, index) => (
							<TouchableOpacity
								key={index}
								onPress={() => setSelectedDay(index)}
								className={`items-center mx-2 px-3 py-2 rounded-lg ${
									selectedDay === index
										? "bg-indigo-600"
										: date.isToday
										? "bg-indigo-100"
										: "bg-transparent"
								}`}
							>
								<Text
									className={`text-xs ${
										selectedDay === index
											? "text-white"
											: date.isToday
											? "text-indigo-600"
											: "text-gray-500"
									}`}
								>
									{date.day}
								</Text>
								<Text
									className={`text-lg font-semibold ${
										selectedDay === index
											? "text-white"
											: date.isToday
											? "text-indigo-600"
											: "text-gray-800"
									}`}
								>
									{date.date}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Workouts for Selected Day */}
				<ScrollView className="flex-1 p-4">
					<View className="flex-row justify-between items-center mb-4">
						<Text className="text-base font-semibold text-gray-800">
							{selectedDayWorkouts.length > 0
								? "Scheduled Workouts"
								: "No Workouts Scheduled"}
						</Text>
						<TouchableOpacity
							className="flex-row items-center"
							onPress={() => router.push("/library")}
						>
							<Text className="text-indigo-600 mr-1">Add Workout</Text>
							<ChevronRight size={16} color="#4F46E5" />
						</TouchableOpacity>
					</View>

					{selectedDayWorkouts.length > 0 ? (
						selectedDayWorkouts.map((workout, index) => (
							<TouchableOpacity
								key={index}
								className="bg-white rounded-xl p-4 shadow-sm mb-3 flex-row items-center"
								onPress={() => router.push(`/workout/${workout.id}`)}
							>
								<View className="bg-indigo-100 rounded-full w-12 h-12 items-center justify-center mr-4">
									<Dumbbell size={24} color="#4F46E5" />
								</View>
								<View className="flex-1">
									<Text className="text-gray-800 font-semibold">
										{workout.title}
									</Text>
									<View className="flex-row items-center mt-1">
										<Clock size={14} color="#6B7280" />
										<Text className="text-gray-500 text-sm ml-1">
											{workout.time} • {workout.duration}
										</Text>
									</View>
								</View>
								<ChevronRight size={20} color="#6B7280" />
							</TouchableOpacity>
						))
					) : (
						<View className="bg-white rounded-xl p-6 shadow-sm items-center">
							<View className="bg-indigo-100 rounded-full w-16 h-16 items-center justify-center mb-4">
								<Dumbbell size={32} color="#4F46E5" />
							</View>
							<Text className="text-gray-800 font-semibold text-lg mb-2">
								Rest Day
							</Text>
							<Text className="text-gray-500 text-center mb-4">
								No workouts scheduled for this day. Take a rest or add a
								workout.
							</Text>
							<TouchableOpacity
								className="bg-indigo-600 rounded-lg py-3 px-6"
								onPress={() => router.push("/library")}
							>
								<Text className="text-white font-semibold">
									Browse Workouts
								</Text>
							</TouchableOpacity>
						</View>
					)}
				</ScrollView>
			</View>

			{/* Add Bottom Navigation */}
			<View className="absolute bottom-0 left-0 right-0">
				<BottomNavigation activeTab="plan" />
			</View>
		</SafeAreaView>
	);
}
