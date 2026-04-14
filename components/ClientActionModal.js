import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import API_BASE_URL from '../config/api';
import CallIcon from './icons/CallIcon';
import ChatIcon from './icons/ChatIcon';
import BellIcon from './icons/BellIcon';
import ChatModal from './ChatModal';

const ClientActionModal = ({ visible, onClose, clientName, client, authToken, onCall, onMessage, onSetReminder }) => {
  const [showChatModal, setShowChatModal] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [lastReminder, setLastReminder] = useState(null);

  // Animation values
  const slideAnim = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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

      // Fetch last reminder
      if (client?._id && authToken) {
        fetchLastReminder();
      }
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
  }, [visible]);

  const fetchLastReminder = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/client/${client._id}/reminders`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reminders = data.reminders || [];
        if (reminders.length > 0) {
          // Get the most recent reminder
          const sorted = reminders.sort((a, b) => new Date(b.date) - new Date(a.date));
          setLastReminder(sorted[0]);
        } else {
          setLastReminder(null);
        }
      }
    } catch (error) {
      console.error('Error fetching reminder:', error);
    }
  };

  const formatReminderDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const reminderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = reminderDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatReminderTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const parseReminderComment = (comment) => {
    if (!comment) return '';
    const parts = comment.split('|~|');
    // If there's a separator, return the part after it
    // Otherwise return the whole comment (for old format)
    if (parts.length > 1) {
      return parts[1] || comment; // Return comment part, or whole if empty
    }
    return comment; // Old format - just return as is
  };

  const parseReminderType = (comment) => {
    if (!comment) return 'Reminder';
    const parts = comment.split('|~|');
    return parts[0] || 'Reminder';
  };

  useEffect(() => {
    console.log('State changed - showChatModal:', showChatModal, 'conversation:', conversation?._id || 'null');
  }, [showChatModal, conversation]);

  const handleOpenChat = async () => {
    if (!client?._id) {
      console.log('No client ID available');
      // Fallback to original behavior if no client data
      if (onMessage) onMessage();
      return;
    }

    if (!authToken) {
      console.log('No auth token available');
      Alert.alert('Error', 'Authentication required. Please try again.');
      return;
    }

    console.log('Opening chat for client:', client._id);
    setIsLoadingChat(true);
    
    try {
      // Fetch all chats (same way as MessagesScreen)
      const response = await fetch(
        `${API_BASE_URL}/mortgage-broker/chats`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      console.log('Chats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Chats data received, count:', data.chats?.length);
        
        // Find chat with this client
        const clientChat = (data.chats || []).find(chat => 
          chat.participants?.client?._id === client._id
        );
        
        if (clientChat) {
          console.log('Found existing chat:', clientChat._id);
          
          // Structure conversation object exactly like MessagesScreen
          const clientData = clientChat.participants.client;
          const nameParts = (clientData.name || '').split(' ');
          
          const conversationData = {
            _id: clientChat._id,
            participant: {
              _id: clientData._id,
              name: clientData.name,
              email: clientData.email,
              phone: clientData.phone,
              type: clientData.type || 'client',
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
            },
            lastMessage: clientChat.lastMessage?.content || '',
            lastMessageAt: clientChat.lastMessage?.timestamp || clientChat.updatedAt,
            unreadCount: clientChat.unreadCount?.mortgageBroker || 0,
          };
          
          console.log('Opening chat modal with conversation:', conversationData._id);
          setConversation(conversationData);
          setShowChatModal(true);
          console.log('Chat modal should now be visible');
        } else {
          console.log('No existing chat found, navigating to Messages');
          // No existing chat found, fallback to navigate to Messages
          Alert.alert('No Conversation', 'No existing conversation found with this client. Navigate to Messages to start a new conversation.');
          if (onMessage) onMessage();
        }
      } else {
        const errorText = await response.text();
        console.error('Chats response error:', response.status, errorText);
        Alert.alert('Error', 'Unable to load chats. Please try again.');
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert('Error', 'Unable to open chat. Please try again.');
      // Fallback to original behavior
      if (onMessage) onMessage();
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleCloseChatModal = () => {
    setShowChatModal(false);
    setConversation(null);
    onClose(); // Close the action modal as well
  };

  return (
    <>
      <Modal
        visible={visible && !showChatModal}
        transparent={true}
        animationType="none"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={onClose}>
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
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* Client Name */}
                <Text style={styles.modalClientName}>
                  {clientName || 'Client'}
                </Text>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {/* Call Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onCall}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionButtonCircle}>
                      <CallIcon width={24} height={24} color="#4A7C7E" />
                    </View>
                  </TouchableOpacity>

                  {/* Message Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleOpenChat}
                    activeOpacity={0.7}
                    disabled={isLoadingChat}
                  >
                    <View style={styles.actionButtonCircle}>
                      {isLoadingChat ? (
                        <ActivityIndicator size="small" color="#4A7C7E" />
                      ) : (
                        <ChatIcon width={24} height={24} color="#4A7C7E" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Reminder Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onSetReminder}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionButtonCircle}>
                      <BellIcon width={24} height={24} color="#4A7C7E" />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Last Reminder Section */}
                {lastReminder && (
                  <View style={styles.reminderSection}>
                    <Text style={styles.reminderDateText}>
                      {formatReminderDate(lastReminder.date)}, {formatReminderTime(lastReminder.date)}
                    </Text>
                    <Text style={styles.reminderTimeText}>
                      {parseReminderComment(lastReminder.comment) || 'No comment'}
                    </Text>
                  </View>
                )}

                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </View>
      </Modal>

      {/* Chat Modal */}
      {console.log('Conversation state for ChatModal render:', conversation ? conversation._id : 'null', 'showChatModal:', showChatModal)}
      {conversation && (
        <ChatModal
          visible={showChatModal}
          onClose={handleCloseChatModal}
          conversation={conversation}
        />
      )}
    </>
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
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginHorizontal: 16,
    marginBottom: 40,
    overflow: 'hidden',
  },
  modalContent: {
    backgroundColor: '#F5F5F5',
    padding: 32,
    paddingBottom: 40,
  },
  modalClientName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#202020',
    marginBottom: 32,
    fontFamily: 'futura',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonCircle: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.4,
    borderColor: '#4A7C7E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderSection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  reminderDateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999999',
    fontFamily: 'futura',
    marginBottom: 4,
  },
  reminderTimeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202020',
    fontFamily: 'futura',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202020',
    fontFamily: 'futura',
  },
});

export default ClientActionModal;
