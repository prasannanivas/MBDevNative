import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import COLORS from '../utils/colors';
import { getRelativeTime } from '../utils/dateUtils';
import MessageFilterModal from '../components/MessageFilterModal';
import ChatModal from '../components/ChatModal';

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
            console.log('=== CLIENT DATA ===', JSON.stringify(client, null, 2));
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

    return (
      <TouchableOpacity
        style={[styles.conversationCard, isUnread && styles.unreadCard]}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationContent}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {participant.firstName?.[0]}{participant.lastName?.[0]}
            </Text>
          </View>

          {/* Message Info */}
          <View style={styles.messageInfo}>
            <View style={styles.messageHeader}>
              <Text style={[styles.participantName, isUnread && styles.unreadText]}>
                {participant.firstName} {participant.lastName}
              </Text>
              <Text style={styles.timestamp}>
                {getRelativeTime(item.lastMessageAt)}
              </Text>
            </View>
            <Text
              style={[styles.lastMessage, isUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Chat Icon */}
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => handleConversationPress(item)}
            >
              <Ionicons name="chatbubble" size={22} color={COLORS.green} />
            </TouchableOpacity>

            {/* Notification Icon */}
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => {/* Handle notification */}}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.green} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Unread Badge */}
        {isUnread && (
          <View style={styles.unreadBadge}>
            <View style={styles.unreadDot} />
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

      {/* Messages Header and Filter */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>MESSAGES</Text>
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
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
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
    color: COLORS.white,
    letterSpacing: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  conversationCard: {
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
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  messageInfo: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.gray,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.slate,
  },
  unreadText: {
    fontWeight: '700',
    color: COLORS.black,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
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
