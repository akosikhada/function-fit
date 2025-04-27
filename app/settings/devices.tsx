import React from "react";
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image, Platform } from "react-native";
import { Stack, router } from "expo-router";
import { ChevronLeft, Smartphone, PlusCircle } from "lucide-react-native";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

export default function DevicesSettings() {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <SafeAreaView 
      style={{ backgroundColor: colors.background }} 
      className="flex-1"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Connected Devices",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              className="ml-2"
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView 
        style={{ backgroundColor: colors.background }}
        className="flex-1 px-4 py-6"
      >
        <View 
          style={{ backgroundColor: colors.card }}
          className="rounded-xl p-4 mb-4"
        >
          <View className="flex-row items-center mb-2">
            <Smartphone size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} className="mr-2" />
            <Text style={{ color: colors.text }} className="text-lg font-medium">
              Connected Devices
            </Text>
          </View>
          <Text style={{ color: colors.secondaryText }} className="mb-4">
            Manage wearables and other devices connected to Function Fit.
          </Text>
        </View>
        
        {/* Current device section */}
        <View 
          style={{ backgroundColor: colors.card }}
          className="rounded-xl p-4 mb-4"
        >
          <Text style={{ color: colors.text }} className="font-medium mb-3">Current Device</Text>
          <View className="flex-row items-center">
            <View 
              className="w-12 h-12 rounded-full justify-center items-center mr-3"
              style={{ backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)' }}
            >
              <Smartphone size={24} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
            </View>
            <View>
              <Text style={{ color: colors.text }} className="font-medium">
                {Platform.OS === 'ios' ? 'iPhone' : 'Android Device'}
              </Text>
              <Text style={{ color: colors.secondaryText }} className="text-xs">
                This device • Active now
              </Text>
            </View>
          </View>
        </View>
        
        {/* Connect new device button */}
        <TouchableOpacity 
          style={{ backgroundColor: colors.card }}
          className="rounded-xl p-4 flex-row items-center justify-center"
          onPress={() => {
            // This would open a flow to connect a new device
            alert("Connect new device functionality will be implemented in a future update.");
          }}
        >
          <PlusCircle size={18} color={isDarkMode ? "#8B5CF6" : "#6366F1"} className="mr-2" />
          <Text style={{ color: isDarkMode ? "#8B5CF6" : "#6366F1" }} className="font-medium">
            Connect New Device
          </Text>
        </TouchableOpacity>
        
        <Text style={{ color: colors.secondaryText }} className="text-xs text-center mt-6">
          Connecting devices allows Function Fit to sync your workout and activity data.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
} 