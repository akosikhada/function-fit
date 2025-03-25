import React, { useCallback } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	useWindowDimensions,
} from "react-native";
import { router, usePathname } from "expo-router";
import { Home, Dumbbell, BarChart, Settings } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface BottomNavigationProps {
	activeTab: string;
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
	const pathname = usePathname();
	const { width } = useWindowDimensions();
	const isSmallDevice = width < 380;

	// Adjust sizes based on device width
	const iconSize = isSmallDevice ? 18 : 20;
	const textSize = isSmallDevice ? "text-[10px]" : "text-xs";
	const paddingY = isSmallDevice ? "py-1" : "py-2";

	// Define tabs with icons and routes
	const tabs = [
		{ name: "home", icon: Home, label: "Home", route: "/" as const },
		{ name: "plan", icon: Dumbbell, label: "Plan", route: "/plan" as const },
		{
			name: "progress",
			icon: BarChart,
			label: "Progress",
			route: "/progress" as const,
		},
		{
			name: "settings",
			icon: Settings,
			label: "Settings",
			route: "/settings" as const,
		},
	];

	// Handle tab press
	const handleTabPress = useCallback((tabName: string, route: string) => {
		// Only navigate if we're changing routes
		if (pathname !== route) {
			// Using switch case to ensure proper type safety with the router
			switch(route) {
				case "/":
					router.push("/");
					break;
				case "/plan":
					router.push("/plan");
					break;
				case "/progress":
					router.push("/progress");
					break;
				case "/settings":
					router.push("/settings");
					break;
			}
		}
	}, [pathname]);

	return (
		<View className="bg-white border-t border-gray-200">
			<View className="flex-row justify-around">
				{tabs.map((tab) => {
					const isActive = activeTab === tab.name;
					const TabIcon = tab.icon;

					return (
						<TouchableOpacity
							key={tab.name}
							className={`items-center ${paddingY} pt-3 flex-1`}
							onPress={() => handleTabPress(tab.name, tab.route)}
						>
							<TabIcon
								size={iconSize}
								color={isActive ? "#8B5CF6" : "#6B7280"}
								strokeWidth={2}
							/>
							<Text
								className={`${textSize} mt-1 ${
									isActive ? "text-indigo-500 font-medium" : "text-gray-500"
								}`}
							>
								{tab.label}
							</Text>
							{isActive && (
								<View className="absolute -bottom-0 w-12 h-[3px] bg-indigo-500 rounded-t-full" />
							)}
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
}
