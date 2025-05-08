import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Platform,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  ArrowLeft,
  Search,
  FilterIcon,
  TrendingUp,
  Clock,
  Calendar,
  ChevronRight,
  PlusCircle,
  X,
} from "lucide-react-native";
import {
  AppleIcon,
  Drumstick,
  Fish,
  Egg,
  Milk,
  Salad,
} from "../components/Icons";
import { BlurView } from "expo-blur";
import { useTheme } from "../utils/theme";
import {
  DataPoint,
  Cluster,
  kMeansClustering,
  normalizeFeatures,
} from "../utils/clustering";

const { width } = Dimensions.get("window");

// Define food nutrition interface
interface FoodNutrition {
  id: string;
  name: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  icon: any; // Using any for icon component type
  category: string;
  benefits: string[];
  color: string;
}

// Sample nutrition data
const nutritionTips = [
  {
    id: "1",
    title: "Pre-Workout Nutrition",
    description: "What to eat before your workout for maximum energy",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&q=80",
    readTime: "4 min read",
  },
  {
    id: "2",
    title: "Post-Workout Recovery",
    description: "Best foods to help your muscles recover faster",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80",
    readTime: "3 min read",
  },
  {
    id: "3",
    title: "Protein-Rich Meals",
    description: "High protein meals to support muscle growth",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80",
    readTime: "5 min read",
  },
  {
    id: "4",
    title: "Hydration Guide",
    description: "How to stay properly hydrated during workouts",
    image:
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&q=80",
    readTime: "2 min read",
  },
  {
    id: "5",
    title: "Meal Prep Ideas",
    description: "Simple meal prep ideas for fitness enthusiasts",
    image:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&q=80",
    readTime: "6 min read",
  },
];

// Sample meal plans
const mealPlans = [
  {
    id: "1",
    title: "Weight Loss Plan",
    calories: "1800-2000",
    duration: "4 weeks",
    image:
      "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=500&q=80",
    tags: ["Low Carb", "High Protein"],
  },
  {
    id: "2",
    title: "Muscle Building",
    calories: "2500-2800",
    duration: "6 weeks",
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=80",
    tags: ["High Protein", "Calorie Surplus"],
  },
  {
    id: "3",
    title: "Balanced Nutrition",
    calories: "2000-2200",
    duration: "Ongoing",
    image:
      "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=500&q=80",
    tags: ["Balanced", "Sustainable"],
  },
];

// Nutrition categories
const categories = [
  { id: "1", name: "All", icon: AppleIcon, selected: true },
  { id: "2", name: "Protein", icon: Drumstick, selected: false },
  { id: "3", name: "Vegetables", icon: Salad, selected: false },
  { id: "4", name: "Fruits", icon: AppleIcon, selected: false },
  { id: "5", name: "Dairy", icon: Milk, selected: false },
  { id: "6", name: "Grains", icon: Salad, selected: false },
  { id: "7", name: "Healthy Fats", icon: Salad, selected: false },
  { id: "8", name: "Superfoods", icon: Salad, selected: false },
];

