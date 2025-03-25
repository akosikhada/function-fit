import React, { useEffect } from "react";
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	SafeAreaView,
	StatusBar,
	Platform,
} from "react-native";
import { router } from "expo-router";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withDelay,
	withSpring,
	FadeIn,
	FadeInDown,
	FadeInUp,
	Easing,
	interpolate,
} from "react-native-reanimated";

export default function WelcomeScreen() {
	// Animation values for box.png (sliding in from left)
	const boxTranslateX = useSharedValue(-100);
	const boxOpacity = useSharedValue(0);
	const boxRotate = useSharedValue(-180); // Start rotated

	// Animation values for box1.png (sliding in from right)
	const box1TranslateX = useSharedValue(100);
	const box1Opacity = useSharedValue(0);
	const box1Rotate = useSharedValue(180); // Start rotated in opposite direction

	// Animation values for text elements to control their separate animations
	const appNameOpacity = useSharedValue(0);
	const taglineOpacity = useSharedValue(0);

	// Animation values for Frame image
	const frameScale = useSharedValue(0.6);
	const frameOpacity = useSharedValue(0);
	const frameRotate = useSharedValue(10);

	// Fix for status bar flash - ensure the status bar is set correctly when component mounts
	useEffect(() => {
		StatusBar.setBarStyle("dark-content");
		if (Platform.OS === "android") {
			StatusBar.setBackgroundColor("white");
		}

		return () => {
			// Cleanup if needed
		};
	}, []);

	useEffect(() => {
		// Animation configuration for smoother motion
		const timing = {
			duration: 1500,
			easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Custom bezier curve for smooth motion
		};

		const springConfig = {
			damping: 15, // Increased for smoother stop
			stiffness: 80, // Reduced for less aggressive movement
			mass: 1.2, // Slightly more weight for smoother motion
			overshootClamping: false,
		};

		// Step 1: First boxes slide in from opposite directions with rolling effect
		boxTranslateX.value = withDelay(300, withSpring(0, springConfig));
		boxOpacity.value = withDelay(300, withTiming(1, { duration: 1000 }));
		boxRotate.value = withDelay(300, withTiming(0, timing));

		box1TranslateX.value = withDelay(300, withSpring(0, springConfig));
		box1Opacity.value = withDelay(300, withTiming(1, { duration: 1000 }));
		box1Rotate.value = withDelay(300, withTiming(0, timing));

		// Step 2: App name appears after boxes are in place
		appNameOpacity.value = withDelay(
			1800,
			withTiming(1, {
				duration: 800,
				easing: Easing.bezier(0.25, 0.1, 0.25, 1),
			})
		);

		// Step 3: Tagline appears after app name
		taglineOpacity.value = withDelay(
			2600,
			withTiming(1, {
				duration: 800,
				easing: Easing.bezier(0.25, 0.1, 0.25, 1),
			})
		);

		// Step 4: Frame animates in with a unique effect
		frameOpacity.value = withDelay(
			3400,
			withTiming(1, {
				duration: 1200,
				easing: Easing.bezier(0.25, 0.1, 0.25, 1),
			})
		);

		// Scale up with a spring effect
		frameScale.value = withDelay(
			3400,
			withSpring(1, {
				damping: 12,
				stiffness: 70,
				mass: 1.5,
				overshootClamping: false,
			})
		);

		// Rotate slightly as it appears
		frameRotate.value = withDelay(
			3400,
			withTiming(0, {
				duration: 1500,
				easing: Easing.elastic(1.5),
			})
		);
	}, []);

	// Animation style for box.png
	const boxAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: boxOpacity.value,
			transform: [
				{ translateX: boxTranslateX.value },
				{ rotate: `${boxRotate.value}deg` },
			],
		};
	});

	// Animation style for box1.png
	const box1AnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: box1Opacity.value,
			transform: [
				{ translateX: box1TranslateX.value },
				{ rotate: `${box1Rotate.value}deg` },
			],
		};
	});

	// Animation style for app name
	const appNameStyle = useAnimatedStyle(() => {
		return {
			opacity: appNameOpacity.value,
		};
	});

	// Animation style for tagline
	const taglineStyle = useAnimatedStyle(() => {
		return {
			opacity: taglineOpacity.value,
		};
	});

	// Frame animation style
	const frameAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: frameOpacity.value,
			transform: [
				{ scale: frameScale.value },
				{ rotate: `${frameRotate.value}deg` },
			],
		};
	});

	const handleGetStarted = () => {
		// Use replace for faster navigation
		router.replace("/signup");
	};

	const handleSignIn = () => {
		// Use replace for faster navigation
		router.replace("/signin");
	};

	return (
		<SafeAreaView className="flex-1 bg-white">
			<StatusBar barStyle="dark-content" backgroundColor="white" />
			<View className="flex-1 justify-center items-center px-6 pb-10">
				{/* Top spacer */}
				<View className="h-10" />

				{/* Logo */}
				<View className="items-center justify-center relative mt-8">
					<Animated.View style={boxAnimatedStyle} className="absolute">
						<Image
							source={require("../assets/images/box.png")}
							className="w-30 h-30"
							resizeMode="contain"
						/>
					</Animated.View>

					<Animated.View style={box1AnimatedStyle}>
						<Image
							source={require("../assets/images/box1.png")}
							className="w-30 h-30"
							resizeMode="contain"
						/>
					</Animated.View>
				</View>

				{/* App title and tagline */}
				<View className="items-center justify-center mt-8">
					<Animated.View style={appNameStyle} className="flex-row">
						<Text className="text-3xl font-bold text-black text-center">
							Function
						</Text>
						<Text className="text-3xl font-bold text-indigo-500 text-center">
							Fit
						</Text>
					</Animated.View>
					<Animated.Text
						style={taglineStyle}
						className="text-base text-gray-600 mt-2 text-center"
					>
						Your Journey to Better Health Starts Here
					</Animated.Text>
				</View>

				{/* Main illustration with custom animation */}
				<View className="items-center justify-center my-10 flex-1">
					<Animated.View style={frameAnimatedStyle}>
						<Image
							source={require("../assets/images/FRAME.png")}
							className="w-80 h-80"
							resizeMode="contain"
						/>
					</Animated.View>
				</View>

				{/* Buttons */}
				<Animated.View
					className="w-full mt-auto"
					entering={FadeInUp.duration(800).delay(4400)}
				>
					<TouchableOpacity
						className="bg-indigo-500 py-4 rounded-full items-center"
						onPress={handleGetStarted}
						activeOpacity={0.7}
					>
						<Text className="text-white font-semibold text-lg">
							Get Started
						</Text>
					</TouchableOpacity>

					<View className="flex-row justify-center items-center mt-4">
						<Text className="text-gray-600">Already have an account?</Text>
						<TouchableOpacity onPress={handleSignIn}>
							<Text className="text-indigo-600 font-semibold ml-1">
								Sign In
							</Text>
						</TouchableOpacity>
					</View>
				</Animated.View>

				{/* Bottom line indicator */}
				<Animated.View
					className="w-10 h-1 bg-gray-800 rounded-full mt-6"
					entering={FadeIn.duration(600).delay(5000)}
				/>
			</View>
		</SafeAreaView>
	);
}
