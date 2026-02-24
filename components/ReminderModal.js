import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import COLORS from '../utils/colors';

const ReminderModal = ({ visible, onClose, client }) => {
  const { authToken } = useAuth();
  const [selectedTime, setSelectedTime] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickOptions = [
    { label: '30 minutes', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '2 hours', minutes: 120 },
    { label: '4 hours', minutes: 240 },
    { label: 'Tomorrow 9 AM', value: 'tomorrow9am' },
    { label: 'Custom', value: 'custom' },
  ];

  const handleOptionSelect = (option) => {
    if (option.value === 'custom') {
      setShowDatePicker(true);
    } else if (option.value === 'tomorrow9am') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setSelectedTime(tomorrow);
    } else {
      const reminderTime = new Date();
      reminderTime.setMinutes(reminderTime.getMinutes() + option.minutes);
      setSelectedTime(reminderTime);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setCustomDate(date);
      setSelectedTime(date);
    }
  };

  const handleSetReminder = async () => {
    if (!selectedTime || !client?._id || !authToken) {
      Alert.alert('Error', 'Please select a reminder time');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `https://signup.roostapp.io/admin/client/${client._id}/reminders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            date: selectedTime.toISOString(),
            comment: `Follow up with ${client.firstName || client.name || 'client'}`,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Reminder set successfully');
        setSelectedTime(null);
        onClose();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to set reminder');
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      Alert.alert('Error', 'Failed to set reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Set Reminder</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.slate} />
                </TouchableOpacity>
              </View>

              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>
                  {client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client'}
                </Text>
              </View>

              <View style={styles.optionsContainer}>
                {quickOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      (selectedTime && option.value !== 'custom' && option.value !== 'tomorrow9am') && styles.optionSelected,
                    ]}
                    onPress={() => handleOptionSelect(option)}
                  >
                    <Text style={styles.optionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedTime && (
                <View style={styles.selectedTimeContainer}>
                  <Ionicons name="time" size={20} color={COLORS.green} />
                  <Text style={styles.selectedTimeText}>
                    {selectedTime.toLocaleString()}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.setButton,
                  (!selectedTime || isSubmitting) && styles.setButtonDisabled,
                ]}
                onPress={handleSetReminder}
                disabled={!selectedTime || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.setButtonText}>Set Reminder</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={customDate}
            mode="datetime"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.silver,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  closeButton: {
    padding: 4,
  },
  clientInfo: {
    padding: 20,
    alignItems: 'center',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  option: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: COLORS.greenLight,
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: COLORS.greenLight,
    borderRadius: 8,
  },
  selectedTimeText: {
    fontSize: 14,
    color: COLORS.green,
    fontWeight: '600',
    marginLeft: 8,
  },
  setButton: {
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  setButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  setButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReminderModal;
