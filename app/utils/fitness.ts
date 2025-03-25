import { supabase } from "./supabase";
import { Database } from "../../src/types/supabase.types";

type Workout = Database["public"]["Tables"]["workouts"]["Row"];
type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

// Function to track steps
export const trackSteps = async (userId: string, steps: number) => {
	try {
		const today = new Date().toISOString().split("T")[0];

		// Check if there's an existing record for today
		const { data: existingStats } = await supabase
			.from("user_stats")
			.select("*")
			.eq("user_id", userId)
			.eq("date", today)
			.single();

		if (existingStats) {
			// Update existing stats
			const { error } = await supabase
				.from("user_stats")
				.update({
					steps: steps,
					updated_at: new Date().toISOString(),
				})
				.eq("id", existingStats.id);

			if (error) throw error;
		} else {
			// Create new stats for today
			const { error } = await supabase.from("user_stats").insert({
				user_id: userId,
				date: today,
				steps: steps,
				calories: 0,
				workouts_completed: 0,
			});

			if (error) throw error;
		}

		return { success: true };
	} catch (error) {
		console.error("Error tracking steps:", error);
		throw error;
	}
};

// Function to track calories
export const trackCalories = async (userId: string, calories: number) => {
	try {
		const today = new Date().toISOString().split("T")[0];

		// Check if there's an existing record for today
		const { data: existingStats } = await supabase
			.from("user_stats")
			.select("*")
			.eq("user_id", userId)
			.eq("date", today)
			.single();

		if (existingStats) {
			// Update existing stats
			const { error } = await supabase
				.from("user_stats")
				.update({
					calories: calories,
					updated_at: new Date().toISOString(),
				})
				.eq("id", existingStats.id);

			if (error) throw error;
		} else {
			// Create new stats for today
			const { error } = await supabase.from("user_stats").insert({
				user_id: userId,
				date: today,
				steps: 0,
				calories: calories,
				workouts_completed: 0,
			});

			if (error) throw error;
		}

		return { success: true };
	} catch (error) {
		console.error("Error tracking calories:", error);
		throw error;
	}
};

// Function to get user streak
export const getUserStreak = async (userId: string) => {
	try {
		const today = new Date();
		let streak = 0;
		let currentDate = new Date(today);
		let continuousStreak = true;

		// Check up to 30 days back to find the streak
		for (let i = 0; i < 30 && continuousStreak; i++) {
			// Format date as YYYY-MM-DD
			const dateString = currentDate.toISOString().split("T")[0];

			// Check if there's a workout completed on this day
			const { data, error } = await supabase
				.from("user_stats")
				.select("workouts_completed")
				.eq("user_id", userId)
				.eq("date", dateString)
				.single();

			if (error || !data || data.workouts_completed === 0) {
				// No workout on this day, streak ends
				continuousStreak = false;
			} else {
				// Workout found, increment streak
				streak++;
				// Move to previous day
				currentDate.setDate(currentDate.getDate() - 1);
			}
		}

		return { streak, success: true };
	} catch (error) {
		console.error("Error getting user streak:", error);
		return { streak: 0, success: false };
	}
};

// Function to create a custom workout
export const createWorkout = async (
	workout: Omit<Workout, "id" | "created_at">,
	exercises: Omit<Exercise, "id" | "workout_id" | "created_at">[]
) => {
	try {
		// 1. Insert the workout
		const { data: workoutData, error: workoutError } = await supabase
			.from("workouts")
			.insert({
				title: workout.title,
				description: workout.description,
				duration: workout.duration,
				calories: workout.calories,
				difficulty: workout.difficulty,
				category: workout.category || "custom",
				image_url: workout.image_url,
			})
			.select()
			.single();

		if (workoutError) throw workoutError;

		// 2. Insert the exercises
		const exercisesWithWorkoutId = exercises.map((exercise, index) => ({
			workout_id: workoutData.id,
			name: exercise.name,
			duration: exercise.duration,
			rest: exercise.rest || 15, // Default rest time is 15 seconds
			sort_order: index + 1,
		}));

		const { error: exercisesError } = await supabase
			.from("exercises")
			.insert(exercisesWithWorkoutId);

		if (exercisesError) throw exercisesError;

		return { workout: workoutData, success: true };
	} catch (error) {
		console.error("Error creating workout:", error);
		throw error;
	}
};

// Function to schedule a workout
export const scheduleWorkout = async (
	userId: string,
	workoutId: string,
	date: string,
	time?: string
) => {
	try {
		// Ensure workoutId is in a valid UUID format
		if (!workoutId.includes("-") && /^\d+$/.test(workoutId)) {
			// Convert simple numeric ID to UUID format
			workoutId = `00000000-0000-0000-0000-00000000000${workoutId}`;
		}

		const { error } = await supabase.from("workout_plans").insert({
			user_id: userId,
			workout_id: workoutId,
			scheduled_date: date,
			scheduled_time: time,
		});

		if (error) throw error;

		return { success: true };
	} catch (error) {
		console.error("Error scheduling workout:", error);
		throw error;
	}
};

// Function to get weekly stats
export const getWeeklyStats = async (userId: string) => {
	try {
		// Get dates for the last 7 days
		const dates = [];
		const today = new Date();

		for (let i = 6; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			dates.push(date.toISOString().split("T")[0]);
		}

		// Get stats for each day
		const { data, error } = await supabase
			.from("user_stats")
			.select("date, steps, calories, workouts_completed")
			.eq("user_id", userId)
			.in("date", dates);

		if (error) throw error;

		// Format the data
		const weeklyData = dates.map((date) => {
			const dayStats = data?.find((stat) => stat.date === date) || {
				date,
				steps: 0,
				calories: 0,
				workouts_completed: 0,
			};

			return {
				date,
				day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
				steps: dayStats.steps,
				calories: dayStats.calories,
				workouts: dayStats.workouts_completed,
			};
		});

		return { weeklyData, success: true };
	} catch (error) {
		console.error("Error getting weekly stats:", error);
		throw error;
	}
};

// Export all functions as a default object
export default {
	trackSteps,
	trackCalories,
	getUserStreak,
	createWorkout,
	scheduleWorkout,
	getWeeklyStats,
};
