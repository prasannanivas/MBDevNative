import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import API_BASE_URL from '../config/api';
import COLORS from '../utils/colors';
import Header from '../components/Header';
import ClientActionModal from '../components/ClientActionModal';
import ReminderModal from '../components/ReminderModal';

const ClientsScreen = () => {
  const { broker, authToken } = useAuth();
  const navigation = useNavigation();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('Active');
  const [showActionModal, setShowActionModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/broker-clients/${broker._id}?includeNeededDocs=false`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('fetchClients: raw response data:', data);

        // Extract clients from assignments
        const clientsList = (data.assignments || [])
          .filter(assignment => assignment.clientId != null)
          .map(assignment => {
            const client = assignment.clientId;
            return {
              _id: client._id,
              name: client.name || 'Unknown',
              email: client.email,
              phone: client.phone,
              type: client.type || 'client',
              mbActivityStatus: client.mbActivityStatus || 'Active',
            };
          });

        setClients(clientsList);
        organizeSections(clientsList);
      } else {
        console.error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const organizeSections = (clientsList) => {
    // Filter clients based on selected filter
    let filteredClients = clientsList;
    if (selectedFilter === 'Active') {
      filteredClients = clientsList.filter(client => client.mbActivityStatus !== 'Inactive');
    }
    // 'All' shows all clients

    // Group clients by first letter
    const grouped = filteredClients.reduce((acc, client) => {
      const firstLetter = (client.name[0] || '').toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(client);
      return acc;
    }, {});

    // Sort clients within each group
    Object.keys(grouped).forEach(letter => {
      grouped[letter].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Convert to section list format
    const sectionsList = Object.keys(grouped)
      .sort()
      .map(letter => ({
        title: letter,
        data: grouped[letter],
      }));

    setSections(sectionsList);
  };

  // Re-organize sections when filter changes
  useEffect(() => {
    if (clients.length > 0) {
      organizeSections(clients);
    }
  }, [selectedFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClients();
  };

  const handleClientPress = (client) => {
    setSelectedClient(client);
    setShowActionModal(true);
  };

  const handleCall = async () => {
    if (selectedClient?.phone) {
      setShowActionModal(false);
      const phoneNumber = selectedClient.phone.replace(/[^0-9]/g, '');
      const url = `tel:${phoneNumber}`;
      try {
        await Linking.openURL(url);
        
        // Send notification to client
        if (selectedClient?._id) {
          await fetch(
            `${API_BASE_URL}/admin/client/${selectedClient._id}/broker-call-notification`,
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
      }
    }
  };

  const handleMessage = () => {
    if (selectedClient?._id) {
      setShowActionModal(false);
      navigation.navigate('Messages');
    }
  };

  const handleSetReminder = () => {
    if (selectedClient?._id) {
      setShowActionModal(false);
      setShowReminderModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowActionModal(false);
    setSelectedClient(null);
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderClientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.clientItem}
      onPress={() => handleClientPress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.clientName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header 
          title="Clients" 
          showBackButton={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Clients" 
        showBackButton={false}
      />
      
      {/* Title and Inline Filter Buttons */}
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>CLIENTS</Text>
        <View style={styles.inlineFilterButtons}>
        <TouchableOpacity
          style={[
            styles.inlineFilterButton,
            selectedFilter === 'Active' && styles.inlineFilterButtonActive,
          ]}
          onPress={() => setSelectedFilter('Active')}
        >
          <Text
            style={[
              styles.inlineFilterButtonText,
              selectedFilter === 'Active' && styles.inlineFilterButtonTextActive,
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.inlineFilterButton,
            selectedFilter === 'All' && styles.inlineFilterButtonActive,
          ]}
          onPress={() => setSelectedFilter('All')}
        >
          <Text
            style={[
              styles.inlineFilterButtonText,
              selectedFilter === 'All' && styles.inlineFilterButtonTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
      </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        renderItem={renderClientItem}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No clients found</Text>
          </View>
        }
      />

      {/* Action Modal */}
      <ClientActionModal
        visible={showActionModal}
        onClose={handleCloseModal}
        clientName={selectedClient?.name}
        client={selectedClient}
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
          fetchClients(); // Refresh to show new reminders
        }}
        client={selectedClient}
        sourceScreen="MBMain"
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
    fontFamily: 'futura',
    letterSpacing: 0.5,
  },
  clientItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '400',
    color: '#202020',
    fontFamily: 'futura',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    fontFamily: 'futura',
  },
  inlineFilterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineFilterButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#377473',
    backgroundColor: 'transparent',
    marginRight: 12,
  },
  inlineFilterButtonActive: {
    backgroundColor: '#377473',
  },
  inlineFilterButtonText: {
    fontSize: 10,
    color: '#377473',
    fontFamily: 'futura',
  },
  inlineFilterButtonTextActive: {
    color: '#FDFDFD',
  },
});

export default ClientsScreen;
