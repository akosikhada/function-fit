import { supabase, createUserProfileWithServiceRole } from "./supabase";
import { User } from "@supabase/supabase-js";
import { router } from "expo-router";
import { Database } from "../../src/types/supabase.types";
import { PostgrestError } from "@supabase/supabase-js";

// Function to sign up a new user
export const signUp = async (
	email: string,
	password: string,
	username: string
) => {
	try {
		// 1. Check if username is already taken
		const { data: existingUsername } = await supabase
			.from("users")
			.select("username")
			.eq("username", username)
			.maybeSingle();

		if (existingUsername) {
			throw new Error(
				"This username is already taken. Please choose another one."
			);
		}

		// 2. Create the auth user with metadata
		const { data: authData, error: authError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					username: username, // Store username in auth metadata
				},
				// For React Native, either set this to your deep link or remove it entirely
				// emailRedirectTo: "fitnessapp://auth/callback",
			},
		});

		if (authError) {
			// Provide more user-friendly error messages
			if (authError.message.includes("already registered")) {
				throw new Error("An account with this email already exists.");
			} else if (authError.message.includes("password")) {
				throw new Error(
					"Your password is too weak. Please use at least 6 characters with a mix of letters, numbers, and symbols."
				);
			} else {
				throw new Error(
					authError.message ||
						"Failed to create your account. Please try again."
				);
			}
		}

		if (!authData.user) {
			throw new Error(
				"We couldn't create your account. Please try again later."
			);
		}

		// 3. Create the user profile - try with service role directly to avoid RLS issues
		try {
			const { data, error } = await createUserProfileWithServiceRole(
				authData.user.id,
				username,
				email
			);

			if (error) {
				// Clean up by signing out if there was an error creating the profile
				await supabase.auth.signOut();

				const errorMessage =
					(error as PostgrestError).message || "Error creating user profile";

				if (errorMessage.includes("duplicate key")) {
					throw new Error(
						"This username is already taken. Please choose another."
					);
				}
				throw new Error(errorMessage);
			}

			// 4. If we have a session, no email confirmation is needed
			if (authData.session) {
				return {
					user: authData.user,
					profile: data,
					success: true,
				};
			} else {
				// Email confirmation is needed
				return {
					user: authData.user,
					profile: data,
					success: true,
					needsEmailConfirmation: true,
					message:
						"Your account has been created! Please check your email to confirm your account before signing in.",
				};
			}
		} catch (profileError) {
			// Clean up by signing out if there was an error creating the profile
			await supabase.auth.signOut();

			// Provide user-friendly error message
			if (
				typeof profileError === "object" &&
				profileError !== null &&
				"message" in profileError
			) {
				throw new Error(String(profileError.message));
			} else {
				throw new Error(
					"We couldn't set up your profile. Please try again later."
				);
			}
		}
	} catch (error) {
		// Just throw the error for the UI to handle
		throw error;
	}
};

// Function to sign in a user
export const signIn = async (email: string, password: string) => {
	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			// Handle specific error cases with user-friendly messages
			if (error.message.includes("Invalid login credentials")) {
				throw new Error(
					"The email or password you entered is incorrect. Please try again."
				);
			} else if (error.message.includes("Email not confirmed")) {
				throw new Error(
					"Your account hasn't been verified yet. Please check your email for a verification link."
				);
			} else {
				throw new Error(
					error.message || "An unexpected error occurred. Please try again."
				);
			}
		}

		return { user: data.user, success: true };
	} catch (error) {
		// No console.error - this just throws the error for the UI to handle
		throw error;
	}
};

// Function to sign out
export const signOut = async () => {
	try {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
		return { success: true };
	} catch (error) {
		console.error("Error signing out:", error);
		throw error;
	}
};

// Function to get the current session
export const getSession = async () => {
	try {
		const { data, error } = await supabase.auth.getSession();
		if (error) throw error;
		return data.session;
	} catch (error) {
		console.error("Error getting session:", error);
		return null;
	}
};

// Function to update user profile
export const updateUserProfile = async (
	userId: string,
	updates: Partial<Database["public"]["Tables"]["users"]["Row"]>
) => {
	try {
		const { data, error } = await supabase
			.from("users")
			.update(updates)
			.eq("id", userId)
			.select()
			.single();

		if (error) throw error;
		return { user: data, success: true };
	} catch (error) {
		console.error("Error updating profile:", error);
		throw error;
	}
};

// Function to reset password
export const resetPassword = async (email: string) => {
	try {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: "https://yourapp.com/reset-password",
		});

		if (error) throw error;
		return { success: true };
	} catch (error) {
		console.error("Error resetting password:", error);
		throw error;
	}
};

// Function to handle complete logout
export const logout = async () => {
	try {
		// 1. Sign out from Supabase auth
		const { error } = await supabase.auth.signOut();
		if (error) throw error;

		// 2. Clear any local storage or state if needed
		// Note: Supabase client automatically clears the local session

		// 3. Navigate to welcome screen
		router.replace("/welcome");

		return { success: true };
	} catch (error) {
		console.error("Error during logout:", error);
		throw error;
	}
};

// Function to delete user account
export const deleteUserAccount = async (userId: string) => {
	try {
		// Call the delete_user_complete function
		const { error } = await supabase.rpc("delete_user_complete", {
			user_id: userId,
		});

		if (error) throw error;

		// Navigate to welcome screen after successful deletion
		router.replace("/welcome");

		return { success: true };
	} catch (error) {
		console.error("Error deleting user account:", error);
		throw error;
	}
};

// Export all functions as a default object
export default {
	signUp,
	signIn,
	signOut,
	getSession,
	updateUserProfile,
	resetPassword,
	logout,
	deleteUserAccount,
};
