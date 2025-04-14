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
  BackHandler,
  Alert,
} from "react-native";
import { Stack, router } from "expo-router";
import { resetPassword } from "../utils/auth";
import Toast from "../components/Toast";
import { Mail } from "lucide-react-native";

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      router.back();
      return true;
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
      StatusBar.setBackgroundColor("white");
    }
  }, []);

  const showErrorToast = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const handleResetPassword = async () => {
    if (!email) {
      showErrorToast("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      const { success } = await resetPassword(email);
      if (success) {
        // For development testing, provide a direct way to reset password
        Alert.alert(
          "Password Reset Email Sent",
          "For development testing: Click 'Continue' to proceed directly to the password reset screen instead of using the email link.",
          [
            { text: "OK", style: "cancel" },
            { 
              text: "Continue to Reset", 
              onPress: () => router.push({
                pathname: "/app/reset-password-confirmation" as any,
                params: { email, dev_reset: "true" }
              })
            }
          ]
        );
      }
    } catch (error) {
      showErrorToast((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-indigo-50">
      <StatusBar barStyle="dark-content" backgroundColor="#eef2ff" />
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTitle: "Reset Password",
          headerTintColor: "#4F46E5",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#eef2ff" }
        }} 
      />

      {/* Background Boxes */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute -right-20 -top-20 w-80 h-80 rotate-12 bg-indigo-500/20 rounded-3xl" />
        <View className="absolute -right-10 -top-10 w-60 h-60 -rotate-12 bg-indigo-600/25 rounded-3xl" />
        <View className="absolute right-1/4 top-1/3 w-40 h-40 rotate-45 bg-indigo-400/15 rounded-2xl" />
        <View className="absolute -left-20 -bottom-20 w-72 h-72 rotate-12 bg-indigo-600/20 rounded-3xl" />
      </View>

      <View className="flex-1 px-8 pt-6 justify-center">
        {/* Card Container */}
        <View className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50">
          <View className="mb-8">
            <Text className="text-2xl font-bold text-gray-900 mb-3">
              Forgot Your Password?
            </Text>
            <Text className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-gray-600 mb-2">Email Address</Text>
              <View className="relative">
                <View className="absolute left-4 top-4 z-10">
                  <Mail size={20} color="#6B7280" />
                </View>
                <TextInput
                  className="bg-gray-50 p-4 pl-12 rounded-lg text-gray-800"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            className="bg-indigo-600 py-4 rounded-lg items-center mt-8"
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Send Reset Link
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            className="mt-6 items-center"
            onPress={() => router.push("/signin" as any)}
          >
            <Text className="text-indigo-600 font-medium">
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Toast
        message={errorMessage}
        visible={showError}
        onDismiss={() => setShowError(false)}
        type="error"
      />
    </SafeAreaView>
  );
}
