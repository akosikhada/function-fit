import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface CircularProgressIndicatorProps {
  size?: number;
  progress?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  value?: string;
}

const CircularProgressIndicator = ({
  size = 80,
  progress = 75,
  strokeWidth = 8,
  color = "#4F46E5",
  backgroundColor = "#E0E7FF",
  label = "Steps",
  value = "7,500",
}: CircularProgressIndicatorProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <View className="items-center justify-center">
      <View className="items-center justify-center">
        <Svg width={size} height={size}>
          <Circle
            stroke={backgroundColor}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <Circle
            stroke={color}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
          />
        </Svg>
        <View className="absolute items-center justify-center">
          <Text className="text-sm font-bold text-gray-800">{value}</Text>
        </View>
      </View>
      <Text className="mt-2 text-xs text-gray-600">{label}</Text>
    </View>
  );
};

export default CircularProgressIndicator;
