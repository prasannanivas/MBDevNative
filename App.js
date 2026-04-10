import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { ChatProvider } from './context/ChatContext';

// Screens
import LoginScreen from './screens/LoginScreen';
import MainTabs from './navigation/MainTabs';
import ClientDetailsScreen from './screens/ClientDetailsScreen';
import RealtorDetailsScreen from './screens/RealtorDetailsScreen';
import ProfileScreen from './screens/ProfileScreen';

// Utils
import COLORS from './utils/colors';
import { registerForPushNotificationsAsync, registerDeviceOnServer } from './services/NotificationService';

// Set default font for all Text components
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = { fontFamily: 'futura' };

const Stack = createNativeStackNavigator();

// Navigation theme
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
  },
};

// Loading screen component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

// App Navigator - handles authenticated vs unauthenticated routes
const AppNavigator = () => {
  const { broker, isLoading, authToken } = useAuth();

  // Initialize push notifications when broker logs in
  useEffect(() => {
    if (broker && authToken) {
      initializeNotifications();
    }
  }, [broker, authToken]);

  const initializeNotifications = async () => {
    try {
      console.log('🔔 Initializing push notifications for broker:', broker?._id);
      const token = await registerForPushNotificationsAsync();
      console.log('📱 Got push token:', token ? token.substring(0, 50) + '...' : 'null');
      
      if (token && broker._id) {
        console.log('📤 Registering device on server...');
        const result = await registerDeviceOnServer(broker._id, token, authToken);
        console.log('✅ Device registration result:', result);
      } else {
        console.warn('⚠️ Missing token or broker ID:', { hasToken: !!token, brokerId: broker._id });
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator>
      {!broker ? (
        // Unauthenticated Stack
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        // Authenticated Stack
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ClientDetails"
            component={ClientDetailsScreen}
            options={{
              title: 'Client Details',
              headerStyle: {
                backgroundColor: COLORS.primary,
              },
              headerTintColor: COLORS.white,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen
            name="RealtorDetails"
            component={RealtorDetailsScreen}
            options={{
              title: 'Realtor Details',
              headerStyle: {
                backgroundColor: COLORS.primary,
              },
              headerTintColor: COLORS.white,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              presentation: 'modal',
              animationTypeForReplace: 'push',
              animation: 'slide_from_left',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

// Main App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <NavigationContainer theme={navTheme}>
        <AuthProvider>
          <NetworkProvider>
            <ChatProvider>
              <AppNavigator />
            </ChatProvider>
          </NetworkProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
