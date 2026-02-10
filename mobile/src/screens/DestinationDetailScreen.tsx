import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, radius, fontSize } from '../theme';
import { getPackages } from '../api/client';
import { PlanCard } from '../components/PlanCard';
import type { RootStackParamList, Plan } from '../types';

type Route = RouteProp<RootStackParamList, 'DestinationDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DestinationDetailScreen() {
  const { params } = useRoute<Route>();
  const nav = useNavigation<Nav>();

  const flagUri = params.flagCode
    ? `https://flagcdn.com/w320/${params.flagCode.toLowerCase()}.png`
    : `https://flagcdn.com/w320/${params.locationCode.toLowerCase()}.png`;

  const { data, isLoading } = useQuery({
    queryKey: ['packages', params.locationCode],
    queryFn: () => getPackages(params.locationCode),
    staleTime: 5 * 60 * 1000,
  });

  const plans = data?.packages ?? [];

  const goToPlan = (plan: Plan) => {
    nav.navigate('PlanDetail', { plan });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={plans}
        keyExtractor={(p) => p.packageCode}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Image source={{ uri: flagUri }} style={styles.heroFlag} resizeMode="cover" />
            <Text style={styles.name}>{params.name}</Text>
            <Text style={styles.planCount}>
              {plans.length} plan{plans.length !== 1 ? 's' : ''} available
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No plans available</Text>
            </View>
          )
        }
        renderItem={({ item }) => <PlanCard plan={item} onPress={() => goToPlan(item)} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroFlag: {
    width: 80,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.text,
  },
  planCount: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textTertiary,
  },
});
