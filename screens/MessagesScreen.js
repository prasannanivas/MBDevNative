import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import API_BASE_URL from '../config/api';
import COLORS from '../utils/colors';
import { getRelativeTime } from '../utils/dateUtils';
// import MessageFilterModal from '../components/MessageFilterModal'; // Using inline filters now
import ChatModal from '../components/ChatModal';
import ReminderModal from '../components/ReminderModal';
import Header from '../components/Header';
import ClientCard from '../components/ClientCard';
import MessageIcon from '../components/icons/MessageIcon';
import AlertIcon from '../components/icons/AlertIcon';

const MessagesScreen = () => {
  const { broker, authToken } = useAuth();
  const { conversations, setConversations, fetchUnreadCount } = useChat();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Unread');
  // const [showFilterModal, setShowFilterModal] = useState(false); // Using inline filters now
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Fetch conversations on screen focus
  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
    }, [selectedFilter])
  );

  const fetchConversations = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/mortgage-broker/chats`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Backend returns { success, chats, message }
        // Transform chats to conversation format and filter out null clients
        const chats = (data.chats || [])
          .filter(chat => chat.participants?.client != null)
          .map(chat => {
            const client = chat.participants.client;
          
            const nameParts = (client.name || '').split(' ');
            return {
              _id: chat._id,
              participant: {
                _id: client._id,
                name: client.name,
                email: client.email,
                phone: client.phone,
                type: client.type || 'client',
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
              },
              lastMessage: chat.lastMessage?.content || '',
              lastMessageAt: chat.lastMessage?.timestamp || chat.updatedAt,
              unreadCount: chat.unreadCount?.mortgageBroker || 0,
            };
          });
        
        // Apply filter
        let filtered = chats;
        if (selectedFilter === 'Unread') {
          filtered = chats.filter(c => c.unreadCount > 0);
        }
        
        // Sort conversations: UNREAD first, then by most recent
        filtered = filtered.sort((a, b) => {
          const isUnreadA = a.unreadCount > 0;
          const isUnreadB = b.unreadCount > 0;
          
          // Prioritize unread messages at the top
          if (isUnreadA && !isUnreadB) return -1;
          if (!isUnreadA && isUnreadB) return 1;
          
          // If both are unread or both are read, sort by timestamp
          const timeA = new Date(a.lastMessageAt || 0);
          const timeB = new Date(b.lastMessageAt || 0);
          
          return timeB - timeA; // Most recent first
        });
        
        setConversations(filtered);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleConversationPress = (conversation) => {
    setSelectedConversation(conversation);
    setShowChatModal(true);
  };

  const handleReminder = (client) => {
    setSelectedClient(client);
    setShowReminderModal(true);
  };

  // const handleFilterPress = () => {
  //   setShowFilterModal(true);
  // }; // Using inline filters now

  const renderConversationItem = ({ item }) => {
    const isUnread = item.unreadCount > 0;
    const participant = item.participant || {};
    const clientName = `${participant.firstName || ''} ${participant.lastName || ''}`.trim();
    const timeDisplay = getRelativeTime(item.lastMessageAt);
    const isInactive = participant.mbActivityStatus === 'Inactive';

    return (
      <View style={styles.conversationWrapper}>
        {/* Unread Dot Indicator */}
        {isUnread && (
          <View style={styles.unreadDot} />
        )}
        
        <ClientCard
          clientName={clientName}
          showStatus={false}
          showInitials={true}
          lastMessage={item.lastMessage}
          timeRange={timeDisplay}
          isUnread={isUnread}
          isInactive={isInactive}
          onPress={() => handleConversationPress(item)}
        >
          {/* Message Icon */}
          <TouchableOpacity
            onPress={() => handleConversationPress(item)}
          >
            <MessageIcon width={43} height={43} isUnread={isUnread} activeFilter={selectedFilter} />
          </TouchableOpacity>

          {/* Alert Icon */}
          <TouchableOpacity
            onPress={() => handleReminder(participant)}
          >
            <AlertIcon width={43} height={43} />
          </TouchableOpacity>
        </ClientCard>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray} />
      <Text style={styles.emptyStateText}>No messages</Text>
      <Text style={styles.emptyStateSubtext}>
        Your conversations with realtors and clients will appear here
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
      <Header />
      
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.sectionTitle}>MESSAGES</Text>
              <View style={styles.inlineFilterButtons}>
                <TouchableOpacity
                  style={[styles.inlineFilterButton, selectedFilter === 'Unread' && styles.inlineFilterButtonActive]}
                  onPress={() => setSelectedFilter('Unread')}
                >
                  <Text style={[styles.inlineFilterButtonText, selectedFilter === 'Unread' && styles.inlineFilterButtonTextActive]}>
                    Unread
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inlineFilterButton, selectedFilter === 'All' && styles.inlineFilterButtonActive]}
                  onPress={() => setSelectedFilter('All')}
                >
                  <Text style={[styles.inlineFilterButtonText, selectedFilter === 'All' && styles.inlineFilterButtonTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
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

      {/* Filter Modal - Commented out, using inline filters now
      <MessageFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedFilter={selectedFilter}
        onSelectFilter={(filter) => {
          setSelectedFilter(filter);
          setShowFilterModal(false);
        }}
      />
      */}

      {/* Chat Modal */}
      {selectedConversation && (
        <ChatModal
          visible={showChatModal}
          onClose={() => {
            setShowChatModal(false);
            setSelectedConversation(null);
            fetchUnreadCount();
            fetchConversations();
          }}
          conversation={selectedConversation}
        />
      )}

      {/* Reminder Modal */}
      {selectedClient && (
        <ReminderModal
          visible={showReminderModal}
          onClose={() => {
            setShowReminderModal(false);
            setSelectedClient(null);
          }}
          client={selectedClient}
          sourceScreen="Messages"
          onSuccess={() => {
            fetchConversations();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sectionTitle: {
    color: "#797979",
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'futura',
  },
  inlineFilterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineFilterButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#377473',
    backgroundColor: 'transparent',
  },
  inlineFilterButtonActive: {
    backgroundColor: '#377473',
  },
  inlineFilterButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#377473',
    fontFamily: 'futura',
  },
  inlineFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  conversationCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  unreadText: {
    fontWeight: '700',
    color: '#000000',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 16,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5A9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
  conversationWrapper: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#377473',
    zIndex: 10,
  },
});

export default MessagesScreen;
