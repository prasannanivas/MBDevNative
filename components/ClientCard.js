import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import COLORS from '../utils/colors';

const ClientCard = ({ 
  clientName, 
  status = 'Active', 
  showStatus = true,
  showInitials = true,
  lastMessage,
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
        style={styles.clientCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.container}>
          {/* Conditional Profile Icon */}
          {showInitials && (
            <View style={styles.profileIcon}>
              <View style={styles.profileIconFrame}>
                <Text style={styles.initials}>
                  {getInitials(clientName)}
                </Text>
              </View>
            </View>
          )}

          {/* Right Section */}
          <View style={[styles.rightSection, !showInitials && styles.rightSectionFullWidth]}>
            {/* Name */}
            <Text style={styles.name} numberOfLines={1}>
              {clientName || 'Client Name'}
            </Text>
            
            {/* Conditional Content - Status or Last Message */}
            {showStatus ? (
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
            ) : (
              <Text style={styles.lastMessage} numberOfLines={2}>
                {lastMessage || 'No messages yet...'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Action Buttons - Outside the card */}
      <View style={styles.actionsContainer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 16,
  },
  clientCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileIcon: {
    width: 49,
    height: 49,
    backgroundColor: '#4D4D4D',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconFrame: {
    width: 49,
    height: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontFamily: 'futura',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 27,
    color: '#FDFDFD',
    textAlign: 'center',
  },
  rightSection: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
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
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default ClientCard;