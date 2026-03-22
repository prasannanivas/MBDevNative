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
  const [realtorNewClients, setRealtorNewClients] = useState([]);
  const [clientIntros, setClientIntros] = useState([]);
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
        console.log('fetchCallRequests: raw response data:', data);
        console.log('fetchCallRequests: assignments count:', (data.assignments || []).length);

        // Extract all clients from assignments
        const allClients = (data.assignments || [])
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
              realtorInfo: client.realtorInfo || client.assignedRealtor,
              isNewSignup: client.isNewSignup || false,
              assignedAt: assignment.assignedAt,
            };
            return mapped;
          });
        
        // Categorize clients into different call types
        const callRequestClients = [];
        const realtorClients = [];
        const introClients = [];
        
        allClients.forEach(client => {
          // Call Requested - clients with active call requests
          if (client.hasCallRequest) {
            callRequestClients.push(client);
          }
          // Realtor - new client - clients assigned to a realtor who signed up
          else if (client.realtorInfo && client.realtorInfo.name && client.isNewSignup) {
            realtorClients.push(client);
          }
          // Client intro - any new client signup
          else if (client.isNewSignup) {
            introClients.push(client);
          }
        });
        
        // Apply filter to all categories
        const now = new Date();
        const applyFilter = (clients) => {
          let filtered = clients;
          
          if (selectedFilter === 'Today') {
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));
            filtered = clients.filter(c => {
              const date = new Date(c.requestedAt || c.assignedAt);
              return date >= startOfDay && date <= endOfDay;
            });
          } else if (selectedFilter === 'This week') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            filtered = clients.filter(c => new Date(c.requestedAt || c.assignedAt) >= startOfWeek);
          } else if (selectedFilter === 'Last week') {
            const startOfLastWeek = new Date(now.setDate(now.getDate() - now.getDay() - 7));
            const endOfLastWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            filtered = clients.filter(c => {
              const date = new Date(c.requestedAt || c.assignedAt);
              return date >= startOfLastWeek && date < endOfLastWeek;
            });
          }
          
          return filtered.sort((a, b) => new Date(b.requestedAt || b.assignedAt) - new Date(a.requestedAt || a.assignedAt));
        };

        setCallRequests(applyFilter(callRequestClients));
        setRealtorNewClients(applyFilter(realtorClients));
        setClientIntros(applyFilter(introClients));
        
        console.log(`Categorized clients - Call Requests: ${callRequestClients.length}, Realtor Clients: ${realtorClients.length}, Client Intros: ${introClients.length}`);
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
        showStatus={false}
        showInitials={true}
        timeRange={getCallTimeDisplay(item)}
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
      {/* Blank space when no actions */}
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
  // Check if the first call is in the future for featuring
  const isFutureCall = (call) => {
    if (!call?.callSchedulePreference?.preferredDay) return true;
    const callDate = new Date(call.callSchedulePreference.preferredDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    callDate.setHours(0, 0, 0, 0);
    return callDate >= today;
  };

  // Only feature the first call if it's in the future
  const upcomingCall = (callRequests.length > 0 && isFutureCall(callRequests[0])) ? callRequests[0] : null;
  // Remaining calls include all but the featured one (if featured)
  const remainingCalls = upcomingCall ? callRequests.slice(1) : callRequests;
  
  // Featured calls for other sections
  const upcomingRealtorCall = realtorNewClients.length > 0 ? realtorNewClients[0] : null;
  const remainingRealtorCalls = upcomingRealtorCall ? realtorNewClients.slice(1) : realtorNewClients;
  
  const upcomingIntroCall = clientIntros.length > 0 ? clientIntros[0] : null;
  const remainingIntroCalls = upcomingIntroCall ? clientIntros.slice(1) : clientIntros;

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

  // Calculate time left or date to display
  const getCallTimeDisplay = (call) => {
    if (!call?.callSchedulePreference?.preferredDay) {
      console.log('No preferredDay found for call:', call?.name);
      return 'Call scheduled';
    }
    
    const callDate = new Date(call.callSchedulePreference.preferredDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    callDate.setHours(0, 0, 0, 0);
    
    const diffTime = callDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('Call date:', callDate, 'Today:', today, 'Diff days:', diffDays);
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === 2) {
      return '2 days left';
    } else if (diffDays === 3) {
      return '3 days left';
    } else if (diffDays > 0 && diffDays <= 3) {
      return `${diffDays} days left`;
    } else {
      // Format as "Mar 10, 2026"
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return callDate.toLocaleDateString('en-US', options);
    }
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
        {/* CALL REQUESTED SECTION */}
        <View style={[styles.titleContainer, { backgroundColor: upcomingCall ? '#F0913A4D' : '#4CAF504D' }]}>
          <Text style={styles.sectionTitle}>CALL REQUESTED</Text>
        </View>
        
        {upcomingCall ? (
          <View style={[styles.featuredCallSection, { backgroundColor: '#F0913A4D' }]}>
            <ClientCard
              clientName={`${upcomingCall.firstName || ''} ${upcomingCall.lastName || ''}`.trim()}
              status={upcomingCall.priority === 'high' ? 'Priority' : 'Active'}
              showStatus={false}
              showInitials={true}
              timeRange={getCallTimeDisplay(upcomingCall)}
              onPress={() => handleClientPress(upcomingCall)}
            >
              <TouchableOpacity onPress={() => handleCall(upcomingCall)}>
                <CallButtonIcon bgColor={"#2271B1"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleReminder(upcomingCall)}>
                <AlertButtonIcon />
              </TouchableOpacity>
            </ClientCard>
          </View>
        ) : (
          <View style={[styles.emptyFeaturedSection, { backgroundColor: '#4CAF504D' }]}>
            <View style={styles.emptyFeaturedCardInner}>
              <Text style={styles.emptyFeaturedText}>You have no calls requested</Text>
            </View>
          </View>
        )}

        <View style={styles.timeFilterRow}>
          <Text style={styles.timeSlot}>CALLS</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterButtonText}>{selectedFilter}</Text>
          </TouchableOpacity>
        </View>

        {remainingCalls.length > 0 ? (
          remainingCalls.map((item) => (
            <View key={item._id} style={styles.callItem}>
              {renderCallRequestCard({ item })}
            </View>
          ))
        ) : null}

        {/* REALTOR - NEW CLIENT SECTION */}
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>REALTOR - NEW CLIENT</Text>
        </View>
        
        {upcomingRealtorCall ? (
          <View style={styles.featuredCallSection}>
            <ClientCard
              clientName={`${upcomingRealtorCall.firstName || ''} ${upcomingRealtorCall.lastName || ''}`.trim()}
              status={`Realtor: ${upcomingRealtorCall.realtorInfo?.name || 'Unknown'}`}
              showStatus={true}
              showInitials={true}
              timeRange={getCallTimeDisplay(upcomingRealtorCall)}
              onPress={() => handleClientPress(upcomingRealtorCall)}
            >
              <TouchableOpacity onPress={() => handleCall(upcomingRealtorCall)}>
                <CallButtonIcon bgColor={"#2271B1"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleReminder(upcomingRealtorCall)}>
                <AlertButtonIcon />
              </TouchableOpacity>
            </ClientCard>
          </View>
        ) : null}

        {remainingRealtorCalls.length > 0 ? (
          remainingRealtorCalls.map((item) => (
            <View key={item._id} style={styles.callItem}>
              <ClientCard
                clientName={`${item.firstName || ''} ${item.lastName || ''}`.trim()}
                status={`Realtor: ${item.realtorInfo?.name || 'Unknown'}`}
                showStatus={true}
                showInitials={true}
                timeRange={getCallTimeDisplay(item)}
                onPress={() => handleClientPress(item)}
              >
                <TouchableOpacity onPress={() => handleCall(item)}>
                  <CallButtonIcon />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleReminder(item)}>
                  <AlertButtonIcon />
                </TouchableOpacity>
              </ClientCard>
            </View>
          ))
        ) : !upcomingRealtorCall ? (
          <View style={styles.emptyFeaturedCard}>
            <Text style={styles.emptyFeaturedText}>You have no realtor calls scheduled for {selectedFilter === 'All clients' ? 'today' : selectedFilter.toLowerCase()}</Text>
          </View>
        ) : null}

        {/* CLIENT INTRO SECTION */}
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>CLIENT INTRO</Text>
        </View>
        
        {upcomingIntroCall ? (
          <View style={styles.featuredCallSection}>
            <ClientCard
              clientName={`${upcomingIntroCall.firstName || ''} ${upcomingIntroCall.lastName || ''}`.trim()}
              status="New Client"
              showStatus={false}
              showInitials={true}
              timeRange={getCallTimeDisplay(upcomingIntroCall)}
              onPress={() => handleClientPress(upcomingIntroCall)}
            >
              <TouchableOpacity onPress={() => handleCall(upcomingIntroCall)}>
                <CallButtonIcon bgColor={"#2271B1"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleReminder(upcomingIntroCall)}>
                <AlertButtonIcon />
              </TouchableOpacity>
            </ClientCard>
          </View>
        ) : null}

        {remainingIntroCalls.length > 0 ? (
          remainingIntroCalls.map((item) => (
            <View key={item._id} style={styles.callItem}>
              <ClientCard
                clientName={`${item.firstName || ''} ${item.lastName || ''}`.trim()}
                status="New Client"
                showStatus={false}
                showInitials={true}
                timeRange={getCallTimeDisplay(item)}
                onPress={() => handleClientPress(item)}
              >
                <TouchableOpacity onPress={() => handleCall(item)}>
                  <CallButtonIcon />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleReminder(item)}>
                  <AlertButtonIcon />
                </TouchableOpacity>
              </ClientCard>
            </View>
          ))
        ) : !upcomingIntroCall ? (
          <View style={styles.emptyFeaturedCard}>
            <Text style={styles.emptyFeaturedText}>You have no client intro calls scheduled for {selectedFilter === 'All clients' ? 'today' : selectedFilter.toLowerCase()}</Text>
          </View>
        ) : null}
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
    // backgroundColor: '#F0913A4D',
  },
  featuredCallSection: {
    marginBottom: 16,
    backgroundColor: '#F0913A4D',
    paddingBottom: 16,
  },
  timeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
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
  emptyCallsSection: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyCallsText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  emptyFeaturedSection: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 16,
  },
  emptyFeaturedCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyFeaturedCardInner: {
    backgroundColor: COLORS.white,
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyFeaturedText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'futura',
  },
});

export default MBHomeScreen;
