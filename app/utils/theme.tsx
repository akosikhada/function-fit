import { useColorScheme } from "react-native";
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define theme types
export type ThemeType = "light" | "dark";

// Define color schemes
export const lightTheme = {
	background: "#F9FAFB",
	card: "#FFFFFF",
	text: "#111827",
	secondaryText: "#6B7280",
	accent: "#8B5CF6",
	border: "#E5E7EB",
	statusBar: "dark-content",
	// Add more colors as needed
};

export const darkTheme = {
	background: "#000000",
	card: "#1E1E1E",
	text: "#FFFFFF",
	secondaryText: "#9CA3AF",
	accent: "#8B5CF6",
	border: "#2A2A2A",
	statusBar: "light-content",
	// Add more colors as needed
};

// Create theme context
type ThemeContextType = {
	theme: ThemeType;
	colors: typeof lightTheme;
	setTheme: (theme: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextType>({
	theme: "light",
	colors: lightTheme,
	setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const deviceTheme = useColorScheme() || "light";
	const [theme, setThemeState] = useState<ThemeType>(deviceTheme as ThemeType);
	const [colors, setColors] = useState(
		deviceTheme === "dark" ? darkTheme : lightTheme
	);

	// Load saved theme preference on component mount
	useEffect(() => {
		const loadThemePreference = async () => {
			try {
				const savedTheme = await AsyncStorage.getItem("themePreference");
				if (savedTheme) {
					setThemeState(savedTheme as ThemeType);
				} else {
					// Set initial theme based on device
					setThemeState(deviceTheme as ThemeType);
				}
			} catch (error) {
				console.error("Error loading theme preferences:", error);
			}
		};

		loadThemePreference();
	}, []);

	// Update colors whenever theme changes
	useEffect(() => {
		setColors(theme === "dark" ? darkTheme : lightTheme);
	}, [theme]);

	// Function to set theme and save to storage
	const setTheme = async (newTheme: ThemeType) => {
		try {
			await AsyncStorage.setItem("themePreference", newTheme);
			setThemeState(newTheme);
		} catch (error) {
			console.error("Error saving theme preference:", error);
		}
	};

	return (
		<ThemeContext.Provider value={{ theme, colors, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

// Helper function to apply theme styles
export const applyThemeStyles = (isDark: boolean) => {
	return isDark ? darkTheme : lightTheme;
};

// Get current theme colors
export const getCurrentTheme = (theme: ThemeType): typeof lightTheme => {
	return theme === "dark" ? darkTheme : lightTheme;
};

// Add a default export that re-exports the ThemeProvider component
const ThemeModule = {
	ThemeProvider,
	useTheme,
	lightTheme,
	darkTheme,
};

export default ThemeModule;
