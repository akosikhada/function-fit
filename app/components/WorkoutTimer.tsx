import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Play, Pause, SkipForward } from "lucide-react-native";

interface WorkoutTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
  isActive?: boolean;
  onToggle?: () => void;
}

const WorkoutTimer = ({
  duration = 45,
  onComplete,
  isActive = false,
  onToggle,
}: WorkoutTimerProps) => {
  // Ensure duration is a valid number
  const validDuration =
    typeof duration === "number" && !isNaN(duration) && duration > 0
      ? Math.floor(duration) // Ensure it's an integer
      : 45; // Default to 45 seconds if invalid

  const [timeLeft, setTimeLeft] = useState(validDuration);
  const [isPaused, setIsPaused] = useState(!isActive);
  const animatedValue = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation for the progress circle
  const circumference = 2 * Math.PI * 50; // radius is 50
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, validDuration],
    outputRange: [circumference, 0],
    extrapolate: "clamp",
  });

  useEffect(() => {
    // Reset when duration changes
    const newDur =
      typeof duration === "number" && !isNaN(duration) && duration > 0
        ? Math.floor(duration)
        : 45;

    // Update animation and time left
    animatedValue.setValue(newDur);
    setTimeLeft(newDur);
  }, [duration]);

  useEffect(() => {
    setIsPaused(!isActive);
  }, [isActive]);

  useEffect(() => {
    if (!isPaused) {
      // Start the timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Timer complete
            clearInterval(timerRef.current as NodeJS.Timeout);
            onComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      // Start the animation
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: timeLeft * 1000,
        useNativeDriver: true,
      }).start();
    } else {
      // Pause the timer and animation
      clearInterval(timerRef.current as NodeJS.Timeout);
      animatedValue.stopAnimation();
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, timeLeft]);

  const handleToggle = () => {
    setIsPaused(!isPaused);
    if (onToggle) {
      onToggle();
    }
  };

  const handleSkip = () => {
    // Skip to the end of the timer
    clearInterval(timerRef.current as NodeJS.Timeout);
    onComplete();
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View className="items-center justify-center">
      {/* Timer Circle */}
      <View className="relative w-64 h-64 items-center justify-center">
        {/* Background Circle */}
        <View className="absolute w-64 h-64 rounded-full bg-indigo-100" />

        {/* Animated Progress Circle */}
        <Animated.View
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: 100,
            borderWidth: 8,
            borderColor: "#4F46E5",
            opacity: 0.8,
            transform: [
              {
                rotate: animatedValue.interpolate({
                  inputRange: [0, validDuration],
                  outputRange: ["0deg", "360deg"],
                  extrapolate: "clamp",
                }),
              },
            ],
          }}
        />

        {/* Timer Text */}
        <Text className="text-4xl font-bold text-indigo-600">
          {formatTime(timeLeft)}
        </Text>
      </View>

      {/* Controls - Now moved below the timer circle */}
      <View className="flex-row justify-center space-x-12 mt-6">
        <TouchableOpacity
          onPress={handleToggle}
          className="bg-white rounded-full w-14 h-14 items-center justify-center shadow-md ml-20"
        >
          {isPaused ? (
            <Play size={28} color="#4F46E5" />
          ) : (
            <Pause size={28} color="#4F46E5" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          className="bg-white rounded-full w-14 h-14 items-center justify-center shadow-md ml-5"
        >
          <SkipForward size={28} color="#4F46E5" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WorkoutTimer;
