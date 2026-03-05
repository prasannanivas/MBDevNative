import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CallIcon from './icons/CallIcon';
import ChatIcon from './icons/ChatIcon';
import BellIcon from './icons/BellIcon';
import ChatModal from './ChatModal';

const ClientActionModal = ({ visible, onClose, clientName, client, authToken, onCall, onMessage, onSetReminder }) => {
  const [showChatModal, setShowChatModal] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

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
        `https://signup.roostapp.io/mortgage-broker/chats`,
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
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
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

                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
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
    marginBottom: 32,
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
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202020',
    fontFamily: 'futura',
  },
});

export default ClientActionModal;
