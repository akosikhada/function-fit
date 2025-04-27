import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { Clock } from 'lucide-react-native';
import ThemeModule from '../utils/theme';

const { useTheme } = ThemeModule;

interface TimePickerProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  label?: string;
}

const TimePickerComponent = ({ selectedTime, onTimeSelect, label }: TimePickerProps) => {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [modalVisible, setModalVisible] = useState(false);
  
  // Create time options in 30-minute intervals
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const period = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const formattedTime = `${displayHour}:${minute === 0 ? '00' : minute} ${period}`;
      timeOptions.push(formattedTime);
    }
  }

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      
      <TouchableOpacity 
        style={[styles.timeButton, { 
          backgroundColor: colors.card,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }]} 
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.buttonContent}>
          <Clock size={20} color={isDarkMode ? "#8B5CF6" : "#6366F1"} style={styles.icon} />
          <Text style={[styles.timeText, { color: colors.text }]}>
            {selectedTime || '6:00 PM'}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Time
            </Text>
            
            <View style={styles.timeGrid}>
              {timeOptions.map((time, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeOption,
                    selectedTime === time && { 
                      backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(99, 102, 241, 0.1)' 
                    }
                  ]}
                  onPress={() => {
                    onTimeSelect(time);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      { color: colors.text },
                      selectedTime === time && { 
                        color: isDarkMode ? '#8B5CF6' : '#6366F1',
                        fontWeight: '600'
                      }
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={[styles.closeButton, { 
                backgroundColor: isDarkMode ? '#8B5CF6' : '#6366F1' 
              }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
  timeButton: {
    padding: 15,
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  timeText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeOption: {
    width: '30%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  timeOptionText: {
    fontSize: 14,
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TimePickerComponent; 