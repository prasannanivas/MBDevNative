import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../utils/colors';
import { formatPhoneNumber } from '../utils/phoneFormatUtils';
import API_BASE_URL from '../config/api';

const RealtorDetailsScreen = ({ route }) => {
  const { client } = route.params;
  const realtor = client?.realtorInfo;

  const realtorInitials = realtor?.name
    ? realtor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'R';

  const clientName = client?.name || `${client?.firstName || ''} ${client?.lastName || ''}`.trim();

  const handleCall = async (phone) => {
    if (!phone) return;
    const url = `tel:${phone}`;
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

  const handleEmail = async (email) => {
    if (!email) return;
    const url = `mailto:${email}`;
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

  if (!realtor) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={48} color={COLORS.slate} />
        <Text style={styles.errorText}>No realtor assigned</Text>
        <Text style={styles.errorSubText}>Client: {clientName}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Realtor Header */}
      <View style={styles.header}>
        {realtor.profilePicture ? (
          <Image
            source={{ uri: `${API_BASE_URL}/realtor/profilepic/${realtor._id}` }}
            style={styles.avatarSquare}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarSquare}>
            <Text style={styles.avatarText}>{realtorInitials}</Text>
          </View>
        )}
        <Text style={styles.realtorName}>{realtor.name || 'Unknown Realtor'}</Text>
        <View style={styles.clientBadge}>
          <Ionicons name="person" size={14} color={COLORS.slate} />
          <Text style={styles.clientBadgeText}>Client: {clientName}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {realtor.phone && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleCall(realtor.phone)}>
            <View style={styles.actionIcon}>
              <Ionicons name="call" size={24} color={COLORS.white} />
            </View>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>
        )}
        {realtor.email && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEmail(realtor.email)}>
            <View style={styles.actionIcon}>
              <Ionicons name="mail" size={24} color={COLORS.white} />
            </View>
            <Text style={styles.actionLabel}>Email</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Realtor Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Realtor Information</Text>

        {realtor.phone && (
          <TouchableOpacity style={styles.infoRow} onPress={() => handleCall(realtor.phone)}>
            <Ionicons name="call" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{formatPhoneNumber(realtor.phone)}</Text>
          </TouchableOpacity>
        )}

        {realtor.email && (
          <TouchableOpacity style={styles.infoRow} onPress={() => handleEmail(realtor.email)}>
            <Ionicons name="mail" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{realtor.email}</Text>
          </TouchableOpacity>
        )}

        {realtor.brokerage && (
          <View style={styles.infoRow}>
            <Ionicons name="business" size={20} color={COLORS.slate} />
            <Text style={styles.infoText}>{realtor.brokerage}</Text>
          </View>
        )}
      </View>

      {/* Client Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color={COLORS.slate} />
          <Text style={styles.infoText}>{clientName}</Text>
        </View>
        {client.email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={COLORS.slate} />
            <Text style={styles.infoText}>{client.email}</Text>
          </View>
        )}
        {client.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={COLORS.slate} />
            <Text style={styles.infoText}>{formatPhoneNumber(client.phone)}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.slate,
    fontFamily: 'futura',
  },
  errorSubText: {
    fontSize: 14,
    color: COLORS.slate,
    fontFamily: 'futura',
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  avatarSquare: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: 'futura',
  },
  realtorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
    fontFamily: 'futura',
  },
  clientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  clientBadgeText: {
    fontSize: 13,
    color: COLORS.slate,
    fontFamily: 'futura',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    paddingVertical: 25,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate,
    fontFamily: 'futura',
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
    fontFamily: 'futura',
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
    fontFamily: 'futura',
  },
});

export default RealtorDetailsScreen;
