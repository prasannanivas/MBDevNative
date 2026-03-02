import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MBHomeScreen from '../screens/MBHomeScreen';
import MessagesScreen from '../screens/MessagesScreen';
import RemindersScreen from '../screens/RemindersScreen';

import COLORS from '../utils/colors';
import { useChat } from '../context/ChatContext';
import CallIcon from '../components/icons/CallIcon';
import ChatIcon from '../components/icons/ChatIcon';
import BellIcon from '../components/icons/BellIcon';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { unreadCount } = useChat();
  const animatedValue = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: state.index,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [state.index]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [-80, 0, 80], // -80 for first tab, 0 for center, 80 for third tab
  });

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarContent}>
        <Animated.View
          style={[styles.slidingIndicator, { transform: [{ translateX }] }]}
        />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let IconComponent;
          if (route.name === 'Home') {
            IconComponent = CallIcon;
          } else if (route.name === 'Messages') {
            IconComponent = ChatIcon;
          } else if (route.name === 'Reminders') {
            IconComponent = BellIcon;
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={1}
            >
              <View style={styles.tabIconContainer}>
                <IconComponent 
                  width={24} 
                  height={24} 
                  color="#202020" 
                />
                {route.name === 'Messages' && unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={MBHomeScreen}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
      />
      <Tab.Screen 
        name="Reminders" 
        component={RemindersScreen}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: '#FDFDFD',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    height: 82,
    paddingTop: 0,
    paddingBottom: 34,
    paddingLeft: 36,
    paddingRight: 24,
    width: '100%',
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 48,
    gap: 48,
  },
  tabItem: {
    width: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconContainer: {
    position: 'relative',
  },
  slidingIndicator: {
    position: 'absolute',
    top: 0,
    width: 36,
    height: 4,
    backgroundColor: '#2E2E2E',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 1,
    left: '50%',
    marginLeft: -18,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default MainTabs;
