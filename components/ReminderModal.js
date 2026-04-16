import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import COLORS from '../utils/colors';

const ReminderModal = ({ visible, onClose, client, onSuccess, sourceScreen = 'MBMain', defaultReminderType = null }) => {
  const { broker, authToken } = useAuth();
  const [step, setStep] = useState(1);

  // Animation values
  const slideAnim = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      console.log('🟡 [ReminderModal] Opened — client._id:', client?._id);
      console.log('🟡 [ReminderModal] Opened — full client:', JSON.stringify(client));
      console.log('🟡 [ReminderModal] Opened — client.mbActivityStatus:', client?.mbActivityStatus);
      
      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 600,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, client]); // 1: Type (Call/Message + Realtor/Client), 2: Date, 3: Custom Date, 4: Inactive Confirmation
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [contactMethod, setContactMethod] = useState(sourceScreen === 'Messages' ? 'Message' : 'Call');
  const [contactTarget, setContactTarget] = useState('client');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inactiveComment, setInactiveComment] = useState('');
  
  // Custom date inputs
  const [customDay, setCustomDay] = useState('');
  const [customMonth, setCustomMonth] = useState('');
  const [customYear, setCustomYear] = useState('');
  const [customDateValue, setCustomDateValue] = useState(new Date());
  
  // Android date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');

  const dateOptions = ['Today', 'Tomorrow', 'Next week', 'Next month', 'Custom'];
  
  // Check if client has a realtor
  const hasRealtor = client?.realtorInfo && Object.keys(client.realtorInfo).length > 0;
  
  // Build the selectedType from contactMethod and contactTarget
  const buildSelectedType = () => {
    return `${contactMethod} ${contactTarget}`;
  };
  
  // Reset defaults based on source screen when modal opens
  useEffect(() => {
    if (visible) {
      if (defaultReminderType) {
        // If defaultReminderType is provided, extract target (client or Realtor)
        console.log('🎯 [ReminderModal] Using default reminder type:', defaultReminderType);
        
        // Parse the defaultReminderType to extract target
        // e.g., "Call client" -> target: "client", "Call Realtor" -> target: "Realtor"
        const parts = defaultReminderType.split(' ');
        const target = parts.slice(1).join(' '); // "client" or "Realtor"
        
        setContactTarget(target);
        setContactMethod(sourceScreen === 'Messages' ? 'Message' : 'Call');
      } else {
        setContactMethod(sourceScreen === 'Messages' ? 'Message' : 'Call');
        setContactTarget('client');
      }
      setStep(1); // Start from date selection
    }
  }, [visible, sourceScreen, defaultReminderType]);
  
  // Filter type options based on whether client has a realtor assigned
  const getTypeOptions = () => {
    // Check if this client has a realtor (realtorInfo field exists)
    const hasRealtor = client?.realtorInfo && Object.keys(client.realtorInfo).length > 0;
    
    console.log('🔍 [ReminderModal] Client:', client?.name);
    console.log('🔍 [ReminderModal] Has realtorInfo:', hasRealtor);
    console.log('🔍 [ReminderModal] RealtorInfo:', client?.realtorInfo);
    
    if (hasRealtor) {
      // Client has a realtor, show all 4 options
      console.log('✅ [ReminderModal] Showing all 4 options (client + realtor)');
      return ['Call client', 'Message client', 'Call Realtor', 'Message Realtor'];
    } else {
      // No realtor, show only client contact options
      console.log('✅ [ReminderModal] Showing only Client options');
      return ['Call client', 'Message client'];
    }
  };
  
  const typeOptions = getTypeOptions();

  const handleDateSelect = (option) => {
    Keyboard.dismiss();
    if (option === 'Custom') {
      setStep(3);
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
    setStep(2);
  };

  const handleCustomDateNext = () => {
    Keyboard.dismiss();
    setSelectedDate(customDateValue);
    setStep(2);
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    const selectedType = buildSelectedType();
    if (!selectedDate || !selectedType || !client?._id || !authToken) {
      Alert.alert('Error', 'Please complete all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Encode type in comment field using unique separator |~|
      const encodedComment = `${selectedType}|~|${comment || ''}`;
      
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
            comment: encodedComment,
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
    setContactMethod(sourceScreen === 'Messages' ? 'Message' : 'Call');
    setContactTarget('client');
    setComment('');
    setCustomDay('');
    setCustomMonth('');
    setCustomYear('');
    setCustomDateValue(new Date());
    setShowDatePicker(false);
    setDatePickerMode('date');
    setInactiveComment('');
    onClose();
  };

  const handleInactiveClick = () => {
    console.log('🔴 [ReminderModal] Inactive/Active toggle button clicked');
    console.log('🔴 [ReminderModal] Client:', client);
    console.log('🔴 [ReminderModal] Current status:', client?.mbActivityStatus);
    Keyboard.dismiss();
    setStep(5);
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
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );};

  const renderMainStep = () => {
    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Set reminder - Date</Text>

        {/* Date Display Row */}
        <View style={styles.customDateHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.customLabel}>
            <Text style={styles.customLabelText}>{getDateDisplayText()}</Text>
          </View>
        </View>

        {/* Call / Message Row */}
        <View style={styles.contactMethodRow}>
          <TouchableOpacity 
            style={[styles.contactOption, contactMethod === 'Call' && styles.contactOptionSelected]} 
            onPress={() => setContactMethod('Call')}
          >
            {contactMethod === 'Call' && <Text style={styles.checkmark}>✓</Text>}
            <Text style={[styles.contactOptionText, contactMethod === 'Call' && styles.contactOptionTextSelected]}>
              Call
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.contactOption, contactMethod === 'Message' && styles.contactOptionSelected]} 
            onPress={() => setContactMethod('Message')}
          >
            {contactMethod === 'Message' && <Text style={styles.checkmark}>✓</Text>}
            <Text style={[styles.contactOptionText, contactMethod === 'Message' && styles.contactOptionTextSelected]}>
              Message
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comment Input */}
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment here"
          placeholderTextColor="#4D4D4D"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
        />

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
      </ScrollView>
    );
  };


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

      <View style={styles.datePickerContainer}>
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={customDateValue}
            mode="date"
            display="spinner"
            onChange={(event, date) => {
              if (date) {
                setCustomDateValue(date);
              }
            }}
            textColor="#202020"
            style={{ transform: [{ scaleY: 0.9 }, { scaleX: 0.9 }] }}
          />
        ) : (
          <>
            <Text style={styles.dateTimeLabel}>Select Date</Text>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeButtonText}>
                {customDateValue.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={customDateValue}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (event.type === 'set' && date) {
                    setCustomDateValue(date);
                  }
                  setShowDatePicker(false);
                }}
              />
            )}
          </>
        )}
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleCustomDateNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getDateDisplayText = () => {
    if (!selectedDate) return '';
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isSameDay = (d1, d2) => 
      d1.getDate() === d2.getDate() && 
      d1.getMonth() === d2.getMonth() && 
      d1.getFullYear() === d2.getFullYear();
    
    if (isSameDay(selectedDate, today)) return 'Today';
    if (isSameDay(selectedDate, tomorrow)) return 'Tomorrow';
    
    return selectedDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderInactiveConfirmation = () => {
    const isCurrentlyInactive = client?.mbActivityStatus === 'Inactive';
    const newStatus = isCurrentlyInactive ? 'active' : 'inactive';
    
    return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.modalContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.confirmTitle}>Are you sure you want to set</Text>
      <Text style={styles.clientName}>{client?.name || `${client?.firstName} ${client?.lastName}` || 'this client'}</Text>
      <Text style={styles.confirmSubtext}>to {newStatus}?</Text>

      <TextInput
        style={styles.commentInput}
        placeholder={isCurrentlyInactive ? "Add a comment (optional)" : "Add a comment here"}
        placeholderTextColor="#4D4D4D"
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
    </ScrollView>
  );};


  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <Animated.View 
              style={[
                styles.backdropOverlay, 
                { opacity: backdropOpacity }
              ]} 
            />
          </TouchableWithoutFeedback>

          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View>
                {step === 1 && renderDateStep()}
                {step === 2 && renderMainStep()}
                {step === 3 && renderCustomDateStep()}
                {step === 5 && renderInactiveConfirmation()}
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FDFDFD',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    maxHeight: '90%',
    marginHorizontal: 16,
    marginBottom: 40,
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: '100%',
  },
  modalContent: {
    backgroundColor: '#FDFDFD',
    borderRadius: 0,
    padding: 32,
    paddingBottom: 40,
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 327,
    marginBottom: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#377473',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#377473',
  },
  optionText: {
    fontSize: 12,
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
    borderRadius: 327,
    borderWidth: 1,
    borderColor: '#377473',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 12,
    color: '#377473',
    fontWeight: '700',
    fontFamily: 'futura',
  },
  customLabel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 327,
    backgroundColor: '#377473',
    marginLeft: 12,
    alignItems: 'center',
  },
  customLabelText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'futura',
  },
  contactMethodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  contactOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 327,
    borderWidth: 1,
    borderColor: '#377473',
    backgroundColor: 'transparent',
  },
  contactOptionSelected: {
    backgroundColor: '#377473',
  },
  contactOptionText: {
    fontSize: 12,
    color: '#377473',
    fontWeight: '700',
    fontFamily: 'futura',
  },
  contactOptionTextSelected: {
    color: '#FFFFFF',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 8,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  datePickerContainer: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dateTimeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#202020',
    marginBottom: 12,
    textAlign: 'center',
  },
  dateTimeButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#377473',
    alignItems: 'center',
  },
  dateTimeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202020',
    textAlign: 'center',
  },
  dateInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    fontSize: 14,
    color: '#4D4D4D',
    fontFamily: 'futura',
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 327,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#377473',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 12,
    color: '#377473',
    fontWeight: '700',
    fontFamily: 'futura',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 327,
    borderWidth: 1,
    borderColor: '#377473',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 12,
    color: '#377473',
    fontWeight: '700',
    fontFamily: 'futura',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 327,
    borderWidth: 1,
    borderColor: '#377473',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 12,
    color: '#377473',
    fontWeight: '700',
    fontFamily: 'futura',
  },
  inactiveButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 327,
    backgroundColor: '#F0913A',
    alignItems: 'center',
    marginBottom: 10,
  },
  inactiveButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'futura',
  },
  activeButton: {
    backgroundColor: '#4CAF50', // Green for "Make Active"
  },
  confirmTitle: {
    fontSize: 12,
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
    fontSize: 12,
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
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 327,
    borderWidth: 1,
    borderColor: '#377473',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelTextConfirm: {
    fontSize: 12,
    color: '#377473',
    fontWeight: '700',
    fontFamily: 'futura',
  },
  confirmYesButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 327,
    backgroundColor: '#D2935A',
    alignItems: 'center',
  },
  confirmYesText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'futura',
  },
});

export default ReminderModal;
