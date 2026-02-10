import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fontSize } from '../theme';
import type { RootStackParamList } from '../types';

import { TabNavigator } from './TabNavigator';
import { DestinationDetailScreen } from '../screens/DestinationDetailScreen';
import { PlanDetailScreen } from '../screens/PlanDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: fontSize.md },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="DestinationDetail"
        component={DestinationDetailScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name="PlanDetail"
        component={PlanDetailScreen}
        options={{ title: 'Plan Details' }}
      />
    </Stack.Navigator>
  );
}
