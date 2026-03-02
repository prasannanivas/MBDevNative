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
import COLORS from '../utils/colors';
import { getRelativeTime } from '../utils/dateUtils';
import MessageFilterModal from '../components/MessageFilterModal';
import ChatModal from '../components/ChatModal';
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
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // Fetch conversations on screen focus
  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
    }, [selectedFilter])
  );

  const fetchConversations = async () => {
    try {
      const response = await fetch(
        `https://signup.roostapp.io/mortgage-broker/chats`,
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
        
        // Sort conversations: recent messages first, empty messages last
        filtered = filtered.sort((a, b) => {
          const hasMessageA = a.lastMessage && a.lastMessage.trim() !== '';
          const hasMessageB = b.lastMessage && b.lastMessage.trim() !== '';
          
          // If one has a message and the other doesn't, prioritize the one with message
          if (hasMessageA && !hasMessageB) return -1;
          if (!hasMessageA && hasMessageB) return 1;
          
          // If both have messages or both don't have messages, sort by timestamp
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

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const renderConversationItem = ({ item }) => {
    const isUnread = item.unreadCount > 0;
    const participant = item.participant || {};
    const clientName = `${participant.firstName || ''} ${participant.lastName || ''}`.trim();

    return (
      <ClientCard
        clientName={clientName}
        showStatus={false}
        showInitials={false}
        lastMessage={item.lastMessage}
        onPress={() => handleConversationPress(item)}
      >
        {/* Message Icon */}
        <TouchableOpacity
          onPress={() => handleConversationPress(item)}
        >
          <MessageIcon width={43} height={43} />
        </TouchableOpacity>

        {/* Alert Icon */}
        <TouchableOpacity
          onPress={() => {/* Handle notification */}}
        >
          <AlertIcon width={43} height={43} />
        </TouchableOpacity>
      </ClientCard>
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
              <TouchableOpacity
                style={styles.filterButton}
                onPress={handleFilterPress}
              >
                <Text style={styles.filterButtonText}>{selectedFilter}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.leftSection}>
              <TouchableOpacity
                style={[styles.unreadButton, selectedFilter === 'Unread' && styles.unreadButtonActive]}
                onPress={() => setSelectedFilter(selectedFilter === 'Unread' ? 'All' : 'Unread')}
              >
                <Text style={[styles.unreadButtonText, selectedFilter === 'Unread' && styles.unreadButtonTextActive]}>Unread</Text>
              </TouchableOpacity>
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

      {/* Filter Modal */}
      <MessageFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedFilter={selectedFilter}
        onSelectFilter={(filter) => {
          setSelectedFilter(filter);
          setShowFilterModal(false);
        }}
      />

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
    paddingBottom: 2,
    paddingTop: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftSection: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: "#797979",
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'futura',
  },
  unreadButton: {
    borderColor: "#377473",
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 788,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadButtonActive: {
    backgroundColor: COLORS.primary,
  },
  unreadButtonText: {
    fontFamily: 'futura',
    fontWeight: '700',
    fontSize: 14,
    color: '#377473',
  },
  unreadButtonTextActive: {
    color: COLORS.white,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonText: {
    color: '#FDFDFD',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'futura',
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
});

export default MessagesScreen;
