import React, { useEffect, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { X } from "lucide-react-native";

interface ToastProps {
	message: string;
	type?: "error" | "success" | "info";
	visible: boolean;
	onDismiss: () => void;
	duration?: number;
}

const Toast: React.FC<ToastProps> = ({
	message,
	type = "error",
	visible,
	onDismiss,
	duration = 5000,
}) => {
	const [fadeAnim] = useState(new Animated.Value(0));

	useEffect(() => {
		if (visible) {
			// Fade in animation
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}).start();

			// Auto dismiss after duration
			const timer = setTimeout(() => {
				handleDismiss();
			}, duration);

			return () => clearTimeout(timer);
		}
	}, [visible]);

	const handleDismiss = () => {
		// Fade out animation
		Animated.timing(fadeAnim, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true,
		}).start(() => {
			onDismiss();
		});
	};

	// Different background colors based on type
	const getBackgroundColor = () => {
		switch (type) {
			case "success":
				return "bg-green-500";
			case "info":
				return "bg-blue-500";
			case "error":
			default:
				return "bg-red-500";
		}
	};

	if (!visible) return null;

	return (
		<Animated.View
			style={{ opacity: fadeAnim }}
			className={`absolute bottom-8 left-5 right-5 ${getBackgroundColor()} rounded-lg p-4 mx-4 flex-row justify-between items-center z-50`}
		>
			<Text className="text-white flex-1">{message}</Text>
			<TouchableOpacity onPress={handleDismiss} className="ml-2">
				<X size={20} color="#fff" />
			</TouchableOpacity>
		</Animated.View>
	);
};

export default Toast;
