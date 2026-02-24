import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [broker, setBroker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  // Load broker data from storage on app start
  useEffect(() => {
    loadBrokerData();
  }, []);

  const loadBrokerData = async () => {
    try {
      const brokerData = await AsyncStorage.getItem('mortgageBroker');
      const token = await AsyncStorage.getItem('brokerAuthToken');
      
      if (brokerData) {
        const parsed = JSON.parse(brokerData);
        console.log('=== LOADED BROKER DATA ===', JSON.stringify(parsed, null, 2));
        setBroker(parsed);
      }
      if (token) {
        setAuthToken(token);
      }
    } catch (error) {
      console.error('Error loading broker data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (brokerData, token) => {
    try {
      console.log('=== BROKER DATA ===', JSON.stringify(brokerData, null, 2));
      await AsyncStorage.setItem('mortgageBroker', JSON.stringify(brokerData));
      await AsyncStorage.setItem('brokerAuthToken', token);
      setBroker(brokerData);
      setAuthToken(token);
    } catch (error) {
      console.error('Error saving broker data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('mortgageBroker');
      await AsyncStorage.removeItem('brokerAuthToken');
      setBroker(null);
      setAuthToken(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const updateBroker = async (updatedData) => {
    try {
      const newBrokerData = { ...broker, ...updatedData };
      await AsyncStorage.setItem('mortgageBroker', JSON.stringify(newBrokerData));
      setBroker(newBrokerData);
    } catch (error) {
      console.error('Error updating broker data:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        broker,
        authToken,
        isLoading,
        login,
        logout,
        updateBroker,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
