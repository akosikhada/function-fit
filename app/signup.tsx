import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	SafeAreaView,
	ActivityIndicator,
	Alert,
	StatusBar,
	Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import { signUp } from "./utils/auth";
import Toast from "./components/Toast";

export default function SignUpScreen() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [showError, setShowError] = useState(false);

	// Fix for status bar flash when navigating
	useEffect(() => {
		StatusBar.setBarStyle("dark-content");
		if (Platform.OS === "android") {
			StatusBar.setBackgroundColor("white");
		}
	}, []);

	const showErrorToast = (message: string) => {
		setErrorMessage(message);
		setShowError(true);
	};

	const handleSignUp = async () => {
		// Input validation
		if (!username || !email || !password || !confirmPassword) {
			showErrorToast("Please fill in all fields");
			return;
		}

		if (username.length < 3) {
			showErrorToast("Username must be at least 3 characters long");
			return;
		}

		if (password.length < 6) {
			showErrorToast("Password must be at least 6 characters long");
			return;
		}

		if (password !== confirmPassword) {
			showErrorToast("Passwords do not match");
			return;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			showErrorToast("Please enter a valid email address");
			return;
		}

		try {
			setLoading(true);
			const result = await signUp(email, password, username);

			if (result.success) {
				// Handle email confirmation if needed
				if (result.needsEmailConfirmation) {
					Alert.alert(
						"Account Created",
						result.message ||
							"Account created successfully! Please check your email to verify your account.",
						[
							{
								text: "OK",
								onPress: () => router.replace("/signin"),
							},
						]
					);
				} else {
					// Automatic sign-in worked
					Alert.alert("Success", "Account created successfully!", [
						{
							text: "OK",
							onPress: () => router.replace("/"),
						},
					]);
				}
			}
		} catch (error: any) {
			// Don't log errors to console
			let errorMessage = "Failed to sign up. Please try again.";

			if (error.message?.includes("duplicate key")) {
				if (error.message.includes("users_username_key")) {
					errorMessage = "Username already taken. Please choose another one.";
				} else if (error.message.includes("users_pkey")) {
					errorMessage = "An account with this email already exists.";
				}
			} else if (error.message) {
				errorMessage = error.message;
			}

			showErrorToast(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const navigateToSignIn = () => {
		// Use replace for fastest navigation between auth screens
		router.replace("/signin");
	};

	return (
		<SafeAreaView className="flex-1 bg-white">
			<StatusBar barStyle="dark-content" backgroundColor="white" />
			<Stack.Screen options={{ title: "Sign Up" }} />

			<View className="flex-1 px-6 py-8">
				<Text className="text-3xl font-bold text-gray-800 mb-8">
					Create Account
				</Text>

				<View className="space-y-4 mb-6">
					<View>
						<Text className="text-gray-600 mb-2">Username</Text>
						<TextInput
							className="bg-gray-100 p-4 rounded-lg text-gray-800"
							placeholder="Choose a username"
							autoCapitalize="none"
							value={username}
							onChangeText={setUsername}
						/>
					</View>

					<View>
						<Text className="text-gray-600 mb-2">Email</Text>
						<TextInput
							className="bg-gray-100 p-4 rounded-lg text-gray-800"
							placeholder="Enter your email"
							keyboardType="email-address"
							autoCapitalize="none"
							value={email}
							onChangeText={setEmail}
						/>
					</View>

					<View>
						<Text className="text-gray-600 mb-2">Password</Text>
						<TextInput
							className="bg-gray-100 p-4 rounded-lg text-gray-800"
							placeholder="Create a password"
							secureTextEntry
							value={password}
							onChangeText={setPassword}
						/>
					</View>

					<View>
						<Text className="text-gray-600 mb-2">Confirm Password</Text>
						<TextInput
							className="bg-gray-100 p-4 rounded-lg text-gray-800"
							placeholder="Confirm your password"
							secureTextEntry
							value={confirmPassword}
							onChangeText={setConfirmPassword}
						/>
					</View>
				</View>

				<TouchableOpacity
					className="bg-indigo-600 py-4 rounded-xl items-center mb-4"
					onPress={handleSignUp}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="white" />
					) : (
						<Text className="text-white font-bold text-lg">Sign Up</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					className="items-center"
					onPress={navigateToSignIn}
					activeOpacity={0.6}
				>
					<Text className="text-indigo-600">
						Already have an account? Sign In
					</Text>
				</TouchableOpacity>
			</View>

			{/* Use the Toast component */}
			<Toast
				message={errorMessage}
				type="error"
				visible={showError}
				onDismiss={() => setShowError(false)}
			/>
		</SafeAreaView>
	);
}
