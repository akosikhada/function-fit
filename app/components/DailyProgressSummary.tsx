import React, { useEffect } from "react";
import { View, Text, useColorScheme } from "react-native";
import { Footprints, Flame, Clock } from "lucide-react-native";
import ThemeModule from "../utils/theme";

interface DailyProgressSummaryProps {
	date?: string;
	stepsProgress?: number;
	caloriesProgress?: number;
	workoutProgress?: number;
	stepsValue?: string;
	caloriesValue?: string;
	workoutValue?: string;
}

const DailyProgressSummary = ({
	date = "Today, June 15",
	stepsProgress = 75,
	caloriesProgress = 60,
	workoutProgress = 40,
	stepsValue = "7,500",
	caloriesValue = "1,200",
	workoutValue = "2/5", // Format can be "X/Y" for workout count or "XXm/YYm" for minutes
}: DailyProgressSummaryProps) => {
	const { theme: currentTheme, colors } = ThemeModule.useTheme();
	const isDarkMode = currentTheme === "dark";
	
	// Add effect to log when props change
	useEffect(() => {
		console.log("DailyProgressSummary updated with:", {
			caloriesValue,
			workoutValue,
			workoutProgress
		});
	}, [caloriesValue, workoutValue, workoutProgress]);
	
	// Parse and format the workout value for proper display
	const formatWorkoutValue = () => {
		// Log the incoming value for debugging
		console.log(`DailyProgressSummary received workoutValue: "${workoutValue}"`);
		
		// If it's already in minutes format (contains 'm'), keep as is
		if (workoutValue.includes('m')) {
			return workoutValue;
		}
		
		// If it's in count format (e.g., "2/10"), keep as is
		if (workoutValue.includes('/')) {
			return workoutValue;
		}
		
		// Otherwise assume it's minutes and format accordingly
		return `${workoutValue}m`;
	};
	
	// Format the display of the goal text based on the value type
	const getWorkoutGoalText = () => {
		if (workoutValue.includes('/')) {
			// If it shows workouts count like "2/10", the goal is workouts
			return 'Workouts';
		}
		return 'Active Time';
	};
	
	// Format the goal value text
	const getWorkoutGoalValue = () => {
		if (workoutValue.includes('/')) {
			// If it shows workouts count, get the goal from the denominator
			const parts = workoutValue.split('/');
			if (parts.length > 1) {
				return `Goal: ${parts[1]}`;
			}
			// Default goal if not properly formatted
			return 'Goal: 10';
		}
		// For active time, use a fixed goal
		return 'Goal: 60m';
	};
	
	// Get current value for display with proper highlighting
	const getCurrentWorkoutValue = () => {
		if (workoutValue.includes('/')) {
			const parts = workoutValue.split('/');
			if (parts.length > 1) {
				return parts[0];
			}
		}
		return workoutValue;
	};

	return (
		<View
			style={{
				backgroundColor: colors.card,
				padding: 24,
			}}
			className="w-full rounded-xl shadow-sm"
		>
			<Text style={{ color: colors.text }} className="font-bold text-lg mb-4">
				{date}
			</Text>
			<View className="flex-row justify-between px-2 items-center">
				<View className="items-center">
					<View
						style={{
							backgroundColor: isDarkMode ? "#312E81" : "#E0E7FF",
						}}
						className="w-12 h-12 rounded-full items-center justify-center mb-2"
					>
						<Footprints size={22} color={isDarkMode ? "#818CF8" : "#4F46E5"} />
					</View>
					<Text
						style={{ color: isDarkMode ? "#818CF8" : "#4F46E5" }}
						className="font-bold text-base"
					>
						{stepsValue}
					</Text>
					<Text style={{ color: colors.secondaryText }} className="text-xs">
						Steps
					</Text>
					<Text style={{ color: colors.secondaryText }} className="text-xs">
						Goal: 10,000
					</Text>
				</View>

				<View className="items-center">
					<View
						style={{
							backgroundColor: isDarkMode ? "#7F1D1D" : "#FEE2E2",
						}}
						className="w-12 h-12 rounded-full items-center justify-center mb-2"
					>
						<Flame size={22} color={isDarkMode ? "#F87171" : "#EF4444"} />
					</View>
					<Text
						style={{ color: isDarkMode ? "#F87171" : "#EF4444" }}
						className="font-bold text-base"
					>
						{caloriesValue}
					</Text>
					<Text style={{ color: colors.secondaryText }} className="text-xs">
						Calories
					</Text>
					<Text style={{ color: colors.secondaryText }} className="text-xs">
						Goal: 600
					</Text>
				</View>

				<View className="items-center">
					<View
						style={{
							backgroundColor: isDarkMode ? "#1E3A8A" : "#DBEAFE",
						}}
						className="w-12 h-12 rounded-full items-center justify-center mb-2"
					>
						<Clock size={22} color={isDarkMode ? "#60A5FA" : "#3B82F6"} />
					</View>
					{workoutValue.includes('/') ? (
						<View className="flex-row items-baseline">
							<Text
								style={{ color: isDarkMode ? "#60A5FA" : "#3B82F6" }}
								className="font-bold text-base"
							>
								{getCurrentWorkoutValue()}
							</Text>
							<Text
								style={{ color: colors.secondaryText }}
								className="text-xs ml-1"
							>
								/{workoutValue.split('/')[1]}
							</Text>
						</View>
					) : (
						<Text
							style={{ color: isDarkMode ? "#60A5FA" : "#3B82F6" }}
							className="font-bold text-base"
						>
							{formatWorkoutValue()}
						</Text>
					)}
					<Text style={{ color: colors.secondaryText }} className="text-xs">
						{getWorkoutGoalText()}
					</Text>
					<Text style={{ color: colors.secondaryText }} className="text-xs">
						{getWorkoutGoalValue()}
					</Text>
				</View>
			</View>
		</View>
	);
};

export default DailyProgressSummary;
