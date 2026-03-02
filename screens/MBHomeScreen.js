import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import COLORS from '../utils/colors';
import { formatPhoneNumber } from '../utils/phoneFormatUtils';
import { getRelativeTime } from '../utils/dateUtils';
import ReminderModal from '../components/ReminderModal';
import FilterModal from '../components/FilterModal';
import Header from '../components/Header';
import ClientCard from '../components/ClientCard';
import CallButtonIcon from '../components/icons/CallButtonIcon';
import AlertButtonIcon from '../components/icons/AlertButtonIcon';

const MBHomeScreen = () => {
  const { broker, authToken } = useAuth();
  const navigation = useNavigation();
  const [callRequests, setCallRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All clients');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [calledClients, setCalledClients] = useState(new Set());

  useEffect(() => {
    fetchCallRequests();
  }, [selectedFilter]);

  const fetchCallRequests = async () => {
    try {
      const response = await fetch(
        `https://signup.roostapp.io/admin/broker-clients/${broker._id}?includeNeededDocs=false`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Debug logs: raw response and assignments
        console.log('fetchCallRequests: raw response data:', data);
        console.log('fetchCallRequests: assignments count:', (data.assignments || []).length);

        // Extract clients from assignments and filter for active call requests
        // Filter out assignments with null clientId first
        const clients = (data.assignments || [])
          .filter(assignment => assignment.clientId != null)
          .map(assignment => {
            const client = assignment.clientId;
            const nameParts = (client.name || '').split(' ');
            
            // Check if client has an active call request
            const hasCallRequest = client.callSchedulePreference && 
              client.callSchedulePreference.preferredDay && 
              client.callSchedulePreference.preferredTime && 
              !client.callSchedulePreference.hasCallCompleted;
            
            const mapped = {
              _id: client._id,
              name: client.name,
              email: client.email,
              phone: client.phone,
              type: client.type || 'client',
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              requestedAt: client.callSchedulePreference?.scheduledAt || assignment.assignedAt,
              priority: client.status,
              callSchedulePreference: client.callSchedulePreference,
              hasCallRequest: hasCallRequest,
            };
            return mapped;
          })
          // Only show clients who have active call requests
          .filter(client => client.hasCallRequest);
        
        // Apply filter
        const now = new Date();
        let filtered = clients;
        
        if (selectedFilter === 'Today') {
          const startOfDay = new Date(now.setHours(0, 0, 0, 0));
          const endOfDay = new Date(now.setHours(23, 59, 59, 999));
          filtered = clients.filter(c => {
            const date = new Date(c.requestedAt);
            return date >= startOfDay && date <= endOfDay;
          });
        } else if (selectedFilter === 'This week') {
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          filtered = clients.filter(c => new Date(c.requestedAt) >= startOfWeek);
        } else if (selectedFilter === 'Last week') {
          const startOfLastWeek = new Date(now.setDate(now.getDate() - now.getDay() - 7));
          const endOfLastWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          filtered = clients.filter(c => {
            const date = new Date(c.requestedAt);
            return date >= startOfLastWeek && date < endOfLastWeek;
          });
        }

        // Sort by most recent (upcoming) first
        filtered = filtered.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
        
        console.log(`fetchCallRequests: filtered call requests count for filter "${selectedFilter}":`, filtered.length);
        
        setCallRequests(filtered);
      }
    } catch (error) {
      console.error('Error fetching call requests:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCallRequests();
  };

  const handleCall = async (client) => {
    const phoneNumber = client.phone;
    const url = `tel:${phoneNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        // Mark as called
        setCalledClients(prev => new Set([...prev, client._id]));
        
        // Update call status on backend
        await fetch(
          `https://signup.roostapp.io/admin/client/${client._id}/mb-call-completed`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          }
        );
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      console.error('Error making call:', error);
    }
  };

  const handleReminder = (client) => {
    setSelectedClient(client);
    setShowReminderModal(true);
  };

  const handleClientPress = (client) => {
    navigation.navigate('ClientDetails', { client });
  };

  const renderCallRequestCard = ({ item }) => {
    const isPriority = item.priority === 'high';
    const isCalled = calledClients.has(item._id);
    const clientName = `${item.firstName || ''} ${item.lastName || ''}`.trim();
    const status = isPriority ? 'Priority' : 'Active';

    return (
      <ClientCard
        clientName={clientName}
        status={status}
        showStatus={true}
        showInitials={true}
        onPress={() => handleClientPress(item)}
      >
        {/* Call Button */}
        <TouchableOpacity onPress={() => handleCall(item)}>
          <CallButtonIcon />
        </TouchableOpacity>

        {/* Alert/Reminder Button */}
        <TouchableOpacity onPress={() => handleReminder(item)}>
          <AlertButtonIcon />
        </TouchableOpacity>
      </ClientCard>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="call-outline" size={64} color={COLORS.gray} />
      <Text style={styles.emptyStateText}>No call requests</Text>
      <Text style={styles.emptyStateSubtext}>
        Call requests will appear here when clients need to speak with you
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Get the most recent call and remaining calls
  const upcomingCall = callRequests.length > 0 ? callRequests[0] : null;
  const remainingCalls = callRequests.slice(1);

  // Format time slot from callSchedulePreference
  const getTimeSlot = (call) => {
    if (!call?.callSchedulePreference?.preferredTime) return '';
    const time = call.callSchedulePreference.preferredTime;
    // Convert 09:00 to 9:00-12:00 format (assuming 3 hour window)
    const [hours, mins] = time.split(':');
    const startHour = parseInt(hours);
    const endHour = startHour + 3;
    return `${startHour}:${mins}-${endHour}:${mins}`;
  };

  return (
    <View style={styles.container}>
      <Header />
      
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
        {/* Header */}
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>CALL REQUESTED</Text>
        </View>

        {callRequests.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Featured Upcoming Call */}
            {upcomingCall && (
              <View style={styles.featuredCallSection}>
                <ClientCard
                  clientName={`${upcomingCall.firstName || ''} ${upcomingCall.lastName || ''}`.trim()}
                  status={upcomingCall.priority === 'high' ? 'Priority' : 'Active'}
                  showStatus={true}
                  showInitials={true}
                  onPress={() => handleClientPress(upcomingCall)}
                >
                  <TouchableOpacity onPress={() => handleCall(upcomingCall)}>
                    <CallButtonIcon bgColor={"#2271B1"}  />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleReminder(upcomingCall)}>
                    <AlertButtonIcon />
                  </TouchableOpacity>
                </ClientCard>
              </View>
            )}

            {/* Time Slot and Filter Row */}
            {upcomingCall && (
              <View style={styles.timeFilterRow}>
                <Text style={styles.timeSlot}>{getTimeSlot(upcomingCall)}</Text>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowFilterModal(true)}
                >
                  <Text style={styles.filterButtonText}>{selectedFilter}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Remaining Calls List */}
            {remainingCalls.map((item) => (
              <View key={item._id} style={styles.callItem}>
                {renderCallRequestCard({ item })}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedFilter={selectedFilter}
        onSelectFilter={(filter) => {
          setSelectedFilter(filter);
          setShowFilterModal(false);
        }}
      />

      {/* Reminder Modal */}
      {selectedClient && (
        <ReminderModal
          visible={showReminderModal}
          onClose={() => {
            setShowReminderModal(false);
            setSelectedClient(null);
          }}
          client={selectedClient}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bellButton: {
    padding: 8,
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
  titleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: COLORS.background,
  },
  featuredCallSection: {
    marginBottom: 16,
  },
  timeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  timeSlot: {
    fontSize: 11,
    fontFamily:"futura",
    fontWeight: '700',
    color: '#797979',
    fontFamily: 'futura',
  },
  callItem: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#797979",
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'futura',
    paddingLeft: 4,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#377473',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonText: {
    color: '#377473',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'futura',
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.slate,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 13,
    color: COLORS.slate,
  },
  rightSection: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: COLORS.green,
  },
  calledButton: {
    backgroundColor: COLORS.blue,
  },
  reminderButton: {
    backgroundColor: COLORS.green,
  },
  statusBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: COLORS.slate,
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
    color: COLORS.slate,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default MBHomeScreen;
