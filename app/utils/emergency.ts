import AsyncStorage from '@react-native-async-storage/async-storage';

// This utility file contains emergency functions for fixing critical issues

/**
 * Emergency function to directly set workout progress in AsyncStorage
 * Used when the normal data flow is not working correctly
 */
export const forceWorkoutProgressUpdate = async (
  userId: string,
  calories: number,
  workoutCount: number = 1
) => {
  try {
    console.log('🚨 EMERGENCY: Force updating workout progress');
    
    // Format today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Create stats object with direct values
    const statsObject = {
      calories: calories,
      workouts_completed: workoutCount,
      active_minutes: 30, // Default value
      steps: 0,
      emergency_update: true,
      timestamp: new Date().toISOString()
    };
    
    // Save to AsyncStorage under the standard key
    const statsKey = `user_stats_${userId}_${today}`;
    await AsyncStorage.setItem(statsKey, JSON.stringify(statsObject));
    console.log(`Saved emergency stats to ${statsKey}:`, statsObject);
    
    // Set emergency flags
    await AsyncStorage.setItem('EMERGENCY_FIX_REQUIRED', 'true');
    await AsyncStorage.setItem('WORKOUT_COUNT_OVERRIDE', String(workoutCount));
    await AsyncStorage.setItem('CALORIES_OVERRIDE', String(calories));
    
    // Force refresh flags
    const timestamp = Date.now().toString();
    await AsyncStorage.setItem('dashboard_needs_refresh', timestamp);
    await AsyncStorage.setItem('FORCE_REFRESH_HOME', timestamp);
    await AsyncStorage.setItem(`workout_completed_${userId}`, timestamp);
    
    console.log('🚨 EMERGENCY FIX COMPLETE');
    return true;
  } catch (error) {
    console.error('Error in emergency workout progress update:', error);
    return false;
  }
};

/**
 * Reset all emergency flags and workout data
 */
export const resetEmergencyFlags = async () => {
  try {
    const keys = [
      'EMERGENCY_FIX_REQUIRED',
      'WORKOUT_COUNT_OVERRIDE',
      'CALORIES_OVERRIDE'
    ];
    
    await AsyncStorage.multiRemove(keys);
    console.log('Reset all emergency flags');
    return true;
  } catch (error) {
    console.error('Error resetting emergency flags:', error);
    return false;
  }
}; 