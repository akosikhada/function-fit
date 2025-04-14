import React, { useState, useEffect } from "react";
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
  TextInput
} from "react-native";
import { Stack, router } from "expo-router";
import { 
  ArrowLeft, 
  Search, 
  FilterIcon, 
  AppleIcon,
  TrendingUp,
  Clock,
  Calendar,
  ChevronRight,
  PlusCircle,
  Salad,
  Drumstick,
  Fish,
  Egg,
  Milk
} from "lucide-react-native";
import ThemeModule from "../utils/theme";
const { useTheme } = ThemeModule;
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
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&q=80",
    readTime: "4 min read"
  },
  {
    id: "2",
    title: "Post-Workout Recovery",
    description: "Best foods to help your muscles recover faster",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80",
    readTime: "3 min read"
  },
  {
    id: "3",
    title: "Protein-Rich Meals",
    description: "High protein meals to support muscle growth",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80",
    readTime: "5 min read"
  },
  {
    id: "4",
    title: "Hydration Guide",
    description: "How to stay properly hydrated during workouts",
    image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&q=80",
    readTime: "2 min read"
  },
  {
    id: "5",
    title: "Meal Prep Ideas",
    description: "Simple meal prep ideas for fitness enthusiasts",
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&q=80",
    readTime: "6 min read"
  },
];

