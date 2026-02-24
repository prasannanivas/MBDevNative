import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import COLORS from '../utils/colors';

const ProfileScreen = () => {
  const { broker, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
        <Text style={styles.sectionTitle}>REALTOR INFO</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="mail" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>{broker.email}</Text>
        </View>

        {broker.phone && (
          <View style={styles.infoCard}>
            <Ionicons name="call" size={24} color={COLORS.primary} />
            <Text style={styles.infoText}>{broker.phone}</Text>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoNote}>
          More features coming soon...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 1,
  },
  content: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoNote: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
  },
});

export default ProfileScreen;
