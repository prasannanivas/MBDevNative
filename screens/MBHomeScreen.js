import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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

const MBHomeScreen = () => {
  const { broker, authToken } = useAuth();
  const navigation = useNavigation();
  const [callRequests, setCallRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Today');
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
        // Extract clients from assignments and filter based on call schedule
        // Filter out assignments with null clientId first
        const clients = (data.assignments || [])
          .filter(assignment => assignment.clientId != null)
          .map(assignment => {
            const client = assignment.clientId;
            const nameParts = (client.name || '').split(' ');
            return {
              _id: client._id,
              name: client.name,
              email: client.email,
              phone: client.phone,
              type: client.type || 'client',
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              requestedAt: client.callScheduledAt || assignment.assignedAt,
              priority: client.callScheduledAt ? 'high' : 'normal',
            };
          });
        
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

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const renderCallRequestCard = ({ item }) => {
    const isPriority = item.priority === 'high';
    const isCalled = calledClients.has(item._id);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isPriority && styles.priorityCard,
        ]}
        onPress={() => handleClientPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Avatar and Client Info */}
          <View style={styles.leftSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.firstName?.[0]}{item.lastName?.[0]}
              </Text>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.clientDetail}>{getRelativeTime(item.requestedAt)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.rightSection}>
            {/* Call Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton, isCalled && styles.calledButton]}
              onPress={() => handleCall(item)}
            >
              <Ionicons
                name="call"
                size={20}
                color={isCalled ? COLORS.bluePressed : COLORS.white}
              />
            </TouchableOpacity>

            {/* Reminder Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.reminderButton]}
              onPress={() => handleReminder(item)}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Badge */}
        {item.status && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Broker Info */}
      <View style={styles.brokerInfo}>
        <View style={styles.brokerAvatar}>
          <Ionicons name="person" size={24} color={COLORS.white} />
        </View>
        <View>
          <Text style={styles.brokerName}>
            {broker.name || 'Mortgage Broker'}
          </Text>
          <Text style={styles.brokerCompany}>
            {broker.company?.city || broker.company?.address || 'Mortgage Broker'}
          </Text>
        </View>
      </View>

      {/* Call Requested Label and Filter */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>CALL REQUESTED</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFilterPress}
        >
          <Text style={styles.filterButtonText}>{selectedFilter}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

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

  return (
    <View style={styles.container}>
      <FlatList
        data={callRequests}
        renderItem={renderCallRequestCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      />

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  listContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  brokerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  brokerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brokerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  brokerCompany: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.orange,
    letterSpacing: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
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
