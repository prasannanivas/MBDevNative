import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../utils/colors';
import { formatPhoneNumber } from '../utils/phoneFormatUtils';

const ClientDetailsScreen = ({ route, navigation }) => {
  const { client: initialClient } = route.params;
  const [client, setClient] = useState(initialClient);
  const [isLoading, setIsLoading] = useState(false);

  // No need to fetch since we pass full client object
  useEffect(() => {
    if (!initialClient) {
      Alert.alert('Error', 'Client data not available');
      navigation.goBack();
    }
  }, [initialClient]);

  const handleCall = async () => {
    if (!client?.phone) return;
    
    const url = `tel:${client.phone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      console.error('Error making call:', error);
    }
  };

  const handleEmail = async () => {
    if (!client?.email) return;
    
    const url = `mailto:${client.email}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open email');
      }
    } catch (error) {
      console.error('Error opening email:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Client not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Client Header */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarTextLarge}>
            {client.firstName?.[0]}{client.lastName?.[0]}
          </Text>
        </View>
        <Text style={styles.clientName}>
          {client.firstName} {client.lastName}
        </Text>
        {client.status && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{client.status}</Text>
          </View>
        )}
      </View>

      {/* Contact Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
          <View style={styles.actionIcon}>
            <Ionicons name="call" size={24} color={COLORS.white} />
          </View>
          <Text style={styles.actionLabel}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
          <View style={styles.actionIcon}>
            <Ionicons name="mail" size={24} color={COLORS.white} />
          </View>
          <Text style={styles.actionLabel}>Email</Text>
        </TouchableOpacity>
      </View>

      {/* Client Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        {client.email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color={COLORS.slate} />
            <Text style={styles.infoText}>{client.email}</Text>
          </View>
        )}

        {client.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color={COLORS.slate} />
            <Text style={styles.infoText}>{formatPhoneNumber(client.phone)}</Text>
          </View>
        )}

        {client.address && (
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={COLORS.slate} />
            <Text style={styles.infoText}>{client.address}</Text>
          </View>
        )}
      </View>

      {/* Purchase Details */}
      {client.purchaseDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Details</Text>
          
          {client.purchaseDetails.budget && (
            <View style={styles.infoRow}>
              <Ionicons name="cash" size={20} color={COLORS.slate} />
              <Text style={styles.infoText}>
                Budget: ${client.purchaseDetails.budget.toLocaleString()}
              </Text>
            </View>
          )}

          {client.purchaseDetails.location && (
            <View style={styles.infoRow}>
              <Ionicons name="home" size={20} color={COLORS.slate} />
              <Text style={styles.infoText}>
                Location: {client.purchaseDetails.location}
              </Text>
            </View>
          )}

          {client.purchaseDetails.timeline && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={COLORS.slate} />
              <Text style={styles.infoText}>
                Timeline: {client.purchaseDetails.timeline}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      {client.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{client.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.slate,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.silver,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarTextLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  clientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.green,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    paddingVertical: 25,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.silver,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.black,
    marginLeft: 12,
    flex: 1,
  },
  notesText: {
    fontSize: 15,
    color: COLORS.slate,
    lineHeight: 22,
  },
});

export default ClientDetailsScreen;
