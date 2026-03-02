import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import COLORS from '../utils/colors';
import { scheduleReminderNotification, cancelReminderNotification } from '../services/NotificationService';

const RemindersScreen = () => {
  const navigation = useNavigation();
  const { broker, authToken } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        `https://signup.roostapp.io/admin/broker-clients/${broker._id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
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
                  createdAt: reminder.createdAt,
                });
              }
            });
          }
        });

        console.log('📋 Server reminders found:', serverReminders.length);

        // Cache to local storage
        const storageKey = `reminders_${broker._id}`;
        await AsyncStorage.setItem(storageKey, JSON.stringify(serverReminders));
        
        const now = new Date();
        
        // Load existing notification IDs to avoid duplicates
        const notificationStorageKey = `reminder_notifications_${broker._id}`;
        const existingNotificationsData = await AsyncStorage.getItem(notificationStorageKey);
        const existingNotificationIds = existingNotificationsData 
          ? JSON.parse(existingNotificationsData) 
          : {};
        
        // Clean up notification IDs for reminders that no longer exist
        const serverReminderIds = new Set(serverReminders.map(r => r.id));
        const cleanedNotificationIds = {};
        for (const [reminderId, notificationId] of Object.entries(existingNotificationIds)) {
          if (serverReminderIds.has(reminderId)) {
            cleanedNotificationIds[reminderId] = notificationId;
          } else {
            // Cancel orphaned notification
            await cancelReminderNotification(notificationId);
            console.log(`🧹 Cleaned up orphaned notification for deleted reminder ${reminderId}`);
          }
        }
        
        // Schedule notifications ONLY for reminders that don't already have one
        const notificationIds = { ...cleanedNotificationIds };
        for (const reminder of serverReminders) {
          const reminderDate = new Date(reminder.date);
          
          // Only schedule if: 1) in the future, AND 2) not already scheduled
          if (reminderDate > now && !notificationIds[reminder.id]) {
            const notificationId = await scheduleReminderNotification(
              reminder,
              reminder.clientName
            );
            if (notificationId) {
              notificationIds[reminder.id] = notificationId;
              console.log(`📅 Scheduled NEW notification for reminder ${reminder.id}`);
            }
          } else if (notificationIds[reminder.id]) {
            console.log(`⏭️ Skipping reminder ${reminder.id} - already scheduled`);
          }
        }
        
        // Store updated notification IDs
        await AsyncStorage.setItem(
          notificationStorageKey,
          JSON.stringify(notificationIds)
        );
        
        // Sort and display
        const upcomingReminders = serverReminders.filter(r => new Date(r.date) >= now);
        const pastReminders = serverReminders.filter(r => new Date(r.date) < now);
        
        upcomingReminders.sort((a, b) => new Date(a.date) - new Date(b.date));
        pastReminders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const sortedReminders = [...upcomingReminders, ...pastReminders];
        setReminders(sortedReminders);
        
        console.log('✅ Reminders synced and notifications scheduled');
      }
    } catch (error) {
      console.error('❌ Error fetching reminders:', error);
      // Try to load from cache if server fetch fails
      const storageKey = `reminders_${broker._id}`;
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
        `https://signup.roostapp.io/admin/client/${reminder.clientId}/reminders/${reminderId}`,
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
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (diffDays === 0) return `Today at ${timeStr}`;
    if (diffDays === 1) return `Tomorrow at ${timeStr}`;
    if (diffDays === -1) return `Yesterday at ${timeStr}`;
    if (diffDays < -1) return `${dateStr} at ${timeStr}`;
    
    return `${dateStr} at ${timeStr}`;
  };

  const isPastReminder = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const handleClientPress = (reminder) => {
    if (reminder.clientId) {
      navigation.navigate('ClientDetails', { clientId: reminder.clientId });
    }
  };

  const handleDeleteReminder = (reminder) => {
    confirmDelete(reminder.id, reminder.clientName);
  };

  const renderReminderCard = ({ item }) => {
    const isPast = isPastReminder(item.date);
    
    return (
      <View style={[styles.reminderItem, isPast && styles.pastReminderItem]}>
        <View style={styles.cardWrapper}>
          {/* Reminder Card */}
          <TouchableOpacity 
            style={styles.reminderCard}
            onPress={() => handleClientPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContainer}>
              {/* Profile Initials */}
              <View style={styles.profileIcon}>
                <View style={styles.profileIconFrame}>
                  <Text style={styles.initials}>
                    {item.clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </Text>
                </View>
              </View>

              {/* Content Section */}
              <View style={styles.contentSection}>
                {/* Client Name at Top */}
                <Text style={styles.clientName} numberOfLines={1}>
                  {item.clientName}
                </Text>
                
                {/* Time */}
                <Text style={styles.reminderTime}>
                  {formatDate(item.date)}
                </Text>
                
                {/* Comment below */}
                <Text style={styles.reminderText} numberOfLines={2}>
                  {item.comment || item.type || 'Reminder'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Delete Button */}
          <TouchableOpacity onPress={() => handleDeleteReminder(item)}>
            <View style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
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

  // Split reminders into featured (first upcoming) and remaining
  const upcomingReminder = reminders.find(r => !isPastReminder(r.date));
  const remainingReminders = upcomingReminder 
    ? reminders.filter(r => r.id !== upcomingReminder.id)
    : reminders;

  if (loading) {
    return (
      <View style={styles.container}>
        <Header sectionTitle="REMINDERS" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header sectionTitle="REMINDERS" />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {reminders.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Featured Upcoming Reminder */}
            {upcomingReminder && (
              <View style={styles.featuredReminderSection}>
                <View style={styles.cardWrapper}>
                  {/* Featured Reminder Card */}
                  <TouchableOpacity 
                    style={styles.reminderCard}
                    onPress={() => handleClientPress(upcomingReminder)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardContainer}>
                      {/* Profile Initials */}
                      <View style={styles.profileIcon}>
                        <View style={styles.profileIconFrame}>
                          <Text style={styles.initials}>
                            {upcomingReminder.clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </Text>
                        </View>
                      </View>

                      {/* Content Section */}
                      <View style={styles.contentSection}>
                        {/* Client Name at Top */}
                        <Text style={styles.clientName} numberOfLines={1}>
                          {upcomingReminder.clientName}
                        </Text>
                        
                        {/* Time */}
                        <Text style={styles.reminderTime}>
                          {formatDate(upcomingReminder.date)}
                        </Text>
                        
                        {/* Comment below */}
                        <Text style={styles.reminderText} numberOfLines={2}>
                          {upcomingReminder.comment || upcomingReminder.type || 'Reminder'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Delete Button */}
                  <TouchableOpacity onPress={() => handleDeleteReminder(upcomingReminder)}>
                    <View style={styles.deleteButtonFeatured}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Remaining Reminders List */}
            {remainingReminders.map((item) => (
              <View key={item.id} style={styles.reminderItem}>
                {renderReminderCard({ item })}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  featuredReminderSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  reminderItem: {
    marginVertical: 4,
  },
  pastReminderItem: {
    opacity: 0.6,
  },
  cardWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 16,
  },
  reminderCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileIcon: {
    width: 49,
    height: 49,
    backgroundColor: '#4D4D4D',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconFrame: {
    width: 49,
    height: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontFamily: 'futura',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 27,
    color: '#FDFDFD',
    textAlign: 'center',
  },
  contentSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 4,
  },
  clientName: {
    fontFamily: 'futura',
    fontWeight: '600',
    fontSize: 18,
    color: '#202020',
    lineHeight: 24,
  },
  reminderTime: {
    fontFamily: 'futura',
    fontWeight: '500',
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  reminderText: {
    fontFamily: 'futura',
    fontWeight: '400',
    fontSize: 14,
    color: '#797979',
    lineHeight: 18,
    marginTop: 2,
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE8E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonFeatured: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE8E6',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: 'Futura Book',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Futura Book',
  },
});

export default RemindersScreen;