// Sample meal plans
const mealPlans = [
  {
    id: "1",
    title: "Weight Loss Plan",
    calories: "1800-2000",
    duration: "4 weeks",
    image: "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=500&q=80",
    tags: ["Low Carb", "High Protein"]
  },
  {
    id: "2",
    title: "Muscle Building",
    calories: "2500-2800",
    duration: "6 weeks",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=80",
    tags: ["High Protein", "Calorie Surplus"]
  },
  {
    id: "3",
    title: "Balanced Nutrition",
    calories: "2000-2200",
    duration: "Ongoing",
    image: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=500&q=80",
    tags: ["Balanced", "Sustainable"]
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
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80",
    calories: 208,
    protein: 20,
    carbs: 0,
    fat: 13,
    icon: Fish,
    category: "Protein",
    benefits: ["Heart Health", "Brain Function", "Anti-inflammatory"],
    color: "#F87171"
  },
  {
    id: "2",
    name: "Avocado",
    image: "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=500&q=80",
    calories: 160,
    protein: 2,
    carbs: 9,
    fat: 15,
    icon: Salad,
    category: "Healthy Fats",
    benefits: ["Heart Health", "Weight Control", "Nutrient Absorption"],
    color: "#34D399"
  },
  {
    id: "3",
    name: "Eggs",
    image: "https://images.unsplash.com/photo-1607690424560-33998b9220b4?w=500&q=80",
    calories: 78,
    protein: 6,
    carbs: 1,
    fat: 5,
    icon: Egg,
    category: "Protein",
    benefits: ["Muscle Building", "Brain Health", "Eye Health"],
    color: "#FBBF24" 
  },
  {
    id: "4",
    name: "Greek Yogurt",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80",
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 0.4,
    icon: Milk,
    category: "Dairy",
    benefits: ["Gut Health", "Bone Strength", "Muscle Recovery"],
    color: "#60A5FA"
  },
  {
    id: "5",
    name: "Lean Beef",
    image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=500&q=80",
    calories: 250,
    protein: 26,
    carbs: 0,
    fat: 15,
    icon: Drumstick,
    category: "Protein",
    benefits: ["Iron Source", "Muscle Building", "Zinc & B Vitamins"],
    color: "#FB7185"
  },
  {
    id: "6",
    name: "Quinoa",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e8cf?w=500&q=80",
    calories: 120,
    protein: 4.4,
    carbs: 21.3,
    fat: 1.9,
    icon: Salad,
    category: "Whole Grains",
    benefits: ["Complete Protein", "High Fiber", "Rich in Minerals"],
    color: "#FBBF24"
  },
  {
    id: "7",
    name: "Spinach",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80",
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Iron Rich", "Antioxidants", "Vitamin K"],
    color: "#34D399"
  },
  {
    id: "8",
    name: "Almonds",
    image: "https://images.unsplash.com/photo-1536188015656-2a575b99cf89?w=500&q=80",
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    icon: Salad,
    category: "Healthy Fats",
    benefits: ["Heart Health", "Vitamin E", "Blood Sugar Control"],
    color: "#FB7185"
  },
  {
    id: "9",
    name: "Blueberries",
    image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=500&q=80",
    calories: 57,
    protein: 0.7,
    carbs: 14.5,
    fat: 0.3,
    icon: AppleIcon,
    category: "Fruits",
    benefits: ["Antioxidants", "Brain Health", "Heart Health"],
    color: "#818CF8"
  },
  {
    id: "10",
    name: "Sweet Potato",
    image: "https://images.unsplash.com/photo-1596097635121-14b63b7a0f16?w=500&q=80",
    calories: 86,
    protein: 1.6,
    carbs: 20.1,
    fat: 0.1,
    icon: Salad,
    category: "Carbs",
    benefits: ["Vitamin A", "Blood Sugar Regulation", "Gut Health"],
    color: "#F59E0B"
  },
  {
    id: "11",
    name: "Broccoli",
    image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&q=80",
    calories: 31,
    protein: 2.5,
    carbs: 6,
    fat: 0.3,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Cancer Prevention", "Detoxification", "Vitamin C"],
    color: "#34D399"
  },
  {
    id: "12",
    name: "Chicken Breast",
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&q=80",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    icon: Drumstick,
    category: "Protein",
    benefits: ["Lean Protein", "Muscle Growth", "B Vitamins"],
    color: "#F87171"
  },
  {
    id: "13",
    name: "Oats",
    image: "https://images.unsplash.com/photo-1471943038886-87c772c31367?w=500&q=80",
    calories: 389,
    protein: 16.9,
    carbs: 66.3,
    fat: 6.9,
    icon: Salad,
    category: "Whole Grains",
    benefits: ["Heart Health", "Fiber", "Sustained Energy"],
    color: "#FBBF24"
  },
  {
    id: "14",
    name: "Lentils",
    image: "https://images.unsplash.com/photo-1611575619751-6e5e1ca5d054?w=500&q=80",
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    icon: Salad,
    category: "Plant Protein",
    benefits: ["Iron", "Fiber", "Plant Protein"],
    color: "#F87171"
  },
  {
    id: "15",
    name: "Walnuts",
    image: "https://images.unsplash.com/photo-1609541971776-39a87bef9dc4?w=500&q=80",
    calories: 654,
    protein: 15.2,
    carbs: 13.7,
    fat: 65.2,
    icon: Salad,
    category: "Healthy Fats",
    benefits: ["Omega-3", "Brain Health", "Anti-inflammatory"],
    color: "#FB7185"
  },
  {
    id: "16",
    name: "Kale",
    image: "https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=500&q=80",
    calories: 49,
    protein: 4.3,
    carbs: 8.8,
    fat: 0.9,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Vitamin K", "Antioxidants", "Anti-inflammatory"],
    color: "#34D399"
  },
  {
    id: "17",
    name: "Tuna",
    image: "https://images.unsplash.com/photo-1611171711910-ba0a5babf59a?w=500&q=80",
    calories: 184,
    protein: 40,
    carbs: 0,
    fat: 1.5,
    icon: Fish,
    category: "Protein",
    benefits: ["Lean Protein", "Heart Health", "Vitamin D"],
    color: "#F87171"
  },
  {
    id: "18",
    name: "Brown Rice",
    image: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&q=80",
    calories: 112,
    protein: 2.6,
    carbs: 23.5,
    fat: 0.9,
    icon: Salad,
    category: "Whole Grains",
    benefits: ["Fiber", "Manganese", "Sustained Energy"],
    color: "#FBBF24"
  },
  {
    id: "19",
    name: "Chia Seeds",
    image: "https://images.unsplash.com/photo-1541161414970-c3f88939f0d3?w=500&q=80",
    calories: 486,
    protein: 16.5,
    carbs: 42.1,
    fat: 30.7,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Omega-3", "Fiber", "Antioxidants"],
    color: "#818CF8"
  },
  {
    id: "20",
    name: "Bell Peppers",
    image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&q=80",
    calories: 31,
    protein: 1,
    carbs: 6,
    fat: 0.3,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Vitamin C", "Antioxidants", "Eye Health"],
    color: "#34D399"
  },
  {
    id: "21",
    name: "Turkey Breast",
    image: "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=500&q=80",
    calories: 157,
    protein: 34,
    carbs: 0,
    fat: 1,
    icon: Drumstick,
    category: "Protein",
    benefits: ["Lean Protein", "B Vitamins", "Selenium"],
    color: "#F87171"
  },
  {
    id: "22",
    name: "Cottage Cheese",
    image: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=500&q=80",
    calories: 98,
    protein: 11.1,
    carbs: 3.4,
    fat: 4.3,
    icon: Milk,
    category: "Dairy",
    benefits: ["Casein Protein", "Calcium", "Low Calorie"],
    color: "#60A5FA"
  },
  {
    id: "23",
    name: "Quinoa",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e8cf?w=500&q=80",
    calories: 120,
    protein: 4.4,
    carbs: 21.3,
    fat: 1.9,
    icon: Salad,
    category: "Whole Grains",
    benefits: ["Complete Protein", "Fiber", "Minerals"],
    color: "#FBBF24"
  },
  {
    id: "24",
    name: "Strawberries",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&q=80",
    calories: 32,
    protein: 0.7,
    carbs: 7.7,
    fat: 0.3,
    icon: AppleIcon,
    category: "Fruits",
    benefits: ["Vitamin C", "Antioxidants", "Heart Health"],
    color: "#FB7185"
  },
  {
    id: "25",
    name: "Tofu",
    image: "https://images.unsplash.com/photo-1546069901-eacee686d2df?w=500&q=80",
    calories: 144,
    protein: 17,
    carbs: 2.8,
    fat: 8.7,
    icon: Salad,
    category: "Plant Protein",
    benefits: ["Complete Protein", "Calcium", "Iron"],
    color: "#F87171"
  },
  {
    id: "26",
    name: "Banana",
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80",
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
    icon: AppleIcon,
    category: "Fruits",
    benefits: ["Potassium", "Energy", "Vitamin B6"],
    color: "#FBBF24"
  },
  {
    id: "27",
    name: "Asparagus",
    image: "https://images.unsplash.com/photo-1575536983242-ae9bf3fd5534?w=500&q=80",
    calories: 20,
    protein: 2.2,
    carbs: 3.9,
    fat: 0.1,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Folate", "Vitamin K", "Anti-inflammatory"],
    color: "#34D399"
  },
  {
    id: "28",
    name: "Black Beans",
    image: "https://images.unsplash.com/photo-1590165481443-6afc43e4a355?w=500&q=80",
    calories: 341,
    protein: 21.6,
    carbs: 62.4,
    fat: 1.4,
    icon: Salad,
    category: "Plant Protein",
    benefits: ["Fiber", "Plant Protein", "Antioxidants"],
    color: "#818CF8"
  },
  {
    id: "29",
    name: "Pumpkin Seeds",
    image: "https://images.unsplash.com/photo-1589119908995-c6841f5d7a10?w=500&q=80",
    calories: 559,
    protein: 30.2,
    carbs: 10.7,
    fat: 49.1,
    icon: Salad,
    category: "Healthy Fats",
    benefits: ["Magnesium", "Zinc", "Antioxidants"],
    color: "#34D399"
  },
  {
    id: "30",
    name: "Cod",
    image: "https://images.unsplash.com/photo-1559737558-2f5a35f4999b?w=500&q=80",
    calories: 82,
    protein: 17.9,
    carbs: 0,
    fat: 0.7,
    icon: Fish,
    category: "Protein",
    benefits: ["Lean Protein", "Vitamin B12", "Selenium"],
    color: "#60A5FA"
  },
  {
    id: "31",
    name: "Mushrooms",
    image: "https://images.unsplash.com/photo-1611495655452-77861a0bb23d?w=500&q=80",
    calories: 22,
    protein: 3.1,
    carbs: 3.3,
    fat: 0.3,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Vitamin D", "Immune Support", "Antioxidants"],
    color: "#6B7280"
  },
  {
    id: "32",
    name: "Flaxseeds",
    image: "https://images.unsplash.com/photo-1514220147930-8037bd8ffd25?w=500&q=80",
    calories: 534,
    protein: 18.3,
    carbs: 28.9,
    fat: 42.2,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Omega-3", "Lignans", "Fiber"],
    color: "#F59E0B"
  },
  {
    id: "33",
    name: "Amaranth",
    image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&q=80",
    calories: 371,
    protein: 13.6,
    carbs: 65.3,
    fat: 7.0,
    icon: Salad,
    category: "Whole Grains",
    benefits: ["Complete Protein", "Lysine", "Minerals"],
    color: "#FBBF24"
  },
  {
    id: "34",
    name: "Sardines",
    image: "https://images.unsplash.com/photo-1604257305697-1a39aee3f416?w=500&q=80",
    calories: 208,
    protein: 24.6,
    carbs: 0,
    fat: 11.5,
    icon: Fish,
    category: "Protein",
    benefits: ["Omega-3", "Calcium", "Vitamin D"],
    color: "#60A5FA"
  },
  {
    id: "35",
    name: "Tempeh",
    image: "https://images.unsplash.com/photo-1593001872095-7d5b3868dd30?w=500&q=80",
    calories: 195,
    protein: 19.9,
    carbs: 7.6,
    fat: 11.4,
    icon: Salad,
    category: "Plant Protein",
    benefits: ["Probiotics", "Plant Protein", "Fiber"],
    color: "#F87171"
  },
  {
    id: "36",
    name: "Pomegranate",
    image: "https://images.unsplash.com/photo-1596591868231-05e586da51a3?w=500&q=80",
    calories: 83,
    protein: 1.7,
    carbs: 18.7,
    fat: 1.2,
    icon: AppleIcon,
    category: "Fruits",
    benefits: ["Antioxidants", "Anti-inflammatory", "Heart Health"],
    color: "#FB7185"
  },
  {
    id: "37",
    name: "Brussels Sprouts",
    image: "https://images.unsplash.com/photo-1614626110386-244ce42bfd5c?w=500&q=80",
    calories: 43,
    protein: 3.4,
    carbs: 8.9,
    fat: 0.3,
    icon: Salad,
    category: "Vegetables",
    benefits: ["Vitamin K", "Detoxification", "Fiber"],
    color: "#34D399"
  },
  {
    id: "38",
    name: "Hemp Seeds",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80",
    calories: 553,
    protein: 31.6,
    carbs: 8.7,
    fat: 48.8,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Complete Protein", "Omega-3 & 6", "Magnesium"],
    color: "#818CF8"
  },
  {
    id: "39",
    name: "Kefir",
    image: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=500&q=80",
    calories: 104,
    protein: 6.1,
    carbs: 11.3,
    fat: 2.5,
    icon: Milk,
    category: "Dairy",
    benefits: ["Probiotics", "Calcium", "Protein"],
    color: "#60A5FA"
  },
  {
    id: "40",
    name: "Turmeric",
    image: "https://images.unsplash.com/photo-1620546152572-b8ae9e935bf5?w=500&q=80",
    calories: 354,
    protein: 7.8,
    carbs: 64.9,
    fat: 9.9,
    icon: Salad,
    category: "Spices",
    benefits: ["Anti-inflammatory", "Antioxidant", "Brain Health"],
    color: "#F59E0B"
  },
  {
    id: "41",
    name: "Nutritional Yeast",
    image: "https://images.unsplash.com/photo-1618423204543-558fc6fc12dc?w=500&q=80",
    calories: 390,
    protein: 52,
    carbs: 36,
    fat: 4,
    icon: Salad,
    category: "Superfoods",
    benefits: ["B Vitamins", "Complete Protein", "Vegan Friendly"],
    color: "#FBBF24"
  },
  {
    id: "42",
    name: "Ginger",
    image: "https://images.unsplash.com/photo-1573414067106-e2f2c899fcc9?w=500&q=80",
    calories: 80,
    protein: 1.8,
    carbs: 17.8,
    fat: 0.8,
    icon: Salad,
    category: "Spices",
    benefits: ["Anti-inflammatory", "Digestive Health", "Immune Support"],
    color: "#F59E0B"
  },
  {
    id: "43",
    name: "Spirulina",
    image: "https://images.unsplash.com/photo-1597075099430-c14a8b99cfd2?w=500&q=80",
    calories: 290,
    protein: 57.5,
    carbs: 23.9,
    fat: 7.7,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Complete Protein", "Iron", "Detoxification"],
    color: "#34D399"
  },
  {
    id: "44",
    name: "Coconut Oil",
    image: "https://images.unsplash.com/photo-1590083948877-f5fe8231aeaa?w=500&q=80",
    calories: 892,
    protein: 0,
    carbs: 0,
    fat: 99.1,
    icon: Salad,
    category: "Healthy Fats",
    benefits: ["MCTs", "Brain Health", "Metabolism"],
    color: "#60A5FA"
  },
  {
    id: "45",
    name: "Seaweed",
    image: "https://images.unsplash.com/photo-1562846115-dcd38b7f22af?w=500&q=80",
    calories: 45,
    protein: 7.7,
    carbs: 9.2,
    fat: 0.6,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Iodine", "Minerals", "Unique Nutrients"],
    color: "#34D399"
  },
  {
    id: "46",
    name: "Bone Broth",
    image: "https://images.unsplash.com/photo-1600704514457-741686e83e10?w=500&q=80",
    calories: 86,
    protein: 10.4,
    carbs: 0,
    fat: 3.6,
    icon: Milk,
    category: "Protein",
    benefits: ["Collagen", "Gut Health", "Joint Support"],
    color: "#F87171"
  },
  {
    id: "47",
    name: "Dragon Fruit",
    image: "https://images.unsplash.com/photo-1575371015930-b275873b8a12?w=500&q=80",
    calories: 60,
    protein: 1.2,
    carbs: 13,
    fat: 0.4,
    icon: AppleIcon,
    category: "Fruits",
    benefits: ["Antioxidants", "Fiber", "Iron"],
    color: "#FB7185"
  },
  {
    id: "48",
    name: "Maca Root",
    image: "https://images.unsplash.com/photo-1590080552494-d0ccf11d6a4a?w=500&q=80",
    calories: 386,
    protein: 14.6,
    carbs: 75.5,
    fat: 2.2,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Energy", "Hormonal Balance", "Adaptogen"],
    color: "#F59E0B"
  },
  {
    id: "49",
    name: "Cacao Nibs",
    image: "https://images.unsplash.com/photo-1610611424854-5e07032a2ef7?w=500&q=80",
    calories: 228,
    protein: 4.7,
    carbs: 13.9,
    fat: 15.1,
    icon: Salad,
    category: "Superfoods",
    benefits: ["Antioxidants", "Magnesium", "Iron"],
    color: "#6B7280"
  },
  {
    id: "50",
    name: "Kombucha",
    image: "https://images.unsplash.com/photo-1560421741-50d9159021cb?w=500&q=80",
    calories: 30,
    protein: 0,
    carbs: 8,
    fat: 0,
    icon: Milk,
    category: "Drinks",
    benefits: ["Probiotics", "Digestive Health", "Antioxidants"],
    color: "#F59E0B"
  }
];

