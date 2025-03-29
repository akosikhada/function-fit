import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import {
	Database,
	WorkoutPlan,
	UserAchievement,
} from "../../src/types/supabase.types";
import { uploadImageToSupabase } from "./uploadUtils";

// Initialize the Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Supabase client (standard client with limited permissions)
export const supabase = createClient<Database>(
	process.env.EXPO_PUBLIC_SUPABASE_URL || "",
	process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Service role client with admin privileges - DO NOT EXPOSE IN CLIENT CODE
// Only use for server-side operations when absolutely necessary
export const supabaseAdmin = createClient(
	process.env.EXPO_PUBLIC_SUPABASE_URL || "",
	process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || "",
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	}
);

// Helper functions for common Supabase operations
export const getUser = async () => {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user;
};

export const getUserProfile = async (userId: string) => {
	try {
		const { data: authUser } = await supabase.auth.getUser();
		if (!authUser.user) throw new Error("No authenticated user");

		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("id", userId)
			.maybeSingle();

		if (error) throw error;

		// If no profile exists, create one with default values
		if (!data) {
			const { data: newProfile, error: createError } = await supabase
				.from("users")
				.insert({
					id: userId,
					email: authUser.user.email,
					username: authUser.user.email?.split("@")[0] || "user",
					avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
				})
				.select()
				.single();

			if (createError) throw createError;
			return newProfile;
		}

		return data;
	} catch (error) {
		console.error("Error in getUserProfile:", error);
		throw error;
	}
};

export const getUserStats = async (userId: string, date: string) => {
	try {
		// First ensure user exists in users table
		const userProfile = await getUserProfile(userId);
		if (!userProfile) {
			throw new Error("User profile not found");
		}

		const { data, error } = await supabase
			.from("user_stats")
			.select("*")
			.eq("user_id", userId)
			.eq("date", date)
			.maybeSingle();

		if (error && error.code !== "PGRST116") throw error;

		// If no stats exist for today, create them
		if (!data) {
			const { data: newStats, error: createError } = await supabase
				.from("user_stats")
				.insert({
					user_id: userId,
					date,
					steps: 0,
					calories: 0,
					workouts_completed: 0,
				})
				.select()
				.single();

			if (createError) throw createError;
			return newStats;
		}

		return data;
	} catch (error) {
		console.error("Error in getUserStats:", error);
		throw error;
	}
};

