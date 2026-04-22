import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import COLORS from '../utils/colors';

const ClientCard = ({ 
  clientName, 
  realtorName,
  status = 'Active', 
  showStatus = true,
  showInitials = true,
  lastMessage,
  timeRange,
  isUnread = false,
  isInactive = false,
  squareIcon = false,
  hourglassIcon = false,
  onPress, 
  children 
}) => {
  // Generate initials from client name
  const getInitials = (name) => {
    if (!name) return 'CL';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={styles.cardWrapper}>
      {/* Client Info Card */}
      <TouchableOpacity 
        style={[styles.clientCard, isInactive && styles.clientCardInactive]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.container}>
          {/* Conditional Profile Icon */}
          {showInitials && (
            <View style={[styles.profileIcon, isInactive && styles.profileIconInactive, squareIcon && styles.profileIconSquare, hourglassIcon && styles.profileIconHourglass]}>
              <View style={[styles.profileIconFrame, hourglassIcon && styles.profileIconFrameHourglass]}>
                <Text style={[styles.initials, hourglassIcon && styles.initialsHourglass]}>
                  {getInitials(clientName)}
                </Text>
              </View>
            </View>
          )}

          {/* Right Section */}
          <View style={[styles.rightSection, !showInitials && styles.rightSectionFullWidth]}>
            {/* Realtor Name - Show if provided */}
            {realtorName && (
              <Text style={styles.realtorName} numberOfLines={1}>
                {realtorName}
              </Text>
            )}
            
            {/* Name */}
            <Text style={[styles.name, isUnread && styles.nameUnread, isInactive && styles.nameInactive]} numberOfLines={1}>
              {clientName || 'Client Name'}
            </Text>
            
            {/* Last Message - Show if exists and timeRange is defined (Messages screen) */}
            {timeRange !== undefined && lastMessage && (
              <Text style={[styles.lastMessage, isUnread && styles.lastMessageUnread]} numberOfLines={2}>
                {lastMessage}
              </Text>
            )}
            
            {/* Time Range */}
            {timeRange !== undefined && (
              <Text style={styles.timeRange} numberOfLines={1}>
                {timeRange || ''}
              </Text>
            )}
            
            {/* Conditional Content - Status or Last Message (for non-message screens) */}
            {timeRange === undefined && showStatus ? (
              <View style={styles.statusFrame}>
                {/* Status Bar */}
                <View style={styles.clientStatus}>
                  <View style={styles.statusBackground} />
                </View>
                
                {/* Status Text */}
                <Text style={styles.statusText}>
                  {status}
                </Text>
              </View>
            ) : timeRange === undefined && (
              <Text style={[styles.lastMessage, isUnread && styles.lastMessageUnread]} numberOfLines={2}>
                {lastMessage || 'No messages yet...'}
              </Text>
            )}
          </View>
          
          {/* Action Buttons - Inside the card */}
          <View style={styles.actionsContainer}>
            {children}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 6,
    gap: 12,
  },
  clientCard: {
    width: '100%',
    backgroundColor: '#FDFDFD',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#0E1D1D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileIcon: {
    width: 49,
    height: 49,
    backgroundColor: '#4D4D4D',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconSquare: {
    borderRadius: 4,
  },
  profileIconHourglass: {
    width: 38,
    height: 38,
    borderRadius: 6,
    transform: [{ rotate: '45deg' }, { scaleY: 0.65 }],
  },
  profileIconFrame: {
    width: 49,
    height: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconFrameHourglass: {
    transform: [{ rotate: '-45deg' }],
  },
  initials: {
    fontFamily: 'futura',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 27,
    color: '#FDFDFD',
    textAlign: 'center',
  },
  initialsHourglass: {
    transform: [{ rotate: '0deg' }],
  },
  rightSection: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  realtorName: {
    fontFamily: 'futura',
    fontWeight: '600',
    fontSize: 13,
    color: '#5f6368',
    lineHeight: 16,
  },
  rightSectionFullWidth: {
    marginLeft: 0, // Remove margin when no profile icon
  },
  name: {
    fontFamily: 'futura',
    fontWeight: '500',
    fontSize: 18,
    color: '#202020',
  },
  nameUnread: {
    fontWeight: '700',
  },
  timeRange: {
    fontFamily: 'futura',
    fontWeight: '400',
    fontSize: 11,
    color: '#797979',
  },
  statusFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientStatus: {
    width: 100,
    height: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 20,
    position: 'relative',
  },
  statusBackground: {
    position: 'absolute',
    width: 21,
    height: 10,
    left: 0,
    top: 0,
    backgroundColor: '#CDDCDC',
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'futura',
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 13,
    color: '#797979',
  },
  lastMessage: {
    fontFamily: 'futura',
    fontWeight: '500',
    fontSize: 10,
    color: '#797979',
  },
  lastMessageUnread: {
    fontWeight: '700',
    color: '#202020',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Inactive styles
  clientCardInactive: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  profileIconInactive: {
    backgroundColor: '#999999',
  },
  nameInactive: {
    color: '#888888',
  },
});

export default ClientCard;