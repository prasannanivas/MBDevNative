import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import COLORS from '../utils/colors';
import { formatTime } from '../utils/dateUtils';

const ChatModal = ({ visible, onClose, conversation }) => {
  const { broker, authToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible && conversation) {
      fetchMessages();
      markAsRead();
    }
  }, [visible, conversation]);

  const fetchMessages = async () => {
    if (!conversation?._id || !authToken) return;
    
    try {
      const response = await fetch(
        `https://signup.roostapp.io/mortgage-broker/chat/${conversation._id}/messages`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversation?._id || !authToken) return;
    
    try {
      await fetch(
        `https://signup.roostapp.io/mortgage-broker/chat/${conversation._id}/read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversation?._id || !authToken) return;

    const tempMessage = {
      _id: Date.now().toString(),
      content: messageText.trim(),
      sender: {
        userId: broker._id,
        userType: 'mortgage-broker',
      },
      timestamp: new Date().toISOString(),
      isTemp: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setMessageText('');
    setIsSending(true);

    try {
      const response = await fetch(
        `https://signup.roostapp.io/mortgage-broker/chat/${conversation._id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            content: tempMessage.content,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempMessage._id ? data.message : msg))
        );
      } else {
        // Remove temp message on error
        setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isBroker = item.sender === 'mortgage-broker';
    const participant = conversation.participant || {};
    const clientInitials = (participant.firstName?.[0] || '') + (participant.lastName?.[0] || '');
    const brokerInitials = (broker.name || 'MB').split(' ').map(n => n[0]).join('').toUpperCase();
    
    return (
      <View
        style={[
          styles.messageContainer,
          isBroker ? styles.messageBrokerContainer : styles.messageClientContainer,
        ]}
      >
        {/* Client Avatar (left side) */}
        {!isBroker && (
          <View style={styles.clientAvatar}>
            <Text style={styles.avatarText}>{clientInitials}</Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isBroker ? styles.bubbleBroker : styles.bubbleClient,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isBroker ? styles.textBroker : styles.textClient,
            ]}
          >
            {item.content || item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isBroker ? styles.timeBroker : styles.timeClient,
            ]}
          >
            {formatTime(item.timestamp || item.createdAt)}
          </Text>
        </View>

        {/* Broker Avatar (right side) */}
        {isBroker && (
          <View style={styles.brokerAvatar}>
            {broker.profilePicture ? (
              <Image
                source={{ uri: `https://signup.roostapp.io/admin/profile-picture/${broker.profilePicture}` }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{brokerInitials}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const participant = conversation.participant || {};

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {participant.firstName} {participant.lastName}
            </Text>
            <Text style={styles.headerSubtitle}>
              {participant.type === 'realtor' ? 'Realtor' : 'Client'}
            </Text>
          </View>
        </View>

        {/* Messages List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            onLayout={() => flatListRef.current?.scrollToEnd()}
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.gray}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9BB9B9',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  messageBrokerContainer: {
    justifyContent: 'flex-end',
  },
  messageClientContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  bubbleBroker: {
    backgroundColor: COLORS.white,
    borderBottomRightRadius: 4,
    marginRight: 12,
  },
  bubbleClient: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  textBroker: {
    color: COLORS.black,
  },
  textClient: {
    color: COLORS.black,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 8,
    color: COLORS.slate,
  },
  timeBroker: {
    color: COLORS.slate,
  },
  timeClient: {
    color: COLORS.slate,
  },
  // Avatar Styles
  clientAvatar: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.red,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 2,
    overflow: 'hidden',
  },
  brokerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.silver,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
    fontSize: 15,
    color: COLORS.black,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.5,
  },
});

export default ChatModal;
