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
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(!isActive);
  const animatedValue = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation for the progress circle
  const circumference = 2 * Math.PI * 50; // radius is 50
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, duration],
    outputRange: [circumference, 0],
    extrapolate: "clamp",
  });

  useEffect(() => {
    // Start or reset animation when duration changes
    animatedValue.setValue(timeLeft);
    setTimeLeft(duration);
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
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View className="items-center justify-center">
      <View className="relative w-64 h-64 items-center justify-center">
        {/* Background Circle */}
        <View className="absolute w-64 h-64 rounded-full bg-indigo-100" />

        {/* Timer Text */}
        <Text className="text-4xl font-bold text-indigo-600">
          {formatTime(timeLeft)}
        </Text>

        {/* Controls */}
        <View className="absolute bottom-0 w-full flex-row justify-center space-x-8 mb-4">
          <TouchableOpacity
            onPress={handleToggle}
            className="bg-white rounded-full w-12 h-12 items-center justify-center shadow-md"
          >
            {isPaused ? (
              <Play size={24} color="#4F46E5" />
            ) : (
              <Pause size={24} color="#4F46E5" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            className="bg-white rounded-full w-12 h-12 items-center justify-center shadow-md"
          >
            <SkipForward size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default WorkoutTimer;