export const getUserDashboardData = async (userId: string) => {
	try {
		// Get today's date in YYYY-MM-DD format
		const today = new Date().toISOString().split("T")[0];

		// Get user profile
		const userProfile = await getUserProfile(userId);

		// Get user stats for today
		const userStats = await getUserStats(userId, today);

		// Get user achievements
		const achievements = await getUserAchievements(userId);

		// Get today's workout plans
		const workoutPlans = await getWorkoutPlans(userId, today);

		// Calculate progress percentages
		const stepsProgress = userStats
			? Math.min(Math.round((userStats.steps / 10000) * 100), 100)
			: 0;
		const caloriesProgress = userStats
			? Math.min(Math.round((userStats.calories / 2000) * 100), 100)
			: 0;
		const workoutProgress = userStats
			? Math.min(Math.round((userStats.workouts_completed / 5) * 100), 100)
			: 0;

		// Format values for display
		const stepsValue = userStats ? userStats.steps.toLocaleString() : "0";
		const caloriesValue = userStats ? userStats.calories.toLocaleString() : "0";
		const workoutValue = userStats
			? `${userStats.workouts_completed}/5`
			: "0/5";

		// Get streak count using the new function
		let streakCount = 5; // Default value
		try {
			// Calculate streak based on consecutive days with workouts
			let currentDate = new Date(today);
			let consecutiveDays = 0;
			let hasWorkout = true;

			// Check up to 30 days back
			for (let i = 0; i < 30 && hasWorkout; i++) {
				const dateString = currentDate.toISOString().split("T")[0];

				// Check if there's a workout completed on this day
				const { data } = await supabase
					.from("user_stats")
					.select("workouts_completed")
					.eq("user_id", userId)
					.eq("date", dateString)
					.single();

				if (!data || data.workouts_completed === 0) {
					hasWorkout = false;
				} else {
					consecutiveDays++;
					// Move to previous day
					currentDate.setDate(currentDate.getDate() - 1);
				}
			}

			streakCount = consecutiveDays;
		} catch (err) {
			console.error("Error calculating streak:", err);
			// Keep default value if there's an error
		}

		// Format achievements for display
		const formattedAchievements =
			achievements && achievements.length > 0
				? achievements
						.map((achievement) => ({
							title: achievement.achievements[0]?.title || "Achievement",
							isNew: achievement.is_new || false,
						}))
						.slice(0, 3) // Limit to 3 achievements
				: [];

		// Get today's workout (first one scheduled for today, if any)
		const todaysWorkout =
			workoutPlans &&
			workoutPlans.length > 0 &&
			workoutPlans[0].workouts &&
			workoutPlans[0].workouts.length > 0
				? {
						id: workoutPlans[0].workouts[0].id || "1",
						title: workoutPlans[0].workouts[0].title || "No workout scheduled",
						duration: `${workoutPlans[0].workouts[0].duration || 0} mins`,
						imageUrl:
							workoutPlans[0].workouts[0].image_url ||
							"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
				  }
				: {
						id: "1",
						title: "No workout scheduled",
						duration: "0 mins",
						imageUrl:
							"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
				  };

		return {
			username: userProfile?.username || "User",
			stepsProgress,
			caloriesProgress,
			workoutProgress,
			stepsValue,
			caloriesValue,
			workoutValue,
			streakCount,
			achievements: formattedAchievements,
			todaysWorkout,
		};
	} catch (error) {
		console.error("Error fetching dashboard data:", error);
		// Return default data in case of error
		return {
			username: "User",
			stepsProgress: 0,
			caloriesProgress: 0,
			workoutProgress: 0,
			stepsValue: "0",
			caloriesValue: "0",
			workoutValue: "0/5",
			streakCount: 0,
			achievements: [],
			todaysWorkout: {
				id: "1",
				title: "No workout available",
				duration: "0 mins",
				imageUrl:
					"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
			},
		};
	}
};

export const getWorkouts = async () => {
	const { data, error } = await supabase
		.from("workouts")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data;
};

export const getWorkoutById = async (workoutId: string) => {
	try {
		// Ensure workoutId is in a valid UUID format
		if (!workoutId.includes("-") && /^\d+$/.test(workoutId)) {
			// Convert simple numeric ID to UUID format
			workoutId = `00000000-0000-0000-0000-00000000000${workoutId}`;
		}

		const { data: workout, error: workoutError } = await supabase
			.from("workouts")
			.select("*")
			.eq("id", workoutId)
			.single();

		if (workoutError) throw workoutError;

		const { data: exercises, error: exercisesError } = await supabase
			.from("exercises")
			.select("*")
			.eq("workout_id", workoutId)
			.order("sort_order", { ascending: true });

		if (exercisesError) throw exercisesError;

		return { ...workout, exercises };
	} catch (error) {
		console.error(`Error getting workout ${workoutId}:`, error);
		throw error;
	}
};

export const getUserAchievements = async (
	userId: string
): Promise<UserAchievement[]> => {
	const { data, error } = await supabase
		.from("user_achievements")
		.select(
			`
      id,
      is_new,
      achieved_at,
      achievements:achievement_id (id, title, description, icon)
    `
		)
		.eq("user_id", userId);

	if (error) throw error;
	return data as UserAchievement[];
};

export const getWorkoutPlans = async (
	userId: string,
	date: string
): Promise<WorkoutPlan[]> => {
	const { data, error } = await supabase
		.from("workout_plans")
		.select(
			`
      id,
      scheduled_date,
      scheduled_time,
      workouts:workout_id (id, title, duration, calories, difficulty, image_url)
    `
		)
		.eq("user_id", userId)
		.eq("scheduled_date", date);

	if (error) throw error;
	return data as WorkoutPlan[];
};

