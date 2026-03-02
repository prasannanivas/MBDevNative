import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import COLORS from '../utils/colors';
import Header from '../components/Header';

const ProfileScreen = () => {
  const { broker, logout } = useAuth();
  const navigation = useNavigation();
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
      {/* Close Button */}
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Header */}
      <Header 
        showProfileSection={true}
      />


      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          {/* Section Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.sectionTitle}>PROFILE INFO</Text>
          </View>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  titleContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 0,
    paddingBottom: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    color: COLORS.black,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'left',
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
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
    fontFamily: 'futura',
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
    fontFamily: 'futura',
  },
  infoNote: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
    fontFamily: 'Futura Light',
  },
});

export default ProfileScreen;
