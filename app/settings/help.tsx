import React from "react";
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Linking } from "react-native";
import { Stack, router } from "expo-router";
import { ChevronLeft, HelpCircle, Mail, MessageCircle, FileText, ExternalLink } from "lucide-react-native";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

export default function HelpSupportScreen() {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === "dark";

  const supportOptions = [
    {
      title: "Contact Support",
      description: "Get help from our support team",
      icon: Mail,
      action: () => Linking.openURL("mailto:support@functionfit.app"),
    },
    {
      title: "FAQs",
      description: "Browse frequently asked questions",
      icon: FileText,
      action: () => alert("FAQs will be available in a future update"),
    },
    {
      title: "Chat with Us",
      description: "Start a live chat with our team",
      icon: MessageCircle,
      action: () => alert("Live chat will be available in a future update"),
    },
    {
      title: "Visit Our Website",
      description: "Find more resources on our website",
      icon: ExternalLink,
      action: () => Linking.openURL("https://functionfit.app"),
    },
  ];

  return (
    <SafeAreaView 
      style={{ backgroundColor: colors.background }} 
      className="flex-1"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Help & Support",
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
          className="rounded-xl p-4 mb-6"
        >
          <View className="flex-row items-center mb-2">
            <HelpCircle size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} className="mr-2" />
            <Text style={{ color: colors.text }} className="text-lg font-medium">
              How Can We Help?
            </Text>
          </View>
          <Text style={{ color: colors.secondaryText }} className="mb-2">
            Select an option below to get the support you need.
          </Text>
        </View>
        
        {/* Support options */}
        {supportOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={{ backgroundColor: colors.card }}
            className="rounded-xl p-4 mb-3 flex-row items-center"
            onPress={option.action}
          >
            <View 
              className="w-10 h-10 rounded-full justify-center items-center mr-3"
              style={{ backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)' }}
            >
              <option.icon size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.text }} className="font-medium">
                {option.title}
              </Text>
              <Text style={{ color: colors.secondaryText }} className="text-xs">
                {option.description}
              </Text>
            </View>
            <ChevronLeft size={16} color={colors.secondaryText} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ))}
        
        <Text style={{ color: colors.secondaryText }} className="text-xs text-center mt-6">
          App Version: 2.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
} 