// Sample food nutrition data
const foodsNutrition: FoodNutrition[] = [
  {
    id: "1",
    name: "Salmon",
    image:
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80",
    calories: 208,
    protein: 20,
    carbs: 0,
    fat: 13,
    icon: Fish,
    category: "Protein",
    benefits: ["Heart Health", "Brain Function", "Anti-inflammatory"],
    color: "#F87171",
  },
  {
    id: "2",
    name: "Avocado",
    image:
      "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=500&q=80",
    calories: 160,
    protein: 2,
    carbs: 9,
    fat: 15,
    icon: Salad,
    category: "Healthy Fats",
    benefits: ["Heart Health", "Weight Control", "Nutrient Absorption"],
    color: "#34D399",
  },
  {
    id: "3",
    name: "Eggs",
    image:
      "https://images.unsplash.com/photo-1607690424560-33998b9220b4?w=500&q=80",
    calories: 78,
    protein: 6,
    carbs: 1,
    fat: 5,
    icon: Egg,
    category: "Protein",
    benefits: ["Muscle Building", "Brain Health", "Eye Health"],
    color: "#FBBF24",
  },
  {
    id: "4",
    name: "Greek Yogurt",
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80",
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 0.4,
    icon: Milk,
    category: "Dairy",
    benefits: ["Gut Health", "Bone Strength", "Muscle Recovery"],
    color: "#60A5FA",
  },
  {
    id: "5",
    name: "Lean Beef",
    image:
      "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=500&q=80",
    calories: 250,
    protein: 26,
    carbs: 0,
    fat: 15,
    icon: Drumstick,
    category: "Protein",
    benefits: ["Iron Source", "Muscle Building", "Zinc & B Vitamins"],
    color: "#FB7185",
  },
  {
    id: "6",
    name: "Quinoa",
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e8cf?w=500&q=80",
    calories: 120,
    protein: 4.4,
    carbs: 21.3,
    fat: 1.9,
    icon: Salad,
    category: "Whole Grains",
    benefits: ["Complete Protein", "High Fiber", "Rich in Minerals"],
    color: "#FBBF24",
  },
  {
    id: "7",
    name: "Spinach",
    image:
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80",
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Iron Rich", "Antioxidants", "Vitamin K"],
    color: "#34D399",
  },
  {
    id: "8",
    name: "Almonds",
    image:
      "https://images.unsplash.com/photo-1536188015656-2a575b99cf89?w=500&q=80",
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    icon: Salad,
    category: "Healthy Fats",
    benefits: ["Heart Health", "Vitamin E", "Blood Sugar Control"],
    color: "#FB7185",
  },
  {
    id: "9",
    name: "Blueberries",
    image:
      "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=500&q=80",
    calories: 57,
    protein: 0.7,
    carbs: 14.5,
    fat: 0.3,
    icon: AppleIcon,
    category: "Fruits",
    benefits: ["Antioxidants", "Brain Health", "Heart Health"],
    color: "#818CF8",
  },
  {
    id: "10",
    name: "Sweet Potato",
    image:
      "https://images.unsplash.com/photo-1596097635121-14b63b7a0f16?w=500&q=80",
    calories: 86,
    protein: 1.6,
    carbs: 20.1,
    fat: 0.1,
    icon: Salad,
    category: "Carbs",
    benefits: ["Vitamin A", "Blood Sugar Regulation", "Gut Health"],
    color: "#F59E0B",
  },
  {
    id: "11",
    name: "Broccoli",
    image:
      "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&q=80",
    calories: 31,
    protein: 2.5,
    carbs: 6,
    fat: 0.3,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Cancer Prevention", "Detoxification", "Vitamin C"],
    color: "#34D399",
  },
  {
    id: "12",
    name: "Chicken Breast",
    image:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&q=80",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    icon: Drumstick,
    category: "Protein",
    benefits: ["Lean Protein", "Muscle Growth", "B Vitamins"],
    color: "#F87171",
  },
  {
    id: "13",
    name: "Oats",
    image:
      "https://images.unsplash.com/photo-1471943038886-87c772c31367?w=500&q=80",
    calories: 389,
    protein: 16.9,
    carbs: 66.3,
    fat: 6.9,
    icon: Salad,
    category: "Whole Grains",
    benefits: ["Heart Health", "Fiber", "Sustained Energy"],
    color: "#FBBF24",
  },
  {
    id: "14",
    name: "Lentils",
    image:
      "https://images.unsplash.com/photo-1611575619751-6e5e1ca5d054?w=500&q=80",
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    icon: Salad,
    category: "Plant Protein",
    benefits: ["Iron", "Fiber", "Plant Protein"],
    color: "#F87171",
  },
  {
    id: "15",
    name: "Walnuts",
    image:
      "https://images.unsplash.com/photo-1609541971776-39a87bef9dc4?w=500&q=80",
    calories: 654,
    protein: 15.2,
    carbs: 13.7,
    fat: 65.2,
    icon: Salad,
    category: "Healthy Fats",
    benefits: ["Omega-3", "Brain Health", "Anti-inflammatory"],
    color: "#FB7185",
  },
  {
    id: "16",
    name: "Kale",
    image:
      "https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=500&q=80",
    calories: 49,
    protein: 4.3,
    carbs: 8.8,
    fat: 0.9,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Vitamin K", "Antioxidants", "Anti-inflammatory"],
    color: "#34D399",
  },
  {
    id: "17",
    name: "Tuna",
    image:
      "https://images.unsplash.com/photo-1611171711910-ba0a5babf59a?w=500&q=80",
    calories: 184,
    protein: 40,
    carbs: 0,
    fat: 1.5,
    icon: Fish,
    category: "Protein",
    benefits: ["Lean Protein", "Heart Health", "Vitamin D"],
    color: "#F87171",
  },
  {
    id: "18",
    name: "Brown Rice",
    image:
      "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&q=80",
    calories: 112,
    protein: 2.6,
    carbs: 23.5,
    fat: 0.9,
    icon: Salad,
    category: "Whole Grains",
    benefits: ["Fiber", "Manganese", "Sustained Energy"],
    color: "#FBBF24",
  },
  {
    id: "19",
    name: "Chia Seeds",
    image:
      "https://images.unsplash.com/photo-1541161414970-c3f88939f0d3?w=500&q=80",
    calories: 486,
    protein: 16.5,
    carbs: 42.1,
    fat: 30.7,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Omega-3", "Fiber", "Antioxidants"],
    color: "#818CF8",
  },
  {
    id: "20",
    name: "Bell Peppers",
    image:
      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&q=80",
    calories: 31,
    protein: 1,
    carbs: 6,
    fat: 0.3,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Vitamin C", "Antioxidants", "Eye Health"],
    color: "#34D399",
  },
  {
    id: "21",
    name: "Turkey Breast",
    image:
      "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=500&q=80",
    calories: 157,
    protein: 34,
    carbs: 0,
    fat: 1,
    icon: Drumstick,
    category: "Protein",
    benefits: ["Lean Protein", "B Vitamins", "Selenium"],
    color: "#F87171",
  },
  {
    id: "22",
    name: "Cottage Cheese",
    image:
      "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=500&q=80",
    calories: 98,
    protein: 11.1,
    carbs: 3.4,
    fat: 4.3,
    icon: Milk,
    category: "Dairy",
    benefits: ["Casein Protein", "Calcium", "Low Calorie"],
    color: "#60A5FA",
  },
  {
    id: "23",
    name: "Quinoa",
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e8cf?w=500&q=80",
    calories: 120,
    protein: 4.4,
    carbs: 21.3,
    fat: 1.9,
    icon: Salad,
    category: "Whole Grains",
    benefits: ["Complete Protein", "Fiber", "Minerals"],
    color: "#FBBF24",
  },
  {
    id: "24",
    name: "Strawberries",
    image:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&q=80",
    calories: 32,
    protein: 0.7,
    carbs: 7.7,
    fat: 0.3,
    icon: AppleIcon,
    category: "Fruits",
    benefits: ["Vitamin C", "Antioxidants", "Heart Health"],
    color: "#FB7185",
  },
  {
    id: "25",
    name: "Tofu",
    image:
      "https://images.unsplash.com/photo-1546069901-eacee686d2df?w=500&q=80",
    calories: 144,
    protein: 17,
    carbs: 2.8,
    fat: 8.7,
    icon: Salad,
    category: "Plant Protein",
    benefits: ["Complete Protein", "Calcium", "Iron"],
    color: "#F87171",
  },
  {
    id: "26",
    name: "Banana",
    image:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80",
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
    icon: AppleIcon,
    category: "Fruits",
    benefits: ["Potassium", "Energy", "Vitamin B6"],
    color: "#FBBF24",
  },
  {
    id: "27",
    name: "Asparagus",
    image:
      "https://images.unsplash.com/photo-1575536983242-ae9bf3fd5534?w=500&q=80",
    calories: 20,
    protein: 2.2,
    carbs: 3.9,
    fat: 0.1,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Folate", "Vitamin K", "Anti-inflammatory"],
    color: "#34D399",
  },
  {
    id: "28",
    name: "Black Beans",
    image:
      "https://images.unsplash.com/photo-1590165481443-6afc43e4a355?w=500&q=80",
    calories: 341,
    protein: 21.6,
    carbs: 62.4,
    fat: 1.4,
    icon: Salad,
    category: "Plant Protein",
    benefits: ["Fiber", "Plant Protein", "Antioxidants"],
    color: "#818CF8",
  },
  {
    id: "29",
    name: "Pumpkin Seeds",
    image:
      "https://images.unsplash.com/photo-1589119908995-c6841f5d7a10?w=500&q=80",
    calories: 559,
    protein: 30.2,
    carbs: 10.7,
    fat: 49.1,
    icon: Salad,
    category: "Healthy Fats",
    benefits: ["Magnesium", "Zinc", "Antioxidants"],
    color: "#34D399",
  },
  {
    id: "30",
    name: "Cod",
    image:
      "https://images.unsplash.com/photo-1559737558-2f5a35f4999b?w=500&q=80",
    calories: 82,
    protein: 17.9,
    carbs: 0,
    fat: 0.7,
    icon: Fish,
    category: "Protein",
    benefits: ["Lean Protein", "Vitamin B12", "Selenium"],
    color: "#60A5FA",
  },
  {
    id: "31",
    name: "Mushrooms",
    image:
      "https://images.unsplash.com/photo-1611495655452-77861a0bb23d?w=500&q=80",
    calories: 22,
    protein: 3.1,
    carbs: 3.3,
    fat: 0.3,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Vitamin D", "Immune Support", "Antioxidants"],
    color: "#6B7280",
  },
  {
    id: "32",
    name: "Flaxseeds",
    image:
      "https://images.unsplash.com/photo-1514220147930-8037bd8ffd25?w=500&q=80",
    calories: 534,
    protein: 18.3,
    carbs: 28.9,
    fat: 42.2,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Omega-3", "Lignans", "Fiber"],
    color: "#F59E0B",
  },
  {
    id: "33",
    name: "Amaranth",
    image:
      "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&q=80",
    calories: 371,
    protein: 13.6,
    carbs: 65.3,
    fat: 7.0,
    icon: Salad,
    category: "Whole Grains",
    benefits: ["Complete Protein", "Lysine", "Minerals"],
    color: "#FBBF24",
  },
  {
    id: "34",
    name: "Sardines",
    image:
      "https://images.unsplash.com/photo-1604257305697-1a39aee3f416?w=500&q=80",
    calories: 208,
    protein: 24.6,
    carbs: 0,
    fat: 11.5,
    icon: Fish,
    category: "Protein",
    benefits: ["Omega-3", "Calcium", "Vitamin D"],
    color: "#60A5FA",
  },
  {
    id: "35",
    name: "Tempeh",
    image:
      "https://images.unsplash.com/photo-1593001872095-7d5b3868dd30?w=500&q=80",
    calories: 195,
    protein: 19.9,
    carbs: 7.6,
    fat: 11.4,
    icon: Salad,
    category: "Plant Protein",
    benefits: ["Probiotics", "Plant Protein", "Fiber"],
    color: "#F87171",
  },
  {
    id: "36",
    name: "Pomegranate",
    image:
      "https://images.unsplash.com/photo-1596591868231-05e586da51a3?w=500&q=80",
    calories: 83,
    protein: 1.7,
    carbs: 18.7,
    fat: 1.2,
    icon: AppleIcon,
    category: "Fruits",
    benefits: ["Antioxidants", "Anti-inflammatory", "Heart Health"],
    color: "#FB7185",
  },
  {
    id: "37",
    name: "Brussels Sprouts",
    image:
      "https://images.unsplash.com/photo-1614626110386-244ce42bfd5c?w=500&q=80",
    calories: 43,
    protein: 3.4,
    carbs: 8.9,
    fat: 0.3,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Vitamin K", "Detoxification", "Fiber"],
    color: "#34D399",
  },
  {
    id: "38",
    name: "Hemp Seeds",
    image:
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80",
    calories: 553,
    protein: 31.6,
    carbs: 8.7,
    fat: 48.8,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Complete Protein", "Omega-3 & 6", "Magnesium"],
    color: "#818CF8",
  },
  {
    id: "39",
    name: "Kefir",
    image:
      "https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=500&q=80",
    calories: 104,
    protein: 6.1,
    carbs: 11.3,
    fat: 2.5,
    icon: Milk,
    category: "Dairy",
    benefits: ["Probiotics", "Calcium", "Protein"],
    color: "#60A5FA",
  },
  {
    id: "40",
    name: "Turmeric",
    image:
      "https://images.unsplash.com/photo-1620546152572-b8ae9e935bf5?w=500&q=80",
    calories: 354,
    protein: 7.8,
    carbs: 64.9,
    fat: 9.9,
    icon: Salad,
    category: "Spices",
    benefits: ["Anti-inflammatory", "Antioxidant", "Brain Health"],
    color: "#F59E0B",
  },
  {
    id: "41",
    name: "Nutritional Yeast",
    image:
      "https://images.unsplash.com/photo-1618423204543-558fc6fc12dc?w=500&q=80",
    calories: 390,
    protein: 52,
    carbs: 36,
    fat: 4,
    icon: Salad,
    category: "Superfoods",
    benefits: ["B Vitamins", "Complete Protein", "Vegan Friendly"],
    color: "#FBBF24",
  },
  {
    id: "42",
    name: "Ginger",
    image:
      "https://images.unsplash.com/photo-1573414067106-e2f2c899fcc9?w=500&q=80",
    calories: 80,
    protein: 1.8,
    carbs: 17.8,
    fat: 0.8,
    icon: Salad,
    category: "Spices",
    benefits: ["Anti-inflammatory", "Digestive Health", "Immune Support"],
    color: "#F59E0B",
  },
  {
    id: "43",
    name: "Spirulina",
    image:
      "https://images.unsplash.com/photo-1597075099430-c14a8b99cfd2?w=500&q=80",
    calories: 290,
    protein: 57.5,
    carbs: 23.9,
    fat: 7.7,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Complete Protein", "Iron", "Detoxification"],
    color: "#34D399",
  },
  {
    id: "44",
    name: "Coconut Oil",
    image:
      "https://images.unsplash.com/photo-1590083948877-f5fe8231aeaa?w=500&q=80",
    calories: 892,
    protein: 0,
    carbs: 0,
    fat: 99.1,
    icon: Salad,
    category: "Healthy Fats",
    benefits: ["MCTs", "Brain Health", "Metabolism"],
    color: "#60A5FA",
  },
  {
    id: "45",
    name: "Seaweed",
    image:
      "https://images.unsplash.com/photo-1562846115-dcd38b7f22af?w=500&q=80",
    calories: 45,
    protein: 7.7,
    carbs: 9.2,
    fat: 0.6,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Iodine", "Minerals", "Unique Nutrients"],
    color: "#34D399",
  },
  {
    id: "46",
    name: "Bone Broth",
    image:
      "https://images.unsplash.com/photo-1600704514457-741686e83e10?w=500&q=80",
    calories: 86,
    protein: 10.4,
    carbs: 0,
    fat: 3.6,
    icon: Milk,
    category: "Protein",
    benefits: ["Collagen", "Gut Health", "Joint Support"],
    color: "#F87171",
  },
  {
    id: "47",
    name: "Dragon Fruit",
    image:
      "https://images.unsplash.com/photo-1575371015930-b275873b8a12?w=500&q=80",
    calories: 60,
    protein: 1.2,
    carbs: 13,
    fat: 0.4,
    icon: AppleIcon,
    category: "Fruits",
    benefits: ["Antioxidants", "Fiber", "Iron"],
    color: "#FB7185",
  },
  {
    id: "48",
    name: "Maca Root",
    image:
      "https://images.unsplash.com/photo-1590080552494-d0ccf11d6a4a?w=500&q=80",
    calories: 386,
    protein: 14.6,
    carbs: 75.5,
    fat: 2.2,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Energy", "Hormonal Balance", "Adaptogen"],
    color: "#F59E0B",
  },
  {
    id: "49",
    name: "Cacao Nibs",
    image:
      "https://images.unsplash.com/photo-1610611424854-5e07032a2ef7?w=500&q=80",
    calories: 228,
    protein: 4.7,
    carbs: 13.9,
    fat: 15.1,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Antioxidants", "Magnesium", "Iron"],
    color: "#6B7280",
  },
  {
    id: "50",
    name: "Kombucha",
    image:
      "https://images.unsplash.com/photo-1560421741-50d9159021cb?w=500&q=80",
    calories: 30,
    protein: 0,
    carbs: 8,
    fat: 0,
    icon: Milk,
    category: "Drinks",
    benefits: ["Probiotics", "Digestive Health", "Antioxidants"],
    color: "#F59E0B",
  },
];

