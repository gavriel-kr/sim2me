import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '../theme';
import type { TabParamList } from '../types';

import { HomeScreen } from '../screens/HomeScreen';
import { DestinationsScreen } from '../screens/DestinationsScreen';
import { MyESimsScreen } from '../screens/MyESimsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const TABS: {
  name: keyof TabParamList;
  component: React.ComponentType<any>;
  icon: string;
  iconFocused: string;
  label: string;
}[] = [
  { name: 'Home', component: HomeScreen, icon: 'home-outline', iconFocused: 'home', label: 'Home' },
  { name: 'Destinations', component: DestinationsScreen, icon: 'globe-outline', iconFocused: 'globe', label: 'Destinations' },
  { name: 'MyeSIMs', component: MyESimsScreen, icon: 'phone-portrait-outline', iconFocused: 'phone-portrait', label: 'My eSIMs' },
  { name: 'Profile', component: ProfileScreen, icon: 'person-outline', iconFocused: 'person', label: 'Profile' },
];

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 4,
          height: 85,
          paddingBottom: 24,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={(focused ? tab.iconFocused : tab.icon) as any}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