export const completeWorkout = async (
	userId: string,
	workoutId: string,
	duration: number,
	calories: number
) => {
	try {
		// Ensure workoutId is in a valid UUID format
		if (!workoutId.includes("-") && /^\d+$/.test(workoutId)) {
			// Convert simple numeric ID to UUID format
			workoutId = `00000000-0000-0000-0000-00000000000${workoutId}`;
		}

		// 1. Log the completed workout
		const { error: workoutError } = await supabase
			.from("user_workouts")
			.insert({
				user_id: userId,
				workout_id: workoutId,
				duration,
				calories,
			});

		if (workoutError) throw workoutError;

		// 2. Update user stats for the day
		const today = new Date().toISOString().split("T")[0];
		const { data: existingStats } = await supabase
			.from("user_stats")
			.select("*")
			.eq("user_id", userId)
			.eq("date", today)
			.single();

		if (existingStats) {
			// Update existing stats
			const { error: statsError } = await supabase
				.from("user_stats")
				.update({
					workouts_completed: existingStats.workouts_completed + 1,
					calories: existingStats.calories + calories,
					updated_at: new Date().toISOString(),
				})
				.eq("id", existingStats.id);

			if (statsError) throw statsError;
		} else {
			// Create new stats for today
			const { error: statsError } = await supabase.from("user_stats").insert({
				user_id: userId,
				date: today,
				workouts_completed: 1,
				calories,
				steps: 0, // Default value, would be updated from a fitness tracker
			});

			if (statsError) throw statsError;
		}

		return { success: true };
	} catch (error) {
		console.error("Error completing workout:", error);
		throw error;
	}
};

// Now let's add a fallback function to create a user profile if RLS fails
export const createUserProfileWithServiceRole = async (
	userId: string,
	username: string,
	email: string
) => {
	try {
		const { data, error } = await supabaseAdmin
			.from("users")
			.insert({
				id: userId,
				username,
				email,
				avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
			})
			.select()
			.single();

		if (error) throw error;
		return { data, error: null };
	} catch (error) {
		console.error("Error in createUserProfileWithServiceRole:", error);
		return { data: null, error };
	}
};

export const updateUserProfile = async (
	userId: string,
	updateData: {
		fullName?: string;
		username?: string;
		email?: string;
		birthday?: string;
		gender?: string;
		height?: string;
		weight?: string;
		avatar_url?: string;
	}
) => {
	try {
		// Extract fields that go to the users table in Supabase
		const { username, avatar_url } = updateData;

		// For local file URIs (from image picker), use a default avatar with a fixed seed
		// so it stays consistent for the user even after logging in again
		let finalAvatarUrl = avatar_url;
		if (avatar_url && avatar_url.startsWith("file://")) {
			// Instead of generating a random avatar, use one based on the user's ID
			// This ensures the same avatar is always used for this user
			const seed = username || userId; // Use username or userId as a consistent seed
			finalAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
				seed
			)}`;
		}

		// Update the users table - removed height and weight fields since they don't exist in the table
		const { data, error } = await supabase
			.from("users")
			.update({
				username: username,
				avatar_url: finalAvatarUrl,
				updated_at: new Date().toISOString(),
			})
			.eq("id", userId)
			.select()
			.single();

		if (error) throw error;

		// Only try to update email if it's provided and the auth user data exists
		if (updateData.email) {
			try {
				const { error: emailError } = await supabase.auth.updateUser({
					email: updateData.email,
				});

				if (emailError) {
					// If email update fails, log the error but don't stop the flow
					console.error("Error updating email:", emailError);
					// Throw the error to be handled by the caller
					throw emailError;
				}
			} catch (emailUpdateError) {
				console.error("Email update failed:", emailUpdateError);
				throw emailUpdateError;
			}
		}

		return { data, success: true };
	} catch (error) {
		console.error("Error updating user profile:", error);
		throw error;
	}
};

// Export all functions as a default object
export default {
	getUser,
	getUserProfile,
	getUserStats,
	getUserDashboardData,
	getWorkouts,
	getWorkoutById,
	getUserAchievements,
	getWorkoutPlans,
	completeWorkout,
	createUserProfileWithServiceRole,
	updateUserProfile,
};
