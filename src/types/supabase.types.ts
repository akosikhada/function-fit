export type Database = {
	public: {
		Tables: {
			users: {
				Row: {
					id: string;
					email: string;
					username: string;
					avatar_url?: string;
					created_at?: string;
					updated_at?: string;
				};
			};
			user_stats: {
				Row: {
					id: string;
					user_id: string;
					date: string;
					steps: number;
					calories: number;
					workouts_completed: number;
					created_at?: string;
					updated_at?: string;
				};
			};
			user_achievements: {
				Row: {
					id: string;
					user_id: string;
					achievement_id: string;
					is_new: boolean;
					achieved_at: string;
					created_at?: string;
					updated_at?: string;
				};
			};
			achievements: {
				Row: {
					id: string;
					title: string;
					description: string;
					icon: string;
					created_at?: string;
					updated_at?: string;
				};
			};
			workout_plans: {
				Row: {
					id: string;
					user_id: string;
					workout_id: string;
					scheduled_date: string;
					scheduled_time?: string;
					created_at?: string;
					updated_at?: string;
				};
			};
			workouts: {
				Row: {
					id: string;
					title: string;
					description?: string;
					duration: number;
					calories: number;
					difficulty: string;
					category?: string;
					image_url?: string;
					created_at?: string;
					updated_at?: string;
				};
			};
			exercises: {
				Row: {
					id: string;
					workout_id: string;
					name: string;
					duration: number;
					rest?: number;
					sort_order: number;
					created_at?: string;
					updated_at?: string;
				};
			};
			user_workouts: {
				Row: {
					id: string;
					user_id: string;
					workout_id: string;
					duration: number;
					calories: number;
					completed_at?: string;
					created_at?: string;
					updated_at?: string;
				};
			};
			// Add other tables as needed
		};
	};
};

// Types for joined/nested data
export type WorkoutPlan = {
	id: string;
	scheduled_date: string;
	scheduled_time?: string;
	workouts: {
		id: string;
		title: string;
		duration: number;
		calories: number;
		difficulty: string;
		image_url?: string;
	}[];
};

export type UserAchievement = {
	id: string;
	is_new: boolean;
	achieved_at: string;
	achievements: {
		id: string;
		title: string;
		description: string;
		icon: string;
	}[];
};
