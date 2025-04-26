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
import { signUp } from "./utils/auth";
import Toast from "./components/Toast";
import { Check, Eye, EyeOff, User, Mail, Lock } from "lucide-react-native";

export default function SignUpScreen() {
	const [userName, setUserName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [agreeToTerms, setAgreeToTerms] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [showError, setShowError] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const [showSuccess, setShowSuccess] = useState(false);

	// Handle hardware back button
	useEffect(() => {
		const backAction = () => {
			try {
				// Get previous route if available
				const previousRoute = router.canGoBack();

				if (previousRoute) {
					// If we can go back in history (came from signin), go back
					router.back();
				} else {
					// Otherwise go to welcome screen
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

	const showSuccessToast = (message: string) => {
		setSuccessMessage(message);
		setShowSuccess(true);
	};

	const handleSignUp = async () => {
		// Input validation
		if (!userName || !email || !password || !confirmPassword) {
			showErrorToast("Please fill in all fields");
			return;
		}

		if (userName.length < 3) {
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

		if (!agreeToTerms) {
			showErrorToast("Please agree to the Terms and Privacy Policy");
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
			const result = await signUp(email, password, fullName);

			if (result.success) {
				// Handle email confirmation if needed
				if (result.needsEmailConfirmation) {
					// Show success toast instead of Alert
					showSuccessToast(
						result.message || 
						"Please check your email to verify your account before signing in."
					);
					
					// Navigate to sign in after a short delay
					setTimeout(() => {
						router.replace("/signin");
					}, 3000);
				} else {
					// Automatic sign-in worked
					showSuccessToast("Account created successfully!");
					setTimeout(() => {
						router.replace("/");
					}, 1500);
				}
			}
		} catch (error: any) {
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
		router.push("/signin");
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
							Get Started
						</Text>
						<Text className="text-gray-600">
							Track your fitness journey with us
						</Text>
					</View>

					<View className="space-y-6">
						<View>
							<Text className="text-gray-600 mb-2">Username</Text>
							<View className="relative">
								<View className="absolute left-4 top-4 z-10">
									<User size={20} color="#6B7280" />
								</View>
								<TextInput
									className="bg-gray-50 p-4 pl-12 rounded-lg text-gray-800"
									placeholder="Enter your username"
									value={userName}
									onChangeText={setUserName}
								/>
							</View>
						</View>

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
									placeholder="Create a password"
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

						<View>
							<Text className="text-gray-600 mb-2">Confirm Password</Text>
							<View className="relative">
								<View className="absolute left-4 top-4 z-10">
									<Lock size={20} color="#6B7280" />
								</View>
								<TextInput
									className="bg-gray-50 p-4 pl-12 pr-12 rounded-lg text-gray-800"
									placeholder="Confirm your password"
									secureTextEntry={!showConfirmPassword}
									value={confirmPassword}
									onChangeText={setConfirmPassword}
								/>
								<TouchableOpacity
									className="absolute right-4 top-4"
									onPress={() => setShowConfirmPassword(!showConfirmPassword)}
								>
									{showConfirmPassword ? (
										<EyeOff size={20} color="#6B7280" />
									) : (
										<Eye size={20} color="#6B7280" />
									)}
								</TouchableOpacity>
							</View>
						</View>

						<View className="flex-row items-center mt-2">
							<TouchableOpacity
								onPress={() => setAgreeToTerms(!agreeToTerms)}
								className="mr-2"
							>
								<View
									className={`w-5 h-5 border rounded items-center justify-center ${
										agreeToTerms
											? "bg-indigo-600 border-indigo-600"
											: "border-gray-300"
									}`}
								>
									{agreeToTerms && (
										<Check size={16} color="white" strokeWidth={3} />
									)}
								</View>
							</TouchableOpacity>
							<Text className="text-gray-600 text-sm flex-1">
								I agree to the <Text className="text-indigo-600">Terms</Text>{" "}
								and <Text className="text-indigo-600">Privacy Policy</Text>
							</Text>
						</View>
					</View>

					<TouchableOpacity
						className="bg-indigo-600 py-4 rounded-lg items-center mt-10"
						onPress={handleSignUp}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="white" />
						) : (
							<Text className="text-white font-semibold text-base">
								Sign Up
							</Text>
						)}
					</TouchableOpacity>

					<View className="mt-8">
						<Text className="text-gray-600 text-center">
							Already have an account?{" "}
							<Text
								className="text-indigo-600 font-semibold"
								onPress={navigateToSignIn}
							>
								Log In
							</Text>
						</Text>
					</View>
				</View>
			</View>

			{/* Error Toast */}
			<Toast
				message={errorMessage}
				type="error"
				visible={showError}
				onDismiss={() => setShowError(false)}
				duration={5000}
			/>
			
			{/* Success Toast */}
			<Toast
				message={successMessage}
				type="success"
				visible={showSuccess}
				onDismiss={() => setShowSuccess(false)}
				duration={5000}
			/>
		</SafeAreaView>
	);
}
