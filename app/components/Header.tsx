import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Bell, User } from "lucide-react-native";

interface HeaderProps {
  username?: string;
}

const Header = ({ username = "Alex" }: HeaderProps) => {
  return (
    <View className="w-full flex-row justify-between items-center px-4 py-3 bg-white">
      <View>
        <Text className="text-lg font-bold text-gray-800">
          Hello, {username}
        </Text>
        <Text className="text-sm text-gray-500">
          Let's crush today's goals!
        </Text>
      </View>
      <View className="flex-row space-x-4">
        <TouchableOpacity className="p-2">
          <Bell size={24} color="#4F46E5" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2 bg-indigo-100 rounded-full">
          <User size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
