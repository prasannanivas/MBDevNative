import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import Header from '../components/Header';
import COLORS from '../utils/colors';
import { scheduleReminderNotification, cancelReminderNotification } from '../services/NotificationService';
import ClientActionModal from '../components/ClientActionModal';
import ReminderModal from '../components/ReminderModal';

const RemindersScreen = () => {
  const navigation = useNavigation();
  const { broker, authToken } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Upcoming'); // 'Upcoming' or 'Past'
  const [sections, setSections] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [modalClientData, setModalClientData] = useState(null);

  // Load reminders from local storage whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAndCacheReminders();
    }, [broker, authToken])
  );

  const fetchAndCacheReminders = async () => {
    if (!broker?._id || !authToken) return;

    try {
      console.log('📋 Fetching reminders from server for broker:', broker._id);
      
      // Fetch from server (single source of truth)
      const response = await fetch(
        `${API_BASE_URL}/admin/broker-clients/${broker._id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Flatten all reminders from all clients
        const serverReminders = [];
        data.assignments?.forEach((assignment) => {
          const client = assignment.clientId;
          
          if (!client) return;
          
          console.log(`📦 [fetchReminders] client: ${client.name} | mbActivityStatus from API: ${client.mbActivityStatus}`);
          
          if (client?.reminders && client.reminders.length > 0) {
            client.reminders.forEach((reminder) => {
              if (reminder.isActive !== false) {
                serverReminders.push({
                  id: reminder._id,
                  date: reminder.date,
                  comment: reminder.comment,
                  type: reminder.type,
                  clientId: client._id,
                  clientName: client.name || client.firstName || 'Client',
                  clientPhone: client.phone,
                  createdAt: reminder.createdAt,
                  // Store full client data for navigation
                  clientData: {
                    _id: client._id,
                    name: client.name,
                    email: client.email,
                    phone: client.phone,
                    type: client.type,
                    status: client.status,
                    mbActivityStatus: client.mbActivityStatus,
                  },
                });
              }
            });
          }
        });

        console.log('📋 Server reminders found:', serverReminders.length);

        const now = new Date();

        // Sort and update UI FIRST — before any notification work that could throw
        const upcomingReminders = serverReminders.filter(r => new Date(r.date) >= now);
        const pastReminders = serverReminders.filter(r => new Date(r.date) < now);
        upcomingReminders.sort((a, b) => new Date(a.date) - new Date(b.date));
        pastReminders.sort((a, b) => new Date(b.date) - new Date(a.date));
        const sortedReminders = [...upcomingReminders, ...pastReminders];
        setReminders(sortedReminders);
        organizeSections(sortedReminders, selectedFilter);

        // Cache fresh data with versioned key (v2 busts any old stale cache)
        const storageKey = `reminders_v2_${broker._id}`;
        await AsyncStorage.setItem(storageKey, JSON.stringify(serverReminders));

        // Notification scheduling in its own try/catch so it can never affect UI state
        try {
          const notificationStorageKey = `reminder_notifications_${broker._id}`;
          const existingNotificationsData = await AsyncStorage.getItem(notificationStorageKey);
          const existingNotificationIds = existingNotificationsData
            ? JSON.parse(existingNotificationsData)
            : {};

          const serverReminderIds = new Set(serverReminders.map(r => r.id));
          const cleanedNotificationIds = {};
          for (const [reminderId, notificationId] of Object.entries(existingNotificationIds)) {
            if (serverReminderIds.has(reminderId)) {
              cleanedNotificationIds[reminderId] = notificationId;
            } else {
              await cancelReminderNotification(notificationId);
              console.log(`🧹 Cleaned up orphaned notification for deleted reminder ${reminderId}`);
            }
          }

          const notificationIds = { ...cleanedNotificationIds };
          for (const reminder of serverReminders) {
            const reminderDate = new Date(reminder.date);
            if (reminderDate > now && !notificationIds[reminder.id]) {
              const notificationId = await scheduleReminderNotification(reminder, reminder.clientName);
              if (notificationId) {
                notificationIds[reminder.id] = notificationId;
                console.log(`📅 Scheduled NEW notification for reminder ${reminder.id}`);
              }
            } else if (notificationIds[reminder.id]) {
              console.log(`⏭️ Skipping reminder ${reminder.id} - already scheduled`);
            }
          }

          await AsyncStorage.setItem(notificationStorageKey, JSON.stringify(notificationIds));
          console.log('✅ Reminders synced and notifications scheduled');
        } catch (notifError) {
          console.warn('⚠️ Notification scheduling failed (UI unaffected):', notifError);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching reminders:', error);
      // Fall back to versioned cache only
      const storageKey = `reminders_v2_${broker._id}`;
      const cached = await AsyncStorage.getItem(storageKey);
      if (cached) {
        const cachedReminders = JSON.parse(cached);
        setReminders(cachedReminders);
        console.log('📱 Loaded from cache:', cachedReminders.length);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAndCacheReminders();
  }, [broker, authToken]);

  useEffect(() => {
    organizeSections(reminders, selectedFilter);
  }, [selectedFilter, reminders]);

  const organizeSections = (remindersList, filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    // Filter based on selected filter
    const filteredReminders = filter === 'Upcoming'
      ? remindersList.filter(r => new Date(r.date) >= now)
      : remindersList.filter(r => new Date(r.date) < now);

    // Group reminders by time period
    const grouped = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    filteredReminders.forEach(reminder => {
      const reminderDate = new Date(reminder.date);
      const reminderDay = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());

      if (reminderDay.getTime() === today.getTime()) {
        grouped.today.push(reminder);
      } else if (reminderDay.getTime() === yesterday.getTime()) {
        grouped.yesterday.push(reminder);
      } else if (reminderDay >= weekStart) {
        grouped.thisWeek.push(reminder);
      } else {
        grouped.older.push(reminder);
      }
    });

    // Sort reminders within groups
    const sortByDate = filter === 'Upcoming'
      ? (a, b) => new Date(a.date) - new Date(b.date)
      : (a, b) => new Date(b.date) - new Date(a.date);

    grouped.today.sort(sortByDate);
    grouped.yesterday.sort(sortByDate);
    grouped.thisWeek.sort(sortByDate);
    grouped.older.sort(sortByDate);

    // Create sections array
    const newSections = [];
    if (grouped.today.length > 0) {
      newSections.push({ title: 'TODAY', data: grouped.today });
    }
    if (grouped.yesterday.length > 0) {
      newSections.push({ title: 'YESTERDAY', data: grouped.yesterday });
    }
    if (grouped.thisWeek.length > 0) {
      newSections.push({ title: 'THIS WEEK', data: grouped.thisWeek });
    }
    if (grouped.older.length > 0) {
      newSections.push({ title: filter === 'Upcoming' ? 'UPCOMING' : 'OLDER', data: grouped.older });
    }

    setSections(newSections);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAndCacheReminders();
  }, [broker, authToken]);

  const deleteReminder = async (reminderId) => {
    try {
      // Delete from server first
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) return;
      
      const response = await fetch(
        `${API_BASE_URL}/admin/client/${reminder.clientId}/reminders/${reminderId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        // Cancel the scheduled notification
        const notificationIdsKey = `reminder_notifications_${broker._id}`;
        const storedNotifications = await AsyncStorage.getItem(notificationIdsKey);
        if (storedNotifications) {
          const notificationIds = JSON.parse(storedNotifications);
          if (notificationIds[reminderId]) {
            await cancelReminderNotification(notificationIds[reminderId]);
          }
        }
        
        Alert.alert('Success', 'Reminder deleted');
        // Refresh from server
        fetchAndCacheReminders();
      } else {
        Alert.alert('Error', 'Failed to delete reminder');
      }
    } catch (error) {
      console.error('❌ Error deleting reminder:', error);
      Alert.alert('Error', 'Failed to delete reminder');
    }
  };

  const confirmDelete = (reminderId, clientName) => {
    Alert.alert(
      'Delete Reminder',
      `Delete reminder for ${clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteReminder(reminderId) },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Create date objects without time for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const reminderDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = reminderDay - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return null; // Today - just show time
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    
    // Format as "March 02 2025"
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    });
    
    return dateStr;
  };

  const formatReminderDisplay = (reminder) => {
    const date = new Date(reminder.date);
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    // Decode type from comment field (format: "TYPE|~|comment")
    let type = 'Reminder';
    let actualComment = reminder.comment || '';
    
    if (reminder.comment && reminder.comment.includes('|~|')) {
      const parts = reminder.comment.split('|~|');
      type = parts[0];
      actualComment = parts.slice(1).join('|~|'); // In case comment itself has |~|
    }
    
    const action = actualComment || type;
    const dateInfo = formatDate(reminder.date);
    
    return {
      time: timeStr,
      action: action,
      type: type,
      dateInfo: dateInfo,
    };
  };

  const handleClientPress = (reminder) => {
    setSelectedClient(reminder);
    setShowActionModal(true);
  };

  const handleCall = async () => {
    if (selectedClient?.clientPhone) {
      setShowActionModal(false);
      const phoneNumber = selectedClient.clientPhone.replace(/[^0-9]/g, '');
      const url = `tel:${phoneNumber}`;
      try {
        await Linking.openURL(url);
        
        // Send notification to client
        if (selectedClient?.clientId) {
          await fetch(
            `${API_BASE_URL}/admin/client/${selectedClient.clientId}/broker-call-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
            }
          );
        }
      } catch (error) {
        console.error('Error making call:', error);
        Alert.alert('Error', 'Could not initiate call');
      }
    } else {
      setShowActionModal(false);
      Alert.alert('No Phone Number', 'This client does not have a phone number on file.');
    }
  };

  const handleMessage = () => {
    if (selectedClient?.clientId) {
      setShowActionModal(false);
      // Navigate to Messages or open chat
      navigation.navigate('Messages');
    }
  };

  const handleSetReminder = () => {
    if (selectedClient?.clientData) {
      console.log('🔍 [handleSetReminder] selectedClient.clientId:', selectedClient.clientId, '| type:', typeof selectedClient.clientId);
      console.log('🔍 [handleSetReminder] selectedClient.clientData.mbActivityStatus:', selectedClient.clientData?.mbActivityStatus);
      console.log('🔍 [handleSetReminder] reminders count:', reminders.length);
      // Use String() to ensure type-safe comparison (ObjectId vs string)
      const freshReminder = reminders.find(r => String(r.clientId) === String(selectedClient.clientId));
      console.log('🔍 [handleSetReminder] freshReminder found:', !!freshReminder);
      console.log('🔍 [handleSetReminder] freshReminder.clientData:', JSON.stringify(freshReminder?.clientData));
      const freshClientData = freshReminder?.clientData || selectedClient.clientData;
      console.log('🔍 [handleSetReminder] final mbActivityStatus going to modal:', freshClientData?.mbActivityStatus);
      // Set modalClientData and open modal in same batch — avoids stale selectedClient issue
      setModalClientData(freshClientData);
      setShowActionModal(false);
      setShowReminderModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowActionModal(false);
    setSelectedClient(null);
  };

  const handleDeleteReminder = (reminder) => {
    confirmDelete(reminder.id, reminder.clientName);
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderReminderItem = ({ item }) => {
    const display = formatReminderDisplay(item);
    const isInactive = item.clientData?.mbActivityStatus === 'Inactive';
    
    return (
      <TouchableOpacity
        style={[styles.reminderItem, isInactive && styles.reminderItemInactive]}
        onPress={() => handleClientPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.reminderContent}>
          <Text style={[styles.clientName, isInactive && styles.clientNameInactive]}>
            {item.clientName}
            {isInactive && <Text style={styles.inactiveLabel}> (Inactive)</Text>}
          </Text>
          <View style={styles.reminderDetails}>
            <Text style={[styles.reminderTime, isInactive && styles.reminderTimeInactive]}>{display.time}</Text>
            <Text style={[styles.reminderType, isInactive && styles.reminderTypeInactive]} numberOfLines={1}>
              {display.type}
            </Text>
            {display.action && (
              <Text style={[styles.reminderAction, isInactive && styles.reminderActionInactive]} numberOfLines={2}>
                {display.action}
              </Text>
            )}
            {display.dateInfo && (
              <Text style={[styles.reminderDateInfo, isInactive && styles.reminderDateInfoInactive]}>
                {display.dateInfo}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateText}>No reminders set</Text>
      <Text style={styles.emptyStateSubtext}>
        Set reminders from client profiles to get notified
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      
      {/* Title and Filter Buttons */}
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>REMINDERS</Text>
        <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'Upcoming' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('Upcoming')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'Upcoming' && styles.filterButtonTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'Past' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('Past')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'Past' && styles.filterButtonTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderReminderItem}
        renderSectionHeader={renderSectionHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Action Modal */}
      <ClientActionModal
        visible={showActionModal}
        onClose={handleCloseModal}
        clientName={selectedClient?.clientName}
        client={selectedClient?.clientData}
        authToken={authToken}
        onCall={handleCall}
        onMessage={handleMessage}
        onSetReminder={handleSetReminder}
      />

      {/* Reminder Modal */}
      <ReminderModal
        visible={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          fetchAndCacheReminders();
        }}
        client={modalClientData}
        sourceScreen="MBMain"
        onSuccess={() => fetchAndCacheReminders()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#F5F5F5',
  },
  sectionTitle: {
    color: "#797979",
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'futura',
    paddingLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#2E2E2E',
    borderColor: '#2E2E2E',
  },
  filterButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'futura',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingTop: 20,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#797979',
    letterSpacing: 1,
    fontFamily: 'futura',
  },
  reminderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#202020',
    fontFamily: 'futura',
    flex: 1,
  },
  reminderDetails: {
    alignItems: 'flex-end',
    marginLeft: 16,
    maxWidth: '60%',
  },
  reminderTime: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999999',
    marginBottom: 4,
    fontFamily: 'futura',
  },
  reminderType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#377473',
    marginBottom: 4,
    fontFamily: 'futura',
    textAlign: 'right',
  },
  reminderAction: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'futura',
    textAlign: 'right',
    marginBottom: 2,
  },
  reminderDateInfo: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999999',
    fontFamily: 'futura',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202020',
    marginTop: 16,
    fontFamily: 'futura',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'futura',
  },
  reminderItemInactive: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  clientNameInactive: {
    color: '#999999',
  },
  inactiveLabel: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  reminderTimeInactive: {
    color: '#CCCCCC',
  },
  reminderTypeInactive: {
    color: '#AAAAAA',
  },
  reminderActionInactive: {
    color: '#AAAAAA',
  },
  reminderDateInfoInactive: {
    color: '#CCCCCC',
  },
});

export default RemindersScreen;
