import {
	DefaultTheme,
	ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";
import { Platform } from "react-native";
import { getSession } from "./utils/auth";
import { supabase } from "./utils/supabase";
import { Slot } from "expo-router";
import { User } from "@supabase/supabase-js";
import ThemeModule, { useTheme, lightTheme, darkTheme } from "./utils/theme";
const { ThemeProvider } = ThemeModule;
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function useProtectedRoute(user: User | null) {
	const segments = useSegments();
	const router = useRouter();
	const [isNavigationReady, setIsNavigationReady] = useState(false);

	useEffect(() => {
		if (!isNavigationReady) return;

		const inPublicGroup = ["welcome", "signin", "signup", "app"].includes(
			segments[0] as string
		) || (segments[0] === "app" && ["reset-password", "reset-password-confirmation"].includes(segments[1] as string));

		if (!user && !inPublicGroup) {
			// If user is not signed in and not on a public screen, redirect to welcome
			router.replace("/welcome");
		} else if (user && inPublicGroup) {
			// If user is signed in and on a public screen, redirect to home
			router.replace("/");
		}
	}, [user, segments, isNavigationReady]);

	useEffect(() => {
		setIsNavigationReady(true);
	}, []);
}

// Add a theme-aware component to wrap the app content
function ThemedApp({ children }: { children: React.ReactNode }) {
	const { colors, theme } = useTheme();
	const deviceTheme = useColorScheme() || "light";
	const isDark = theme === "dark";

	// Create a navigation theme based on current app theme
	const navigationTheme = {
		...DefaultTheme,
		dark: isDark,
		colors: {
			...DefaultTheme.colors,
			background: isDark ? "#000000" : colors.background,
			card: isDark ? "#1E1E1E" : colors.card,
			text: isDark ? "#FFFFFF" : colors.text,
			border: isDark ? "#2A2A2A" : colors.border,
			primary: colors.accent,
		},
	};

	return (
		<>
			<NavigationThemeProvider value={navigationTheme}>
				{children}
			</NavigationThemeProvider>
			<StatusBar style={isDark ? "light" : "dark"} />
		</>
	);
}

export default function RootLayout() {
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (process.env.EXPO_PUBLIC_TEMPO && Platform.OS === "web") {
			const { TempoDevtools } = require("tempo-devtools");
			TempoDevtools.init();
		}
	}, []);

	useEffect(() => {
		// Check if the user is authenticated
		const checkUser = async () => {
			try {
				// Clear any invalid mock user data from AsyncStorage
				const userData = await AsyncStorage.getItem('current_user');
				if (userData) {
					const parsedUser = JSON.parse(userData);
					// If the user ID is not in UUID format, clear it
					if (parsedUser.id && typeof parsedUser.id === 'string' && !parsedUser.id.includes('-')) {
						await AsyncStorage.removeItem('current_user');
						console.log('Cleared invalid mock user data from AsyncStorage');
					}
				}
				
				const session = await getSession();
				setUser(session?.user || null);
				setIsLoading(false);
			} catch (error) {
				console.error("Error checking auth:", error);
				setUser(null);
				setIsLoading(false);
			}
		};

		checkUser();

		// Set up auth state listener
		const { data: authListener } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				setUser(session?.user || null);
			}
		);

		return () => {
			if (authListener && authListener.subscription) {
				authListener.subscription.unsubscribe();
			}
		};
	}, []);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	// Use the custom hook to protect routes
	useProtectedRoute(user);

	if (!loaded || isLoading) {
		return <Slot />;
	}

	return (
		<ThemeProvider>
			<ThemedApp>
				{/* Handle all navigation through Stack */}
				<Stack
					screenOptions={{
						headerShown: false,
						// Speed up navigation between screens
						animation: "slide_from_right",
						animationDuration: 100,
						// Disable gestureEnabled to prevent unwanted interactions
						gestureEnabled: false,
						// These options help with performance
						animationTypeForReplace: "push",
						presentation: "card",
					}}
				>
					{/* Auth screens */}
					<Stack.Screen
						name="welcome"
						options={{
							headerShown: false,
							gestureEnabled: false,
						}}
					/>
					<Stack.Screen
						name="signin"
						options={{
							headerShown: true,
							headerTitle: "Sign In",
							gestureEnabled: false,
							// Fix navigation between auth screens
							animation: "slide_from_right",
						}}
					/>
					<Stack.Screen
						name="signup"
						options={{
							headerShown: true,
							headerTitle: "Sign Up",
							gestureEnabled: false,
							// Fix navigation between auth screens
							animation: "slide_from_right",
						}}
					/>
					{/* Main app screens */}
					<Stack.Screen name="index" options={{ headerShown: false }} />
					<Stack.Screen name="plan/index" options={{ headerShown: false }} />
					<Stack.Screen
						name="progress/index"
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="settings/index"
						options={{ headerShown: false }}
					/>
					{/* Settings sub-screens */}
					<Stack.Screen
						name="settings/profile"
						options={{ headerShown: true }}
					/>
					<Stack.Screen
						name="settings/privacy"
						options={{ headerShown: true }}
					/>
					<Stack.Screen
						name="settings/notifications"
						options={{ headerShown: true }}
					/>
					<Stack.Screen
						name="settings/devices"
						options={{ headerShown: true }}
					/>
					<Stack.Screen
						name="settings/help"
						options={{ headerShown: true }}
					/>
					<Stack.Screen
						name="nutrition/index"
						options={{ headerShown: false }}
					/>
					<Stack.Screen
						name="app/reset-password"
						options={{
							headerShown: true,
							headerTitle: "Reset Password",
							gestureEnabled: true,
							animation: "slide_from_right"
						}}
					/>
					<Stack.Screen
						name="app/reset-password-confirmation"
						options={{
							headerShown: true,
							headerTitle: "Create New Password",
							gestureEnabled: false,
							animation: "slide_from_right"
						}}
					/>
				</Stack>
			</ThemedApp>
		</ThemeProvider>
	);
}
