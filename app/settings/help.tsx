import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
  Platform,
  Animated,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  ChevronLeft,
  HelpCircle,
  Mail,
  MessageCircle,
  FileText,
  ExternalLink,
  Users,
  Github,
  Linkedin,
} from "lucide-react-native";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

interface Developer {
  name: string;
  role: string;
  github: string;
  linkedin: string;
}

interface SupportOption {
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
}

export default function HelpSupportScreen() {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    // Start animations after component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const supportOptions: SupportOption[] = [
    {
      title: "Contact Support",
      description: "Get help from our support team",
      icon: Mail,
      action: () =>
        alert("Contact support will be available in a future update"),
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
      action: () => alert("Website will be available in a future update"),
    },
  ];

  const developers: Developer[] = [
    {
      name: "Miguel Enrique Dasalla",
      role: "Lead Programmer, Full-Stack Developer",
      github: "https://github.com/akosikhada",
      linkedin: "https://linkedin.com/in/",
    },
    {
      name: "Franz Jeremy Señora",
      role: "Full-Stack Developer",
      github: "https://github.com/znarf-y",
      linkedin: "https://linkedin.com/in/",
    },
  ];

  const SectionHeader = ({
    icon,
    title,
  }: {
    icon: JSX.Element;
    title: string;
  }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <View
        style={{
          backgroundColor: isDarkMode
            ? "rgba(139, 92, 246, 0.15)"
            : "rgba(99, 102, 241, 0.08)",
          padding: 12,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.15 : 0.05,
          shadowRadius: 3,
          elevation: isDarkMode ? 2 : 1,
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: "700",
          marginLeft: 12,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
    </Animated.View>
  );

  const renderSupportOption = (option: SupportOption, index: number) => (
    <Animated.View
      key={index}
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: 12,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.25 : 0.08,
          shadowRadius: 4,
          elevation: isDarkMode ? 3 : 2,
          borderWidth: 1,
          borderColor: isDarkMode
            ? "rgba(255,255,255,0.05)"
            : "rgba(229, 231, 235, 0.8)",
        }}
        onPress={option.action}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isDarkMode
              ? "rgba(139, 92, 246, 0.15)"
              : "rgba(99, 102, 241, 0.08)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDarkMode ? 0.2 : 0.1,
            shadowRadius: 2,
            elevation: isDarkMode ? 2 : 1,
          }}
        >
          <option.icon size={22} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 4,
              letterSpacing: -0.3,
            }}
          >
            {option.title}
          </Text>
          <Text
            style={{
              color: colors.secondaryText,
              fontSize: 14,
              lineHeight: 20,
              letterSpacing: -0.2,
            }}
          >
            {option.description}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: isDarkMode
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.03)",
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft
            size={16}
            color={colors.secondaryText}
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDeveloper = (dev: Developer, index: number) => (
    <Animated.View
      key={index}
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: 12,
      }}
    >
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.25 : 0.08,
          shadowRadius: 4,
          elevation: isDarkMode ? 3 : 2,
          borderWidth: 1,
          borderColor: isDarkMode
            ? "rgba(255,255,255,0.05)"
            : "rgba(229, 231, 235, 0.8)",
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 4,
            letterSpacing: -0.3,
          }}
        >
          {dev.name}
        </Text>
        <Text
          style={{
            color: colors.secondaryText,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.2,
            marginBottom: 12,
          }}
        >
          {dev.role}
        </Text>

        <View style={{ flexDirection: "row", marginTop: 4 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL(dev.github)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDarkMode
                ? "rgba(139, 92, 246, 0.15)"
                : "rgba(99, 102, 241, 0.08)",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 12,
              marginRight: 10,
            }}
          >
            <Github
              size={16}
              color={isDarkMode ? "#8B5CF6" : "#6366F1"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                color: isDarkMode ? "#A78BFA" : "#6366F1",
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              GitHub
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL(dev.linkedin)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDarkMode
                ? "rgba(139, 92, 246, 0.15)"
                : "rgba(99, 102, 241, 0.08)",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 12,
            }}
          >
            <Linkedin
              size={16}
              color={isDarkMode ? "#8B5CF6" : "#6366F1"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                color: isDarkMode ? "#A78BFA" : "#6366F1",
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              LinkedIn
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.background,
        paddingTop: Platform.OS === "android" ? 25 : 10,
      }}
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
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 18,
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="mr-3"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDarkMode
                  ? "rgba(55, 65, 81, 0.5)"
                  : "rgba(249, 250, 251, 0.9)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDarkMode ? 0.2 : 0.08,
                shadowRadius: 2,
                elevation: isDarkMode ? 2 : 1,
              }}
            >
              <ChevronLeft size={20} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={{ backgroundColor: colors.background }}
        className="flex-1 px-5 py-3"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: 5,
            borderWidth: 1,
            borderColor: isDarkMode
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.03)",
          }}
        >
          <SectionHeader
            icon={
              <HelpCircle
                size={20}
                color={isDarkMode ? "#A78BFA" : "#6366F1"}
              />
            }
            title="How Can We Help?"
          />

          <Text
            style={{
              color: colors.secondaryText,
              fontSize: 15,
              lineHeight: 22,
              letterSpacing: -0.2,
            }}
          >
            Select an option below to get the support you need for Function Fit.
            Our team is here to help you with any questions or issues you may
            have.
          </Text>
        </Animated.View>

        {/* Support options */}
        {supportOptions.map(renderSupportOption)}

        {/* Developers Section */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            marginTop: 8,
            marginBottom: 16,
          }}
        >
          <SectionHeader
            icon={
              <Users size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} />
            }
            title="Meet the Team"
          />
        </Animated.View>

        {developers.map(renderDeveloper)}

        {/* Version Information */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginTop: 8,
            marginBottom: 16,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0.25 : 0.08,
            shadowRadius: 4,
            elevation: isDarkMode ? 3 : 2,
            borderWidth: 1,
            borderColor: isDarkMode
              ? "rgba(255,255,255,0.05)"
              : "rgba(229, 231, 235, 0.8)",
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 4,
              letterSpacing: -0.3,
            }}
          >
            Function Fit
          </Text>
          <Text
            style={{
              color: colors.secondaryText,
              fontSize: 14,
              letterSpacing: -0.2,
            }}
          >
            Version 1.0.0
          </Text>
        </Animated.View>

        {/* Information note */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: isDarkMode
              ? "rgba(139, 92, 246, 0.1)"
              : "rgba(99, 102, 241, 0.05)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 40,
            borderWidth: 1,
            borderColor: isDarkMode
              ? "rgba(139, 92, 246, 0.2)"
              : "rgba(99, 102, 241, 0.1)",
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 14,
              lineHeight: 20,
              letterSpacing: -0.2,
            }}
          >
            Note: The support options on this page are currently placeholder
            examples. Actual support features will be implemented in a future
            update.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
