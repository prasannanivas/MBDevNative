import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const { broker, authToken } = useAuth();

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    if (!broker || !authToken) return;

    try {
      const response = await fetch(
        `https://signup.roostapp.io/mortgage-broker/unread-count`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (broker && authToken) {
      fetchUnreadCount();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [broker, authToken]);

  const markAsRead = (conversationId) => {
    // Update local state
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === conversationId ? { ...conv, unread: false } : conv
      )
    );
    // Refresh count
    fetchUnreadCount();
  };

  return (
    <ChatContext.Provider
      value={{
        unreadCount,
        conversations,
        setConversations,
        fetchUnreadCount,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
