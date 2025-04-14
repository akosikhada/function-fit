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
import { Stack, router, useLocalSearchParams } from "expo-router";
import Toast from "./components/Toast";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { supabase } from "./utils/supabase";

export default function ResetPasswordConfirmationScreen() {
  const params = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      router.push("/signin" as any);
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

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showErrorToast("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorToast("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      showErrorToast("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      Alert.alert(
        "Password Updated",
        "Your password has been successfully updated.",
        [{ text: "Sign In", onPress: () => router.push("/signin" as any) }]
      );
    } catch (error) {
      showErrorToast((error as Error).message || "Failed to update password");
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
          headerTitle: "Create New Password",
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
              Create New Password
            </Text>
            <Text className="text-gray-600">
              Your new password must be different from previously used passwords
            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-gray-600 mb-2">New Password</Text>
              <View className="relative">
                <View className="absolute left-4 top-4 z-10">
                  <Lock size={20} color="#6B7280" />
                </View>
                <TextInput
                  className="bg-gray-50 p-4 pl-12 pr-12 rounded-lg text-gray-800"
                  placeholder="Enter new password"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  className="absolute right-4 top-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text className="text-gray-600 mb-2">Confirm Password</Text>
              <View className="relative">
                <View className="absolute left-4 top-4 z-10">
                  <Lock size={20} color="#6B7280" />
                </View>
                <TextInput
                  className="bg-gray-50 p-4 pl-12 pr-12 rounded-lg text-gray-800"
                  placeholder="Confirm new password"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            className="bg-indigo-600 py-4 rounded-lg items-center mt-8"
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Update Password
              </Text>
            )}
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
