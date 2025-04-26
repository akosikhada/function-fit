import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format } from 'date-fns'
import ThemeModule from '../utils/theme'

const { useTheme } = ThemeModule;

interface DateTimePickerProps {
  date: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  mode?: 'date' | 'time' | 'datetime';
  format?: string;
}

const CustomDateTimePicker = ({ 
  date, 
  onChange, 
  label, 
  mode = 'date',
  format: dateFormat
}: DateTimePickerProps) => {
  const [show, setShow] = useState(false)
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>(mode === 'datetime' ? 'date' : mode)
  const { colors } = useTheme()
  
  useEffect(() => {
    // Log component mount and props for debugging
    console.log(`DateTimePicker mounted with mode: ${mode}, date:`, date ? date.toISOString() : 'null');
  }, []);

  const handleChange = (event: any, selectedDate?: Date) => {
    const eventType = event?.type || 'unknown';
    console.log(`DateTimePicker change event: ${eventType}, selectedDate:`, selectedDate ? selectedDate.toISOString() : 'null');
    
    if (Platform.OS === 'android') {
      setShow(false)
      
      // For datetime mode, after picking date, show time picker
      if (mode === 'datetime' && pickerMode === 'date' && selectedDate) {
        setTimeout(() => {
          setPickerMode('time')
          setShow(true)
        }, 100)
      }
    } else {
      // iOS handles date and time in one picker for datetime mode
      setShow(Platform.OS === 'ios')
    }
    
    if (selectedDate) {
      onChange(selectedDate)
    }
  }

  const getDisplayText = () => {
    if (!date) return 'Select'
    
    try {
      if (dateFormat) {
        return format(date, dateFormat)
      }
      
      switch (mode) {
        case 'date':
          return format(date, 'MMM dd, yyyy')
        case 'time':
          return format(date, 'h:mm a')
        case 'datetime':
          return format(date, 'MMM dd, yyyy h:mm a')
        default:
          return format(date, 'MMM dd, yyyy')
      }
    } catch (e) {
      console.error('Error formatting date:', e, date);
      return 'Invalid date';
    }
  }

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TouchableOpacity 
        style={[styles.dateButton, { backgroundColor: colors.card }]} 
        onPress={() => {
          console.log('DateTimePicker button pressed, showing picker');
          // Reset to date mode for datetime when opening
          if (mode === 'datetime') {
            setPickerMode('date')
          }
          setShow(true)
        }}
      >
        <Text style={[styles.dateText, { color: colors.text }]}>
          {getDisplayText()}
        </Text>
      </TouchableOpacity>
      
      {show && (
        <DateTimePicker
          value={date || new Date()}
          mode={pickerMode}
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          testID="dateTimePicker"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  dateButton: {
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  dateText: {
    fontSize: 16,
  }
})

export default CustomDateTimePicker