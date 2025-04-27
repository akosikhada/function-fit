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
import { signUp } from "./utils/auth";
import Toast from "./components/Toast";
import {
  Check,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowLeft,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function SignUpScreen() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      try {
        // Get previous route if available
        const previousRoute = router.canGoBack();

        if (previousRoute) {
          // If we can go back in history (came from signin), go back
          router.back();
        } else {
          // Otherwise go to welcome screen
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

  const showSuccessToast = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
  };

  const handleSignUp = async () => {
    // Input validation
    if (!userName || !email || !password || !confirmPassword) {
      showErrorToast("Please fill in all fields");
      return;
    }

    if (userName.length < 3) {
      showErrorToast("Username must be at least 3 characters long");
      return;
    }

    if (password.length < 6) {
      showErrorToast("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      showErrorToast("Passwords do not match");
      return;
    }

    if (!agreeToTerms) {
      showErrorToast("Please agree to the Terms and Privacy Policy");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showErrorToast("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const result = await signUp(email, password, userName);

      if (result.success) {
        // Handle email confirmation if needed
        if (result.needsEmailConfirmation) {
          // Show success toast instead of Alert
          showSuccessToast(
            result.message ||
              "Please check your email to verify your account before signing in."
          );

          // Navigate to sign in after a short delay
          setTimeout(() => {
            router.replace("/signin");
          }, 3000);
        } else {
          // Automatic sign-in worked
          showSuccessToast("Account created successfully!");
          setTimeout(() => {
            router.replace("/");
          }, 1500);
        }
      }
    } catch (error: any) {
      let errorMessage = "Failed to sign up. Please try again.";

      if (error.message?.includes("duplicate key")) {
        if (error.message.includes("users_username_key")) {
          errorMessage = "Username already taken. Please choose another one.";
        } else if (error.message.includes("users_pkey")) {
          errorMessage = "An account with this email already exists.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignIn = () => {
    router.push("/signin");
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join FunctionFit today</Text>
          </View>

          {/* Compact Input Fields */}
          <View style={styles.inputsContainer}>
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <User size={18} color="#6366f1" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="#a1a1aa"
                  value={userName}
                  onChangeText={setUserName}
                />
              </View>
            </View>

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
                  placeholder="Create a password"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.toggleIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.8}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#6366f1" />
                  ) : (
                    <Eye size={18} color="#6366f1" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Lock size={18} color="#6366f1" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.toggleIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.8}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color="#6366f1" />
                  ) : (
                    <Eye size={18} color="#6366f1" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms Agreement */}
            <View style={styles.termsRow}>
              <TouchableOpacity
                onPress={() => setAgreeToTerms(!agreeToTerms)}
                style={styles.checkboxContainer}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreeToTerms && styles.checkboxChecked,
                  ]}
                >
                  {agreeToTerms && (
                    <Check size={14} color="white" strokeWidth={3} />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.signupButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
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
                <Text style={styles.signupButtonText}>Sign Up</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToSignIn} activeOpacity={0.8}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Error Toast */}
      <Toast
        message={errorMessage}
        type="error"
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={5000}
      />

      {/* Success Toast */}
      <Toast
        message={successMessage}
        type="success"
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={5000}
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
    marginBottom: 20,
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
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
    marginBottom: 4,
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  checkboxChecked: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  termsLink: {
    color: "#4f46e5",
    fontWeight: "500",
  },
  signupButton: {
    height: 50,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 16,
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
  signupButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signInText: {
    fontSize: 14,
    color: "#6b7280",
  },
  signInLink: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "600",
  },
});
