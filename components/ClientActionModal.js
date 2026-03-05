import React, { useState } from 'react';
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
      // Try to get existing chat or create a new one
      const url = `https://signup.roostapp.io/mortgage-broker/chat/get-or-create/${client._id}`;
      console.log('Fetching chat from:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      console.log('Chat response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Chat data received:', data);
        
        // Structure conversation object for ChatModal
        const nameParts = (client.name || '').split(' ');
        const conversationData = {
          _id: data.chat._id || data.chat.chatId,
          participant: {
            _id: client._id,
            name: client.name,
            email: client.email || '',
            phone: client.phone || '',
            type: client.type || 'client',
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
          },
        };
        
        console.log('Opening chat modal with conversation:', conversationData);
        setConversation(conversationData);
        setShowChatModal(true);
      } else {
        const errorText = await response.text();
        console.error('Chat response error:', response.status, errorText);
        Alert.alert('Error', 'Unable to open chat. Please try again.');
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
        visible={visible}
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
