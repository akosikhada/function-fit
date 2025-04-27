import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions,
  BackHandler,
  StyleSheet,
} from "react-native";
import { Stack, router } from "expo-router";
import { signIn } from "./utils/auth";
import Toast from "./components/Toast";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      try {
        // Check if there's a navigation history
        if (router.canGoBack()) {
          // Go back to previous screen (which could be signup or welcome)
          router.back();
        } else {
          // Default fallback to welcome screen
          router.replace("/welcome");
        }
        return true;
      } catch (error) {
        // Fallback to welcome screen if there's an error
        router.replace("/welcome");
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // Fix for status bar flash when navigating
  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
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
    // Use push instead of replace for consistent navigation
    router.push("/signup");
  };

  const navigateToResetPassword = () => {
    router.push("/app/reset-password" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Gradient */}
      <LinearGradient
        colors={["#eef2ff", "#e0e7ff", "#ede9fe"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Background Decorative Elements */}
      <View style={styles.decorations}>
        {/* Top-right decorative element */}
        <Animated.View
          entering={FadeIn.duration(800).delay(100)}
          style={[styles.decorativeBox, styles.topRightBox]}
        />

        {/* Bottom-left decorative element */}
        <Animated.View
          entering={FadeIn.duration(800).delay(300)}
          style={[styles.decorativeBox, styles.bottomLeftBox]}
        />
      </View>

      {/* Main Compact Form */}
      <View style={styles.formWrapper}>
        <Animated.View
          entering={FadeInDown.duration(700).delay(200)}
          style={styles.formContainer}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your fitness journey
            </Text>
          </View>

          {/* Compact Input Fields */}
          <View style={styles.inputsContainer}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Mail size={18} color="#6366f1" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Lock size={18} color="#6366f1" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.toggleIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#6366f1" />
                  ) : (
                    <Eye size={18} color="#6366f1" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={navigateToResetPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#6366f1", "#4f46e5"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToSignUp}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  decorations: {
    position: "absolute",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  decorativeBox: {
    position: "absolute",
    borderRadius: 24,
  },
  topRightBox: {
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    transform: [{ rotate: "30deg" }],
  },
  bottomLeftBox: {
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    transform: [{ rotate: "30deg" }],
  },
  formWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },
  inputsContainer: {
    marginBottom: 16,
    width: "100%",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 6,
    paddingLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    height: 50,
    marginBottom: 12,
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#1f2937",
    fontSize: 15,
    paddingRight: 16,
  },
  toggleIcon: {
    padding: 12,
  },
  forgotContainer: {
    alignSelf: "flex-end",
    marginBottom: 8,
    marginTop: 4,
  },
  forgotText: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "500",
  },
  signInButton: {
    height: 50,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    width: "100%",
    shadowColor: "#4338ca",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  signInButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signUpText: {
    fontSize: 14,
    color: "#6b7280",
  },
  signUpLink: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "600",
  },
});
