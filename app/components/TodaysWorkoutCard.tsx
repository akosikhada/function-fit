import React from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Image,
	useColorScheme,
} from "react-native";
import { Clock, Play } from "lucide-react-native";
import { router } from "expo-router";
import { supabase } from "../utils/supabase";
import { getUser } from "../utils/supabase";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

interface TodaysWorkoutCardProps {
	id?: string;
	title?: string;
	duration?: string;
	imageUrl?: string;
	onStart?: () => void;
}

const TodaysWorkoutCard = ({
	id = "1",
	title = "Full Body HIIT",
	duration = "30 mins",
	imageUrl = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
	onStart,
}: TodaysWorkoutCardProps) => {
	// Get theme colors
	const { theme: currentTheme, colors } = useTheme();
	const deviceTheme = useColorScheme() || "light";
	const isDarkMode = currentTheme === "dark";

	const handleStart = async () => {
		try {
			// Get the current authenticated user
			const user = await getUser();

			if (user) {
				// Get today's date in YYYY-MM-DD format
				const today = new Date().toISOString().split("T")[0];

				// Get current stats for today
				const { data: existingStats } = await supabase
					.from("user_stats")
					.select("*")
					.eq("user_id", user.id)
					.eq("date", today)
					.single();

				if (existingStats) {
					// Update existing stats - increment workouts_completed
					await supabase
						.from("user_stats")
						.update({
							workouts_completed: existingStats.workouts_completed + 1,
							updated_at: new Date().toISOString(),
						})
						.eq("id", existingStats.id);
				} else {
					// Create new stats for today
					await supabase.from("user_stats").insert({
						user_id: user.id,
						date: today,
						workouts_completed: 1,
						calories: 0,
						steps: 0,
					});
				}
			}
		} catch (error) {
			console.error("Error updating workout stats:", error);
		} finally {
			// Call the onStart callback if provided
			if (onStart) {
				onStart();
			} else {
				// Otherwise navigate to the workout screen
				router.push(`/workout/${id}`);
			}
		}
	};

	return (
		<View
			style={{
				backgroundColor: colors.card,
				width: "100%",
				borderRadius: 12,
				overflow: "hidden",
				shadowOpacity: 0.1,
				shadowRadius: 4,
			}}
		>
			<View style={{ flexDirection: "row", height: 144 }}>
				<Image
					source={{ uri: imageUrl }}
					style={{ width: "33%", height: "100%" }}
					resizeMode="cover"
				/>
				<View
					style={{ width: "67%", padding: 16, justifyContent: "space-between" }}
				>
					<View>
						<Text className="text-lg font-bold" style={{ color: colors.text }}>
							{title}
						</Text>
						<View className="flex-row items-center mt-1">
							<Clock size={16} color={colors.secondaryText} />
							<Text
								className="ml-1 text-sm"
								style={{ color: colors.secondaryText }}
							>
								{duration}
							</Text>
						</View>
					</View>
					<TouchableOpacity
						onPress={handleStart}
						className="rounded-lg py-2 px-4 flex-row items-center justify-center mt-2"
						style={{ backgroundColor: colors.accent }}
					>
						<Play size={16} color="#FFFFFF" />
						<Text className="ml-3 text-white font-semibold">Start Workout</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

export default TodaysWorkoutCard;
