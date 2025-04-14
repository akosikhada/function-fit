import { Redirect } from 'expo-router';

// This file acts as a redirect to the actual nutrition page
export default function NutritionRedirect() {
  return <Redirect href="/nutrition" />;
}