// Define nutritional content thresholds
const NUTRIENT_THRESHOLDS = {
  HIGH_PROTEIN: 20, // grams per 100g
  HIGH_CARBS: 40, // grams per 100g
  HIGH_FAT: 20, // grams per 100g
  LOW_CALORIE: 150, // calories per 100g
};

// K-means clustering function for foods
const getClusteredFoods = () => {
  // Convert food data into data points for clustering
  const dataPoints: DataPoint[] = foodsNutrition.map((food) => ({
    id: food.id,
    name: food.name,
    // Use nutritional values as features for clustering
    features: [
      food.protein, // Protein content
      food.carbs, // Carb content
      food.fat, // Fat content
      food.calories, // Calorie content
    ],
  }));

  // Normalize the data for better clustering results
  const normalizedDataPoints = normalizeFeatures(dataPoints);

  // Run K-means with 5 clusters (same number as our previous categories)
  const clusters = kMeansClustering(normalizedDataPoints, 5);

  // Name the clusters based on their centroids
  const namedClusters: { [key: string]: FoodNutrition[] } = {};

  clusters.forEach((cluster, index) => {
    // Analyze the centroid to determine the cluster's character
    const centroid = cluster.centroid;
    // Features: [protein, carbs, fat, calories] (all normalized between 0-1)

    let clusterName = "";

    // Determine the dominant characteristic of this cluster
    if (centroid[0] > 0.6) {
      // High protein
      clusterName = "High Protein";
    } else if (centroid[1] > 0.6) {
      // High carbs
      clusterName = "High Carbs";
    } else if (centroid[2] > 0.6) {
      // High fat
      clusterName = "High Fat";
    } else if (centroid[3] < 0.3) {
      // Low calorie
      clusterName = "Lean Protein";
    } else {
      clusterName = "Balanced";
    }

    // Get all the original food objects for this cluster
    const clusterFoods = cluster.points.map(
      (point) => foodsNutrition.find((food) => food.id === point.id)!
    );

    namedClusters[clusterName] = clusterFoods;
  });

  return namedClusters;
};

