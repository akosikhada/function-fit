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
	Dimensions,
	BackHandler,
} from "react-native";
import { Stack, router } from "expo-router";
import { signIn } from "./utils/auth";
import Toast from "./components/Toast";
import { Eye, EyeOff, Mail, Lock } from "lucide-react-native";

export default function SignInScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [showError, setShowError] = useState(false);

	// Handle hardware back button
	useEffect(() => {
		const backAction = () => {
			try {
				// Check if there's a navigation history
				if (router.canGoBack()) {
					// Go back to previous screen (which could be signup or welcome)
					router.back();
				} else {
					// Default fallback to welcome screen
					router.replace("/welcome");
				}
				return true;
			} catch (error) {
				// Fallback to welcome screen if there's an error
				router.replace("/welcome");
				return true;
			}
		};

		const backHandler = BackHandler.addEventListener(
			"hardwareBackPress",
			backAction
		);

		return () => backHandler.remove();
	}, []);

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

	const handleSignIn = async () => {
		if (!email || !password) {
			showErrorToast("Please fill in all fields");
			return;
		}

		try {
			setLoading(true);
			const { success } = await signIn(email, password);
			if (success) {
				// Ensure status bar remains consistent during navigation
				StatusBar.setBarStyle("dark-content", true);
				router.push("/");
			}
		} catch (error) {
			// Don't log errors to console
			showErrorToast((error as Error).message);
		} finally {
			setLoading(false);
		}
	};

	const navigateToSignUp = () => {
		// Use push instead of replace for consistent navigation
		router.push("/signup");
	};

	const navigateToResetPassword = () => {
		router.push("/app/reset-password" as any);
	};

	return (
		<SafeAreaView className="flex-1 bg-indigo-50">
			<StatusBar barStyle="dark-content" backgroundColor="#eef2ff" />
			<Stack.Screen options={{ headerShown: false }} />

			{/* Background Boxes */}
			<View className="absolute inset-0 overflow-hidden">
				{/* Top-right large box */}
				<View className="absolute -right-20 -top-20 w-80 h-80 rotate-12 bg-indigo-500/20 rounded-3xl" />
				<View className="absolute -right-10 -top-10 w-60 h-60 -rotate-12 bg-indigo-600/25 rounded-3xl" />

				{/* Middle decorative boxes */}
				<View className="absolute right-1/4 top-1/3 w-40 h-40 rotate-45 bg-indigo-400/15 rounded-2xl" />
				<View className="absolute left-1/4 top-2/3 w-32 h-32 -rotate-12 bg-indigo-500/20 rounded-2xl" />

				{/* Bottom-left boxes */}
				<View className="absolute -left-20 -bottom-20 w-72 h-72 rotate-12 bg-indigo-600/20 rounded-3xl" />
				<View className="absolute -left-10 -bottom-10 w-52 h-52 -rotate-12 bg-indigo-500/25 rounded-3xl" />
			</View>

			<View className="flex-1 px-8 pt-16 justify-center">
				{/* Card Container */}
				<View className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50">
					<View className="mb-10">
						<Text className="text-3xl font-bold text-gray-900 mb-3">
							Welcome Back
						</Text>
						<Text className="text-gray-600">
							Sign in to continue your fitness journey
						</Text>
					</View>

					<View className="space-y-6">
						<View>
							<Text className="text-gray-600 mb-2">Email Address</Text>
							<View className="relative">
								<View className="absolute left-4 top-4 z-10">
									<Mail size={20} color="#6B7280" />
								</View>
								<TextInput
									className="bg-gray-50 p-4 pl-12 rounded-lg text-gray-800"
									placeholder="Enter your email"
									keyboardType="email-address"
									autoCapitalize="none"
									value={email}
									onChangeText={setEmail}
								/>
							</View>
						</View>

						<View>
							<Text className="text-gray-600 mb-2">Password</Text>
							<View className="relative">
								<View className="absolute left-4 top-4 z-10">
									<Lock size={20} color="#6B7280" />
								</View>
								<TextInput
									className="bg-gray-50 p-4 pl-12 pr-12 rounded-lg text-gray-800"
									placeholder="Enter your password"
									secureTextEntry={!showPassword}
									value={password}
									onChangeText={setPassword}
								/>
								<TouchableOpacity
									className="absolute right-4 top-4"
									onPress={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeOff size={20} color="#6B7280" />
									) : (
										<Eye size={20} color="#6B7280" />
									)}
								</TouchableOpacity>
							</View>
						</View>

						<TouchableOpacity
							className="items-end"
							onPress={navigateToResetPassword}
						>
							<Text className="text-indigo-600 font-semibold mt-2">
								Forgot your password?
							</Text>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						className="bg-indigo-600 py-4 rounded-lg items-center mt-10"
						onPress={handleSignIn}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="white" />
						) : (
							<Text className="text-white font-semibold text-base">
								Sign In
							</Text>
						)}
					</TouchableOpacity>

					<View className="mt-8">
						<Text className="text-gray-600 text-center">
							Don't have an account?{" "}
							<Text
								className="text-indigo-600 font-semibold"
								onPress={navigateToSignUp}
							>
								Sign Up
							</Text>
						</Text>
					</View>
				</View>
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
