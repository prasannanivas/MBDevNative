import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import COLORS from '../utils/colors';

const ReminderModal = ({ visible, onClose, client, onSuccess }) => {
  const { broker, authToken } = useAuth();
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (visible) {
      console.log('🟡 [ReminderModal] Opened — client._id:', client?._id);
      console.log('🟡 [ReminderModal] Opened — full client:', JSON.stringify(client));
      console.log('🟡 [ReminderModal] Opened — client.mbActivityStatus:', client?.mbActivityStatus);
    }
  }, [visible, client]); // 1: Date, 2: Custom Date, 3: Type, 4: Inactive Confirmation
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inactiveComment, setInactiveComment] = useState('');
  
  // Custom date inputs
  const [customDay, setCustomDay] = useState('');
  const [customMonth, setCustomMonth] = useState('');
  const [customYear, setCustomYear] = useState('');

  const dateOptions = ['Today', 'Tomorrow', 'Next week', 'Next month', 'Custom'];
  const typeOptions = ['Call client', 'Call Realtor', 'Message client', 'Message Realtor'];

  const handleDateSelect = (option) => {
    Keyboard.dismiss();
    if (option === 'Custom') {
      setStep(2);
      return;
    }
    
    let date = new Date();
    switch(option) {
      case 'Today':
        date.setHours(date.getHours() + 1, 0, 0, 0);
        break;
      case 'Tomorrow':
        date.setDate(date.getDate() + 1);
        date.setHours(9, 0, 0, 0);
        break;
      case 'Next week':
        date.setDate(date.getDate() + 7);
        date.setHours(9, 0, 0, 0);
        break;
      case 'Next month':
        date.setMonth(date.getMonth() + 1);
        date.setHours(9, 0, 0, 0);
        break;
    }
    setSelectedDate(date);
    setStep(3);
  };

  const handleCustomDateNext = () => {
    Keyboard.dismiss();
    if (!customDay || !customMonth || !customYear) {
      Alert.alert('Error', 'Please enter day, month, and year');
      return;
    }
    
    const date = new Date(parseInt(customYear), parseInt(customMonth) - 1, parseInt(customDay), 9, 0, 0, 0);
    if (isNaN(date.getTime())) {
      Alert.alert('Error', 'Invalid date');
      return;
    }
    
    setSelectedDate(date);
    setStep(3);
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!selectedDate || !selectedType || !client?._id || !authToken) {
      Alert.alert('Error', 'Please complete all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to server (single source of truth)
      const response = await fetch(
        `${API_BASE_URL}/admin/client/${client._id}/reminders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            date: selectedDate.toISOString(),
            comment: comment || selectedType,
            type: selectedType,
          }),
        }
      );

      if (response.ok) {
        console.log('✅ Reminder saved to server');
        Alert.alert('Success', 'Reminder set successfully');
        if (onSuccess) onSuccess(); // Trigger refresh
        handleClose();
        // Let the parent screen handle syncing when it becomes focused
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to set reminder');
      }
    } catch (error) {
      console.error('❌ Error setting reminder:', error);
      Alert.alert('Error', 'Failed to set reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setStep(1);
    setSelectedDate(null);
    setSelectedType(null);
    setComment('');
    setCustomDay('');
    setCustomMonth('');
    setCustomYear('');
    setInactiveComment('');
    onClose();
  };

  const handleInactiveClick = () => {
    console.log('🔴 [ReminderModal] Inactive/Active toggle button clicked');
    console.log('🔴 [ReminderModal] Client:', client);
    console.log('🔴 [ReminderModal] Current status:', client?.mbActivityStatus);
    Keyboard.dismiss();
    setStep(4);
  };

  const handleToggleInactive = async () => {
    console.log('🔴 [ReminderModal] handleToggleInactive called');
    console.log('🔴 [ReminderModal] Client ID:', client?._id);
    console.log('🔴 [ReminderModal] Inactive comment:', inactiveComment);
    console.log('🔴 [ReminderModal] API_BASE_URL:', API_BASE_URL);
    Keyboard.dismiss();
    if (!client?._id || !authToken) {
      console.log('❌ [ReminderModal] Missing client ID or auth token');
      Alert.alert('Error', 'Client information not available');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🔴 [ReminderModal] Making API call to toggle inactive...');
      const response = await fetch(
        `${API_BASE_URL}/admin/client/${client._id}/toggle-inactive`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            comment: inactiveComment,
          }),
        }
      );
      console.log('🔴 [ReminderModal] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [ReminderModal] Toggle inactive successful:', data);
        
        // Clear AsyncStorage cache to force fresh fetch
        const storageKey = `reminders_${broker._id}`;
        await AsyncStorage.removeItem(storageKey);
        console.log('🗑️ Cleared reminders cache after status toggle');
        
        Alert.alert('Success', data.message || 'Client status updated');
        console.log('🔄 [ReminderModal] Calling onSuccess to refresh data');
        if (onSuccess) onSuccess(); // Trigger refresh
        handleClose();
      } else {
        const errorData = await response.json();
        console.log('❌ [ReminderModal] Toggle inactive failed:', errorData);
        Alert.alert('Error', errorData.error || 'Failed to update client status');
      }
    } catch (error) {
      console.error('❌ Error toggling inactive status:', error);
      Alert.alert('Error', 'Failed to update client status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDateStep = () => {
    const isInactive = client?.mbActivityStatus === 'Inactive';
    
    return (
    <View style={styles.modalContent}>
      <Text style={styles.title}>Set reminder - Date</Text>

      <View style={styles.optionsList}>
        {dateOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.option, selectedDate && option === 'Custom' && styles.optionSelected]}
            onPress={() => handleDateSelect(option)}
          >
            <Text style={[styles.optionText, selectedDate && option === 'Custom' && styles.optionTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.inactiveButton, isInactive && styles.activeButton]} 
        onPress={handleInactiveClick}
      >
        <Text style={styles.inactiveButtonText}>
          {isInactive ? 'Make Active' : 'Set as Inactive'}
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomButtons}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );};


  const renderCustomDateStep = () => (
    <View style={styles.modalContent}>
      <Text style={styles.title}>Set reminder</Text>

      <View style={styles.customDateHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.customLabel}>
          <Text style={styles.customLabelText}>Custom</Text>
        </View>
      </View>

      <View style={styles.dateInputsRow}>
        <TextInput
          style={styles.dateInput}
          placeholder="Day"
          placeholderTextColor="#999"
          keyboardType="number-pad"
          maxLength={2}
          value={customDay}
          onChangeText={setCustomDay}
        />
        <TextInput
          style={styles.dateInput}
          placeholder="Month"
          placeholderTextColor="#999"
          keyboardType="number-pad"
          maxLength={2}
          value={customMonth}
          onChangeText={setCustomMonth}
        />
        <TextInput
          style={styles.dateInput}
          placeholder="Year"
          placeholderTextColor="#999"
          keyboardType="number-pad"
          maxLength={4}
          value={customYear}
          onChangeText={setCustomYear}
        />
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleCustomDateNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTypeStep = () => (
    <View style={styles.modalContent}>
      <Text style={styles.title}>Set reminder - Type</Text>

      <View style={styles.optionsList}>
        {typeOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.option, selectedType === option && styles.optionSelected]}
            onPress={() => setSelectedType(option)}
          >
            <Text style={[styles.optionText, selectedType === option && styles.optionTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
        
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment here"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
        />
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInactiveConfirmation = () => {
    const isCurrentlyInactive = client?.mbActivityStatus === 'Inactive';
    const newStatus = isCurrentlyInactive ? 'active' : 'inactive';
    
    return (
    <View style={styles.modalContent}>
      <Text style={styles.confirmTitle}>Are you sure you want to set</Text>
      <Text style={styles.clientName}>{client?.name || `${client?.firstName} ${client?.lastName}` || 'this client'}</Text>
      <Text style={styles.confirmSubtext}>to {newStatus}?</Text>

      <TextInput
        style={styles.commentInput}
        placeholder={isCurrentlyInactive ? "Add a comment (optional)" : "Add a comment here"}
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        value={inactiveComment}
        onChangeText={setInactiveComment}
      />

      <View style={styles.confirmButtons}>
        <TouchableOpacity style={styles.cancelButtonConfirm} onPress={() => setStep(1)}>
          <Text style={styles.cancelTextConfirm}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.confirmYesButton} 
          onPress={handleToggleInactive}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmYesText}>Yes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );};


  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              {step === 1 && renderDateStep()}
              {step === 2 && renderCustomDateStep()}
              {step === 3 && renderTypeStep()}
              {step === 4 && renderInactiveConfirmation()}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    padding: 32,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202020',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'futura',
  },
  optionsList: {
    marginBottom: 20,
  },
  option: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 327,
    marginBottom: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#377473',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#377473',
  },
  optionText: {
    fontSize: 14,
    color: '#377473',
    fontWeight: '700',
    fontFamily: 'futura',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  customDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#377473',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 16,
    color: '#377473',
    fontWeight: '600',
    fontFamily: 'Futura Book',
  },
  customLabel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 32,
    backgroundColor: '#377473',
    marginLeft: 12,
    alignItems: 'center',
  },
  customLabelText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Futura Book',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#377473',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#202020',
    fontFamily: 'Futura Book',
    textAlign: 'center',
  },
  commentInput: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#202020',
    fontFamily: 'Futura Book',
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 18,
    color: '#202020',
    fontWeight: '600',
    fontFamily: 'Futura Book',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#377473',
    backgroundColor: 'transparent',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#377473',
    fontWeight: '600',
    fontFamily: 'Futura Book',
  },
  saveButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#377473',
    backgroundColor: 'transparent',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#377473',
    fontWeight: '600',
    fontFamily: 'Futura Book',
  },
  inactiveButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 327,
    backgroundColor: '#D2935A',
    alignItems: 'center',
    marginBottom: 20,
  },
  inactiveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'futura',
  },
  activeButton: {
    backgroundColor: '#4CAF50', // Green for "Make Active"
  },
  confirmTitle: {
    fontSize: 14,
    color: '#202020',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Futura Book',
  },
  clientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202020',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'futura',
  },
  confirmSubtext: {
    fontSize: 14,
    color: '#202020',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Futura Book',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  cancelButtonConfirm: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#377473',
    backgroundColor: 'transparent',
  },
  cancelTextConfirm: {
    fontSize: 16,
    color: '#377473',
    fontWeight: '600',
    fontFamily: 'Futura Book',
  },
  confirmYesButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 32,
    backgroundColor: '#D2935A',
    alignItems: 'center',
  },
  confirmYesText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'futura',
  },
});

export default ReminderModal;
