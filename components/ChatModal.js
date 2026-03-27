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
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
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
        `${API_BASE_URL}/mortgage-broker/chat/${conversation._id}/messages`,
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
        `${API_BASE_URL}/mortgage-broker/chat/${conversation._id}/read`,
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
        `${API_BASE_URL}/mortgage-broker/chat/${conversation._id}/messages`,
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
                source={{ uri: `${API_BASE_URL}/admin/profile-picture/${broker.profilePicture}` }}
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
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {participant.firstName} {participant.lastName}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Svg
              width="26"
              height="26"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M13 0C5.82075 0 0 5.8201 0 13C0 20.1799 5.8201 26 13 26C20.1799 26 26 20.1799 26 13C26 5.8201 20.1799 0 13 0ZM13 24.401C6.7275 24.401 1.625 19.2725 1.625 13C1.625 6.7275 6.7275 1.625 13 1.625C19.2725 1.625 24.375 6.7275 24.375 13C24.375 19.2725 19.2725 24.401 13 24.401ZM17.5961 8.4045C17.2793 8.08763 16.7648 8.08763 16.4473 8.4045L13.0007 11.8511L9.55402 8.4045C9.23715 8.08763 8.72202 8.08763 8.4045 8.4045C8.08698 8.72138 8.08763 9.2365 8.4045 9.55338L11.8511 13L8.4045 16.4466C8.08763 16.7635 8.08763 17.2786 8.4045 17.5955C8.72138 17.9124 9.2365 17.9124 9.55402 17.5955L13.0007 14.1489L16.4473 17.5955C16.7642 17.9124 17.2786 17.9124 17.5961 17.5955C17.9137 17.2786 17.913 16.7635 17.5961 16.4466L14.1495 13L17.5961 9.55338C17.914 9.23585 17.914 8.72138 17.5961 8.4045Z"
                fill="#797979"
              />
            </Svg>
          </TouchableOpacity>
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
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#797979"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
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
                <ActivityIndicator size="small" color={COLORS.green} />
              ) : (
                <Ionicons name="send" size={20} color={COLORS.green} />
              )}
            </TouchableOpacity>
          </View>
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
    paddingTop: 63,
    paddingBottom: 15,
    paddingHorizontal: 16,
    minHeight: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  closeButton: {
    backgroundColor: '#F4F4F4',
    position: 'absolute',
    top: 60,
    right: 16,
    borderRadius: 53,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#797979',
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#797979',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
});

export default ChatModal;
