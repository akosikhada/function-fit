import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  StyleSheet,
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
  withSequence,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  // Animation values for box.png (sliding in from left)
  const boxTranslateX = useSharedValue(-100);
  const boxOpacity = useSharedValue(0);
  const boxRotate = useSharedValue(-180); // Start rotated
  const boxScale = useSharedValue(0.8);

  // Animation values for box1.png (sliding in from right)
  const box1TranslateX = useSharedValue(100);
  const box1Opacity = useSharedValue(0);
  const box1Rotate = useSharedValue(180); // Start rotated in opposite direction
  const box1Scale = useSharedValue(0.8);

  // Animation values for text elements to control their separate animations
  const appNameOpacity = useSharedValue(0);
  const appNameTranslateY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(15);

  // Animation values for Frame image
  const frameScale = useSharedValue(0.6);
  const frameOpacity = useSharedValue(0);
  const frameRotate = useSharedValue(10);

  // Background gradient animation
  const gradientOpacity = useSharedValue(0);

  // Button animations
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.95);
  const signInOpacity = useSharedValue(0);

  // Fix for status bar flash - ensure the status bar is set correctly when component mounts
  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  useEffect(() => {
    // Animation configuration for smoother motion
    const timing = {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    };

    const springConfig = {
      damping: 14,
      stiffness: 80,
      mass: 1.2,
      overshootClamping: false,
    };

    // Background gradient fades in first
    gradientOpacity.value = withTiming(1, { duration: 800 });

    // Step 1: First boxes slide in from opposite directions with rolling effect and subtle scale
    boxTranslateX.value = withDelay(300, withSpring(0, springConfig));
    boxOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    boxRotate.value = withDelay(300, withTiming(0, timing));
    boxScale.value = withDelay(300, withSpring(1, springConfig));

    box1TranslateX.value = withDelay(300, withSpring(0, springConfig));
    box1Opacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    box1Rotate.value = withDelay(300, withTiming(0, timing));
    box1Scale.value = withDelay(300, withSpring(1, springConfig));

    // Step 2: App name appears with subtle upward movement
    appNameOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
    appNameTranslateY.value = withDelay(1000, withTiming(0, timing));

    // Step 3: Tagline appears after app name with subtle upward movement
    taglineOpacity.value = withDelay(1300, withTiming(1, { duration: 600 }));
    taglineTranslateY.value = withDelay(1300, withTiming(0, timing));

    // Step 4: Frame animates in with a unique effect
    frameOpacity.value = withDelay(1600, withTiming(1, { duration: 1000 }));

    // Scale up with a spring effect and subtle bounce
    frameScale.value = withDelay(
      1600,
      withSpring(1, {
        damping: 12,
        stiffness: 70,
        mass: 1.5,
        overshootClamping: false,
      })
    );

    // Rotate slightly as it appears with a subtle wobble effect
    frameRotate.value = withDelay(
      1600,
      withSequence(
        withTiming(0, { duration: 1000 }),
        withTiming(-2, { duration: 200 }),
        withTiming(0, { duration: 200 })
      )
    );

    // Button animations
    buttonOpacity.value = withDelay(2000, withTiming(1, { duration: 600 }));
    buttonScale.value = withDelay(2000, withSpring(1, springConfig));
    signInOpacity.value = withDelay(2200, withTiming(1, { duration: 600 }));
  }, []);

  // Animation style for box.png
  const boxAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: boxOpacity.value,
      transform: [
        { translateX: boxTranslateX.value },
        { rotate: `${boxRotate.value}deg` },
        { scale: boxScale.value },
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
        { scale: box1Scale.value },
      ],
    };
  });

  // Animation style for app name
  const appNameStyle = useAnimatedStyle(() => {
    return {
      opacity: appNameOpacity.value,
      transform: [{ translateY: appNameTranslateY.value }],
    };
  });

  // Animation style for tagline
  const taglineStyle = useAnimatedStyle(() => {
    return {
      opacity: taglineOpacity.value,
      transform: [{ translateY: taglineTranslateY.value }],
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

  // Gradient background animation
  const gradientStyle = useAnimatedStyle(() => {
    return {
      opacity: gradientOpacity.value,
    };
  });

  // Button animations
  const buttonStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ scale: buttonScale.value }],
    };
  });

  const signInStyle = useAnimatedStyle(() => {
    return {
      opacity: signInOpacity.value,
    };
  });

  const handleGetStarted = () => {
    // Use push for proper navigation history
    router.push("/signup");
  };

  const handleSignIn = () => {
    // Use push for proper navigation history
    router.push("/signin");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Animated background gradient */}
      <Animated.View style={[styles.gradientContainer, gradientStyle]}>
        <LinearGradient
          colors={["#f7f9ff", "#eef2ff", "#f0f4ff"]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[boxAnimatedStyle, styles.logoImageContainer, { zIndex: 1 }]}
          >
            <Image
              source={require("../assets/images/box.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View style={[box1AnimatedStyle, styles.logoImageContainer]}>
            <Image
              source={require("../assets/images/box1.png")}
              style={styles.logoImage}
              resizeMode="contain"
              className="-z-10"
            />
          </Animated.View>
        </View>

        {/* App title and tagline */}
        <View style={styles.titleContainer}>
          <Animated.View style={[appNameStyle, styles.appNameContainer]}>
            <Text style={styles.appNameFirst}>Function</Text>
            <Text style={styles.appNameSecond}>Fit</Text>
          </Animated.View>

          <Animated.Text style={[taglineStyle, styles.tagline]}>
            Your Journey to Better Health Starts Here
          </Animated.Text>
        </View>

        {/* Main illustration with custom animation */}
        <View style={styles.illustrationContainer}>
          <Animated.View style={frameAnimatedStyle}>
            <Image
              source={require("../assets/images/FRAME.png")}
              style={styles.mainImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Animated.View style={buttonStyle}>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#6366f1", "#4f46e5"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[signInStyle, styles.signInContainer]}>
            <Text style={styles.signInText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={handleSignIn}
              style={styles.signInButton}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.06,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 10 : 10,
    paddingBottom: height * 0.05,
  },
  logoContainer: {
    marginTop: height * 0.04,
    height: height * 0.1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  logoImageContainer: {
    position: "absolute",
  },
  logoImage: {
    width: width * 0.25,
    height: width * 0.25,
  },
  titleContainer: {
    alignItems: "center",
    marginTop: height * 0.02,
  },
  appNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  appNameFirst: {
    fontSize: width * 0.08,
    fontWeight: "bold",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  appNameSecond: {
    fontSize: width * 0.08,
    fontWeight: "bold",
    color: "#4f46e5",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: width * 0.04,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: height * 0.02,
  },
  mainImage: {
    width: width * 0.85,
    height: width * 0.85,
  },
  buttonContainer: {
    width: "100%",
    marginTop: height * 0.02,
  },
  getStartedButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#4338ca",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  getStartedText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  signInText: {
    color: "#64748b",
    fontSize: 16,
  },
  signInButton: {
    marginLeft: 4,
    padding: 4,
  },
  signInButtonText: {
    color: "#4f46e5",
    fontWeight: "600",
    fontSize: 16,
  },
});
