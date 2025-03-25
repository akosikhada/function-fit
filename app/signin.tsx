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
import { signIn } from "./utils/auth";
import Toast from "./components/Toast";

export default function SignInScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
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
		// Use replace for fastest navigation between auth screens
		router.replace("/signup");
	};

	const navigateToResetPassword = () => {
		Alert.alert(
			"Reset Password",
			"Password reset functionality will be implemented soon."
		);
	};

	return (
		<SafeAreaView className="flex-1 bg-white">
			<StatusBar barStyle="dark-content" backgroundColor="white" />
			<Stack.Screen options={{ title: "Sign In" }} />

			<View className="flex-1 px-6 py-8">
				<Text className="text-3xl font-bold text-gray-800 mb-8">
					Welcome Back
				</Text>

				<View className="space-y-4 mb-6">
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
							placeholder="Enter your password"
							secureTextEntry
							value={password}
							onChangeText={setPassword}
						/>
					</View>
				</View>

				<TouchableOpacity
					className="items-end mb-6"
					onPress={navigateToResetPassword}
				>
					<Text className="text-indigo-600">Forgot your password?</Text>
				</TouchableOpacity>

				<TouchableOpacity
					className="bg-indigo-600 py-4 rounded-xl items-center mb-4"
					onPress={handleSignIn}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="white" />
					) : (
						<Text className="text-white font-bold text-lg">Sign In</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					className="items-center"
					onPress={navigateToSignUp}
					activeOpacity={0.6}
				>
					<Text className="text-indigo-600">
						Don't have an account? Sign Up
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