// Define nutritional content thresholds
const NUTRIENT_THRESHOLDS = {
  HIGH_PROTEIN: 20, // grams per 100g
  HIGH_CARBS: 40,    // grams per 100g
  HIGH_FAT: 20,      // grams per 100g
  LOW_CALORIE: 150   // calories per 100g
};

// Function to identify nutritional focus of a food
const getNutrientFocus = (food: FoodNutrition): string[] => {
  const focuses: string[] = [];
  
  // Calculate percentage of calories from each macronutrient
  const proteinCals = food.protein * 4;
  const carbsCals = food.carbs * 4;
  const fatCals = food.fat * 9;
  const totalCals = food.calories > 0 ? food.calories : (proteinCals + carbsCals + fatCals);
  
  // Determine dominant macronutrients (contributing over 30% of calories)
  if (food.protein >= NUTRIENT_THRESHOLDS.HIGH_PROTEIN || (proteinCals / totalCals) >= 0.3) {
    focuses.push("High Protein");
  }
  
  if (food.carbs >= NUTRIENT_THRESHOLDS.HIGH_CARBS || (carbsCals / totalCals) >= 0.45) {
    focuses.push("High Carbs");
  }
  
  if (food.fat >= NUTRIENT_THRESHOLDS.HIGH_FAT || (fatCals / totalCals) >= 0.3) {
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

// Group foods by nutrient focus
const getFoodsByNutrient = () => {
  const byNutrient: { [key: string]: FoodNutrition[] } = {
    "High Protein": [],
    "High Carbs": [],
    "High Fat": [],
    "Lean Protein": [],
    "Balanced": []
  };
  
  foodsNutrition.forEach(food => {
    const focuses = getNutrientFocus(food);
    focuses.forEach(focus => {
      if (byNutrient[focus]) {
        byNutrient[focus].push(food);
      }
    });
  });
  
  return byNutrient;
};

export default function NutritionScreen() {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [activeCategories, setActiveCategories] = useState(categories);
  const [showAllFoods, setShowAllFoods] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState(foodsNutrition);
  const [showNutrientCategory, setShowNutrientCategory] = useState<string | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryFilteredFoods, setCategoryFilteredFoods] = useState<FoodNutrition[]>([]);
  
  // Get foods grouped by nutrient focus
  const foodsByNutrient = getFoodsByNutrient();
  
  // Effect to update category filtered foods when category changes
  useEffect(() => {
    if (showNutrientCategory) {
      setCategorySearchQuery('');
      setCategoryFilteredFoods(foodsByNutrient[showNutrientCategory] || []);
    }
  }, [showNutrientCategory]);
  
  // Filter foods for category modal
  const filterCategoryFoods = (query: string) => {
    if (!showNutrientCategory) return;
    
    let filtered = [...foodsByNutrient[showNutrientCategory]];
    
    if (query.trim() !== '') {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(food => 
        food.name.toLowerCase().includes(lowercaseQuery) || 
        food.category.toLowerCase().includes(lowercaseQuery) ||
        food.benefits.some(benefit => benefit.toLowerCase().includes(lowercaseQuery))
      );
    }
    
    setCategoryFilteredFoods(filtered);
  };
  
  // Filter foods by category and search query
  const filterFoods = (categoryId: string, query: string = searchQuery) => {
    let filtered = [...foodsNutrition];
    
    // Filter by category if not "All"
    if (categoryId !== "1") {
      const categoryName = categories.find(cat => cat.id === categoryId)?.name;
      if (categoryName && categoryName !== "All") {
        // Map category names to actual food categories
        const categoryMap: { [key: string]: string[] } = {
          "Protein": ["Protein", "Plant Protein"],
          "Vegetables": ["Vegetables"],
          "Fruits": ["Fruits"],
          "Dairy": ["Dairy"],
          "Grains": ["Whole Grains", "Carbs"],
          "Healthy Fats": ["Healthy Fats"],
          "Superfoods": ["Superfoods", "Spices"]
        };
        
        const foodCategories = categoryMap[categoryName] || [categoryName];
        filtered = filtered.filter(food => foodCategories.includes(food.category));
      }
    }
    
    // Filter by search query
    if (query.trim() !== '') {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(food => 
        food.name.toLowerCase().includes(lowercaseQuery) || 
        food.category.toLowerCase().includes(lowercaseQuery) ||
        food.benefits.some(benefit => benefit.toLowerCase().includes(lowercaseQuery))
      );
    }
    
    setFilteredFoods(filtered);
  };
  
  const selectCategory = (id: string) => {
    const updated = activeCategories.map(cat => ({
      ...cat,
      selected: cat.id === id
    }));
    setActiveCategories(updated);
    filterFoods(id);
  };
  
  // Header component with back button
  const Header = () => (
    <View 
      style={{ 
        backgroundColor: isDarkMode ? "#000000" : colors.background,
        paddingTop: Platform.OS === 'ios' ? 12 : (StatusBar.currentHeight || 12) + 10,
      }}
      className="px-5 pb-4 border-b border-gray-200 dark:border-gray-800"
    >
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full"
          style={{ backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}
        >
          <ArrowLeft size={20} color={isDarkMode ? "#FFFFFF" : colors.text} />
        </TouchableOpacity>
        <Text 
          style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
          className="text-xl font-semibold"
        >
          Nutrition
        </Text>
        <TouchableOpacity 
          className="p-2 rounded-full"
          style={{ backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}
        >
          <FilterIcon size={20} color={isDarkMode ? "#FFFFFF" : colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const NutritionProgress = () => {
    const nutrients = [
      { name: "Calories", value: 1850, target: 2200, unit: "kcal", color: "#8B5CF6" },
      { name: "Protein", value: 95, target: 120, unit: "g", color: "#10B981" },
      { name: "Carbs", value: 210, target: 250, unit: "g", color: "#F59E0B" },
      { name: "Fat", value: 65, target: 70, unit: "g", color: "#EF4444" },
    ];

  return (
      <View className="mx-5 my-5 p-5 rounded-2xl shadow-sm" 
        style={{ 
          backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
        }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold" style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}>
            Today's Progress
          </Text>
          <TouchableOpacity>
            <Text className="text-sm font-medium" style={{ color: "#8B5CF6" }}>Details</Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row flex-wrap justify-between">
          {nutrients.map((nutrient, index) => {
            const progress = (nutrient.value / nutrient.target) * 100;
            return (
              <View key={index} className="mb-4" style={{ width: '48%' }}>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm font-medium" style={{ color: isDarkMode ? "#D1D5DB" : "#4B5563" }}>
                    {nutrient.name}
                  </Text>
                  <Text className="text-sm" style={{ color: isDarkMode ? "#D1D5DB" : "#4B5563" }}>
                    {nutrient.value}/{nutrient.target} {nutrient.unit}
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${Math.min(progress, 100)}%`, 
                      backgroundColor: nutrient.color 
                    }} 
                  />
                </View>
              </View>
            );
          })}
        </View>
        
        <TouchableOpacity 
          className="mt-3 py-3 rounded-xl flex-row items-center justify-center"
          style={{ backgroundColor: "#8B5CF6" }}
        >
          <PlusCircle size={18} color="#FFFFFF" />
          <Text className="ml-2 text-white font-semibold">Log Food</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Foods Nutrition Card
  const FoodNutritionCard = ({ food }: { food: FoodNutrition }) => {
    return (
      <TouchableOpacity 
        className="rounded-2xl overflow-hidden shadow-sm mb-3"
        style={{ 
          backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
        }}
      >
        <View className="flex-row">
          <Image
            source={{ uri: food.image }}
            className="w-24 h-full"
            resizeMode="cover"
          />
          <View className="flex-1 p-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold" style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}>
                {food.name}
              </Text>
              <View 
                className="px-2 py-1 rounded-full" 
                style={{ backgroundColor: `${food.color}20` }}
              >
                <Text className="text-xs font-medium" style={{ color: food.color }}>
                  {food.category}
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center flex-wrap mt-2">
              <View className="flex-row items-center mr-3 mb-1">
                <food.icon size={14} color={isDarkMode ? "#D1D5DB" : "#6B7280"} />
                <Text className="ml-1 text-xs" style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}>
                  {food.calories} cal
                </Text>
              </View>
              <View className="flex-row mr-3 mb-1">
                <Text className="text-xs font-medium" style={{ color: "#10B981" }}>
                  P: {food.protein}g
                </Text>
              </View>
              <View className="flex-row mr-3 mb-1">
                <Text className="text-xs font-medium" style={{ color: "#F59E0B" }}>
                  C: {food.carbs}g
                </Text>
              </View>
              <View className="flex-row mb-1">
                <Text className="text-xs font-medium" style={{ color: "#EF4444" }}>
                  F: {food.fat}g
                </Text>
              </View>
            </View>
            
            <View className="flex-row flex-wrap mt-1">
              {food.benefits.map((benefit: string, index: number) => (
                <View 
                  key={index}
                  className="mr-2 mb-1 px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)" }}
                >
                  <Text 
                    className="text-xs"
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
    const [activeModalCategory, setActiveModalCategory] = useState(modalCategories[0].id);
    
    // Get food counts by category
    const getCategoryCount = (categoryId: string): number => {
      if (categoryId === "1") return foodsNutrition.length;
      
      const categoryName = categories.find(cat => cat.id === categoryId)?.name;
      if (!categoryName || categoryName === "All") return 0;
      
      // Map category names to actual food categories
      const categoryMap: { [key: string]: string[] } = {
        "Protein": ["Protein", "Plant Protein"],
        "Vegetables": ["Vegetables"],
        "Fruits": ["Fruits"],
        "Dairy": ["Dairy"],
        "Grains": ["Whole Grains", "Carbs"],
        "Healthy Fats": ["Healthy Fats"],
        "Superfoods": ["Superfoods", "Spices"]
      };
      
      const foodCategories = categoryMap[categoryName] || [categoryName];
      return foodsNutrition.filter(food => foodCategories.includes(food.category)).length;
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
        backgroundColor: isDarkMode ? "#000000" : colors.background 
      }}
    >
          <View 
            style={{ 
              paddingTop: Platform.OS === 'ios' ? 12 : (StatusBar.currentHeight || 12) + 10,
              backgroundColor: isDarkMode ? "#000000" : colors.background
            }}
            className="px-5 pb-4 border-b border-gray-200 dark:border-gray-800"
          >
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => setShowAllFoods(false)}
                className="p-2 rounded-full"
                style={{ backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}
              >
                <ArrowLeft size={20} color={isDarkMode ? "#FFFFFF" : colors.text} />
              </TouchableOpacity>
              <Text 
                style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                className="text-xl font-semibold"
              >
                All Foods
              </Text>
              <View style={{ width: 40 }} />
            </View>
          </View>
          
          <View className="px-5 pt-4 pb-2">
            <View 
              className="flex-row items-center px-4 py-3 rounded-xl"
              style={{ backgroundColor: isDarkMode ? "#111827" : "#F3F4F6" }}
            >
              <Search size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
              <TextInput
                placeholder="Search foods, nutrients, benefits..."
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                style={{ 
                  flex: 1,
                  marginLeft: 8,
                  color: isDarkMode ? "#FFFFFF" : "#000000",
                  fontSize: 14
                }}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>
          </View>
          
          <View className="mb-3">
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
            >
              {modalCategories.map((category) => {
                const count = getCategoryCount(category.id);
                return (
          <TouchableOpacity 
                    key={category.id}
                    onPress={() => handleCategoryChange(category.id)}
                    className="mr-3 py-2 rounded-xl flex-row items-center"
                    style={{ 
                      backgroundColor: category.id === activeModalCategory
                        ? "#8B5CF6" 
                        : isDarkMode ? "#111827" : "#F3F4F6",
                      paddingLeft: 10,
                      paddingRight: 12
                    }}
                  >
                    <category.icon 
                      size={16} 
                      color={category.id === activeModalCategory
                        ? "#FFFFFF" 
                        : isDarkMode ? "#9CA3AF" : "#6B7280"} 
                    />
            <Text 
                      className="mx-2 font-medium"
                      style={{ 
                        color: category.id === activeModalCategory
                          ? "#FFFFFF" 
                          : isDarkMode ? "#9CA3AF" : "#6B7280"
                      }}
                    >
                      {category.name}
            </Text>
                    <View 
                      className="px-1.5 rounded-full"
                      style={{ 
                        backgroundColor: category.id === activeModalCategory
                          ? "rgba(255, 255, 255, 0.3)" 
                          : isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"
                      }}
                    >
                      <Text 
                        className="text-xs font-medium"
                        style={{ 
                          color: category.id === activeModalCategory
                            ? "#FFFFFF" 
                            : isDarkMode ? "#9CA3AF" : "#6B7280"
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
            contentContainerStyle={{ padding: 20, paddingTop: 10 }}
            renderItem={({ item }) => <FoodNutritionCard food={item} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                  No foods found matching your criteria
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    );
  };

  // Foods By Nutrient Component
  const FoodsByNutrientSection = () => {
    // Color map for nutrient categories
    const nutrientColors: { [key: string]: string } = {
      "High Protein": "#EC4899",
      "High Carbs": "#F59E0B", 
      "High Fat": "#3B82F6",
      "Lean Protein": "#10B981",
      "Balanced": "#8B5CF6"
    };
    
    // Icon map for nutrient categories
    const nutrientIcons: { [key: string]: any } = {
      "High Protein": Drumstick,
      "High Carbs": AppleIcon,
      "High Fat": Salad,
      "Lean Protein": Fish,
      "Balanced": AppleIcon
    };
    
    return (
      <View className="px-5 mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold" style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}>
            Foods by Macro
          </Text>
          <TouchableOpacity 
            className="flex-row items-center"
            onPress={() => {
              setShowAllFoods(true);
              filterFoods("1");
            }}
          >
            <Text className="text-sm font-medium mr-1" style={{ color: "#8B5CF6" }}>See All</Text>
            <ChevronRight size={16} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
          className="mb-3"
        >
          {Object.keys(foodsByNutrient).map((nutrient, index) => {
            if (foodsByNutrient[nutrient].length === 0) return null;
            
            const IconComponent = nutrientIcons[nutrient] || AppleIcon;
            const color = nutrientColors[nutrient] || "#8B5CF6";
            
            return (
              <TouchableOpacity
                key={index}
                className="mr-3 rounded-xl overflow-hidden"
                style={{ width: 160 }}
                onPress={() => setShowNutrientCategory(nutrient)}
              >
                <View 
                  className="p-4 items-center justify-center" 
                  style={{ backgroundColor: `${color}15`, height: 120 }}
                >
                  <IconComponent size={32} color={color} />
                  <Text 
                    className="mt-3 text-base font-bold text-center"
                    style={{ color }}
                  >
                    {nutrient}
              </Text>
                  <Text 
                    className="text-xs text-center mt-1"
                    style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}
                  >
                    {foodsByNutrient[nutrient].length} foods
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
            </View>
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
      "Balanced": "#8B5CF6"
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
            backgroundColor: isDarkMode ? "#000000" : colors.background
          }}
        >
          <View 
            style={{ 
              paddingTop: Platform.OS === 'ios' ? 12 : (StatusBar.currentHeight || 12) + 10,
              backgroundColor: isDarkMode ? "#000000" : colors.background
            }}
            className="px-5 pb-4 border-b border-gray-200 dark:border-gray-800"
          >
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => setShowNutrientCategory(null)}
                className="p-2 rounded-full"
                style={{ backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}
              >
                <ArrowLeft size={20} color={isDarkMode ? "#FFFFFF" : colors.text} />
              </TouchableOpacity>
              <Text 
                style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                className="text-xl font-semibold"
              >
                {showNutrientCategory} Foods
              </Text>
              <View style={{ width: 40 }} />
            </View>
              </View>
              
          {/* Search bar for category */}
          <View className="px-5 pt-4 pb-2">
            <View 
              className="flex-row items-center px-4 py-3 rounded-xl"
              style={{ backgroundColor: isDarkMode ? "#111827" : "#F3F4F6" }}
            >
              <Search size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
              <TextInput
                placeholder={`Search ${showNutrientCategory} foods...`}
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                style={{ 
                  flex: 1,
                  marginLeft: 8,
                  color: isDarkMode ? "#FFFFFF" : "#000000",
                  fontSize: 14
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
          <View className="px-5 py-2">
            <View 
              className="p-3 rounded-lg mb-3 flex-row items-center"
              style={{ backgroundColor: `${color}15` }}
            >
              <View 
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: color }}
              >
                <Text className="text-white font-bold">
                  {categoryFilteredFoods.length}
                </Text>
              </View>
              <View className="flex-1">
                <Text 
                  className="font-semibold"
                  style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}
                >
                  {showNutrientCategory} foods
                </Text>
                <Text 
                  className="text-xs"
                  style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                >
                  {
                    showNutrientCategory === "High Protein" ? "Foods with significant protein content" :
                    showNutrientCategory === "High Carbs" ? "Foods rich in carbohydrates" :
                    showNutrientCategory === "High Fat" ? "Foods with healthy fat content" :
                    showNutrientCategory === "Lean Protein" ? "Low-calorie protein sources" :
                    "Foods with balanced macronutrients"
                  }
                </Text>
            </View>
          </View>
        </View>
        
          <FlatList
            data={categoryFilteredFoods}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, paddingTop: 0 }}
            renderItem={({ item }) => <FoodNutritionCard food={item} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                  No foods found matching your criteria
            </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView
      style={{ 
        flex: 1, 
        backgroundColor: isDarkMode ? "#000000" : colors.background 
      }}
      className="pb-0"
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <Stack.Screen options={{ headerShown: false }} />
      
      <Header />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Search bar */}
        <View className="px-5 pt-4 pb-2">
          <TouchableOpacity 
            className="flex-row items-center px-4 py-3 rounded-xl"
            style={{ backgroundColor: isDarkMode ? "#111827" : "#F3F4F6" }}
            onPress={() => {
              setShowAllFoods(true);
              filterFoods("1", ""); // Reset filters when opening all foods
              setSearchQuery("");
            }}
          >
            <Search size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text 
              className="ml-2 text-sm"
              style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
            >
              Search for meals, foods, nutrients...
            </Text>
            </TouchableOpacity>
          </View>
          
        {/* Categories */}
        <View className="mt-1 mb-1">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            className="py-2"
          >
            {activeCategories.map((category) => (
              <TouchableOpacity 
                key={category.id}
                onPress={() => selectCategory(category.id)}
                className="mr-3 px-4 py-2 rounded-full flex-row items-center"
                style={{ 
                  backgroundColor: category.selected 
                    ? "#8B5CF6" 
                    : isDarkMode ? "#111827" : "#F3F4F6"
                }}
              >
                <category.icon 
                  size={16} 
                  color={category.selected 
                    ? "#FFFFFF" 
                    : isDarkMode ? "#9CA3AF" : "#6B7280"} 
                />
                <Text 
                  className="ml-2 font-medium"
                  style={{ 
                    color: category.selected 
                      ? "#FFFFFF" 
                      : isDarkMode ? "#9CA3AF" : "#6B7280"
                  }}
                >
                  {category.name}
                  </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Daily nutrition progress */}
        <NutritionProgress />
        
        {/* Foods by Nutrient Section */}
        <FoodsByNutrientSection />
        
        {/* Foods Nutrition Section */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold" style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}>
              Foods Nutrition
            </Text>
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => {
                setShowAllFoods(true);
                filterFoods("1", ""); // Reset filters when opening all foods
                setSearchQuery("");
              }}
            >
              <Text className="text-sm font-medium mr-1" style={{ color: "#8B5CF6" }}>Browse All</Text>
              <ChevronRight size={16} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
          
          {/* Show only first 5 foods in the main view to avoid performance issues */}
          {foodsNutrition.slice(0, 5).map((food) => (
            <FoodNutritionCard key={food.id} food={food} />
          ))}
          
          <TouchableOpacity 
            className="mt-2 py-3 rounded-xl flex-row items-center justify-center"
            style={{ backgroundColor: isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)" }}
            onPress={() => {
              setShowAllFoods(true);
              filterFoods("1", ""); // Reset filters when opening all foods
              setSearchQuery("");
            }}
          >
            <Text className="font-semibold" style={{ color: "#8B5CF6" }}>View All 50 Foods</Text>
          </TouchableOpacity>
        </View>
        
        {/* Meal Plans Section */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold" style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}>
              Meal Plans
            </Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-sm font-medium mr-1" style={{ color: "#8B5CF6" }}>View All</Text>
              <ChevronRight size={16} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
          
          {mealPlans.map((plan) => (
            <TouchableOpacity 
              key={plan.id}
              className="mb-4 rounded-2xl overflow-hidden shadow-sm"
              style={{ 
                backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
                elevation: 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 2,
              }}
            >
              <Image
                source={{ uri: plan.image }}
                className="w-full h-48"
                resizeMode="cover"
              />
              <View className="p-4">
                <Text className="text-lg font-bold" style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}>
                  {plan.title}
                </Text>
                
                <View className="flex-row items-center mt-2 mb-2">
                  <View className="flex-row items-center mr-4">
                    <AppleIcon size={16} color={isDarkMode ? "#D1D5DB" : "#6B7280"} />
                    <Text className="ml-1 text-sm" style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}>
                      {plan.calories} cal
                </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Calendar size={16} color={isDarkMode ? "#D1D5DB" : "#6B7280"} />
                    <Text className="ml-1 text-sm" style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}>
                  {plan.duration}
                </Text>
              </View>
              </View>
              
                <View className="flex-row mt-1">
                  {plan.tags.map((tag, index) => (
                    <View 
                      key={index} 
                      className="mr-2 px-2 py-1 rounded-md"
                      style={{ backgroundColor: isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)" }}
                    >
                      <Text 
                        className="text-xs font-medium"
                        style={{ color: "#8B5CF6" }}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Nutrition Tips Section */}
        <View className="px-5 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold" style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}>
              Nutrition Tips
            </Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-sm font-medium mr-1" style={{ color: "#8B5CF6" }}>See All</Text>
              <ChevronRight size={16} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
            className="space-x-4"
          >
            {nutritionTips.map((tip) => (
              <TouchableOpacity 
                key={tip.id}
                className="w-72 rounded-2xl overflow-hidden shadow-sm"
                style={{ 
                  backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 2,
                }}
              >
                <Image
                  source={{ uri: tip.image }}
                  className="w-full h-40"
                  resizeMode="cover"
                />
                <View className="p-4">
                  <Text className="text-lg font-bold" style={{ color: isDarkMode ? "#FFFFFF" : colors.text }}>
                    {tip.title}
                  </Text>
                  <Text className="mt-1 text-sm" style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                    {tip.description}
                  </Text>
                  <View className="flex-row items-center mt-3">
                    <Clock size={14} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                    <Text className="ml-1 text-xs" style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                      {tip.readTime}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
      </ScrollView>
        </View>
      </ScrollView>
      
      {/* Modal for All Foods */}
      <AllFoodsModal />
      
      {/* Modal for Nutrient Category */}
      <NutrientCategoryModal />
    </SafeAreaView>
  );
}
