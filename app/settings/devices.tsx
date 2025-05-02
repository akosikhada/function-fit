import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Animated,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  ChevronLeft,
  Smartphone,
  PlusCircle,
  Bluetooth,
  Watch,
  WifiOff,
} from "lucide-react-native";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;

interface DeviceItemProps {
  icon: JSX.Element;
  name: string;
  status: string;
  isCurrent?: boolean;
  onPress?: () => void;
  delay?: number;
}

export default function DevicesSettings() {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  // Mock devices data
  const [connectedDevices, setConnectedDevices] = useState([
    {
      id: "1",
      name: Platform.OS === "ios" ? "iPhone" : "Android Device",
      status: "This device • Active now",
      type: "smartphone",
      isCurrent: true,
    },
    {
      id: "2",
      name: "Garmin Forerunner",
      status: "Connected • Last sync: Today",
      type: "watch",
      isCurrent: false,
    },
  ]);

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

  const DeviceItem = ({
    icon,
    name,
    status,
    isCurrent = false,
    onPress,
    delay = 0,
  }: DeviceItemProps) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: 16,
      }}
    >
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: colors.card,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.25 : 0.08,
          shadowRadius: 4,
          elevation: isDarkMode ? 3 : 2,
          borderWidth: 1,
          borderColor: isDarkMode
            ? isCurrent
              ? "rgba(139, 92, 246, 0.3)"
              : "rgba(255, 255, 255, 0.05)"
            : isCurrent
            ? "rgba(99, 102, 241, 0.2)"
            : "rgba(229, 231, 235, 0.8)",
        }}
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
          {icon}
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
            {name}
            {isCurrent && (
              <Text
                style={{
                  color: isDarkMode ? "#A78BFA" : "#6366F1",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {" "}
                •
              </Text>
            )}
          </Text>
          <Text
            style={{
              color: colors.secondaryText,
              fontSize: 13,
              letterSpacing: -0.2,
            }}
          >
            {status}
          </Text>
        </View>

        {onPress && (
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
            <WifiOff size={14} color={colors.secondaryText} />
          </View>
        )}
      </TouchableOpacity>
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
          title: "Connected Devices",
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
          <View className="flex-row items-center mb-4">
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
              <Bluetooth size={20} color={isDarkMode ? "#A78BFA" : "#6366F1"} />
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
              Connected Devices
            </Text>
          </View>

          <Text
            style={{
              color: colors.secondaryText,
              fontSize: 15,
              lineHeight: 22,
              letterSpacing: -0.2,
            }}
          >
            Manage wearables, fitness trackers, and other devices connected to
            Function Fit. Data from these devices will sync with your workout
            history.
          </Text>
        </Animated.View>

        {/* Devices Section */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: "700",
              marginBottom: 12,
              marginLeft: 4,
              letterSpacing: -0.3,
            }}
          >
            Your Devices
          </Text>

          {connectedDevices.map((device) => (
            <DeviceItem
              key={device.id}
              icon={
                device.type === "smartphone" ? (
                  <Smartphone
                    size={24}
                    color={isDarkMode ? "#8B5CF6" : "#6366F1"}
                  />
                ) : (
                  <Watch size={24} color={isDarkMode ? "#8B5CF6" : "#6366F1"} />
                )
              }
              name={device.name}
              status={device.status}
              isCurrent={device.isCurrent}
              onPress={
                !device.isCurrent
                  ? () => {
                      alert(`Disconnect ${device.name}?`);
                    }
                  : undefined
              }
            />
          ))}
        </Animated.View>

        {/* Connect new device button */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: isDarkMode
                ? "rgba(139, 92, 246, 0.15)"
                : "rgba(99, 102, 241, 0.08)",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDarkMode ? 0.2 : 0.1,
              shadowRadius: 3,
              elevation: isDarkMode ? 2 : 1,
              borderWidth: 1,
              borderColor: isDarkMode
                ? "rgba(139, 92, 246, 0.3)"
                : "rgba(99, 102, 241, 0.2)",
            }}
            activeOpacity={0.7}
            onPress={() => {
              // This would open a flow to connect a new device
              alert(
                "Connect new device functionality will be implemented in a future update."
              );
            }}
          >
            <PlusCircle
              size={18}
              color={isDarkMode ? "#A78BFA" : "#6366F1"}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                color: isDarkMode ? "#A78BFA" : "#6366F1",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Connect New Device
            </Text>
          </TouchableOpacity>
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
            Note: This page is currently a static mockup with sample devices.
            The actual device connection functionality will be implemented in an
            upcoming update.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