// Function to identify nutritional focus of a food - original rule-based approach
const getNutrientFocus = (food: FoodNutrition): string[] => {
  const focuses: string[] = [];

  // Calculate percentage of calories from each macronutrient
  const proteinCals = food.protein * 4;
  const carbsCals = food.carbs * 4;
  const fatCals = food.fat * 9;
  const totalCals =
    food.calories > 0 ? food.calories : proteinCals + carbsCals + fatCals;

  // Determine dominant macronutrients (contributing over 30% of calories)
  if (
    food.protein >= NUTRIENT_THRESHOLDS.HIGH_PROTEIN ||
    proteinCals / totalCals >= 0.3
  ) {
    focuses.push("High Protein");
  }

  if (
    food.carbs >= NUTRIENT_THRESHOLDS.HIGH_CARBS ||
    carbsCals / totalCals >= 0.45
  ) {
    focuses.push("High Carbs");
  }

  if (food.fat >= NUTRIENT_THRESHOLDS.HIGH_FAT || fatCals / totalCals >= 0.3) {
    focuses.push("High Fat");
  }

  // Special categories
  if (food.calories <= NUTRIENT_THRESHOLDS.LOW_CALORIE && food.protein >= 10) {
    focuses.push("Lean Protein");
  }

  if (focuses.length === 0) {
    focuses.push("Balanced");
  }

  return focuses;
};

