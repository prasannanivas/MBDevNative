import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { ChatProvider } from './context/ChatContext';

// Screens
import LoginScreen from './screens/LoginScreen';
import MainTabs from './navigation/MainTabs';
import ClientDetailsScreen from './screens/ClientDetailsScreen';

// Utils
import COLORS from './utils/colors';

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
  const { broker, isLoading } = useAuth();

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
