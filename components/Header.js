import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import COLORS from '../utils/colors';

const Header = ({ 
  sectionTitle, 
  rightComponent = null, 
  showProfileSection = true 
}) => {
  const { broker } = useAuth();
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      {/* Status Bar Padding */}
      <View style={styles.statusBarPadding} />
      
      {showProfileSection && (
        <>
          {/* Realtor Menu */}
          <View style={styles.realtorMenu}>
            <View style={styles.menuRow}>
              <View style={styles.leftSection}>
                {/* Profile Icon */}
                <TouchableOpacity 
                  style={styles.profileIcon}
                  onPress={() => navigation.navigate('Profile')}
                >
                  {broker.profilePicture ? (
                    <Image
                      source={{ uri: `https://signup.roostapp.io/admin/profile-picture/${broker.profilePicture}` }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.defaultProfileIcon}>
                      <Text style={styles.profileInitials}>
                        {(broker.name || 'MB').split(' ').map(n => n[0]).join('').toUpperCase()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                {/* Content */}
                <View style={styles.content}>
                  <Text style={styles.brokerName}>
                    {(broker.name || 'DAVID SMITH').toUpperCase()}
                  </Text>
                  <Text style={styles.brokerCompany}>
                    {broker.brokerageName || 'ABC Realty'}
                  </Text>
                </View>
              </View>
              
              {rightComponent && (
                <View style={styles.rightSection}>
                  {rightComponent}
                </View>
              )}
            </View>
          </View>
        </>
      )}

      {/* Section Header */}
      {(sectionTitle || rightComponent) && (
        <View style={styles.sectionContainer}>
          <View style={styles.headerRow}>
            {sectionTitle && (
              <Text style={styles.sectionTitle}>{sectionTitle}</Text>
            )}
            {rightComponent}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0E1D1D',
    paddingBottom: 16,
  },
  statusBarPadding: {
    height: 80,
  },
  realtorMenu: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 154,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 45,
    height: 45,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 45,
  },
  defaultProfileIcon: {
    width: 45,
    height: 45,
    borderRadius: 45,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0E1D1D',
    fontFamily: 'futura',
  },
  content: {
    gap: 4,
  },
  brokerName: {
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 19,
    textTransform: 'uppercase',
    color: '#FDFDFD',
    fontFamily: 'futura',
  },
  brokerCompany: {
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 13,
    color: '#D2D2D2',
    fontFamily: 'futura',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FDFDFD',
    letterSpacing: 1,
    fontFamily: 'futura',
  },
});

export default Header;