// Group foods by nutrient focus - replace with K-means clustering
const getFoodsByNutrient = () => {
  // Use K-means clustering instead of rule-based categorization
  return getClusteredFoods();
};

export default function NutritionScreen() {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [activeCategories, setActiveCategories] = useState(categories);
  const [showAllFoods, setShowAllFoods] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFoods, setFilteredFoods] = useState(foodsNutrition);
  const [showNutrientCategory, setShowNutrientCategory] = useState<
    string | null
  >(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [categoryFilteredFoods, setCategoryFilteredFoods] = useState<
    FoodNutrition[]
  >([]);
  const [showKMeansExplanation, setShowKMeansExplanation] = useState(false);

  // Get foods grouped by nutrient focus
  const foodsByNutrient = getFoodsByNutrient();

  // Effect to update category filtered foods when category changes
  useEffect(() => {
    if (showNutrientCategory) {
      setCategorySearchQuery("");
      setCategoryFilteredFoods(foodsByNutrient[showNutrientCategory] || []);
    }
  }, [showNutrientCategory]);

  // Filter foods for category modal
  const filterCategoryFoods = (query: string) => {
    if (!showNutrientCategory) return;

    let filtered = [...foodsByNutrient[showNutrientCategory]];

    if (query.trim() !== "") {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(
        (food) =>
          food.name.toLowerCase().includes(lowercaseQuery) ||
          food.category.toLowerCase().includes(lowercaseQuery) ||
          food.benefits.some((benefit) =>
            benefit.toLowerCase().includes(lowercaseQuery)
          )
      );
    }

    setCategoryFilteredFoods(filtered);
  };

  // Filter foods by category and search query
  const filterFoods = (categoryId: string, query: string = searchQuery) => {
    let filtered = [...foodsNutrition];

    // Filter by category if not "All"
    if (categoryId !== "1") {
      const categoryName = categories.find(
        (cat) => cat.id === categoryId
      )?.name;
      if (categoryName && categoryName !== "All") {
        // Map category names to actual food categories
        const categoryMap: { [key: string]: string[] } = {
          Protein: ["Protein", "Plant Protein"],
          Vegetables: ["Vegetables"],
          Fruits: ["Fruits"],
          Dairy: ["Dairy"],
          Grains: ["Whole Grains", "Carbs"],
          "Healthy Fats": ["Healthy Fats"],
          Superfoods: ["Superfoods", "Spices"],
        };

        const foodCategories = categoryMap[categoryName] || [categoryName];
        filtered = filtered.filter((food) =>
          foodCategories.includes(food.category)
        );
      }
    }

    // Filter by search query
    if (query.trim() !== "") {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(
        (food) =>
          food.name.toLowerCase().includes(lowercaseQuery) ||
          food.category.toLowerCase().includes(lowercaseQuery) ||
          food.benefits.some((benefit) =>
            benefit.toLowerCase().includes(lowercaseQuery)
          )
      );
    }

    setFilteredFoods(filtered);
  };

  const selectCategory = (id: string) => {
    const updated = activeCategories.map((cat) => ({
      ...cat,
      selected: cat.id === id,
    }));
    setActiveCategories(updated);
    filterFoods(id);
  };

  // Header component with back button
  const Header = () => (
    <View
      style={{
        backgroundColor: isDarkMode ? "#000000" : colors.background,
        paddingTop:
          Platform.OS === "ios" ? 16 : (StatusBar.currentHeight || 16) + 10,
        paddingBottom: 16,
      }}
      className="px-6 border-b border-gray-200 dark:border-gray-800"
    >
      <View className="flex-row items-center">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          className="p-2.5 rounded-full mr-4"
          style={{
            backgroundColor: isDarkMode
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.03)",
          }}
        >
          <ArrowLeft size={22} color={isDarkMode ? "#FFFFFF" : colors.text} />
        </TouchableOpacity>
        <Text
          style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
          className="text-2xl font-bold"
        >
          Nutrition
        </Text>
      </View>
    </View>
  );

  // Foods Nutrition Card
  const FoodNutritionCard = ({ food }: { food: FoodNutrition }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        className="rounded-2xl overflow-hidden shadow-sm mb-4"
        style={{
          backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.09,
          shadowRadius: 3,
        }}
      >
        <View className="flex-row">
          <Image
            source={{ uri: food.image }}
            className="w-28 h-full"
            resizeMode="cover"
          />
          <View className="flex-1 p-4">
            <View className="flex-row justify-between items-center">
              <Text
                className="text-lg font-bold"
                style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
              >
                {food.name}
              </Text>
              <View
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${food.color}20` }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: food.color }}
                >
                  {food.category}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center flex-wrap mt-3">
              <View className="flex-row items-center mr-4 mb-1.5">
                <food.icon
                  size={14}
                  color={isDarkMode ? "#D1D5DB" : "#6B7280"}
                />
                <Text
                  className="ml-1 text-xs font-medium"
                  style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}
                >
                  {food.calories} cal
                </Text>
              </View>
              <View className="flex-row mr-4 mb-1.5">
                <Text
                  className="text-xs font-semibold"
                  style={{ color: "#10B981" }}
                >
                  P: {food.protein}g
                </Text>
              </View>
              <View className="flex-row mr-4 mb-1.5">
                <Text
                  className="text-xs font-semibold"
                  style={{ color: "#F59E0B" }}
                >
                  C: {food.carbs}g
                </Text>
              </View>
              <View className="flex-row mb-1.5">
                <Text
                  className="text-xs font-semibold"
                  style={{ color: "#EF4444" }}
                >
                  F: {food.fat}g
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap mt-2">
              {food.benefits.map((benefit: string, index: number) => (
                <View
                  key={index}
                  className="mr-2 mb-1.5 px-2.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(139, 92, 246, 0.2)"
                      : "rgba(139, 92, 246, 0.1)",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: "#8B5CF6" }}
                  >
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // All Foods Modal
  const AllFoodsModal = () => {
    const modalCategories = [...categories];
    const [activeModalCategory, setActiveModalCategory] = useState(
      modalCategories[0].id
    );

    // Get food counts by category
    const getCategoryCount = (categoryId: string): number => {
      if (categoryId === "1") return foodsNutrition.length;

      const categoryName = categories.find(
        (cat) => cat.id === categoryId
      )?.name;
      if (!categoryName || categoryName === "All") return 0;

      // Map category names to actual food categories
      const categoryMap: { [key: string]: string[] } = {
        Protein: ["Protein", "Plant Protein"],
        Vegetables: ["Vegetables"],
        Fruits: ["Fruits"],
        Dairy: ["Dairy"],
        Grains: ["Whole Grains", "Carbs"],
        "Healthy Fats": ["Healthy Fats"],
        Superfoods: ["Superfoods", "Spices"],
      };

      const foodCategories = categoryMap[categoryName] || [categoryName];
      return foodsNutrition.filter((food) =>
        foodCategories.includes(food.category)
      ).length;
    };

    const handleCategoryChange = (id: string) => {
      setActiveModalCategory(id);
      filterFoods(id);
    };

    const handleSearch = (text: string) => {
      setSearchQuery(text);
      filterFoods(activeModalCategory, text);
    };

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={showAllFoods}
        onRequestClose={() => setShowAllFoods(false)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: isDarkMode ? "#000000" : colors.background,
          }}
        >
          <View
            style={{
              paddingTop:
                Platform.OS === "ios"
                  ? 16
                  : (StatusBar.currentHeight || 16) + 10,
              paddingBottom: 16,
              backgroundColor: isDarkMode ? "#000000" : colors.background,
            }}
            className="px-6 border-b border-gray-200 dark:border-gray-800"
          >
            <View className="flex-row items-center">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAllFoods(false)}
                className="p-2.5 rounded-full mr-4"
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.03)",
                }}
              >
                <ArrowLeft
                  size={22}
                  color={isDarkMode ? "#FFFFFF" : colors.text}
                />
              </TouchableOpacity>
              <Text
                style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                className="text-2xl font-bold"
              >
                All Foods
              </Text>
            </View>
          </View>

          <View className="px-6 pt-4 pb-2">
            <View
              className="flex-row items-center px-4 py-3.5 rounded-xl"
              style={{ backgroundColor: isDarkMode ? "#111827" : "#F3F4F6" }}
            >
              <Search size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
              <TextInput
                placeholder="Search foods, nutrients, benefits..."
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                style={{
                  flex: 1,
                  marginLeft: 10,
                  color: isDarkMode ? "#FFFFFF" : "#000000",
                  fontSize: 15,
                }}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>
          </View>

          <View className="mb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingVertical: 10,
              }}
            >
              {modalCategories.map((category) => {
                const count = getCategoryCount(category.id);
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    key={category.id}
                    onPress={() => handleCategoryChange(category.id)}
                    className="mr-3 py-2.5 rounded-xl flex-row items-center"
                    style={{
                      backgroundColor:
                        category.id === activeModalCategory
                          ? "#8B5CF6"
                          : isDarkMode
                          ? "#111827"
                          : "#F3F4F6",
                      paddingLeft: 12,
                      paddingRight: 14,
                    }}
                  >
                    <category.icon
                      width={18}
                      height={18}
                      color={
                        category.id === activeModalCategory
                          ? "#FFFFFF"
                          : isDarkMode
                          ? "#9CA3AF"
                          : "#6B7280"
                      }
                    />
                    <Text
                      className="mx-2 font-semibold"
                      style={{
                        color:
                          category.id === activeModalCategory
                            ? "#FFFFFF"
                            : isDarkMode
                            ? "#9CA3AF"
                            : "#6B7280",
                      }}
                    >
                      {category.name}
                    </Text>
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor:
                          category.id === activeModalCategory
                            ? "rgba(255, 255, 255, 0.3)"
                            : isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color:
                            category.id === activeModalCategory
                              ? "#FFFFFF"
                              : isDarkMode
                              ? "#9CA3AF"
                              : "#6B7280",
                        }}
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <FlatList
            data={filteredFoods}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 24, paddingTop: 0 }}
            renderItem={({ item }) => <FoodNutritionCard food={item} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text
                  className="text-base"
                  style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                >
                  No foods found matching your criteria
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    );
  };

  // Modal to show foods by specific nutrient category
  const NutrientCategoryModal = () => {
    if (!showNutrientCategory) return null;

    // Get the specific nutrient color for styling
    const nutrientColors: { [key: string]: string } = {
      "High Protein": "#EC4899",
      "High Carbs": "#F59E0B",
      "High Fat": "#3B82F6",
      "Lean Protein": "#10B981",
      Balanced: "#8B5CF6",
    };

    const color = nutrientColors[showNutrientCategory] || "#8B5CF6";

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={!!showNutrientCategory}
        onRequestClose={() => setShowNutrientCategory(null)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: isDarkMode ? "#000000" : colors.background,
          }}
        >
          <View
            style={{
              paddingTop:
                Platform.OS === "ios"
                  ? 16
                  : (StatusBar.currentHeight || 16) + 10,
              paddingBottom: 16,
              backgroundColor: isDarkMode ? "#000000" : colors.background,
            }}
            className="px-6 border-b border-gray-200 dark:border-gray-800"
          >
            <View className="flex-row items-center">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowNutrientCategory(null)}
                className="p-2.5 rounded-full mr-4"
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.03)",
                }}
              >
                <ArrowLeft
                  size={22}
                  color={isDarkMode ? "#FFFFFF" : colors.text}
                />
              </TouchableOpacity>
              <Text
                style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                className="text-2xl font-bold"
              >
                {showNutrientCategory} Foods
              </Text>
            </View>
          </View>

          {/* Search bar for category */}
          <View className="px-6 pt-4 pb-2">
            <View
              className="flex-row items-center px-4 py-3.5 rounded-xl"
              style={{ backgroundColor: isDarkMode ? "#111827" : "#F3F4F6" }}
            >
              <Search size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
              <TextInput
                placeholder={`Search ${showNutrientCategory} foods...`}
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                style={{
                  flex: 1,
                  marginLeft: 10,
                  color: isDarkMode ? "#FFFFFF" : "#000000",
                  fontSize: 15,
                }}
                value={categorySearchQuery}
                onChangeText={(text) => {
                  setCategorySearchQuery(text);
                  filterCategoryFoods(text);
                }}
              />
            </View>
          </View>

          {/* Nutrient category info */}
          <View className="px-6 py-3">
            <View
              className="p-4 rounded-xl mb-3 flex-row items-center"
              style={{
                backgroundColor: `${color}15`,
                borderWidth: 1,
                borderColor: `${color}30`,
              }}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: color }}
              >
                <Text className="text-white font-bold text-base">
                  {categoryFilteredFoods.length}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-lg font-bold"
                  style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                >
                  {showNutrientCategory} foods
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                >
                  {showNutrientCategory === "High Protein"
                    ? "Foods with significant protein content"
                    : showNutrientCategory === "High Carbs"
                    ? "Foods rich in carbohydrates"
                    : showNutrientCategory === "High Fat"
                    ? "Foods with healthy fat content"
                    : showNutrientCategory === "Lean Protein"
                    ? "Low-calorie protein sources"
                    : "Foods with balanced macronutrients"}
                </Text>
              </View>
            </View>
          </View>

          <FlatList
            data={categoryFilteredFoods}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 24, paddingTop: 4 }}
            renderItem={({ item }) => <FoodNutritionCard food={item} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text
                  className="text-base"
                  style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                >
                  No foods found matching your criteria
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    );
  };

  // Foods by Nutrient Section - Original section that shows rule-based categories
  const FoodsByNutrientSection = () => {
    // Color map for nutrient categories
    const nutrientColors: { [key: string]: string } = {
      "High Protein": "#EC4899",
      "High Carbs": "#F59E0B",
      "High Fat": "#3B82F6",
      "Lean Protein": "#10B981",
      Balanced: "#8B5CF6",
    };

    // Icon map for nutrient categories
    const nutrientIcons: { [key: string]: any } = {
      "High Protein": Drumstick,
      "High Carbs": AppleIcon,
      "High Fat": Salad,
      "Lean Protein": Fish,
      Balanced: AppleIcon,
    };

    return (
      <View className="px-6 mb-6">
        <View className="flex-row items-center justify-between mb-5">
          <Text
            className="text-2xl font-bold"
            style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
          >
            Foods by Macro
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-row items-center"
            onPress={() => {
              setShowAllFoods(true);
              filterFoods("1");
            }}
          >
            <Text
              className="text-sm font-semibold mr-1"
              style={{ color: "#8B5CF6" }}
            >
              See All
            </Text>
            <ChevronRight size={16} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pb-3"
          contentContainerStyle={{ paddingRight: 12 }}
        >
          {Object.keys(foodsByNutrient).map((category) => {
            const categoryFoods = foodsByNutrient[category];
            const color = nutrientColors[category] || "#8B5CF6";
            const Icon = nutrientIcons[category] || AppleIcon;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                key={category}
                className="mr-5"
                style={{ width: width * 0.6 }}
                onPress={() => {
                  setShowNutrientCategory(category);
                }}
              >
                <View
                  className="p-5 rounded-xl mb-2"
                  style={{
                    backgroundColor: `${color}15`,
                    borderWidth: 1,
                    borderColor: `${color}30`,
                  }}
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <Icon size={24} color="#FFFFFF" />
                    </View>
                    <View
                      className="px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: `${color}30` }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: color }}
                      >
                        {categoryFoods.length} foods
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                  >
                    {category}
                  </Text>
                  <Text
                    className="text-xs mt-1.5"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    {category === "High Protein"
                      ? "Foods rich in protein content"
                      : category === "High Carbs"
                      ? "Foods high in carbohydrates"
                      : category === "High Fat"
                      ? "Foods with healthy fat content"
                      : category === "Lean Protein"
                      ? "Low-calorie protein sources"
                      : "Foods with balanced nutrients"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // FoodsByKMeansSection - A component to display our K-means clustering results
  const FoodsByKMeansSection = () => {
    // Get nutrient color map
    const nutrientColors: { [key: string]: string } = {
      "High Protein": "#EC4899",
      "High Carbs": "#F59E0B",
      "High Fat": "#3B82F6",
      "Lean Protein": "#10B981",
      Balanced: "#8B5CF6",
    };

    // Get nutrient icon map
    const nutrientIcons: { [key: string]: any } = {
      "High Protein": Drumstick,
      "High Carbs": AppleIcon,
      "High Fat": Salad,
      "Lean Protein": Fish,
      Balanced: AppleIcon,
    };

    return (
      <View className="px-6 mb-8 mt-4">
        <View className="flex-row items-center justify-between mb-5">
          <Text
            className="text-2xl font-bold"
            style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
          >
            Food Clusters
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-row items-center"
            onPress={() => setShowKMeansExplanation(true)}
          >
            <Text
              className="text-sm font-semibold mr-1"
              style={{ color: "#8B5CF6" }}
            >
              How It Works
            </Text>
            <ChevronRight size={16} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pb-3"
          contentContainerStyle={{ paddingRight: 12 }}
        >
          {Object.keys(foodsByNutrient).map((category) => {
            const categoryFoods = foodsByNutrient[category];
            const color = nutrientColors[category] || "#8B5CF6";
            const Icon = nutrientIcons[category] || AppleIcon;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                key={category}
                className="mr-5"
                style={{ width: width * 0.6 }}
                onPress={() => {
                  setShowNutrientCategory(category);
                }}
              >
                <View
                  className="p-5 rounded-xl mb-2"
                  style={{
                    backgroundColor: `${color}15`,
                    borderWidth: 1,
                    borderColor: `${color}30`,
                  }}
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <Icon size={24} color="#FFFFFF" />
                    </View>
                    <View
                      className="px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: `${color}30` }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: color }}
                      >
                        {categoryFoods.length} foods
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                  >
                    {category}
                  </Text>
                  <Text
                    className="text-xs mt-1.5"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    {category === "High Protein"
                      ? "Foods rich in protein content"
                      : category === "High Carbs"
                      ? "Foods high in carbohydrates"
                      : category === "High Fat"
                      ? "Foods with healthy fat content"
                      : category === "Lean Protein"
                      ? "Low-calorie protein sources"
                      : "Foods with balanced nutrients"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Modal to explain K-means clustering
  const KMeansExplanationModal = () => {
    return (
      <Modal
        visible={showKMeansExplanation}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowKMeansExplanation(false)}
      >
        <BlurView intensity={40} tint="dark" style={{ flex: 1 }}>
          <View className="flex-1 justify-end">
            <View
              className="rounded-t-3xl p-7"
              style={{
                backgroundColor: isDarkMode ? "#1E1E1E" : colors.background,
              }}
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text
                  className="text-2xl font-bold"
                  style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                >
                  K-Means Clustering
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowKMeansExplanation(false)}
                  className="p-2.5 rounded-full"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.03)",
                  }}
                >
                  <X size={20} color={isDarkMode ? "#FFFFFF" : colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView className="mb-6" showsVerticalScrollIndicator={false}>
                <Text
                  className="text-base mb-4 leading-6"
                  style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                >
                  The K-means algorithm automatically groups foods based on
                  their nutritional properties:
                </Text>

                <Text
                  className="text-base mb-3 leading-6"
                  style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                >
                  • Foods are represented as points in 4-dimensional space
                  (protein, carbs, fat, calories)
                </Text>

                <Text
                  className="text-base mb-3 leading-6"
                  style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                >
                  • The algorithm creates 5 clusters by finding foods with
                  similar nutritional profiles
                </Text>

                <Text
                  className="text-base mb-3 leading-6"
                  style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                >
                  • Each cluster gets a name based on its centroid (average
                  nutritional values)
                </Text>

                <Text
                  className="text-base mb-3 leading-6"
                  style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                >
                  • Unlike the rule-based approach, K-means discovers natural
                  groupings in the data
                </Text>

                <Text
                  className="text-base mb-2 leading-6"
                  style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                >
                  You might notice differences between these clusters and the
                  traditional categories - that's because K-means is finding
                  patterns we might not immediately recognize!
                </Text>
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.8}
                className="py-4 rounded-xl items-center"
                style={{ backgroundColor: "#8B5CF6" }}
                onPress={() => setShowKMeansExplanation(false)}
              >
                <Text className="text-white font-bold text-base">Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    );
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: isDarkMode ? "#000000" : colors.background }}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
      >
        {/* K-means section */}
        <FoodsByKMeansSection />

        <FoodsByNutrientSection />
      </ScrollView>

      {/* Modals */}
      <AllFoodsModal />
      <NutrientCategoryModal />
      <KMeansExplanationModal />
    </SafeAreaView>
  );
}
