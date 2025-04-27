import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform } from 'react-native'
import React, { useState } from 'react'
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
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(date || new Date())
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>(mode === 'datetime' ? 'date' : mode)
  const { colors } = useTheme()
  
  // Generate arrays for picker
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 99 + i)
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 60 }, (_, i) => i)
  const ampm = ['AM', 'PM']

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const handleDayPress = (day: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(day)
    setSelectedDate(newDate)
  }

  const handleMonthPress = (monthIndex: number) => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(monthIndex)
    
    // Adjust day if it exceeds the number of days in the selected month
    const daysInNewMonth = getDaysInMonth(newDate.getFullYear(), monthIndex)
    if (newDate.getDate() > daysInNewMonth) {
      newDate.setDate(daysInNewMonth)
    }
    
    setSelectedDate(newDate)
  }

  const handleYearPress = (year: number) => {
    const newDate = new Date(selectedDate)
    newDate.setFullYear(year)
    
    // Adjust day if it exceeds the number of days in the selected month
    const daysInMonth = getDaysInMonth(year, newDate.getMonth())
    if (newDate.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth)
    }
    
    setSelectedDate(newDate)
  }

  const handleHourPress = (hour: number) => {
    const newDate = new Date(selectedDate)
    const isPM = newDate.getHours() >= 12
    newDate.setHours(isPM ? hour + 12 : hour)
    setSelectedDate(newDate)
  }

  const handleMinutePress = (minute: number) => {
    const newDate = new Date(selectedDate)
    newDate.setMinutes(minute)
    setSelectedDate(newDate)
  }

  const handleAmPmPress = (value: string) => {
    const newDate = new Date(selectedDate)
    const currentHours = newDate.getHours()
    const is24Hour = Platform.OS === 'android'
    
    if (value === 'AM' && currentHours >= 12) {
      newDate.setHours(currentHours - 12)
    } else if (value === 'PM' && currentHours < 12) {
      newDate.setHours(currentHours + 12)
    }
    
    setSelectedDate(newDate)
  }

  const handleDone = () => {
    onChange(selectedDate)
    setShowModal(false)
    
    // For datetime mode on first close, switch to time
    if (mode === 'datetime' && pickerMode === 'date') {
      setTimeout(() => {
        setPickerMode('time')
        setShowModal(true)
      }, 300)
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

  const renderDatePicker = () => {
    const monthsToRender = months.map((month, index) => (
      <TouchableOpacity
        key={month}
        style={[
          styles.pickerItem,
          { backgroundColor: selectedDate.getMonth() === index ? colors.accent : 'transparent' }
        ]}
        onPress={() => handleMonthPress(index)}
      >
        <Text style={[
          styles.pickerText,
          { color: selectedDate.getMonth() === index ? '#fff' : colors.text }
        ]}>
          {month}
        </Text>
      </TouchableOpacity>
    ))

    const daysInMonth = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth())
    const daysToRender = Array.from({ length: daysInMonth }, (_, i) => (
      <TouchableOpacity
        key={i + 1}
        style={[
          styles.pickerItem,
          { backgroundColor: selectedDate.getDate() === i + 1 ? colors.accent : 'transparent' }
        ]}
        onPress={() => handleDayPress(i + 1)}
      >
        <Text style={[
          styles.pickerText,
          { color: selectedDate.getDate() === i + 1 ? '#fff' : colors.text }
        ]}>
          {i + 1}
        </Text>
      </TouchableOpacity>
    ))

    const yearsToRender = years.map((year) => (
      <TouchableOpacity
        key={year}
        style={[
          styles.pickerItem,
          { backgroundColor: selectedDate.getFullYear() === year ? colors.accent : 'transparent' }
        ]}
        onPress={() => handleYearPress(year)}
      >
        <Text style={[
          styles.pickerText,
          { color: selectedDate.getFullYear() === year ? '#fff' : colors.text }
        ]}>
          {year}
        </Text>
      </TouchableOpacity>
    ))

    return (
      <View style={styles.datePickerContainer}>
        <View style={styles.pickerSection}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>Month</Text>
          <ScrollView style={styles.pickerScrollView}>
            {monthsToRender}
          </ScrollView>
        </View>
        <View style={styles.pickerSection}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>Day</Text>
          <ScrollView style={styles.pickerScrollView}>
            {daysToRender}
          </ScrollView>
        </View>
        <View style={styles.pickerSection}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>Year</Text>
          <ScrollView style={styles.pickerScrollView}>
            {yearsToRender}
          </ScrollView>
        </View>
      </View>
    )
  }

  const renderTimePicker = () => {
    const currentHours = selectedDate.getHours()
    const displayHour = currentHours % 12 === 0 ? 12 : currentHours % 12
    const isPM = currentHours >= 12
    
    const hoursToRender = hours.map((hour) => (
      <TouchableOpacity
        key={hour}
        style={[
          styles.pickerItem,
          { backgroundColor: displayHour === hour ? colors.accent : 'transparent' }
        ]}
        onPress={() => handleHourPress(hour === 12 ? 0 : hour)}
      >
        <Text style={[
          styles.pickerText,
          { color: displayHour === hour ? '#fff' : colors.text }
        ]}>
          {hour}
        </Text>
      </TouchableOpacity>
    ))

    const minutesToRender = minutes.map((minute) => (
      <TouchableOpacity
        key={minute}
        style={[
          styles.pickerItem,
          { backgroundColor: selectedDate.getMinutes() === minute ? colors.accent : 'transparent' }
        ]}
        onPress={() => handleMinutePress(minute)}
      >
        <Text style={[
          styles.pickerText,
          { color: selectedDate.getMinutes() === minute ? '#fff' : colors.text }
        ]}>
          {minute.toString().padStart(2, '0')}
        </Text>
      </TouchableOpacity>
    ))

    const ampmToRender = ampm.map((value) => (
      <TouchableOpacity
        key={value}
        style={[
          styles.pickerItem,
          { backgroundColor: (isPM ? 'PM' : 'AM') === value ? colors.accent : 'transparent' }
        ]}
        onPress={() => handleAmPmPress(value)}
      >
        <Text style={[
          styles.pickerText,
          { color: (isPM ? 'PM' : 'AM') === value ? '#fff' : colors.text }
        ]}>
          {value}
        </Text>
      </TouchableOpacity>
    ))

    return (
      <View style={styles.datePickerContainer}>
        <View style={styles.pickerSection}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>Hour</Text>
          <ScrollView style={styles.pickerScrollView}>
            {hoursToRender}
          </ScrollView>
        </View>
        <View style={styles.pickerSection}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>Minute</Text>
          <ScrollView style={styles.pickerScrollView}>
            {minutesToRender}
          </ScrollView>
        </View>
        <View style={styles.pickerSection}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>AM/PM</Text>
          <ScrollView style={styles.pickerScrollView}>
            {ampmToRender}
          </ScrollView>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TouchableOpacity 
        style={[styles.dateButton, { backgroundColor: colors.card }]} 
        onPress={() => {
          if (date) setSelectedDate(date)
          // Reset to date mode for datetime when opening
          if (mode === 'datetime') {
            setPickerMode('date')
          }
          setShowModal(true)
        }}
      >
        <Text style={[styles.dateText, { color: colors.text }]}>
          {getDisplayText()}
        </Text>
      </TouchableOpacity>
      
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {pickerMode === 'date' ? 'Select Date' : 'Select Time'}
              </Text>
              <TouchableOpacity onPress={handleDone}>
                <Text style={[styles.doneButton, { color: colors.accent }]}>Done</Text>
              </TouchableOpacity>
            </View>
            
            {pickerMode === 'date' ? renderDatePicker() : renderTimePicker()}
          </View>
        </View>
      </Modal>
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
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerSection: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  pickerScrollView: {
    height: 200,
  },
  pickerItem: {
    padding: 12,
    marginVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
  }
})

export default CustomDateTimePicker 